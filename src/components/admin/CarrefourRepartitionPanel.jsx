import React, { useState, useEffect } from 'react'
import { retreatService } from '../../services/retreatService'
import { distributeToCarrefours, computeGroupStats } from '../../utils/carrefourAlgorithm'

// ─── Données fictives Mode Démo ─────────────────────────────────────────────

const DEMO_RETREATS = [
  { id: 'demo-retreat-1', titre: "Feu de l'Esprit 2026", nb_inscrits: 47 }
]

const DEMO_REGISTRANTS = [
  { id: 'reg-1', member: { id: 'demo-1', nom: 'Ambunga',  prenom: 'Didier',     genre: 'M', date_naissance: '2002-04-15' } },
  { id: 'reg-2', member: { id: 'demo-2', nom: 'Kabangu',  prenom: 'Sarah',      genre: 'F', date_naissance: '2004-08-22' } },
  { id: 'reg-3', member: { id: 'demo-3', nom: 'Mbuyi',    prenom: 'Jean-Paul',  genre: 'M', date_naissance: '1999-11-30' } },
  { id: 'reg-4', member: { id: 'demo-4', nom: 'Ngolo',    prenom: 'Christian',  genre: 'M', date_naissance: '2003-01-10' } },
  { id: 'reg-5', member: { id: 'demo-5', nom: 'Boseko',   prenom: 'Esther',     genre: 'F', date_naissance: '2001-07-18' } },
  { id: 'reg-6', member: { id: 'demo-6', nom: 'Lukusa',   prenom: 'Grace',      genre: 'F', date_naissance: '2005-03-05' } },
  { id: 'reg-7', member: { id: 'demo-7', nom: 'Bakama',   prenom: 'Élysée',     genre: 'M', date_naissance: '2000-09-25' } },
  { id: 'reg-8', member: { id: 'demo-8', nom: 'Mulumba',  prenom: 'Rébecca',    genre: 'F', date_naissance: '1998-12-14' } }
]

// ─── Helpers UI ──────────────────────────────────────────────────────────────

const ageRange = (stats) => {
  if (stats.ageMin === null) return '—'
  if (stats.ageMin === stats.ageMax) return `${stats.ageMin} ans`
  return `${stats.ageMin} – ${stats.ageMax} ans`
}

const StepBadge = ({ n, label, done, active }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
    <div style={{
      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
      background: done ? 'rgba(46,204,113,0.2)' : active ? 'rgba(200,169,81,0.2)' : 'rgba(255,255,255,0.06)',
      color: done ? '#2ecc71' : active ? 'var(--accent-color)' : 'var(--text-secondary)',
      border: `1px solid ${done ? 'rgba(46,204,113,0.4)' : active ? 'rgba(200,169,81,0.4)' : 'rgba(255,255,255,0.08)'}`
    }}>
      {done ? '✓' : n}
    </div>
    <span style={{ color: done ? '#2ecc71' : active ? '#fff' : 'var(--text-secondary)' }}>{label}</span>
  </div>
)

// ─── Composant principal ─────────────────────────────────────────────────────

