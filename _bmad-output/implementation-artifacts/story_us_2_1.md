# Spécification de Story : US-2.1

**ID** : US-2.1  
**Titre** : Lecteur de Méditations Quotidiennes (Interface & Intégration Supabase)  
**Épique** : Epic 2 — Vie Spirituelle & Cache Offline (PWA)  
**Estimation** : 3 Story Points  
**Statut** : Complété (Done)  
**Responsable** : Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

Cette story implémente le cœur de l'expérience membre. Elle permet d'afficher la méditation du jour (texte et audio), d'offrir une interface de lecture audio moderne et de permettre aux jeunes de naviguer parmi les méditations de la semaine en cours. Les données seront chargées dynamiquement depuis la table `meditations` de Supabase.

---

## 2. Critères d'Acceptation (Vérifications obligatoires)

* **CA-1** : L'interface affiche le titre, le texte biblique, l'orateur et la date de la méditation sélectionnée.
* **CA-2** : Les contrôles de lecture (Play, Pause) pilotent le flux audio récupéré depuis la base de données.
* **CA-3** : La barre de progression s'ajuste en temps réel pendant la lecture et permet à l'utilisateur de cliquer dessus pour changer la position de lecture (seeking).
* **CA-4** : Des boutons "Suivant" et "Précédent" permettent de basculer sur les méditations des autres jours de la semaine courante.
* **CA-5** : Les données sont chargées depuis la table Supabase `public.meditations` filtrées sur la date courante.

---

## 3. Guide d'Implémentation Technique

### 3.1. Fichiers à créer / modifier
1. **`src/components/mobile/MeditationPlayer.jsx`** : Nouveau composant contenant l'interface du lecteur.
2. **`src/App.jsx`** : Remplacer l'audio mocké par l'appel à ce nouveau composant dans la vue membre.

### 3.2. Modèle de Code : `MeditationPlayer.jsx`

```javascript
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../services/supabase'

export default function MeditationPlayer() {
  const [meditation, setMeditation] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const audioRef = useRef(new Audio())

  useEffect(() => {
    // Charge la méditation pour la date sélectionnée
    const fetchMeditation = async () => {
      setLoading(true)
      const dateString = currentDate.toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('meditations')
        .select('*')
        .eq('date_publication', dateString)
        .single()
        
      if (!error && data) {
        setMeditation(data)
        audioRef.current.src = data.audio_url
        audioRef.current.load()
      } else {
        setMeditation(null)
      }
      setLoading(false)
      setIsPlaying(false)
    }

    fetchMeditation()
  }, [currentDate])

  useEffect(() => {
    const audio = audioRef.current

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

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
      audioRef.current.play().catch(err => console.error("Audio play failed", err))
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressChange = (e) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const changeDay = (offset) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + offset)
    setCurrentDate(newDate)
  }

  // Formate le temps en MM:SS
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (loading) return <div>Chargement de la méditation...</div>
  if (!meditation) {
    return (
      <div className="glass-panel flex flex-col gap-4">
        <p style={{ textAlign: 'center' }}>Aucune méditation disponible pour le {currentDate.toLocaleDateString('fr-FR')}</p>
        <div className="flex justify-between">
          <button className="glass-button" onClick={() => changeDay(-1)}>Précédent</button>
          <button className="glass-button" onClick={() => changeDay(1)}>Suivant</button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>Méditation du {new Date(meditation.date_publication).toLocaleDateString('fr-FR')}</h2>
      </div>

      <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
          {meditation.texte_biblique}
        </p>
        {meditation.auteur && (
          <p style={{ fontSize: '0.8rem', color: 'var(--accent-color)', textAlign: 'right', marginTop: '0.5rem' }}>
            Par {meditation.auteur}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4" style={{ gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
        <div className="flex justify-between" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        
        <input 
          type="range"
          min="0"
          max="100"
          value={duration ? (currentTime / duration) * 100 : 0}
          onChange={handleProgressChange}
          style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
        />

        <div className="flex justify-between items-center" style={{ marginTop: '0.5rem' }}>
          <button className="glass-button" onClick={() => changeDay(-1)}>⏮ Précédent</button>
          <button className="glass-button accent" onClick={handlePlayPause}>
            {isPlaying ? '⏸ Pause' : '▶ Écouter'}
          </button>
          <button className="glass-button" onClick={() => changeDay(1)}>Suivant ⏭</button>
        </div>
      </div>
    </div>
  )
}
```

---

## 4. Plan de Vérification & Tests

### Vérification Manuelle
1. Insérer un enregistrement de test dans Supabase pour la date d'aujourd'hui (avec un lien audio MP3 valide).
2. Tester le chargement de la méditation.
3. Vérifier les fonctionnalités Play et Pause.
4. Glisser/déposer le curseur de la barre de progression : vérifier que le son se décale correctement dans l'audio.
5. Utiliser les boutons de changement de jour : vérifier que la méditation de la veille ou du lendemain se charge bien.
