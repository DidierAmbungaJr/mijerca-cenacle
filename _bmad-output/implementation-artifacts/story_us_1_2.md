# Spécification de Story : US-1.2

**ID** : US-1.2  
**Titre** : Connexion et Rôles de Sécurité (Supabase Auth)  
**Épique** : Epic 1 — Socle Technique & Authentification  
**Estimation** : 3 Story Points  
**Statut** : Complété (Done)  
**Responsable** : Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

Cette story gère la sécurité et l'accès à l'application. Elle permet d'initialiser le client Supabase, de créer une page de connexion (Email/Mot de passe), de configurer le contexte d'authentification React (`AuthContext`), et de rediriger l'utilisateur vers son tableau de bord spécifique en fonction de son rôle en base de données (`Admin` vs `Membre` / `Responsable`).

---

## 2. Critères d'Acceptation (Vérifications obligatoires)

* **CA-1** : Le client Supabase est initialisé en lisant les variables d'environnement (`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`).
* **CA-2** : Un utilisateur non connecté tentant d'accéder à l'application est redirigé vers la page de Connexion.
* **CA-3** : Le formulaire de connexion valide les entrées et s'authentifie auprès de Supabase Auth.
* **CA-4** : Après connexion, l'application lit le profil de l'utilisateur dans la table BDD `public.members` :
  * Si `role` = `'Admin'` : Affiche la console administrative (PC).
  * Si `role` = `'Membre'` ou `'Responsable'` : Affiche le dashboard d'engagement spirituel (Mobile).

---

## 3. Guide d'Implémentation Technique

### 3.1. Fichiers à créer / modifier

1. **`.env.example` & `.env`** : Fichiers contenant les variables d'environnement Supabase.
2. **`src/services/supabase.js`** : Initialisation du client Supabase.
3. **`src/context/AuthContext.jsx`** : Fournit l'état global de l'utilisateur connecté (`user`, `profile`, `loading`, `login()`, `logout()`).
4. **`src/components/common/LoginPage.jsx`** : Page de connexion avec formulaire esthétique (style Glassmorphism).
5. **`src/App.jsx`** : Intègre le `AuthProvider` et orchestre le routage/la redirection des vues.

### 3.2. Modèle de Code : `AuthContext.jsx`

Le contexte React gère la synchronisation de la session Supabase avec les données de profil stockées dans la table `members` :

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Écoute les changements d'état d'authentification Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        // Charge le profil utilisateur dans la table public.members
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', currentUser.id)
          .single()
          
        if (!error && data) {
          setProfile(data)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

---

## 4. Plan de Vérification & Tests

### Vérification Manuelle
1. Ajouter les variables d'environnement Supabase factices dans un fichier local `.env`.
2. Démarrer l'application. Vérifier que la page de Connexion s'affiche par défaut.
3. Tenter une connexion avec des identifiants invalides : vérifier que l'alerte d'erreur s'affiche correctement sous forme de message stylisé rouge.
4. Créer un utilisateur test dans Supabase Auth et un enregistrement dans la table `members` :
   * Tester avec le rôle `Membre` : vérifier qu'il est dirigé vers la vue PWA Mobile.
   * Tester avec le rôle `Admin` : vérifier qu'il est dirigé vers la console d'administration PC.
