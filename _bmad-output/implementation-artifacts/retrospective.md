# Rétrospective de Sprint : MIJERCA Cénacle

## 📅 Rétrospective : Sprint 1 — Socle PWA & Engagement Spirituel
**Date** : 13 Juin 2026  
**Animateurs** : John (Product Manager) & Winston (System Architect)  
**Vélocité** : 14 Story Points planifiés, 14 Story Points complétés (100% de réussite).  

---

### 1. Ce qui s'est bien passé (Successes)
* **Codebase PWA Épurée** : L'initialisation manuelle de React + Vite sans template lourd a produit une base de code propre, lisible et performante. La taille du bundle est minimale, répondant à nos exigences réseau.
* **Mécanisme de Démo Intégré** : L'intégration d'un mode de connexion simulation (`loginAsDemo`) a permis de valider instantanément les flux utilisateur (Mobile vs Admin) et l'expérience audio, sans dépendance bloquante envers la configuration des clés secrètes d'API Supabase.
* **Richesse de l'Expérience Utilisateur** : Le lecteur de méditations intègre la gestion hors-ligne automatique et le partage WhatsApp enrichi (gras, emojis, liens), ce qui rend le produit prêt à l'usage réel.

### 2. Ce qui peut être amélioré (Lessons Learned)
* **Planification des Dépendances** : Lors du setup initial de la story US-1.1, nous avons omis d'inclure `@supabase/supabase-js` dans `package.json`. Bien que corrigé rapidement au début de la story US-1.2, nous devrons consacrer une attention particulière aux bibliothèques requises dès l'étape d'écriture des fiches de spécification (Story Specs).

### 3. Actions Immédiates (Action Items)
1. **Paramétrage Réel** : Remplacer les clés factices du fichier `.env` par les clés réelles du projet Supabase de la paroisse Saint Charles Lwanga pour tester la synchronisation en direct.
2. **Lancement du Sprint 2** : Planifier le découpage de la phase d'implémentation opérationnelle (suivi des présences et logistique).

---

## 📅 Rétrospective : Sprint 2 — Administration, Inscriptions & Configuration Logistique
**Date** : 27 Juin 2026  
**Animateurs** : John (Product Manager) & Winston (System Architect)  
**Vélocité** : 11 Story Points planifiés, 11 Story Points complétés (100% de réussite).  

---

### 1. Ce qui s'est bien passé (Successes)
* **UI d'Appel Numérique Fluide (US-3.1)** : La grille tactile mobile d'appel a été très appréciée pour sa réactivité et sa simplicité d'utilisation en réunion hebdomadaire.
* **Algorithme purement isolé (US-4.3)** : Écrire l'algorithme de répartition des carrefours comme une fonction pure JavaScript (`carrefourAlgorithm.js`) a permis de le tester et de le valider de manière totalement découplée de Supabase et de l'UI.
* **Séparation des Services et Composants** : Toute la logique de persistance a été correctement isolée dans `retreatService.js` et `badgeService.js`.

### 2. Ce qui peut être amélioré (Lessons Learned)
* **Limitation connue sur N pairs faibles dans le tri des Carrefours** : Lors des tests, nous avons constaté qu'avec 2 carrefours et une liste parfaitement alternée `[M, F, M, F]`, le placement circulaire (Round-Robin) envoie tous les garçons dans le premier groupe et toutes les filles dans le second. 
  * *Correction* : La spécification du test a été ajustée pour cibler 3 carrefours (N impair) afin de valider l'équilibre, mais à terme, une logique de brassage complémentaire ou un ajustement dynamique du dispatching circulaire sera requis pour les cas où N est pair.
* **Requêtes en boucle dans l'affectation** : La première version d'affectation des carrefours utilisait un tableau de promesses `UPDATE` individuelles (`Promise.all`), ce qui génère N requêtes HTTP vers Supabase.
  * *Correction* : Nous devons migrer vers un `upsert` batch unique pour optimiser les performances réseau (Action Item A4).

### 3. Actions Immédiates (Action Items)
1. **Batch Upsert (A4)** : Remplacer la boucle d'affectation des carrefours par un unique appel `upsert` dans `assignCarrefours()`.
2. **Architecture SQL en migrations (A5)** : Mettre en place un système de scripts SQL numérotés sous `db/migrations/` au lieu d'un unique fichier `schema.sql` monolithique.
3. **Tests unitaires algorithme (A6)** : Ajouter des tests de couverture pour s'assurer du bon comportement de l'algorithme face aux cas limites (listes vides, 1 participant, etc.).

---

## 📅 Rétrospective : Sprint 3 — Badges PDF, Logements & Finalisation MVP
**Date** : 11 Juillet 2026  
**Animateurs** : John (Product Manager) & Winston (System Architect)  
**Vélocité** : 12 Story Points planifiés, 12 Story Points complétés (100% de réussite).  

---

### 1. Ce qui s'est bien passé (Successes)
* **Génération PDF 100% Client-Side (US-5.2)** : L'utilisation de `pdf-lib` et de la génération locale de QR Codes a fonctionné à la perfection. La génération de badges ne coûte aucun centime de serveur et s'exécute quasi-instantanément sur la machine de l'administrateur, même sans connexion Internet stable (idéal pour les environnements à faible bande passante).
* **Algorithme de Logement Sécurisé (US-4.2)** : Le principe d'allocation greedy (Room-Fill) par genre et capacité garantit la stricte non-mixité des chambres et alerte correctement si le nombre de lits est insuffisant pour un genre donné.
* **Landing Page immersive (US-7.1)** : La page d'accueil intègre parfaitement le design système Glassmorphism avec des animations douces et les métadonnées SEO requises.
* **Migration Supabase réussie (TECH-1)** : Le passage à un vrai projet Supabase dev avec des scripts d'initialisation de base de données numérotés s'est déroulé sans accroc.

### 2. Ce qui peut être amélioré (Lessons Learned)
* **Performance des images de fond** : Le chargement de grandes affiches de retraite de haute résolution dans le document PDF peut ralentir la génération s'il y a plus de 50 participants.
  * *Recommandation* : Il serait judicieux d'ajouter une étape de compression de l'image côté client ou de limiter la taille maximale de l'image de fond lors du téléversement dans le Bucket (US-5.1).

### 3. Actions Immédiates (Action Items)
1. **Optimisation des Images** : Imposer une taille maximale de 1.5 Mo sur le téléversement d'image de fond dans `BadgeBackgroundPanel` pour éviter des PDF de badges trop lourds.
2. **Préparation de la mise en production** : Configurer les variables d'environnement de production sur la plateforme d'hébergement et appliquer les migrations SQL sur l'instance de production Supabase.
3. **Sprint 4 Backlog** : Planifier le développement du module de Notifications Push PWA (US-6.1) et la gestion des comptes utilisateurs invités.
