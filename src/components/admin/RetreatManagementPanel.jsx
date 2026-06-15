import React, { useState, useEffect } from 'react'
import { retreatService } from '../../services/retreatService'

// Données fictives pour le Mode Démo
const DEMO_RETREATS_ADMIN = [
  { id: 'demo-retreat-1', titre: "Feu de l'Esprit 2026",       date_debut: '2026-07-18', date_fin: '2026-07-20', lieu: 'Centre Spirituel Père Boka', statut: 'Active',    nb_inscrits: 47 },
  { id: 'demo-retreat-2', titre: 'Retraite Jeunesse Noël 2026', date_debut: '2026-12-26', date_fin: '2026-12-28', lieu: 'Paroisse Saint Charles Lwanga', statut: 'Planifiee', nb_inscrits: 0  }
]

const STATUT_OPTIONS = [
  { value: 'Planifiee', label: '📅 Planifiée' },
  { value: 'Active',    label: '🟢 Active'    },
  { value: 'Terminee',  label: '✓ Terminée'  }
]

const statutColor = { Active: '#2ecc71', Planifiee: '#3498db', Terminee: '#7f8c8d' }

const formatDate = (d) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export default function RetreatManagementPanel({ isDemo }) {
  const [retreats, setRetreats] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', date_debut: '', date_fin: '', lieu: '' })
  const [formError, setFormError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 350))
        setRetreats([...DEMO_RETREATS_ADMIN])
      } else {
        setRetreats(await retreatService.getAllRetreats())
      }
    } catch (err) {
      console.error('Erreur chargement admin retraites :', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [isDemo])

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.titre.trim() || !form.date_debut || !form.date_fin) {
      setFormError('Le titre, la date de début et la date de fin sont obligatoires.')
      return
    }
    if (form.date_fin < form.date_debut) {
      setFormError('La date de fin ne peut pas être antérieure à la date de début.')
      return
    }
    setIsCreating(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500))
        const newRetreat = {
          id: `demo-new-${Date.now()}`,
          ...form,
          statut: 'Planifiee',
          nb_inscrits: 0
        }
        setRetreats(prev => [newRetreat, ...prev])
      } else {
        const created = await retreatService.createRetreat(form.titre, form.date_debut, form.date_fin, form.lieu)
        setRetreats(prev => [created, ...prev])
      }
      setForm({ titre: '', date_debut: '', date_fin: '', lieu: '' })
      setShowForm(false)
    } catch (err) {
      setFormError("Erreur lors de la création. Veuillez réessayer.")
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleStatusChange = async (retreatId, newStatut) => {
    setUpdatingId(retreatId)
    try {
      if (!isDemo) await retreatService.updateRetreatStatus(retreatId, newStatut)
      setRetreats(prev => prev.map(r => r.id === retreatId ? { ...r, statut: newStatut } : r))
    } catch (err) {
      console.error('Erreur changement statut :', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', width: '100%',
    outline: 'none'
  }

  return (
    <section className="glass-panel flex flex-col gap-4">
      {/* En-tête du panneau */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>⛺ Gestion des Retraites</h2>
        <button
          className="glass-button accent"
          style={{ fontSize: '0.85rem' }}
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? '✕ Annuler' : '＋ Nouvelle Retraite'}
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem'
          }}
        >
          <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-color)', margin: 0 }}>Créer une nouvelle retraite</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Titre *</label>
              <input
                style={inputStyle}
                placeholder="ex: Feu de l'Esprit 2027"
                value={form.titre}
                onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Lieu</label>
              <input
                style={inputStyle}
                placeholder="ex: Centre Spirituel Père Boka"
                value={form.lieu}
                onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Date de début *</label>
              <input
                type="date" style={inputStyle}
                value={form.date_debut}
                onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Date de fin *</label>
              <input
                type="date" style={inputStyle}
                value={form.date_fin}
                onChange={e => setForm(f => ({ ...f, date_fin: e.target.value }))}
              />
            </div>
          </div>

          {formError && (
            <p style={{ fontSize: '0.82rem', color: '#e74c3c', margin: 0 }}>⚠ {formError}</p>
          )}

          <button
            type="submit"
            className="glass-button accent"
            style={{ alignSelf: 'flex-start', opacity: isCreating ? 0.7 : 1 }}
            disabled={isCreating}
          >
            {isCreating ? '⏳ Création...' : '✓ Créer la retraite'}
          </button>
        </form>
      )}

      {/* Liste des retraites */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <div style={{
            width: '30px', height: '30px', border: '2px solid rgba(255,255,255,0.1)',
            borderLeftColor: 'var(--accent-color)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Chargement des retraites...
        </div>
      ) : retreats.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem 0' }}>
          Aucune retraite créée. Cliquez sur "Nouvelle Retraite" pour commencer.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {retreats.map((r) => {
            const color = statutColor[r.statut] || '#7f8c8d'
            return (
              <div key={r.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center', gap: '0.75rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem'
              }}>
                {/* Infos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.titre}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    📅 {formatDate(r.date_debut)} → {formatDate(r.date_fin)}
                    {r.lieu && ` · 📍 ${r.lieu}`}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.15rem' }}>
                    <span style={{
                      fontSize: '0.72rem', padding: '0.15rem 0.45rem',
                      borderRadius: '4px', background: `${color}18`, color, fontWeight: 'bold'
                    }}>
                      {STATUT_OPTIONS.find(o => o.value === r.statut)?.label || r.statut}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: '500' }}>
                      👥 {r.nb_inscrits} inscrit(s)
                    </span>
                  </div>
                </div>

                {/* Sélecteur de statut */}
                <select
                  value={r.statut}
                  disabled={updatingId === r.id}
                  onChange={e => handleStatusChange(r.id, e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0
                  }}
                >
                  {STATUT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value} style={{ background: '#1a0a2e', color: '#fff' }}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
