import React, { useState, useEffect } from 'react'
import { rosterService } from '../../services/rosterService'

const DEMO_ROSTER = [
  { id: 'demo-1', nom: 'Ambunga', prenom: 'Didier', role: 'Membre', email: 'didier.ambunga@cenacle.com', telephone: '+243 890 000 001', est_actif: true },
  { id: 'demo-2', nom: 'Kabangu', prenom: 'Sarah', role: 'Membre', email: 'sarah.kabangu@cenacle.com', telephone: '+243 890 000 002', est_actif: true },
  { id: 'demo-3', nom: 'Mbuyi', prenom: 'Jean-Paul', role: 'Responsable', email: 'jp.mbuyi@cenacle.com', telephone: '+243 890 000 003', est_actif: true },
  { id: 'demo-4', nom: 'Ngolo', prenom: 'Christian', role: 'Membre', email: 'christian.ngolo@cenacle.com', telephone: '+243 890 000 004', est_actif: false },
  { id: 'demo-5', nom: 'Boseko', prenom: 'Esther', role: 'Admin', email: 'esther.boseko@cenacle.com', telephone: '+243 890 000 005', est_actif: true }
]

const ROLE_OPTIONS = ['Membre', 'Responsable', 'Admin']

export default function RosterManagementPanel({ isDemo }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tous')
  const [updatingId, setUpdatingId] = useState(null)

  const loadRoster = async () => {
    setLoading(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 300))
        setMembers([...DEMO_ROSTER])
      } else {
        const dbMembers = await rosterService.getMembers()
        setMembers(dbMembers)
      }
    } catch (err) {
      console.error("Erreur de chargement du roster :", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoster()
  }, [isDemo])

  const handleRoleChange = async (memberId, newRole) => {
    setUpdatingId(memberId)
    try {
      if (!isDemo) {
        await rosterService.updateMemberRole(memberId, newRole)
      }
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m))
    } catch (err) {
      alert("Impossible de modifier le rôle. Veuillez réessayer.")
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleStatus = async (memberId, currentStatus) => {
    const newStatus = !currentStatus
    setUpdatingId(memberId)
    try {
      if (!isDemo) {
        await rosterService.toggleMemberStatus(memberId, newStatus)
      }
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, est_actif: newStatus } : m))
    } catch (err) {
      alert("Impossible de modifier le statut d'accès. Veuillez réessayer.")
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtrage et recherche
  const filteredMembers = members.filter(m => {
    const fullName = `${m.nom} ${m.prenom}`.toLowerCase()
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesRole = roleFilter === 'Tous' || m.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  return (
    <section className="glass-panel flex flex-col gap-4">
      {/* En-tête du panneau */}
      <div>
        <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>🛡️ Roster & Rôles des Membres</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Gérez les privilèges d'accès et le statut de connexion des utilisateurs de l'application.
        </p>
      </div>

      {/* Barre de Filtres et Recherche */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center'
      }}>
        {/* Recherche */}
        <div style={{ flex: 2, minWidth: '200px' }}>
          <input 
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              color: '#fff',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Filtrage par rôle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rôle :</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <option value="Tous" style={{ background: '#1a0a2e', color: '#fff' }}>Tous</option>
            {ROLE_OPTIONS.map(role => (
              <option key={role} value={role} style={{ background: '#1a0a2e', color: '#fff' }}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau des membres */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <div style={{
            width: '30px', height: '30px', border: '2px solid rgba(255,255,255,0.1)',
            borderLeftColor: 'var(--accent-color)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Chargement du roster...
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nom / Prénom</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email / Téléphone</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Rôle</th>
                <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>Accès</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Aucun membre ne correspond aux critères
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const isActif = m.est_actif !== false // true par défaut
                  return (
                    <tr key={m.id} style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      opacity: isActif ? 1 : 0.6,
                      transition: 'opacity 0.2s'
                    }}>
                      {/* Nom / Prénom */}
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: '500', color: '#fff' }}>
                          {m.nom} {m.prenom}
                        </div>
                      </td>

                      {/* Contact details */}
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#fff' }}>{m.email || 'Pas d\'email'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                          📞 {m.telephone || 'Non renseigné'}
                        </div>
                      </td>

                      {/* Rôle selector */}
                      <td style={{ padding: '0.75rem' }}>
                        <select
                          value={m.role}
                          disabled={updatingId === m.id}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#fff',
                            padding: '0.3rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {ROLE_OPTIONS.map(role => (
                            <option key={role} value={role} style={{ background: '#1a0a2e', color: '#fff' }}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Activation toggler */}
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button
                          disabled={updatingId === m.id}
                          onClick={() => handleToggleStatus(m.id, isActif)}
                          className="glass-button"
                          style={{
                            padding: '0.3rem 0.75rem',
                            fontSize: '0.75rem',
                            minWidth: '90px',
                            background: isActif ? 'rgba(46, 196, 182, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isActif ? 'var(--success-color)' : '#ef4444',
                            border: isActif ? '1px solid rgba(46, 196, 182, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                            fontWeight: '600'
                          }}
                        >
                          {isActif ? '✓ Actif' : '✕ Bloqué'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
