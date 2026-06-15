import React, { useState, useEffect } from 'react'
import { presenceService } from '../../services/presenceService'

// Génère un historique simulé réaliste pour le Mode Démo
const generateDemoHistory = (memberId) => {
  const weeks = [
    { date: '2026-06-13', theme: 'La joie de servir' },
    { date: '2026-06-06', theme: 'Esprit Saint, souffle de vie' },
    { date: '2026-05-30', theme: 'Marcher dans la foi' },
    { date: '2026-05-23', theme: "L'amour fraternel" },
    { date: '2026-05-16', theme: 'Prier sans cesse' },
    { date: '2026-05-09', theme: "L'humilité" },
    { date: '2026-05-02', theme: 'La fidélité dans les petites choses' },
    { date: '2026-04-25', theme: 'Porter sa croix quotidiennement' }
  ]

  // Chaque membre a un profil d'assiduité différent pour un rendu réaliste
  const absencePatterns = {
    'demo-1': [7],             // Ambunga Didier — absent une fois
    'demo-2': [0, 2, 5],      // Kabangu Sarah — plusieurs absences
    'demo-3': [],              // Mbuyi Jean-Paul — présent à tout
    'demo-4': [0, 1, 4, 6],   // Ngolo Christian — moins assidu
    'demo-5': [7]              // Boseko Esther — absent une fois
  }

  const absentIndexes = absencePatterns[memberId] || [3]
  return weeks.map((w, i) => ({ ...w, present: !absentIndexes.includes(i) }))
}

const getRateColor = (rate) => {
  if (rate >= 80) return '#2ecc71'
  if (rate >= 50) return '#e67e22'
  return '#e74c3c'
}

const getRateLabel = (rate) => {
  if (rate >= 80) return 'Excellent'
  if (rate >= 50) return 'Moyen'
  return 'À suivre'
}

export default function MemberProfileModal({ member, isDemo, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // Fermer la modale au clic sur l'arrière-plan
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Fermer avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (isDemo) {
      // Petit délai simulé pour reproduire le ressenti d'un appel réseau
      const timer = setTimeout(() => {
        setHistory(generateDemoHistory(member.id))
        setLoading(false)
      }, 400)
      return () => clearTimeout(timer)
    }

    const loadHistory = async () => {
      setLoading(true)
      try {
        const data = await presenceService.getMemberAttendanceHistory(member.id)
        setHistory(data)
      } catch (err) {
        console.error("Erreur de chargement d'historique :", err)
        setHistory([])
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [member, isDemo])

  const totalReunions = history.length
  const totalPresences = history.filter(h => h.present).length
  const rate = totalReunions > 0 ? Math.round((totalPresences / totalReunions) * 100) : 0
  const rateColor = getRateColor(rate)

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .history-item:hover { background: rgba(255,255,255,0.04) !important; }
        .close-btn:hover { background: rgba(255,255,255,0.15) !important; }
      `}</style>

      <div
        className="glass-panel flex flex-col gap-4"
        style={{
          maxWidth: '520px', width: '100%', maxHeight: '88vh',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}
      >
        {/* En-tête de la modale */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-color, #c8a951), rgba(79,30,111,0.6))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', flexShrink: 0
            }}>
              {member.prenom?.[0]}{member.nom?.[0]}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>
                {member.prenom} {member.nom}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.1rem 0 0 0' }}>
                {member.role}
              </p>
            </div>
          </div>
          <button
            className="close-btn glass-button"
            style={{ padding: '0.3rem 0.7rem', fontSize: '0.85rem', flexShrink: 0 }}
            onClick={onClose}
            title="Fermer (Échap)"
          >
            ✕ Fermer
          </button>
        </div>

        {/* Corps scrollable */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <div style={{
                width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)',
                borderLeftColor: 'var(--accent-color)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Chargement de l'historique...
            </div>
          ) : (
            <>
              {/* Indicateur de taux d'assiduité */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem',
                background: 'rgba(255,255,255,0.02)', padding: '1.1rem',
                borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {/* Cercle de score */}
                <div style={{
                  flexShrink: 0, fontSize: '1.6rem', fontWeight: 'bold', color: rateColor,
                  border: `3px solid ${rateColor}`, borderRadius: '50%',
                  width: '76px', height: '76px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 18px ${rateColor}44`
                }}>
                  {rate}%
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>Score d'Assiduité</h4>
                    <span style={{
                      fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '4px',
                      background: `${rateColor}22`, color: rateColor, fontWeight: 'bold'
                    }}>
                      {getRateLabel(rate)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Présent à <strong style={{ color: '#fff' }}>{totalPresences}</strong> réunion(s) sur{' '}
                    <strong style={{ color: '#fff' }}>{totalReunions}</strong> séances enregistrées.
                  </p>
                </div>
              </div>

              {/* Barre de progression visuelle */}
              {totalReunions > 0 && (
                <div>
                  <div style={{
                    height: '6px', background: 'rgba(255,255,255,0.07)',
                    borderRadius: '3px', overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%', width: `${rate}%`,
                      background: `linear-gradient(90deg, ${rateColor}88, ${rateColor})`,
                      borderRadius: '3px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* Historique des réunions */}
              <div>
                <h4 style={{ color: '#fff', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                  📅 Historique des réunions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {history.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1.5rem 0' }}>
                      Aucune réunion enregistrée pour ce membre.
                    </p>
                  ) : (
                    history.map((h, i) => (
                      <div
                        key={i}
                        className="history-item"
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.6rem 0.5rem',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          fontSize: '0.88rem', transition: 'background 0.15s'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: '500', color: '#e0e0e0' }}>
                            {new Date(h.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                          {h.theme && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                              — {h.theme}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: '0.78rem', padding: '0.2rem 0.55rem', borderRadius: '4px', flexShrink: 0,
                          background: h.present ? 'rgba(46,204,113,0.12)' : 'rgba(231,76,60,0.12)',
                          color: h.present ? '#2ecc71' : '#e74c3c', fontWeight: 'bold',
                          border: `1px solid ${h.present ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)'}`
                        }}>
                          {h.present ? '✓ Présent' : '✗ Absent'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
