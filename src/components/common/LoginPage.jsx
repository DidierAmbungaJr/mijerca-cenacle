import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login, loginAsDemo } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    
    try {
      await login(email, password)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Identifiants incorrects. Veuillez configurer Supabase ou essayer le mode démo ci-dessous.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <div className="glass-panel flex flex-col gap-4" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        
        {/* Logo & Titre */}
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <img 
            src="/icon.svg" 
            alt="Logo Cénacle" 
            style={{ width: '70px', height: '70px', filter: 'drop-shadow(0 2px 10px rgba(230,194,41,0.5))', marginBottom: '0.5rem' }} 
          />
          <h2 style={{ fontSize: '1.6rem', color: '#fff' }}>Connexion</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>MIJERCA Cénacle Bandal</p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#ef4444', 
            padding: '0.6rem', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.8rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col" style={{ gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Adresse Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre.nom@email.com"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 0.8rem',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          <div className="flex flex-col" style={{ gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 0.8rem',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className="glass-button accent"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem' }}
          >
            {submitting ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        {/* Section de Simulation Démo */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Pour tester l'application sans configurer Supabase :
          </p>
          <div className="flex flex-col" style={{ gap: '0.5rem' }}>
            <button 
              type="button" 
              className="glass-button" 
              style={{ padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.05)' }}
              onClick={() => loginAsDemo('Membre')}
            >
              🔑 Mode Démo : Espace Membre (Mobile)
            </button>
            <button 
              type="button" 
              className="glass-button" 
              style={{ padding: '0.5rem', fontSize: '0.85rem', background: 'rgba(255, 255, 255, 0.05)' }}
              onClick={() => loginAsDemo('Admin')}
            >
              🛡️ Mode Démo : Console Admin (PC)
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
