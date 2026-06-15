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
          await fetchProfile(currentUser.id)
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
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .single()
        
      if (!error && data) {
        setProfile(data)
      } else {
        // Profil par défaut si l'enregistrement membre n'existe pas encore
        setProfile({
          id: userId,
          nom: 'Invité',
          prenom: 'Cénacle',
          role: 'Membre',
          genre: 'M'
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  const login = async (email, password) => {
    setIsDemo(false)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
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
