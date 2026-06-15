# Spécification de Story : US-2.2

**ID** : US-2.2  
**Titre** : Cache Hors-Ligne Automatique (PWA & Workbox Caching)  
**Épique** : Epic 2 — Vie Spirituelle & Cache Offline (PWA)  
**Estimation** : 5 Story Points  
**Statut** : Complété (Done)  
**Responsable** : Winston / Amelia  

---

## 1. Contexte & Valeur Métier

L'accessibilité réseau est un enjeu crucial à Kinshasa (RDC) en raison des délestages électriques et des instabilités de connexion. Cette story configure les règles de mise en cache intelligentes du Service Worker via Workbox pour télécharger et stocker localement les fichiers audio `.mp3` des méditations, garantissant un fonctionnement hors-ligne à 100% pour la semaine en cours.

---

## 2. Critères d'Acceptation (Vérifications obligatoires)

* **CA-1** : Le Service Worker intercepte les requêtes réseau sortantes vers le stockage audio Supabase.
* **CA-2** : Une stratégie *Cache-First* est appliquée aux fichiers audio : s'ils sont présents localement, ils sont joués instantanément sans requérir de réseau.
* **CA-3** : Une politique d'expiration de cache restreint le volume stocké (maximum 10 fichiers audio ou 7 jours de rétention) pour préserver l'espace disque du téléphone.
* **CA-4** : Le lecteur de méditations affiche un indicateur visuel précis de l'état du cache pour le fichier courant (ex: Nuage vert "Disponible Hors-ligne" vs "En Ligne uniquement").
* **CA-5** : En coupant la connexion internet, le lecteur charge et joue le fichier précédemment mis en cache sans lever d'erreur ni interrompre le son.

---

## 3. Guide d'Implémentation Technique

### 3.1. Fichiers concernés
* **`vite.config.js`** : Configuration des options Workbox et de la politique d'expiration.
* **`src/components/mobile/MeditationPlayer.jsx`** : Intégration de la détection de cache locale et mise à jour de l'état d'affichage.

### 3.2. Mécanisme de détection de cache dans `MeditationPlayer.jsx`

Pour mettre à jour l'indicateur visuel, nous interrogeons l'API `caches` globale du navigateur au chargement de la méditation :

```javascript
const [isCached, setIsCached] = useState(false);

useEffect(() => {
  const checkCache = async () => {
    if ('caches' in window && meditation?.audio_url) {
      const match = await caches.match(meditation.audio_url);
      setIsCached(!!match);
    } else {
      setIsCached(false);
    }
  };
  
  checkCache();
}, [meditation]);
```

### 3.3. Téléchargement forcé en tâche de fond (Pre-caching dynamique)
Pour forcer le navigateur à mettre en cache l'audio dès l'ouverture de la page (sans attendre que l'utilisateur clique sur Play) :

```javascript
const preCacheAudio = async (url) => {
  if ('caches' in window && url) {
    const cache = await caches.open('meditations-audio-cache');
    const response = await cache.match(url);
    if (!response) {
      // Force le téléchargement et l'enregistrement
      try {
        await cache.add(url);
        setIsCached(true);
      } catch (err) {
        console.warn("Échec du pré-téléchargement de l'audio", err);
      }
    }
  }
};
```

---

## 4. Plan de Vérification & Tests

### Vérification Manuelle
1. Démarrer l'application en mode développement.
2. Naviguer sur la méditation d'aujourd'hui.
3. Vérifier la console de développement (F12) -> Onglet **Application** -> **Cache Storage** :
   * S'assurer que le cache nommé `meditations-audio-cache` a été créé et contient l'URL du fichier MP3.
4. Dans l'onglet **Network** (Réseau) de la console, cocher la case **Offline** (Hors-ligne) :
   * Cliquer sur Play dans le lecteur de méditation.
   * Vérifier que la musique démarre normalement et que le statut indique toujours *"Disponible Hors-ligne"*.
5. Modifier la date locale de l'ordinateur pour simuler un délai de plus de 7 jours : vérifier que le fichier MP3 périmé est évincé du cache local.
