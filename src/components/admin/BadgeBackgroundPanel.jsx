import React, { useState, useEffect, useRef } from 'react'
import { retreatService } from '../../services/retreatService'
import { badgeService } from '../../services/badgeService'

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_MB = 5

// Exemple de données superposées pour la prévisualisation
const PREVIEW_SAMPLE = {
  nom: 'AMBUNGA Didier',
  role: 'Membre',
  carrefour: 'Carrefour n°3'
}

// Badge ratio A6 (148mm × 105mm landscape) ≈ 1.41
const BADGE_RATIO = 148 / 105

export default function BadgeBackgroundPanel({ isDemo }) {
  const [retreats, setRetreats] = useState([])
  const [selectedRetreatId, setSelectedRetreatId] = useState('')
  const [loadingRetreats, setLoadingRetreats] = useState(true)

  // Image
  const [previewUrl, setPreviewUrl] = useState(null) // URL locale (FileReader) ou Supabase
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError] = useState('')

  // Upload
  const [uploadStatus, setUploadStatus] = useState('idle') // idle | uploading | success | error
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadMsg, setUploadMsg] = useState('')

  const fileInputRef = useRef(null)

  // ── Charger les retraites ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingRetreats(true)
      try {
        if (isDemo) {
          await new Promise(r => setTimeout(r, 300))
          setRetreats([
            { id: 'demo-retreat-1', titre: "Feu de l'Esprit 2026", image_affiche_url: null },
            { id: 'demo-retreat-2', titre: 'Retraite Jeunesse Noël 2026', image_affiche_url: null }
          ])
          setSelectedRetreatId('demo-retreat-1')
        } else {
          const all = await retreatService.getAllRetreats()
          setRetreats(all)
          if (all.length > 0) setSelectedRetreatId(all[0].id)
        }
      } catch (err) {
        console.error('Erreur chargement retraites badge :', err)
      } finally {
        setLoadingRetreats(false)
      }
    }
    load()
  }, [isDemo])

  // ── Charger le fond existant quand la retraite change ─────
  useEffect(() => {
    if (!selectedRetreatId) return
    setSelectedFile(null)
    setFileError('')
    setUploadStatus('idle')
    setUploadMsg('')
    setPreviewUrl(null)

    if (isDemo) return // Pas de fond persisté en démo

    const loadExisting = async () => {
      try {
        const url = await badgeService.getExistingBackground(selectedRetreatId)
        if (url) setPreviewUrl(url)
      } catch { /* pas de fond existant */ }
    }
    loadExisting()
  }, [selectedRetreatId, isDemo])

  // ── Sélection de fichier ───────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError('')
    setUploadStatus('idle')
    setUploadMsg('')

    // Validation du type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Format non supporté. Utilisez .jpg, .png ou .webp.')
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    // Validation de la taille
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`Fichier trop volumineux (max ${MAX_FILE_SIZE_MB} Mo).`)
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    setSelectedFile(file)

    // Lecture locale pour la prévisualisation instantanée
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  // ── Enregistrer le fond ────────────────────────────────────
  const handleSave = async () => {
    if (!selectedFile || !selectedRetreatId) return
    setUploadStatus('uploading')
    setUploadProgress(0)
    setUploadMsg('')

    try {
      if (isDemo) {
        // Simulation en démo : progression animée fictive
        for (let p = 20; p <= 100; p += 20) {
          await new Promise(r => setTimeout(r, 180))
          setUploadProgress(p)
        }
        setUploadStatus('success')
        setUploadMsg('Fond enregistré avec succès (Mode Démo).')
      } else {
        // La progression réelle de Supabase Storage n'expose pas d'events —
        // on simule 30% au démarrage, 100% à la fin.
        setUploadProgress(30)
        const publicUrl = await badgeService.uploadBackground(selectedRetreatId, selectedFile)
        setUploadProgress(100)
        setPreviewUrl(publicUrl)
        setUploadStatus('success')
        setUploadMsg('Fond enregistré et lié à la retraite avec succès.')
        setSelectedFile(null)
      }
    } catch (err) {
      console.error('Erreur upload fond badge :', err)
      setUploadStatus('error')
      setUploadMsg("Erreur lors de l'enregistrement. Vérifiez les droits du bucket Supabase.")
    }
  }

  const selectedRetreat = retreats.find(r => r.id === selectedRetreatId)

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', padding: '0.4rem 0.7rem', borderRadius: 'var(--radius-sm)',
    fontSize: '0.88rem', cursor: 'pointer'
  }

  return (
    <section className="glass-panel flex flex-col gap-4">
      {/* En-tête */}
      <div>
        <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: '0 0 0.25rem' }}>🎨 Arrière-plan des Badges</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Téléversez l'affiche de la retraite pour l'utiliser comme fond de badge. Prévisualisez le rendu final avant de l'enregistrer.
        </p>
      </div>

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
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Panneau de contrôle gauche ─────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Sélecteur de retraite */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Retraite</label>
              <select
                value={selectedRetreatId}
                onChange={e => setSelectedRetreatId(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
              >
                {retreats.map(r => (
                  <option key={r.id} value={r.id} style={{ background: '#1a0a2e' }}>
                    {r.titre}
                  </option>
                ))}
              </select>
            </div>

            {/* File picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Image de fond <span style={{ fontSize: '0.72rem' }}>(JPG, PNG, WEBP · max 5 Mo)</span>
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${selectedFile ? 'rgba(200,169,81,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 'var(--radius-md)', padding: '1.25rem',
                  textAlign: 'center', cursor: 'pointer',
                  background: selectedFile ? 'rgba(200,169,81,0.04)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>🖼️</div>
                <p style={{ fontSize: '0.82rem', color: selectedFile ? 'var(--accent-color)' : 'var(--text-secondary)', margin: 0 }}>
                  {selectedFile ? selectedFile.name : 'Cliquez pour choisir une image'}
                </p>
                {selectedFile && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {fileError && (
                <p style={{ fontSize: '0.8rem', color: '#e74c3c', margin: 0 }}>⚠ {fileError}</p>
              )}
            </div>

            {/* Barre de progression */}
            {uploadStatus === 'uploading' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  <span>Upload en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${uploadProgress}%`,
                    background: 'linear-gradient(90deg, rgba(200,169,81,0.6), var(--accent-color))',
                    transition: 'width 0.3s ease', borderRadius: '2px'
                  }} />
                </div>
              </div>
            )}

            {/* Message résultat */}
            {uploadMsg && (
              <div style={{
                fontSize: '0.82rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                background: uploadStatus === 'success' ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                color: uploadStatus === 'success' ? '#2ecc71' : '#e74c3c',
                border: `1px solid ${uploadStatus === 'success' ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)'}`
              }}>
                {uploadStatus === 'success' ? '✓' : '⚠'} {uploadMsg}
              </div>
            )}

            {/* Bouton de sauvegarde */}
            <button
              className="glass-button accent"
              style={{ alignSelf: 'flex-start', opacity: (!selectedFile || uploadStatus === 'uploading') ? 0.5 : 1 }}
              onClick={handleSave}
              disabled={!selectedFile || uploadStatus === 'uploading'}
            >
              {uploadStatus === 'uploading' ? '⏳ Enregistrement...' : '💾 Enregistrer ce fond'}
            </button>

            {!selectedFile && !previewUrl && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                Aucun fond sélectionné. Choisissez une image pour voir la prévisualisation.
              </p>
            )}
          </div>

          {/* ── Prévisualisation badge droite ──────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Prévisualisation du badge{selectedRetreat ? ` — ${selectedRetreat.titre}` : ''}
            </label>

            {previewUrl ? (
              <div style={{
                position: 'relative',
                width: '100%',
                paddingTop: `${(1 / BADGE_RATIO) * 100}%`, // ratio A6 landscape
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                {/* Image de fond */}
                <img
                  src={previewUrl}
                  alt="Fond du badge"
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover'
                  }}
                />

                {/* Overlay de texte d'exemple */}
                <div style={{
                  position: 'absolute', bottom: '8%', left: '5%', right: '5%',
                  background: 'rgba(0,0,0,0.58)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: '6px',
                  padding: '6% 8%',
                  border: '1px solid rgba(255,255,255,0.12)'
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: 'clamp(0.65rem, 2.5vw, 0.95rem)', fontWeight: 'bold', color: '#fff', letterSpacing: '0.02em' }}>
                    {PREVIEW_SAMPLE.nom}
                  </p>
                  <p style={{ margin: '0 0 4px', fontSize: 'clamp(0.55rem, 2vw, 0.75rem)', color: 'var(--accent-color)', fontWeight: '500' }}>
                    {PREVIEW_SAMPLE.role}
                  </p>
                  <p style={{ margin: 0, fontSize: 'clamp(0.5rem, 1.8vw, 0.7rem)', color: 'rgba(255,255,255,0.75)' }}>
                    🔀 {PREVIEW_SAMPLE.carrefour}
                  </p>
                </div>

                {/* Indicateur "APERÇU" */}
                <div style={{
                  position: 'absolute', top: '4%', right: '4%',
                  background: 'rgba(0,0,0,0.6)', borderRadius: '4px',
                  padding: '2px 6px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.1em'
                }}>
                  APERÇU
                </div>
              </div>
            ) : (
              <div style={{
                width: '100%', paddingTop: `${(1 / BADGE_RATIO) * 100}%`,
                position: 'relative', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.02)',
                border: '2px dashed rgba(255,255,255,0.08)'
              }}>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center', color: 'var(--text-secondary)'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🖼️</div>
                  <p style={{ fontSize: '0.78rem', margin: 0 }}>La prévisualisation<br />apparaîtra ici</p>
                </div>
              </div>
            )}

            {previewUrl && (
              <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                Format badge A6 simulé · Texte d'exemple superposé
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
