import React, { useState, useEffect } from 'react'
import { retreatService } from '../../services/retreatService'
import { distributeToRooms } from '../../utils/roomAlgorithm'

// ─── Données fictives Mode Démo ──────────────────────────────────────────────

const DEMO_RETREATS = [
  { id: 'demo-retreat-1', titre: "Feu de l'Esprit 2026", nb_inscrits: 8 }
]

const DEMO_REGISTRANTS = [
  { id: 'reg-1', member: { id: 'm1', nom: 'Ambunga',  prenom: 'Didier',    genre: 'M' } },
  { id: 'reg-2', member: { id: 'm2', nom: 'Kabangu',  prenom: 'Sarah',     genre: 'F' } },
  { id: 'reg-3', member: { id: 'm3', nom: 'Mbuyi',    prenom: 'Jean-Paul', genre: 'M' } },
  { id: 'reg-4', member: { id: 'm4', nom: 'Ngolo',    prenom: 'Christian', genre: 'M' } },
  { id: 'reg-5', member: { id: 'm5', nom: 'Boseko',   prenom: 'Esther',    genre: 'F' } },
  { id: 'reg-6', member: { id: 'm6', nom: 'Lukusa',   prenom: 'Grace',     genre: 'F' } },
  { id: 'reg-7', member: { id: 'm7', nom: 'Bakama',   prenom: 'Élysée',    genre: 'M' } },
  { id: 'reg-8', member: { id: 'm8', nom: 'Mulumba',  prenom: 'Rébecca',   genre: 'F' } }
]

