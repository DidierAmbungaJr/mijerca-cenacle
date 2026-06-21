import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    // 1. Récupère la session courante au montage
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.email)
        }
      } catch (error) {
        console.error('Error fetching session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // 2. Écoute les changements d'état d'authentification Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        try {
          await fetchProfile(currentUser.id, currentUser.email)
        } catch (err) {
          console.warn("Échec du chargement du profil lors de l'onAuthStateChange (compte peut-être désactivé) :", err)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId, userEmail) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .single()
        
      if (!error && data) {
        // Vérification de l'état actif du compte
        if (data.est_actif === false) {
          await supabase.auth.signOut()
          setUser(null)
          setProfile(null)
          throw new Error("Votre compte a été désactivé par un administrateur.")
        }

        // Synchronisation de l'email si manquant ou différent
        if (userEmail && data.email !== userEmail) {
          await supabase
            .from('members')
            .update({ email: userEmail })
            .eq('id', userId)
          data.email = userEmail
        }

        setProfile(data)
      } else {
        // Profil par défaut si l'enregistrement membre n'existe pas encore
        setProfile({
          id: userId,
          nom: 'Invité',
          prenom: 'Cénacle',
          role: 'Membre',
          genre: 'M',
          email: userEmail || '',
          est_actif: true
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      throw err
    }
  }

  const login = async (email, password) => {
    setIsDemo(false)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data?.user) {
      // Attendre fetchProfile pour propager l'erreur en cas de compte désactivé
      await fetchProfile(data.user.id, data.user.email)
    }
  }

  const loginAsDemo = (role) => {
    setIsDemo(true)
    setUser({ id: 'demo-user-id', email: 'demo@cenacle.com' })
    setProfile({
      id: 'demo-user-id',
      nom: role === 'Admin' ? 'Comité' : 'Didier',
      prenom: role === 'Admin' ? 'Gestion' : 'Jeune',
      role: role,
      genre: 'M',
      telephone: '+243 890 000 000'
    })
    setLoading(false)
  }

  const logout = async () => {
    if (isDemo) {
      setUser(null)
      setProfile(null)
      setIsDemo(false)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, loginAsDemo, logout, isDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