export default function CarrefourRepartitionPanel({ isDemo }) {
  const [retreats, setRetreats] = useState([])
  const [selectedRetreatId, setSelectedRetreatId] = useState('')
  const [loadingRetreats, setLoadingRetreats] = useState(true)

  // État machine : idle | loading | done | error
  const [status, setStatus] = useState('idle')
  const [step, setStep] = useState(0) // 0-3 pour la progression visuelle
  const [result, setResult] = useState(null) // Tableau récapitulatif après répartition
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmReset, setConfirmReset] = useState(false) // Affiche la bannière de confirmation

  // Charger la liste des retraites avec des inscrits
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
          // Garder seulement les retraites avec des inscrits
          const withRegistrants = all.filter(r => r.nb_inscrits > 0)
          setRetreats(withRegistrants)
          if (withRegistrants.length > 0) setSelectedRetreatId(withRegistrants[0].id)
        }
      } catch (err) {
        console.error('Erreur chargement retraites pour répartition :', err)
      } finally {
        setLoadingRetreats(false)
      }
    }
    load()
  }, [isDemo])

  const handleLaunchClick = async () => {
    if (!selectedRetreatId) return
    setErrorMsg('')

    // Vérifier l'existence d'une répartition antérieure
    if (!isDemo) {
      try {
        const hasExisting = await retreatService.hasExistingCarrefours(selectedRetreatId)
        if (hasExisting && !confirmReset) {
          setConfirmReset(true)
          return
        }
      } catch { /* continue */ }
    } else if (result && !confirmReset) {
      // Mode démo : même logique de confirmation si déjà calculé
      setConfirmReset(true)
      return
    }

    setConfirmReset(false)
    setStatus('loading')
    setResult(null)
    setStep(1)

    try {
      // ── Étape 1 : Charger les inscrits validés ───────────────
      let registrants
      if (isDemo) {
        await new Promise(r => setTimeout(r, 400))
        registrants = DEMO_REGISTRANTS
      } else {
        registrants = await retreatService.getValidatedRegistrants(selectedRetreatId)
      }

      if (registrants.length === 0) {
        setErrorMsg("Aucun inscrit avec le statut 'Validée' pour cette retraite. Validez d'abord des inscriptions.")
        setStatus('error')
        setStep(0)
        return
      }

      setStep(2)

      // ── Étape 2 : Algorithme de répartition ──────────────────
      const nbCarrefours = Math.max(1, Math.ceil(registrants.length / 10))
      const groups = distributeToCarrefours(registrants, nbCarrefours)

      setStep(3)

      // ── Étape 3 : Persistance en BDD (ignorée en démo) ───────
      let carrefourNames
      if (!isDemo) {
        const createdCarrefours = await retreatService.createCarrefours(selectedRetreatId, nbCarrefours)

        // Construire les assignments : chaque membre → son carrefour_id
        const assignments = []
        groups.forEach((group, gi) => {
          const carrefourId = createdCarrefours[gi].id
          group.members.forEach(m => {
            assignments.push({ registrationId: m.id, carrefourId })
          })
        })
        await retreatService.assignCarrefours(assignments)
        carrefourNames = createdCarrefours.map(c => c.nom_carrefour)
      } else {
        await new Promise(r => setTimeout(r, 500))
        carrefourNames = groups.map((_, i) => `Carrefour n°${i + 1}`)
      }

      // ── Étape 4 : Calcul des statistiques pour le tableau ────
      const stats = groups.map((group, i) => computeGroupStats(group, carrefourNames[i]))
      setResult(stats)
      setStatus('done')
      setStep(4)

    } catch (err) {
      console.error('Erreur répartition carrefours :', err)
      setErrorMsg("Une erreur est survenue pendant la répartition. Vérifiez la console.")
      setStatus('error')
      setStep(0)
    }
  }

  const selectedRetreat = retreats.find(r => r.id === selectedRetreatId)

  return (
    <section className="glass-panel flex flex-col gap-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>🔀 Répartition des Carrefours</h2>
        {result && (
          <button
            className="glass-button"
            style={{ fontSize: '0.8rem' }}
            onClick={() => { setResult(null); setStatus('idle'); setStep(0) }}
          >
            ↺ Réinitialiser
          </button>
        )}
      </div>

      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
        Lance l'algorithme de répartition équilibrée (genre + âge) pour distribuer automatiquement les inscrits validés dans des carrefours de prière.
      </p>

      {loadingRetreats ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
          <div style={{
            width: '28px', height: '28px', border: '2px solid rgba(255,255,255,0.1)',
            borderLeftColor: 'var(--accent-color)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Chargement...
        </div>
      ) : retreats.length === 0 ? (
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center',
          color: 'var(--text-secondary)', fontSize: '0.88rem'
        }}>
          <p>Aucune retraite avec des inscrits trouvée.</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Créez d'abord une retraite et inscrivez des membres (statut "Validée").</p>
        </div>
      ) : (
        <>
          {/* Sélecteur de retraite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flexShrink: 0 }}>Retraite :</label>
            <select
              value={selectedRetreatId}
              onChange={e => { setSelectedRetreatId(e.target.value); setResult(null); setStatus('idle'); setStep(0); setConfirmReset(false) }}
              disabled={status === 'loading'}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', padding: '0.4rem 0.7rem', borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem', flex: 1, minWidth: '200px', cursor: 'pointer'
              }}
            >
              {retreats.map(r => (
                <option key={r.id} value={r.id} style={{ background: '#1a0a2e' }}>
                  {r.titre} ({r.nb_inscrits} inscrit(s))
                </option>
              ))}
            </select>
            {selectedRetreat && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                → {Math.max(1, Math.ceil(selectedRetreat.nb_inscrits / 10))} carrefour(s) prévu(s)
              </span>
            )}
          </div>

          {/* Indicateur de progression */}
          {status === 'loading' && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--radius-md)', padding: '1rem'
            }}>
              <StepBadge n={1} label="Chargement des inscrits validés..."   done={step > 1} active={step === 1} />
              <StepBadge n={2} label="Calcul de la répartition équilibrée" done={step > 2} active={step === 2} />
              <StepBadge n={3} label="Enregistrement en base de données"    done={step > 3} active={step === 3} />
            </div>
          )}

          {/* Bannière de confirmation de réinitialisation */}
          {confirmReset && status !== 'loading' && (
            <div style={{
              background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.25)',
              borderRadius: 'var(--radius-md)', padding: '0.9rem 1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.88rem', color: '#e74c3c' }}>
                ⚠ Une répartition existe déjà. Voulez-vous l'écraser et recommencer ?
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="glass-button" style={{ fontSize: '0.8rem' }} onClick={() => setConfirmReset(false)}>
                  Annuler
                </button>
                <button
                  className="glass-button accent"
                  style={{ fontSize: '0.8rem', background: 'rgba(231,76,60,0.15)', borderColor: 'rgba(231,76,60,0.4)', color: '#e74c3c' }}
                  onClick={handleLaunchClick}
                >
                  Oui, écraser et relancer
                </button>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {status === 'error' && (
            <div style={{
              background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)',
              borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
              fontSize: '0.85rem', color: '#e74c3c'
            }}>
              ⚠ {errorMsg}
            </div>
          )}

          {/* Bouton de lancement */}
          {!confirmReset && status !== 'loading' && (
            <button
              className="glass-button accent"
              style={{ alignSelf: 'flex-start', fontSize: '0.9rem' }}
              onClick={handleLaunchClick}
              disabled={!selectedRetreatId || status === 'loading'}
            >
              🔀 Lancer la répartition automatique
            </button>
          )}

          {/* Tableau récapitulatif après répartition */}
          {status === 'done' && result && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ color: '#2ecc71', fontSize: '1.1rem' }}>✓</span>
                <h3 style={{ fontSize: '0.95rem', color: '#2ecc71', margin: 0 }}>
                  Répartition terminée — {result.length} carrefour(s) créé(s)
                </h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {['Carrefour', 'Total', 'Garçons ♂', 'Filles ♀', 'Âge (min – max)'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((stats, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.55rem 0.75rem', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap' }}>
                          {stats.nom}
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                          {stats.total}
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', color: '#5dade2' }}>
                          {stats.garcons}
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', textAlign: 'center', color: '#f1948a' }}>
                          {stats.filles}
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {ageRange(stats)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>Total</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                        {result.reduce((s, r) => s + r.total, 0)}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#5dade2', fontWeight: 'bold' }}>
                        {result.reduce((s, r) => s + r.garcons, 0)}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#f1948a', fontWeight: 'bold' }}>
                        {result.reduce((s, r) => s + r.filles, 0)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
