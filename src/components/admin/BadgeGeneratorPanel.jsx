import React, { useState, useEffect, useRef } from 'react'
import { retreatService } from '../../services/retreatService'
import { generateBadgesPDF } from '../../services/pdfGenerator'

// ─── Données Mode Démo ────────────────────────────────────────────────────────
const DEMO_RETREAT = {
  id: 'demo-retreat-1',
  titre: "Feu de l'Esprit 2026",
  image_affiche_url: null
}

const DEMO_MEMBERS = [
  { id: 'm1', nom: 'Ambunga',   prenom: 'Didier',    role: 'Membre',       carrefour: 'Carrefour n°1' },
  { id: 'm2', nom: 'Kabangu',   prenom: 'Sarah',     role: 'Membre',       carrefour: 'Carrefour n°2' },
  { id: 'm3', nom: 'Mbuyi',     prenom: 'Jean-Paul', role: 'Responsable',  carrefour: 'Carrefour n°1' },
  { id: 'm4', nom: 'Ngolo',     prenom: 'Christian', role: 'Membre',       carrefour: 'Carrefour n°2' },
  { id: 'm5', nom: 'Boseko',    prenom: 'Esther',    role: 'Membre',       carrefour: 'Carrefour n°1' },
  { id: 'm6', nom: 'Lukusa',    prenom: 'Grace',     role: 'Membre',       carrefour: 'Carrefour n°3' },
  { id: 'm7', nom: 'Bakama',    prenom: 'Élysée',    role: 'Admin',        carrefour: null            },
  { id: 'm8', nom: 'Mulumba',   prenom: 'Rébecca',   role: 'Responsable',  carrefour: null            }
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (str) =>
  str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff',
  padding: '0.45rem 0.65rem',
  borderRadius: 'var(--radius-sm, 6px)',
  fontSize: '0.85rem',
  outline: 'none',
  flex: 1
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function BadgeGeneratorPanel({ isDemo }) {
  const [retreats, setRetreats]         = useState([])
  const [selectedRetreat, setSelectedRetreat] = useState(null)
  const [layout, setLayout]             = useState('single')
  const [appBaseUrl, setAppBaseUrl]     = useState(window.location.origin)

  const [status, setStatus]             = useState('idle') // idle | loading | success | error
  const [progress, setProgress]         = useState({ current: 0, total: 0 })
  const [errorMsg, setErrorMsg]         = useState('')
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null)
  const [generatedPdfName, setGeneratedPdfName] = useState('')

  const downloadLinkRef = useRef(null)

  // ── Charger les retraites ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (isDemo) {
        setRetreats([DEMO_RETREAT])
        setSelectedRetreat(DEMO_RETREAT)
      } else {
        try {
          const all = await retreatService.getAllRetreats()
          setRetreats(all)
          if (all.length > 0) setSelectedRetreat(all[0])
        } catch (err) {
          console.error('Erreur chargement retraites:', err)
        }
      }
    }
    load()
  }, [isDemo])

  // Libérer l'URL blob précédente
  useEffect(() => {
    return () => { if (generatedPdfUrl) URL.revokeObjectURL(generatedPdfUrl) }
  }, [generatedPdfUrl])

  // ── Lancer la génération ──────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedRetreat) return
    setStatus('loading')
    setErrorMsg('')
    setProgress({ current: 0, total: 0 })
    if (generatedPdfUrl) { URL.revokeObjectURL(generatedPdfUrl); setGeneratedPdfUrl(null) }

    try {
      let rawMembers

      if (isDemo) {
        await new Promise(r => setTimeout(r, 400))
        rawMembers = DEMO_MEMBERS
      } else {
        // Récupérer les inscrits validés avec carrefour
        const registrants = await retreatService.getValidatedRegistrants(selectedRetreat.id)
        rawMembers = registrants.map(r => ({
          id:         r.member?.id ?? r.id,
          nom:        r.member?.nom ?? '—',
          prenom:     r.member?.prenom ?? '',
          role:       r.member?.role ?? 'Membre',
          carrefour:  r.carrefour?.nom_carrefour ?? null
        }))
      }

      if (rawMembers.length === 0) {
        setErrorMsg("Aucun inscrit validé trouvé pour cette retraite. Validez d'abord des inscriptions.")
        setStatus('error')
        return
      }

      const pdfBytes = await generateBadgesPDF({
        members:    rawMembers,
        layout,
        appBaseUrl,
        bgImageUrl: selectedRetreat.image_affiche_url ?? null,
        onProgress: (current, total) => setProgress({ current, total })
      })

      // Créer un URL blob pour le téléchargement
      const blob  = new Blob([pdfBytes], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      const filename = `badges_${slugify(selectedRetreat.titre)}.pdf`

      setGeneratedPdfUrl(blobUrl)
      setGeneratedPdfName(filename)
      setStatus('success')

      // Déclencher le téléchargement automatique
      setTimeout(() => {
        if (downloadLinkRef.current) downloadLinkRef.current.click()
      }, 150)

    } catch (err) {
      console.error('Erreur génération PDF:', err)
      setErrorMsg(`Erreur lors de la génération : ${err.message ?? 'inconnue'}`)
      setStatus('error')
    }
  }

  const progressPct = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ─── En-tête ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
            🪪 Génération des Badges PDF
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
            Exportez tous les badges prêts à imprimer avec QR codes intégrés.
          </p>
        </div>
        {isDemo && (
          <span style={{
            background: 'rgba(255,193,7,0.12)', color: '#ffc107',
            border: '1px solid rgba(255,193,7,0.25)',
            padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600'
          }}>
            MODE DÉMO
          </span>
        )}
      </div>

      {/* ─── Configuration ───────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 'var(--radius-md, 10px)',
        padding: '1rem'
      }}>
        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.85rem' }}>
          Paramètres de génération
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>

          {/* Sélecteur retraite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Retraite *</label>
            <select
              id="badge-retreat-select"
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={selectedRetreat?.id ?? ''}
              onChange={e => setSelectedRetreat(retreats.find(r => r.id === e.target.value) ?? null)}
              disabled={retreats.length === 0}
            >
              {retreats.length === 0
                ? <option style={{ background: '#1a0a2e' }}>Aucune retraite</option>
                : retreats.map(r => (
                    <option key={r.id} value={r.id} style={{ background: '#1a0a2e' }}>{r.titre}</option>
                  ))
              }
            </select>
          </div>

          {/* Disposition */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Disposition *</label>
            <select
              id="badge-layout-select"
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={layout}
              onChange={e => setLayout(e.target.value)}
            >
              <option value="single"  style={{ background: '#1a0a2e' }}>1 badge / page A6 (paysage)</option>
              <option value="grid2x2" style={{ background: '#1a0a2e' }}>4 badges / page A4 (2×2)</option>
            </select>
          </div>

          {/* URL de base */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              URL de base de l'app
              <span style={{ marginLeft: '0.3rem', opacity: 0.45, fontSize: '0.72rem' }}>(pour les QR codes)</span>
            </label>
            <input
              id="badge-base-url"
              style={inputStyle}
              value={appBaseUrl}
              onChange={e => setAppBaseUrl(e.target.value)}
              placeholder="https://votre-app.vercel.app"
            />
          </div>

        </div>

        {/* Info fond de badge */}
        <div style={{
          marginTop: '0.85rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.78rem', color: 'var(--text-secondary)'
        }}>
          {selectedRetreat?.image_affiche_url ? (
            <span style={{ color: '#2ecc71' }}>
              ✓ Image de fond disponible pour cette retraite
            </span>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>
              ℹ Aucun fond d'affiche configuré. Configurez-en un dans le panneau "Arrière-plan des Badges".
            </span>
          )}
        </div>
      </div>

      {/* ─── Bouton de génération ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          id="badge-generate-btn"
          className="glass-button accent"
          style={{
            fontSize: '0.92rem', fontWeight: '700',
            padding: '0.7rem 1.4rem',
            opacity: (status === 'loading' || !selectedRetreat) ? 0.6 : 1,
            cursor: (status === 'loading' || !selectedRetreat) ? 'not-allowed' : 'pointer'
          }}
          onClick={handleGenerate}
          disabled={status === 'loading' || !selectedRetreat}
        >
          {status === 'loading' ? '⏳ Génération en cours...' : '⬇ Générer & Télécharger le PDF'}
        </button>

        {status === 'success' && generatedPdfUrl && (
          <a
            id="badge-download-link"
            ref={downloadLinkRef}
            href={generatedPdfUrl}
            download={generatedPdfName}
            style={{
              background: 'rgba(46,204,113,0.12)', color: '#2ecc71',
              border: '1px solid rgba(46,204,113,0.25)',
              padding: '0.55rem 1rem', borderRadius: '30px',
              fontSize: '0.82rem', fontWeight: '600',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
            }}
          >
            ⬇ {generatedPdfName}
          </a>
        )}
      </div>

      {/* ─── Barre de progression ─────────────────────────────────── */}
      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <span>Génération des badges…</span>
            <span>{progress.current} / {progress.total} badges ({progressPct}%)</span>
          </div>
          <div style={{
            height: '6px', background: 'rgba(255,255,255,0.08)',
            borderRadius: '3px', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, var(--accent-color, #9b59b6), #f39c12)',
              borderRadius: '3px',
              transition: 'width 0.2s ease'
            }} />
          </div>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
            Génération côté navigateur — veuillez patienter.
          </p>
        </div>
      )}

      {/* ─── Message de succès ────────────────────────────────────── */}
      {status === 'success' && (
        <div style={{
          background: 'rgba(46,204,113,0.06)', border: '1px solid rgba(46,204,113,0.2)',
          borderRadius: 'var(--radius-md, 10px)', padding: '0.85rem 1rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.65rem'
        }}>
          <span style={{ fontSize: '1.2rem' }}>✅</span>
          <div>
            <p style={{ color: '#2ecc71', fontWeight: '600', margin: '0 0 0.2rem', fontSize: '0.9rem' }}>
              PDF généré avec succès — {progress.total} badge{progress.total > 1 ? 's' : ''}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', margin: 0 }}>
              Le téléchargement a démarré automatiquement. Si ce n'est pas le cas, utilisez le lien ci-dessus.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', margin: '0.3rem 0 0' }}>
              ℹ Les QR codes encodent : <code style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '0 3px', borderRadius: 3 }}>{appBaseUrl}/presence/[id_membre]</code>
            </p>
          </div>
        </div>
      )}

      {/* ─── Message d'erreur ─────────────────────────────────────── */}
      {status === 'error' && (
        <div style={{
          background: 'rgba(231,76,60,0.07)', border: '1px solid rgba(231,76,60,0.2)',
          borderRadius: 'var(--radius-sm, 6px)', padding: '0.7rem 0.9rem',
          fontSize: '0.83rem', color: '#e74c3c'
        }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* ─── Aperçu du format sélectionné ────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '0.85rem',
        display: 'flex', gap: '1rem', flexWrap: 'wrap'
      }}>
        {[
          { key: 'single',  label: '1 / page A6', icon: '📄', desc: '148×105 mm — Idéal pour impression directe sur carton A6' },
          { key: 'grid2x2', label: '4 / page A4', icon: '🗂️', desc: '210×297 mm — Économique, découpage après impression' }
        ].map(opt => (
          <div
            key={opt.key}
            onClick={() => setLayout(opt.key)}
            style={{
              flex: '1 1 180px',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md, 10px)',
              border: `1px solid ${layout === opt.key ? 'var(--accent-color, #9b59b6)' : 'rgba(255,255,255,0.07)'}`,
              background: layout === opt.key ? 'rgba(155,89,182,0.08)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.1rem' }}>{opt.icon}</span>
              <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.88rem' }}>{opt.label}</span>
              {layout === opt.key && (
                <span style={{ marginLeft: 'auto', color: 'var(--accent-color, #9b59b6)', fontSize: '0.75rem' }}>✓</span>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.73rem', margin: 0, lineHeight: 1.4 }}>{opt.desc}</p>
          </div>
        ))}
      </div>

    </section>
  )
}
