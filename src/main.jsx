import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/main.css'

// Enregistre automatiquement le Service Worker pour le support PWA et hors-ligne
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    if (confirm('Une mise à jour est disponible pour l\'application Cénacle. Voulez-vous recharger la page ?')) {
      window.location.reload()
    }
  },
  onOfflineReady() {
    console.log('L\'application MIJERCA Cénacle est prête pour le fonctionnement hors ligne.')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
