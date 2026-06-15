import React, { useState, useEffect } from 'react'
import { retreatService } from '../../services/retreatService'

// Données fictives pour le Mode Démo
const DEMO_RETREATS = [
  {
    id: 'demo-retreat-1',
    titre: 'Feu de l\'Esprit 2026',
    date_debut: '2026-07-18',
    date_fin: '2026-07-20',
    lieu: 'Centre Spirituel Père Boka, Kinshasa',
    statut: 'Active'
  },
  {
    id: 'demo-retreat-2',
    titre: 'Retraite Jeunesse Noël 2026',
    date_debut: '2026-12-26',
    date_fin: '2026-12-28',
    lieu: 'Paroisse Saint Charles Lwanga',
    statut: 'Planifiee'
  }
]

const formatDate = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

const statutStyles = {
  Active:    { bg: 'rgba(46,204,113,0.12)', color: '#2ecc71', label: '🟢 Active' },
  Planifiee: { bg: 'rgba(52,152,219,0.12)', color: '#3498db', label: '📅 Planifiée' },
  Terminee:  { bg: 'rgba(127,140,141,0.12)', color: '#7f8c8d', label: '✓ Terminée' }
}

export default function RetreatRegistrationCard({ memberId, isDemo }) {
  const [retreats, setRetreats] = useState([])
  const [registrations, setRegistrations] = useState({}) // { retreatId: inscription | null }
  const [loading, setLoading] = useState(true)
  const [signingUpFor, setSigningUpFor] = useState(null) // retreatId en cours d'inscription

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        if (isDemo) {
          // Mode Démo : membre inscrit à la première retraite
          await new Promise(r => setTimeout(r, 400))
          const regMap = {
            'demo-retreat-1': { id: 'reg-demo-1', statut_inscription: 'En attente' },
            'demo-retreat-2': null
          }
          setRetreats(DEMO_RETREATS)
          setRegistrations(regMap)
        } else {
          const activeRetreats = await retreatService.getActiveRetreats()
          setRetreats(activeRetreats)
          const regMap = {}
          await Promise.all(activeRetreats.map(async (r) => {
            regMap[r.id] = await retreatService.getMemberRegistration(r.id, memberId)
          }))
          setRegistrations(regMap)
        }
      } catch (err) {
        console.error('Erreur chargement retraites :', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [memberId, isDemo])

  const handleRegister = async (retreatId) => {
    setSigningUpFor(retreatId)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 600))
        setRegistrations(prev => ({
          ...prev,
          [retreatId]: { id: 'reg-demo-new', statut_inscription: 'En attente' }
        }))
      } else {
        await retreatService.registerMember(retreatId, memberId)
        const reg = await retreatService.getMemberRegistration(retreatId, memberId)
        setRegistrations(prev => ({ ...prev, [retreatId]: reg }))
      }
    } catch (err) {
      if (err.message === 'ALREADY_REGISTERED') {
        // Mise à jour UI sans alert brute
        setRegistrations(prev => ({
          ...prev,
          [retreatId]: { id: 'already', statut_inscription: 'En attente' }
        }))
      } else {
        console.error('Erreur inscription :', err)
        alert('Une erreur est survenue. Veuillez réessayer.')
      }
    } finally {
      setSigningUpFor(null)
    }
  }

  if (loading) {
    return (
      <section className="glass-panel flex flex-col gap-4">
        <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Retraites & Inscriptions</h2>
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <div style={{
            width: '28px', height: '28px', border: '2px solid rgba(255,255,255,0.1)',
            borderLeftColor: 'var(--accent-color)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Chargement des retraites...
        </div>
      </section>
    )
  }

  return (
    <section className="glass-panel flex flex-col gap-4">
      <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>✝️ Retraites & Inscriptions</h2>

      {retreats.length === 0 ? (
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>
          Aucune retraite ouverte pour le moment. Revenez plus tard !
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {retreats.map((retreat) => {
            const reg = registrations[retreat.id]
            const isRegistered = !!reg
            const style = statutStyles[retreat.statut] || statutStyles.Planifiee

            return (
              <div
                key={retreat.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex', flexDirection: 'column', gap: '0.6rem'
                }}
              >
                {/* En-tête de la retraite */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <h3 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>{retreat.titre}</h3>
                  <span style={{
                    fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px',
                    background: style.bg, color: style.color, fontWeight: 'bold', flexShrink: 0
                  }}>
                    {style.label}
                  </span>
                </div>

                {/* Détails */}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span>📅 {formatDate(retreat.date_debut)} — {formatDate(retreat.date_fin)}</span>
                  {retreat.lieu && <span>📍 {retreat.lieu}</span>}
                </div>

                {/* Statut d'inscription du membre */}
                {isRegistered ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.2)',
                    borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem'
                  }}>
                    <span style={{ color: '#2ecc71', fontSize: '1rem' }}>✓</span>
                    <div>
                      <p style={{ fontSize: '0.82rem', color: '#2ecc71', margin: 0, fontWeight: 'bold' }}>
                        Vous êtes inscrit(e)
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Statut : {reg.statut_inscription}
                      </p>
                    </div>
                  </div>
                ) : retreat.statut === 'Active' ? (
                  <button
                    className="glass-button accent"
                    style={{ alignSelf: 'flex-start', fontSize: '0.85rem', opacity: signingUpFor === retreat.id ? 0.7 : 1 }}
                    onClick={() => handleRegister(retreat.id)}
                    disabled={!!signingUpFor}
                  >
                    {signingUpFor === retreat.id ? '⏳ Inscription en cours...' : "✍️ S'inscrire à cette retraite"}
                  </button>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Les inscriptions pour cette retraite ne sont pas encore ouvertes.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
