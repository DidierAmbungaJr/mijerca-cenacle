import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/common/LoginPage'
import MeditationPlayer from './components/mobile/MeditationPlayer'
import { presenceService } from './services/presenceService'
import './styles/main.css'

const getTodayDateString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function AppContent() {
  const { user, profile, loading, logout, isDemo } = useAuth()
  const [installPrompt, setInstallPrompt] = useState(null)

  // États pour la feuille d'appel des présences (Admin)
  const [selectedDate, setSelectedDate] = useState(getTodayDateString())
  const [members, setMembers] = useState([])
  const [presences, setPresences] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [currentReunion, setCurrentReunion] = useState(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [updatingMemberId, setUpdatingMemberId] = useState(null)

  // Simulation locale pour le Mode Démo
  const [demoMembers] = useState([
    { id: 'demo-1', nom: 'Ambunga', prenom: 'Didier', role: 'Membre' },
    { id: 'demo-2', nom: 'Kabangu', prenom: 'Sarah', role: 'Membre' },
    { id: 'demo-3', nom: 'Mbuyi', prenom: 'Jean-Paul', role: 'Responsable (Accueil)' },
    { id: 'demo-4', nom: 'Ngolo', prenom: 'Christian', role: 'Membre' },
    { id: 'demo-5', nom: 'Boseko', prenom: 'Esther', role: 'Membre' }
  ])
  const [demoPresences, setDemoPresences] = useState({
    '2026-06-13': { 'demo-1': true, 'demo-3': true, 'demo-5': true }
  })

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  // Charger les données de présence
  useEffect(() => {
    if (profile?.role !== 'Admin') return

    if (isDemo) {
      setMembers(demoMembers)
      const dayPresences = demoPresences[selectedDate] || {}
      const presenceMap = {}
      demoMembers.forEach(m => {
        presenceMap[m.id] = !!dayPresences[m.id]
      })
      setPresences(presenceMap)
      return
    }

    const loadData = async () => {
      setIsLoadingData(true)
      try {
        const dbMembers = await presenceService.getMembers()
        setMembers(dbMembers)

        const reunion = await presenceService.getOrCreateReunion(selectedDate)
        setCurrentReunion(reunion)

        const reunionPresences = await presenceService.getPresencesForReunion(reunion.id)
        const presenceMap = {}
        dbMembers.forEach(m => {
          presenceMap[m.id] = false
        })
        reunionPresences.forEach(p => {
          presenceMap[p.member_id] = p.present
        })
        setPresences(presenceMap)
      } catch (err) {
        console.error("Erreur de chargement des données :", err)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [profile, selectedDate, isDemo])

  // Basculer la présence
  const togglePresence = async (memberId) => {
    if (updatingMemberId) return

    const newStatus = !presences[memberId]
    setPresences(prev => ({ ...prev, [memberId]: newStatus }))

    if (isDemo) {
      setUpdatingMemberId(memberId)
      setDemoPresences(prev => {
        const dayPresences = { ...(prev[selectedDate] || {}) }
        if (newStatus) {
          dayPresences[memberId] = true
        } else {
          delete dayPresences[memberId]
        }
        return { ...prev, [selectedDate]: dayPresences }
      })
      setTimeout(() => {
        setUpdatingMemberId(null)
      }, 150)
      return
    }

    try {
      setUpdatingMemberId(memberId)
      await presenceService.setPresence(memberId, currentReunion.id, newStatus)
    } catch (err) {
      console.error("Erreur de sauvegarde de présence :", err)
      setPresences(prev => ({ ...prev, [memberId]: !newStatus }))
      alert("Erreur lors de l'enregistrement de la présence. Veuillez réessayer.")
    } finally {
      setUpdatingMemberId(null)
    }
  }

  const filteredMembers = members.filter(m => {
    const fullName = `${m.nom} ${m.prenom}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  // Écran de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh', color: 'var(--accent-color)' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{
            border: '4px solid rgba(255, 255, 255, 0.1)',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            borderLeftColor: 'var(--accent-color)',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          <p>Chargement du profil Cénacle...</p>
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    )
  }

  // Écran de Connexion si non authentifié
  if (!user) {
    return <LoginPage />
  }

  // 1. ESPACE MEMBRE / RESPONSABLE (VUE MOBILE)
  if (profile?.role === 'Membre' || profile?.role === 'Responsable') {
    return (
      <div className="container flex flex-col gap-4" style={{ minHeight: '100vh' }}>
        
        {/* Header Mobile */}
        <header className="glass-panel flex items-center justify-between" style={{ padding: '1rem 1.25rem' }}>
          <div className="flex items-center gap-4" style={{ gap: '0.75rem' }}>
            <img src="/icon.svg" alt="Logo" style={{ width: '40px', height: '40px' }} />
            <div>
              <h1 style={{ fontSize: '1.25rem', color: 'var(--accent-color)' }}>Cénacle Mobile</h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Salut, {profile.prenom} !</p>
            </div>
          </div>
          <button className="glass-button" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={logout}>
            Quitter
          </button>
        </header>

        {isDemo && (
          <div style={{ textAlign: 'center', background: 'rgba(230,194,41,0.1)', border: '1px solid rgba(230,194,41,0.3)', color: 'var(--accent-color)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
            ⚙️ Mode Démo Actif. Vous explorez l'application mobile côté jeune.
          </div>
        )}

        {/* Lecteur de Méditations du jour */}
        <MeditationPlayer />

        {/* Fiche de Retraite */}
        <section className="glass-panel flex flex-col gap-4">
          <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Ma Retraite active</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Nom de la Retraite :</span>
              <span style={{ fontWeight: '500' }}>Feu de l'Esprit 2026</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mon Logement :</span>
              <span style={{ fontWeight: '500', color: 'var(--accent-color)' }}>Chambre Saint Jean (M)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mon Carrefour :</span>
              <span style={{ fontWeight: '500', color: 'var(--accent-color)' }}>Carrefour n°3 (St Pierre)</span>
            </div>
          </div>
        </section>
        
      </div>
    )
  }

  // 2. CONSOLE D'ADMINISTRATION (VUE DE BUREAU/DESKTOP)
  if (profile?.role === 'Admin') {
    return (
      <div className="container flex flex-col gap-4" style={{ minHeight: '100vh' }}>
        
        {/* Header Admin */}
        <header className="glass-panel flex items-center justify-between" style={{ padding: '1rem 1.5rem' }}>
          <div className="flex items-center gap-4" style={{ gap: '1rem' }}>
            <img src="/icon.svg" alt="Logo" style={{ width: '48px', height: '48px' }} />
            <div>
              <h1 style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}>Console Administration</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Connecté en tant qu'Administrateur</p>
            </div>
          </div>
          <button className="glass-button" style={{ padding: '0.5rem 1rem' }} onClick={logout}>
            Se déconnecter
          </button>
        </header>

        {isDemo && (
          <div style={{ textAlign: 'center', background: 'rgba(230,194,41,0.1)', border: '1px solid rgba(230,194,41,0.3)', color: 'var(--accent-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
            🛡️ Mode Démo Actif. Vous pilotez l'application en tant qu'Administrateur du comité.
          </div>
        )}

        {/* Grille principale de stats */}
        <section className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Membres Actifs</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>124</p>
          </div>
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Taux d'assiduité moyen</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success-color)' }}>87%</p>
          </div>
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Chambres de retraite</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>15</p>
          </div>
        </section>

        {/* Section Feuille d'Appel des Présences */}
        <section className="glass-panel flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 style={{ fontSize: '1.25rem', color: '#fff' }}>Pointage de Présences (Réunion hebdomadaire)</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="reunion-date" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Réunion du :</label>
              <input 
                id="reunion-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: '#fff',
                  padding: '0.3rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  accentColor: 'var(--accent-color)'
                }}
              />
            </div>
          </div>

          {/* Recherche */}
          <div>
            <input 
              type="text"
              placeholder="Rechercher un membre par nom ou prénom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                color: '#fff',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {isLoadingData ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Chargement des données de présence...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nom du membre</th>
                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Rôle / Commission</th>
                    <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>Présent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Aucun membre trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.95rem', fontWeight: '500' }}>{m.nom} {m.prenom}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{m.role}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={!!presences[m.id]} 
                            onChange={() => togglePresence(m.id)}
                            disabled={updatingMemberId === m.id}
                            style={{
                              width: '20px',
                              height: '20px',
                              accentColor: 'var(--accent-color)',
                              cursor: updatingMemberId === m.id ? 'not-allowed' : 'pointer',
                              opacity: updatingMemberId === m.id ? 0.5 : 1
                            }}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section Administration des Badges de Retraite */}
        <section className="glass-panel flex flex-col gap-4">
          <h2 style={{ fontSize: '1.25rem', color: '#fff' }}>Impression de Badges</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Téléversez le fond d'affiche officiel de la retraite et générez l'ensemble des badges PDF au format A6.
          </p>
          <div className="flex flex-col gap-4" style={{ gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '500' }}>Fichier Image de Fond (.jpg, .png)</label>
              <input type="file" accept="image/*" style={{ color: 'var(--text-secondary)' }} />
            </div>
            
            <button className="glass-button accent" style={{ alignSelf: 'flex-start' }} onClick={() => alert('Génération de badges PDF simulée !')}>
              🖨️ Générer le fichier d'impression PDF
            </button>
          </div>
        </section>

      </div>
    )
  }

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
