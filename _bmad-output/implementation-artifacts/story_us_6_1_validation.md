# Rapport de Validation de Story : US-6.1

* **ID Story** : US-6.1
* **Titre** : Notifications Push PWA (Web Push & VAPID)
* **Date** : 21 Juin 2026
* **Validateur** : Winston (Architecte)
* **Statut de Validation** : **PRÊT POUR DÉVELOPPEMENT (READY) 🟢**

---

## 📋 Grille de Validation

| Critère de Validation | Statut | Remarques / Observations |
| :--- | :---: | :--- |
| **Objectif Métier Clair** | Conforme ✅ | Permettre l'engagement quotidien par des rappels spirituels le matin. |
| **Critères d'Acceptation (CA)** | Conforme ✅ | Six critères clairs (CA-1 à CA-6), incluant le Mode Démo. |
| **Schéma SQL fourni** | Conforme ✅ | Script fourni pour `public.push_subscriptions` avec politiques RLS de sécurité. |
| **Variables d'environnement** | Conforme ✅ | Nécessite `VITE_VAPID_PUBLIC_KEY` dans le fichier local `.env`. |
| **Fichiers cibles identifiés** | Conforme ✅ | `vite.config.js`, `src/sw.js`, `pushNotificationService.js`, `MeditationPlayer.jsx`. |
| **Plan de test défini** | Conforme ✅ | Tests locaux en mode Démo et intégration réelle. |

---

## ⚡ Plan de Lancement du Développement (Action Items de Dev)
1. **Migration SQL** : Créer le fichier `db/migrations/004_push_subscriptions.sql` avec le script de migration.
2. **Génération de clés VAPID** : Générer une paire de clés VAPID pour le projet.
3. **Configuration du Projet (.env)** : Configurer `VITE_VAPID_PUBLIC_KEY` à la fois dans `.env` et `.env.example`.
4. **Refactoring PWA** : Adapter `vite.config.js` pour passer de `generateSW` à la stratégie `injectManifest` avec le fichier de Service Worker personnalisé `src/sw.js`.
5. **Service Worker** : Créer `src/sw.js` et y intégrer les écouteurs d'événements `push` et `notificationclick`.
6. **Service d'Abonnement** : Créer `src/services/pushNotificationService.js` gérant l'abonnement du navigateur et l'enregistrement Supabase.
7. **Interface Utilisateur** : Ajouter l'UI d'abonnement au-dessus ou sous le lecteur dans `src/components/mobile/MeditationPlayer.jsx`.
