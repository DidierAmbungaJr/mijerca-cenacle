import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../services/supabase'

export default function MeditationPlayer() {
  const [meditation, setMeditation] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [isDemoData, setIsDemoData] = useState(false)
  
  // États PWA Cache
  const [isCached, setIsCached] = useState(false)

  const audioRef = useRef(new Audio())

  // Détecte le statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Charge la méditation et gère le cache
  useEffect(() => {
    const fetchMeditation = async () => {
      setLoading(true)
      const dateString = currentDate.toISOString().split('T')[0]
      setIsDemoData(false)
      setIsCached(false)

      try {
        const { data, error } = await supabase
          .from('meditations')
          .select('*')
          .eq('date_publication', dateString)
          .single()
          
        if (!error && data) {
          setMeditation(data)
          audioRef.current.src = data.audio_url
          audioRef.current.load()
          await checkAndPreCache(data.audio_url)
        } else {
          loadDemoMeditation(dateString)
        }
      } catch (err) {
        loadDemoMeditation(dateString)
      } finally {
        setLoading(false)
        setIsPlaying(false)
      }
    }

    fetchMeditation()
  }, [currentDate])

  const loadDemoMeditation = async (dateString) => {
    setIsDemoData(true)
    const demoUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    setMeditation({
      date_publication: dateString,
      texte_biblique: `« Mais vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins à Jérusalem, dans toute la Judée, dans la Samarie, et jusqu'aux extrémités de la terre. »\n\n— Actes de Apôtres 1, 8`,
      audio_url: demoUrl,
      auteur: 'Père Jean-Paul (Kinshasa)'
    })
    audioRef.current.src = demoUrl
    audioRef.current.load()
    await checkAndPreCache(demoUrl)
  }

  // Vérifie si l'audio est déjà dans le cache local, sinon le télécharge
  const checkAndPreCache = async (url) => {
    if (!('caches' in window) || !url) return

    try {
      const cache = await caches.open('meditations-audio-cache')
      const matchedResponse = await cache.match(url)
      
      if (matchedResponse) {
        setIsCached(true)
      } else if (navigator.onLine) {
        // En ligne : pré-télécharge en tâche de fond pour consultation offline future
        await cache.add(url)
        setIsCached(true)
      }
    } catch (err) {
      console.warn("PWA Caching storage warning or CORS limits:", err)
    }
  }

  useEffect(() => {
    const audio = audioRef.current

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
    }
  }, [])

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      // Si hors-ligne et non caché, empêcher la lecture
      if (isOffline && !isCached) {
        alert("Cette méditation n'est pas disponible hors-ligne. Veuillez vous connecter pour la télécharger.")
        return
      }
      audioRef.current.play().catch(err => {
        console.warn("Audio play failed or interrupted", err)
      })
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressChange = (e) => {
    const newPercent = parseFloat(e.target.value)
    const newTime = (newPercent / 100) * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const changeDay = (offset) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + offset)
    setCurrentDate(newDate)
  }

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Partage WhatsApp dynamique
  const handleShareWhatsApp = (e) => {
    e.preventDefault()
    if (!meditation) return

    const dateFormatted = new Date(meditation.date_publication).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long'
    })
    
    const rawText = meditation.texte_biblique || ''
    const cleanText = rawText.length > 150 ? `${rawText.substring(0, 150)}...` : rawText
    
    const shareText = `🕊️ *MIJERCA Cénacle - Méditation du ${dateFormatted}* 🕊️\n\n« ${cleanText} »\n\n👉 Retrouve le texte biblique complet et l'écoute audio hors-ligne sur notre application : ${window.location.origin}`
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Chargement de la méditation...</p>
      </div>
    )
  }

  return (
    <div className="glass-panel flex flex-col gap-4">
      
      {/* En-tête Méditation */}
      <div className="flex justify-between items-start" style={{ gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>
            Méditation du {new Date(meditation.date_publication).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          {isDemoData && (
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
              ⚠️ MODE DÉMO (Données simulées)
            </span>
          )}
        </div>
        
        {/* Statuts PWA & Cache visuels */}
        <div className="flex flex-col items-end" style={{ gap: '0.25rem' }}>
          <span style={{ 
            fontSize: '0.7rem', 
            color: isOffline ? '#ef4444' : 'var(--success-color)', 
            background: isOffline ? 'rgba(239, 68, 68, 0.1)' : 'rgba(46, 196, 182, 0.1)', 
            padding: '0.2rem 0.5rem', 
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600'
          }}>
            {isOffline ? '● Hors-ligne' : '● Connecté'}
          </span>
          
          <span style={{ 
            fontSize: '0.7rem', 
            color: isCached ? 'var(--success-color)' : (isOffline ? '#ef4444' : 'var(--accent-color)'), 
            background: isCached ? 'rgba(46, 196, 182, 0.1)' : (isOffline ? 'rgba(239, 68, 68, 0.1)' : 'rgba(230, 194, 41, 0.1)'), 
            padding: '0.2rem 0.5rem', 
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600'
          }}>
            ☁️ {isCached ? 'Disponible Offline' : (isOffline ? 'Non dispo offline' : 'En ligne uniquement')}
          </span>
        </div>
      </div>

      {/* Texte Biblique */}
      <div style={{ 
        padding: '1rem', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid rgba(255,255,255,0.05)',
        maxHeight: '220px',
        overflowY: 'auto'
      }}>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontStyle: 'italic', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
          {meditation.texte_biblique}
        </p>
        {meditation.auteur && (
          <p style={{ fontSize: '0.8rem', color: 'var(--accent-color)', textAlign: 'right', marginTop: '0.75rem', fontWeight: '500' }}>
            Méditation par {meditation.auteur}
          </p>
        )}
      </div>

      {/* Lecteur Audio */}
      <div className="flex flex-col gap-4" style={{ gap: '0.6rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.02)' }}>
        <div className="flex justify-between" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          <span style={{ color: isPlaying ? 'var(--success-color)' : 'var(--text-secondary)' }}>
            {isPlaying ? '● Lecture...' : 'Prêt'}
          </span>
        </div>
        
        {/* Curseur de progression */}
        <input 
          type="range"
          min="0"
          max="100"
          value={duration ? (currentTime / duration) * 100 : 0}
          disabled={isOffline && !isCached}
          onChange={handleProgressChange}
          style={{ 
            width: '100%', 
            accentColor: 'var(--accent-color)', 
            cursor: (isOffline && !isCached) ? 'not-allowed' : 'pointer',
            height: '6px',
            borderRadius: '3px'
          }}
        />

        {/* Contrôles interactifs */}
        <div className="flex justify-between items-center" style={{ marginTop: '0.5rem', gap: '0.5rem' }}>
          <button 
            className="glass-button" 
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', flex: 1 }} 
            onClick={() => changeDay(-1)}
          >
            ⏮ Hier
          </button>
          
          <button 
            className="glass-button accent" 
            style={{ 
              padding: '0.5rem 1.2rem', 
              fontSize: '0.9rem', 
              flex: 1.5,
              opacity: (isOffline && !isCached) ? 0.5 : 1,
              cursor: (isOffline && !isCached) ? 'not-allowed' : 'pointer'
            }} 
            onClick={handlePlayPause}
          >
            {isPlaying ? '⏸ Pause' : '▶ Écouter'}
          </button>
          
          <button 
            className="glass-button" 
            style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', flex: 1 }} 
            onClick={() => changeDay(1)}
          >
            Demain ⏭
          </button>
        </div>
      </div>

      {/* Bouton de Partage WhatsApp */}
      <button 
        onClick={handleShareWhatsApp}
        className="glass-button"
        style={{ 
          width: '100%', 
          background: 'rgba(37, 211, 102, 0.15)', 
          color: '#25D366', 
          border: '1px solid rgba(37, 211, 102, 0.3)',
          textAlign: 'center'
        }}
      >
        💬 Partager cette méditation sur WhatsApp
      </button>
    </div>
  )
}
