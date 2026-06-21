import React, { useState, useEffect } from 'react'
import { commissionService } from '../../services/commissionService'
import { supabase } from '../../services/supabase'

export default function CommissionTeamPanel({ commission, isDemo }) {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeRetreat, setActiveRetreat] = useState(null)

  const loadTeam = async () => {
    setLoading(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 300))
        setActiveRetreat({ titre: "Feu de l'Esprit 2026" })
        setTeam([
          { memberId: 'demo-1', nom: 'Kabangu', prenom: 'Sarah', genre: 'F', telephone: '+243 890 000 002' },
          { memberId: 'demo-4', nom: 'Ngolo', prenom: 'Christian', genre: 'M', telephone: '+243 890 000 004' },
          { memberId: 'demo-m1', nom: 'Mutombo', prenom: 'Grace', genre: 'F', telephone: '+243 890 000 010' },
          { memberId: 'demo-m2', nom: 'Mamba', prenom: 'Jonathan', genre: 'M', telephone: '+243 890 000 011' }
        ])
      } else {
        // Récupérer la retraite active
        const { data: retreats, error: rError } = await supabase
          .from('retreats')
          .select('*')
          .eq('statut', 'Active')
          
        if (!rError && retreats && retreats.length > 0) {
          const active = retreats[0]
          setActiveRetreat(active)
          const teamData = await commissionService.getCommissionTeam(active.id, commission)
          setTeam(teamData)
        } else {
          setActiveRetreat(null)
          setTeam([])
        }
      }
    } catch (err) {
      console.error("Erreur chargement équipe de commission :", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeam()
  }, [commission, isDemo])

  const countBoys = team.filter(m => m.genre === 'M').length
  const countGirls = team.filter(m => m.genre === 'F').length

  if (loading) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
        <div style={{
          width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)',
          borderLeftColor: 'var(--accent-color)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Chargement de la commission...</p>
      </div>
    )
  }

  if (!activeRetreat) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
          Aucune retraite active pour le moment.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-panel flex flex-col gap-4">
      <div>
        <h2 style={{ fontSize: '1.1rem', color: '#fff', margin: 0 }}>🎨 Commission {commission}</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
          Retraite : <span style={{ color: 'var(--accent-color)', fontWeight: '500' }}>{activeRetreat.titre}</span>
        </p>
      </div>

      {/* Stats rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
        background: 'rgba(255,255,255,0.02)',
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255,255,255,0.04)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Équipe</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>{team.length}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Répartition</div>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--accent-color)', marginTop: '0.2rem' }}>
            ♂ {countBoys} · ♀ {countGirls}
          </div>
        </div>
      </div>

      {/* Liste des retraitants */}
      <div className="flex flex-col gap-2">
        {team.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '1rem' }}>
            Aucun retraitant assigné à votre commission pour l'instant.
          </p>
        ) : (
          team.map((member) => (
            <div 
              key={member.memberId} 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '500' }}>
                  {member.nom} {member.prenom}
                </span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  marginLeft: '0.5rem',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  background: member.genre === 'M' ? 'rgba(52, 152, 219, 0.15)' : 'rgba(233, 30, 99, 0.15)',
                  color: member.genre === 'M' ? '#3498db' : '#e91e63'
                }}>
                  {member.genre}
                </span>
              </div>

              {member.telephone && (
                <a 
                  href={`tel:${member.telephone}`}
                  className="glass-button"
                  style={{
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: 'rgba(46, 196, 182, 0.1)',
                    color: 'var(--success-color)',
                    border: '1px solid rgba(46, 196, 182, 0.2)'
                  }}
                >
                  📞 Appeler
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
