# Spécification de Story : US-6.1

**ID** : US-6.1  
**Titre** : Notifications Push PWA (Web Push & VAPID)  
**Épique** : Epic 2 — Vie Spirituelle & Cache Offline (PWA)  
**Estimation** : 3 Story Points  
**Statut** : A faire (Todo)  
**Responsable** : Winston (Architecte) / Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

Pour soutenir l'assiduité spirituelle des jeunes du groupe, l'application doit pouvoir envoyer des **rappels quotidiens de méditation** sous forme de notifications push système directement sur les smartphones des membres. 
Cette story met en place l'abonnement Web Push (API Push du navigateur), l'intégration avec le Service Worker, le stockage des abonnements dans Supabase, et une simulation de notification push pour tester le fonctionnement en direct.

> **Dépendance** : Cette story nécessite la configuration Supabase dev établie dans **TECH-1** et le Service Worker configuré dans **US-1.1** & **US-2.2**.

---

## 2. Critères d'Acceptation

* **CA-1** : L'interface utilisateur mobile (Membres) affiche un bouton ou une bannière discrète "**Activer les rappels quotidiens 🔔**" si les notifications ne sont pas encore autorisées.
* **CA-2** : Lors du clic, l'application demande la permission de notification au navigateur. Si elle est accordée, elle génère un objet `PushSubscription` en utilisant la clé publique VAPID configurée.
* **CA-3** : L'abonnement Push (JSON de l'endpoint et des clés crypto `p256dh`/`auth`) est sauvegardé en base de données dans la table `public.push_subscriptions` associé à l'ID de l'utilisateur connecté (`member_id`).
* **CA-4** : Le Service Worker intercepte les événements `push` système et affiche la notification avec le titre "Méditation du jour 📖" et un extrait du verset biblique.
* **CA-5** : Un clic sur la notification push ferme la notification et redirige l'utilisateur vers l'application sur son smartphone (lecteur de méditations).
* **CA-6** : **Mode Démo** : L'activation simule l'enregistrement localement, et un bouton "Tester la notification" déclenche une notification locale fictive (avec délai de 3 secondes) pour validation visuelle immédiate.

---

## 3. Architecture & Modèle de Données

### 3.1. Script de Migration SQL
Créer le fichier [004_push_subscriptions.sql](file:///home/didier-ambunga-jr/Documents/Mes%20projets/mijerca-cenacle/db/migrations/004_push_subscriptions.sql) :

```sql
-- Migration 004 : Notifications Push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    subscription_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_member_subscription UNIQUE (member_id, subscription_json)
);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Membres : lecture/écriture de leurs propres abonnements"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = member_id)
WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Admins : lecture de tous les abonnements"
ON public.push_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = auth.uid() AND m.role = 'Admin'
  )
);
```

### 3.2. Variables d'Environnement (.env & .env.example)
Ajouter la clé publique VAPID :
```
VITE_VAPID_PUBLIC_KEY=BL_votre_cle_vapid_publique_generée
```

---

## 4. Guide d'Implémentation Technique

### 4.1. Fichiers à modifier / créer

1. **[vite.config.js](file:///home/didier-ambunga-jr/Documents/Mes%20projets/mijerca-cenacle/vite.config.js)** : Basculer PWA en stratégie `injectManifest` pour coder des listeners `push` personnalisés.
2. **[src/sw.js](file:///home/didier-ambunga-jr/Documents/Mes%20projets/mijerca-cenacle/src/sw.js)** : Nouveau fichier Service Worker personnalisé avec les événements `push` et `notificationclick`.
3. **[src/services/pushNotificationService.js](file:///home/didier-ambunga-jr/Documents/Mes%20projets/mijerca-cenacle/src/services/pushNotificationService.js)** : Logique d'abonnement Push, appel VAPID, et enregistrement dans Supabase.
4. **[src/components/mobile/MeditationPlayer.jsx](file:///home/didier-ambunga-jr/Documents/Mes%20projets/mijerca-cenacle/src/components/mobile/MeditationPlayer.jsx)** : Ajouter le bouton ou la bannière d'abonnement au-dessus ou au-dessous du lecteur de méditations.

### 4.2. Configuration de VitePWA dans `vite.config.js`
Remplacer la section `VitePWA` par la stratégie `injectManifest` :
```javascript
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.js',
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon.png'],
  manifest: {
    // ... identique au manifest existant
  }
})
```

### 4.3. Code du Service Worker `src/sw.js`
```javascript
import { precacheAndRoute } from 'workbox-precaching'

// Précacher tous les assets compilés par Vite
precacheAndRoute(self.__WB_MANIFEST)

// Custom runtime caching pour les fichiers MP3 de méditation (identique à l'ancienne config)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('meditations-audio')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          return caches.open('meditations-audio-cache').then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});

// Gérer l'événement Push
self.addEventListener('push', (event) => {
  let data = { title: 'Cénacle 📖', body: 'Votre méditation spirituelle du jour est disponible !' }
  if (event.data) {
    try {
      data = event.data.json()
    } catch (err) {
      data = { title: 'Cénacle 📖', body: event.data.text() }
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: {
      url: data.url || '/'
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const targetUrl = event.notification.data.url || '/'
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
```

---

## 5. Plan de Vérification

### 5.1. Test de Notification locale (Mode Démo)
1. Ouvrir l'application en Mode Démo sur mobile.
2. Cliquer sur "**Activer les rappels quotidiens 🔔**".
3. Accepter la demande d'autorisation de notification du navigateur.
4. Cliquer sur le bouton "**Tester la notification (3s)**" qui apparaît après activation.
5. Verrouiller le téléphone ou mettre l'application en arrière-plan.
6. **Vérifier** que la notification système s'affiche après 3 secondes avec le bon titre et le bon logo.
7. Cliquer sur la notification et **vérifier** qu'elle ouvre/redirige vers l'application Cénacle.

### 5.2. Intégration Supabase (Mode Réel)
1. Créer la table `push_subscriptions` dans Supabase via l'éditeur SQL.
2. Se connecter en mode réel avec un compte membre.
3. Activer les notifications.
4. **Vérifier dans la console Supabase** qu'une nouvelle ligne a été ajoutée dans la table `push_subscriptions` avec l'ID du membre et les détails JSON de l'abonnement.