const DEMO_ROOMS_INITIAL = [
  { id: 'room-1', nom_chambre: 'Chambre Saint-Joseph', capacite: 3, genre_chambre: 'M' },
  { id: 'room-2', nom_chambre: 'Chambre Saint-Jean',   capacite: 2, genre_chambre: 'M' },
  { id: 'room-3', nom_chambre: 'Chambre Sainte-Marie', capacite: 4, genre_chambre: 'F' }
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const genreLabel = { M: '♂ Hommes', F: '♀ Femmes' }
const genreColor  = { M: '#5dade2', F: '#f1948a' }

const inputStyle = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)',
  fontSize: '0.85rem', outline: 'none'
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function RoomManagementPanel({ isDemo }) {
  const [retreats, setRetreats] = useState([])
  const [selectedRetreatId, setSelectedRetreatId] = useState('')
  const [loadingRetreats, setLoadingRetreats] = useState(true)
  const [rooms, setRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)

  // Formulaire ajout chambre
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [roomForm, setRoomForm] = useState({ nom: '', capacite: '', genre: 'M' })
  const [roomFormError, setRoomFormError] = useState('')
  const [isAddingRoom, setIsAddingRoom] = useState(false)

  // Répartition
  const [repartStatus, setRepartStatus] = useState('idle') // idle | loading | done | error
  const [repartResult, setRepartResult] = useState(null)
  const [repartError, setRepartError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  // ── Chargement des retraites ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingRetreats(true)
      try {
        if (isDemo) {
          await new Promise(r => setTimeout(r, 300))
          setRetreats(DEMO_RETREATS)
          setSelectedRetreatId(DEMO_RETREATS[0].id)
        } else {
          const all = await retreatService.getAllRetreats()
          setRetreats(all)
          if (all.length > 0) setSelectedRetreatId(all[0].id)
        }
      } catch (err) {
        console.error('Erreur chargement retraites chambres :', err)
      } finally {
        setLoadingRetreats(false)
      }
    }
    load()
  }, [isDemo])

  // ── Chargement des chambres quand la retraite change ───────
  useEffect(() => {
    if (!selectedRetreatId) return
    setRooms([])
    setRepartResult(null)
    setRepartStatus('idle')
    setConfirmReset(false)

    const loadRooms = async () => {
      setLoadingRooms(true)
      try {
        if (isDemo) {
          await new Promise(r => setTimeout(r, 200))
          setRooms([...DEMO_ROOMS_INITIAL])
        } else {
          setRooms(await retreatService.getRooms(selectedRetreatId))
        }
      } catch (err) {
        console.error('Erreur chargement chambres :', err)
      } finally {
        setLoadingRooms(false)
      }
    }
    loadRooms()
  }, [selectedRetreatId, isDemo])

  // ── Ajouter une chambre ─────────────────────────────────────
  const handleAddRoom = async (e) => {
    e.preventDefault()
    setRoomFormError('')
    if (!roomForm.nom.trim()) { setRoomFormError('Le nom de la chambre est obligatoire.'); return }
    const cap = parseInt(roomForm.capacite)
    if (!cap || cap < 1) { setRoomFormError('La capacité doit être un entier positif.'); return }

    setIsAddingRoom(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 300))
        const newRoom = { id: `room-demo-${Date.now()}`, nom_chambre: roomForm.nom.trim(), capacite: cap, genre_chambre: roomForm.genre }
        setRooms(prev => [...prev, newRoom])
      } else {
        const created = await retreatService.createRoom(selectedRetreatId, roomForm.nom.trim(), cap, roomForm.genre)
        setRooms(prev => [...prev, created])
      }
      setRoomForm({ nom: '', capacite: '', genre: 'M' })
      setShowRoomForm(false)
    } catch (err) {
      setRoomFormError('Erreur lors de la création. Veuillez réessayer.')
    } finally {
      setIsAddingRoom(false)
    }
  }

  // ── Supprimer une chambre ───────────────────────────────────
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Supprimer cette chambre ? Les membres affectés seront désassignés.')) return
    try {
      if (!isDemo) await retreatService.deleteRoom(roomId)
      setRooms(prev => prev.filter(r => r.id !== roomId))
    } catch (err) {
      console.error('Erreur suppression chambre :', err)
    }
  }

  // ── Lancer la répartition ───────────────────────────────────
  const handleLaunchRepartition = async () => {
    if (!selectedRetreatId || rooms.length === 0) return
    setRepartError('')

    // Vérification répartition existante
    if (!isDemo) {
      try {
        const hasExisting = await retreatService.hasExistingRoomAssignments(selectedRetreatId)
        if (hasExisting && !confirmReset) { setConfirmReset(true); return }
      } catch { /* continue */ }
    } else if (repartResult && !confirmReset) {
      setConfirmReset(true); return
    }

    setConfirmReset(false)
    setRepartStatus('loading')
    setRepartResult(null)

    try {
      let registrants
      if (isDemo) {
        await new Promise(r => setTimeout(r, 600))
        registrants = DEMO_REGISTRANTS
      } else {
        registrants = await retreatService.getValidatedRegistrants(selectedRetreatId)
      }

      if (registrants.length === 0) {
        setRepartError("Aucun inscrit validé trouvé. Validez d'abord des inscriptions.")
        setRepartStatus('error')
        return
      }

      const { assignments, roomStats, unhoused } = distributeToRooms(registrants, rooms)

      if (!isDemo && assignments.length > 0) {
        await retreatService.assignRooms(assignments)
      }

      setRepartResult({ roomStats, unhoused })
      setRepartStatus('done')
    } catch (err) {
      console.error('Erreur répartition chambres :', err)
      setRepartError('Une erreur est survenue pendant la répartition.')
      setRepartStatus('error')
    }
  }

  // ── Capacités totales ───────────────────────────────────────
  const totalCapaciteM = rooms.filter(r => r.genre_chambre === 'M').reduce((s, r) => s + r.capacite, 0)
  const totalCapaciteF = rooms.filter(r => r.genre_chambre === 'F').reduce((s, r) => s + r.capacite, 0)

  return (
    <section className="glass-panel flex flex-col gap-4">
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>🏠 Gestion des Chambres</h2>
        <button className="glass-button accent" style={{ fontSize: '0.82rem' }}
          onClick={() => setShowRoomForm(v => !v)}>
          {showRoomForm ? '✕ Annuler' : '＋ Ajouter une chambre'}
        </button>
      </div>

      {loadingRetreats ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Chargement...</p>
      ) : (
        <>
          {/* Sélecteur de retraite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>Retraite :</label>
            <select value={selectedRetreatId} onChange={e => setSelectedRetreatId(e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: '180px', cursor: 'pointer' }}>
              {retreats.map(r => (
                <option key={r.id} value={r.id} style={{ background: '#1a0a2e' }}>{r.titre}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
              Capacité : ♂ {totalCapaciteM} lits · ♀ {totalCapaciteF} lits
            </span>
          </div>

          {/* Formulaire d'ajout de chambre */}
          {showRoomForm && (
            <form onSubmit={handleAddRoom} style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 'var(--radius-md)', padding: '0.85rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nom *</label>
                <input style={inputStyle} placeholder="ex: Chambre Saint-Paul"
                  value={roomForm.nom} onChange={e => setRoomForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Capacité *</label>
                <input style={inputStyle} type="number" min="1" max="30" placeholder="ex: 4"
                  value={roomForm.capacite} onChange={e => setRoomForm(f => ({ ...f, capacite: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Genre *</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={roomForm.genre}
                  onChange={e => setRoomForm(f => ({ ...f, genre: e.target.value }))}>
                  <option value="M" style={{ background: '#1a0a2e' }}>♂ Hommes</option>
                  <option value="F" style={{ background: '#1a0a2e' }}>♀ Femmes</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '0.25rem' }}>
                {roomFormError && <p style={{ fontSize: '0.72rem', color: '#e74c3c', margin: 0 }}>⚠ {roomFormError}</p>}
                <button type="submit" className="glass-button accent" style={{ fontSize: '0.82rem', opacity: isAddingRoom ? 0.7 : 1 }}
                  disabled={isAddingRoom}>
                  {isAddingRoom ? '⏳' : '✓ Ajouter'}
                </button>
              </div>
            </form>
          )}

          {/* Liste des chambres */}
          {loadingRooms ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Chargement des chambres...</p>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              <p>Aucune chambre créée pour cette retraite.</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Cliquez sur "Ajouter une chambre" pour commencer.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
              {rooms.map(room => (
                <div key={room.id} style={{
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${genreColor[room.genre_chambre]}22`,
                  borderRadius: 'var(--radius-md)', padding: '0.75rem',
                  display: 'flex', flexDirection: 'column', gap: '0.2rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.88rem' }}>{room.nom_chambre}</span>
                    <button onClick={() => handleDeleteRoom(room.id)} style={{
                      background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer',
                      fontSize: '0.75rem', padding: '0', lineHeight: 1
                    }} title="Supprimer">✕</button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: genreColor[room.genre_chambre] }}>
                    {genreLabel[room.genre_chambre]}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    🛏 {room.capacite} lit{room.capacite > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Bandeau de confirmation réinitialisation */}
          {confirmReset && repartStatus !== 'loading' && (
            <div style={{
              background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)',
              borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem'
            }}>
              <span style={{ fontSize: '0.85rem', color: '#e74c3c' }}>
                ⚠ Des chambres sont déjà affectées. Écraser la répartition existante ?
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="glass-button" style={{ fontSize: '0.78rem' }} onClick={() => setConfirmReset(false)}>Annuler</button>
                <button className="glass-button accent"
                  style={{ fontSize: '0.78rem', color: '#e74c3c', borderColor: 'rgba(231,76,60,0.4)' }}
                  onClick={handleLaunchRepartition}>
                  Oui, écraser
                </button>
              </div>
            </div>
          )}

          {/* Message d'erreur répartition */}
          {repartStatus === 'error' && (
            <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.9rem', fontSize: '0.83rem', color: '#e74c3c' }}>
              ⚠ {repartError}
            </div>
          )}

          {/* Bouton de lancement */}
          {!confirmReset && rooms.length > 0 && repartStatus !== 'loading' && (
            <button className="glass-button accent" style={{ alignSelf: 'flex-start', fontSize: '0.88rem' }}
              onClick={handleLaunchRepartition}>
              {repartStatus === 'loading' ? '⏳ Répartition en cours...' : '🏠 Lancer la répartition des chambres'}
            </button>
          )}

          {/* Tableau récapitulatif après répartition */}
          {repartStatus === 'done' && repartResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#2ecc71', fontSize: '1.1rem' }}>✓</span>
                <h3 style={{ color: '#2ecc71', margin: 0, fontSize: '0.95rem' }}>
                  Répartition terminée — {repartResult.roomStats.length} chambre(s)
                </h3>
              </div>

              {/* Alerte membres non logés */}
              {repartResult.unhoused.length > 0 && (
                <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                  <p style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                    ⚠ {repartResult.unhoused.length} membre(s) non logé(s) — capacité insuffisante :
                  </p>
                  {repartResult.unhoused.map((r, i) => (
                    <p key={i} style={{ color: 'rgba(231,76,60,0.8)', fontSize: '0.8rem', margin: '0.15rem 0' }}>
                      → {r.member.nom} {r.member.prenom} ({r.member.genre === 'M' ? '♂' : '♀'})
                    </p>
                  ))}
                </div>
              )}

              {/* Tableau par chambre */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {['Chambre', 'Genre', 'Affectés', 'Capacité', 'Places libres', 'Membres'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.45rem 0.65rem', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {repartResult.roomStats
                      .sort((a, b) => a.room.genre_chambre.localeCompare(b.room.genre_chambre))
                      .map((stat, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.5rem 0.65rem', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap' }}>
                            {stat.room.nom_chambre}
                          </td>
                          <td style={{ padding: '0.5rem 0.65rem', color: genreColor[stat.room.genre_chambre], whiteSpace: 'nowrap' }}>
                            {genreLabel[stat.room.genre_chambre]}
                          </td>
                          <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                            {stat.occupants.length}
                          </td>
                          <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {stat.room.capacite}
                          </td>
                          <td style={{ padding: '0.5rem 0.65rem', textAlign: 'center', color: stat.available === 0 ? '#e74c3c' : '#2ecc71' }}>
                            {stat.available}
                          </td>
                          <td style={{ padding: '0.5rem 0.65rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                            {stat.occupants.map(o => `${o.member.prenom} ${o.member.nom}`).join(', ') || '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
