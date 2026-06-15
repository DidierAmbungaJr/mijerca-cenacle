# Spécification de Story : US-1.1

**ID** : US-1.1  
**Titre** : Initialisation React/Vite & Configuration PWA  
**Épique** : Epic 1 — Socle Technique & Authentification  
**Estimation** : 1 Story Point  
**Statut** : Complété (Done)  
**Responsable** : Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

Cette story pose la toute première pierre technique du projet. Il s'agit d'initialiser le projet React à l'aide de Vite et de configurer les bases Progressive Web App (PWA) afin que l'application puisse être "installée" sur l'écran d'accueil d'un smartphone Android ou iOS et supporte le chargement hors ligne.

---

## 2. Critères d'Acceptation (Vérifications obligatoires)

* **CA-1** : L'application React démarre correctement via un serveur de développement local (`npm run dev`).
* **CA-2** : L'application expose un manifeste PWA (`manifest.json` ou configuré via `vite-plugin-pwa`) valide avec le nom *"MIJERCA Cénacle"*, le nom court *"Cénacle"*, la couleur de thème violette (`#4F1E6F`) et les icônes de l'app.
* **CA-3** : Les navigateurs mobiles détectent l'application comme installable (bannière d'installation ou bouton d'ajout à l'écran d'accueil fonctionnel).
* **CA-4** : Un Service Worker de base est enregistré au démarrage de l'application.

---

## 3. Guide d'Implémentation Technique

### 3.1. Structure du projet à créer
Amelia devra initialiser le projet dans le dossier racine :
* Utiliser `vite` avec le template `react` (JavaScript ou TypeScript selon préférence).
* Installer le package : `npm install vite-plugin-pwa --save-dev`

### 3.2. Exemple de Configuration `vite.config.js`
Voici le modèle de configuration attendu pour activer la PWA :

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MIJERCA Cénacle',
        short_name: 'Cénacle',
        description: 'Application de gestion et d\'engagement pour les jeunes du Cénacle',
        theme_color: '#4F1E6F',
        background_color: '#0E0B16',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
```

---

## 4. Plan de Vérification & Tests

### Vérification Manuelle
1. Lancer l'application : `npm run dev`.
2. Ouvrir la console de développement (F12) dans le navigateur (ex. Chrome).
3. Accéder à l'onglet **Application** (ou *Lighthouse*) :
   * Vérifier sous **Manifest** que le nom, les couleurs et les icônes sont correctement lus.
   * Vérifier sous **Service Workers** que le Service Worker est actif et enregistré.
4. Tenter l'installation :
   * Sur ordinateur : Vérifier la présence de l'icône d'installation dans la barre d'adresse.
   * Sur mobile : Vérifier que l'option "Ajouter à l'écran d'accueil" installe bien l'app standalone.
