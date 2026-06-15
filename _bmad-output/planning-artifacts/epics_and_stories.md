# Épiques & User Stories : MIJERCA Cénacle

**Projet** : Application Web MIJERCA Cénacle  
**Version** : 1.0.0  
**Statut** : En cours de validation  
**Date** : 13 Juin 2026  
**Auteur** : Winston (System Architect) & John (Product Manager)  

---

## 1. Liste des Épiques (Backlog de haut niveau)

* **Epic 1 [Base] : Socle Technique & Authentification**
* **Epic 2 [Engagement] : Vie Spirituelle & Cache Offline (PWA)**
* **Epic 3 [Gestion] : Réunions & Présences Hebdomadaires**
* **Epic 4 [Logistique] : Organisation des Retraites & Algorithmes**
* **Epic 5 [Badges] : Générateur de Badges PDF & QR Codes**

---

## 2. Récits Utilisateurs (User Stories) Détaillés

### 🛠️ Epic 1 : Socle Technique & Authentification

#### US-1.1 : Initialisation React/Vite & PWA
* **En tant que** : Développeur
* **Je veux** : Configurer le projet React avec Vite et installer le plugin PWA
* **Afin de** : Mettre en place un projet fonctionnel capable de s'installer sur smartphone et de fonctionner hors-ligne.
* **Critères d'acceptation** :
  * Le projet compile sans erreur.
  * Le fichier `manifest.json` est valide et l'icône de l'app est configurable.
  * L'application propose d'être installée sur l'écran d'accueil du téléphone.
* **Priorité** : MUST | **Estimation** : S

#### US-1.2 : Connexion et Rôles de Sécurité
* **En tant que** : Membre ou Administrateur
* **Je veux** : Pouvoir me connecter à mon compte sécurisé Supabase
* **Afin de** : Accéder aux fonctionnalités correspondant à mon rôle (Admin vs Membre).
* **Critères d'acceptation** :
  * Formulaire de connexion (Email / Mot de passe) robuste.
  * Redirection automatique des admins vers la console bureau et des membres vers l'espace mobile.
  * Les membres ne peuvent pas accéder physiquement à l'URL de la console d'administration.
* **Priorité** : MUST | **Estimation** : M

#### US-1.3 : Charte Graphique & Structure Responsive
* **En tant que** : Utilisateur (Membre ou Admin)
* **Je veux** : Une interface fluide et esthétique respectant les thèmes de couleur violet/or et le style Glassmorphism
* **Afin de** : Bénéficier d'une expérience visuelle premium sur n'importe quel écran.
* **Critères d'acceptation** :
  * Les variables CSS globales sont définies dans `variables.css`.
  * Les éléments "verre dépoli" (backdrop-filter: blur) s'affichent correctement.
  * Mise en page 100% responsive (mobile d'abord).
* **Priorité** : MUST | **Estimation** : S

---

### 📚 Epic 2 : Vie Spirituelle & Cache Offline (PWA)

#### US-2.1 : Lecteur de Méditations Quotidiennes
* **En tant que** : Membre
* **Je veux** : Lire le texte biblique et écouter l'audio du jour
* **Afin de** : Faire ma prière quotidienne facilement.
* **Critères d'acceptation** :
  * Affichage propre du texte avec option d'ajustement de la taille des caractères.
  * Lecteur audio intégré (Play/Pause, barre de progression).
  * Les boutons Précédent/Suivant permettent de naviguer dans les méditations de la semaine.
* **Priorité** : MUST | **Estimation** : M

#### US-2.2 : Cache Hors-Ligne Automatique
* **En tant que** : Membre
* **Je veux** : Continuer d'écouter les méditations de la semaine même sans connexion Internet
* **Afin de** : Ne pas être bloqué par les pannes d'électricité ou de réseau.
* **Critères d'acceptation** :
  * Un Service Worker intercepte les requêtes des fichiers MP3 et textes bibliques de la semaine.
  * Affichage d'une icône verte de réussite ("Disponible hors ligne") quand le contenu est en cache.
  * Si la connexion coupe pendant la lecture d'un fichier en cache, l'audio continue de tourner sans erreur.
* **Priorité** : MUST | **Estimation** : L

#### US-2.3 : Partage Rapide WhatsApp
* **En tant que** : Membre ou Admin
* **Je veux** : Partager le texte et l'audio de la méditation sur WhatsApp en un clic
* **Afin de** : Faciliter la diffusion dans mes groupes de prière.
* **Critères d'acceptation** :
  * Un bouton "Partager sur WhatsApp" génère un message prérempli propre : *"Méditation MIJERCA Cénacle du [Date] : [Lien de l'app]"*.
* **Priorité** : SHOULD | **Estimation** : S

---

### 📋 Epic 3 : Réunions & Présences Hebdomadaires

#### US-3.1 : Feuille d'Appel Numérique (Admin)
* **En tant que** : Administrateur
* **Je veux** : Parcourir la liste des membres et cocher les présences à la réunion
* **Afin de** : Remplacer les listes d'appel papier.
* **Critères d'acceptation** :
  * La liste affiche les membres par ordre alphabétique.
  * Filtre de recherche instantané par nom/prénom.
  * Clic simple sur une case pour valider la présence pour la réunion de la date sélectionnée.
* **Priorité** : MUST | **Estimation** : S

#### US-3.2 : Fiche d'Assiduité des Membres
* **En tant que** : Administrateur
* **Je veux** : Consulter l'historique de présence de chaque jeune sur son profil
* **Afin de** : Mieux accompagner ceux qui s'absentent régulièrement.
* **Critères d'acceptation** :
  * Affichage d'un taux d'assiduité (ex. 85% de présence sur les 3 derniers mois).
  * Liste détaillée des dates de présence/absence.
* **Priorité** : MUST | **Estimation** : M

---

### ⛺ Epic 4 : Organisation des Retraites & Algorithmes

#### US-4.1 : Inscription en ligne aux Retraites
* **En tant que** : Membre
* **Je veux** : M'inscrire à une retraite active via un formulaire
* **Afin de** : Valider ma participation.
* **Critères d'acceptation** :
  * Formulaire demandant le Nom, Genre, Âge et contact.
  * Un membre connecté ne peut s'inscrire qu'une seule fois à une retraite donnée.
* **Priorité** : MUST | **Estimation** : S

#### US-4.2 : Répartition Automatique des Logements (Chambres)
* **En tant que** : Administrateur
* **Je veux** : Que l'application affecte automatiquement les retraitants dans les chambres
* **Afin de** : Gérer la logistique de logement en 1 clic.
* **Critères d'acceptation** :
  * Répartition stricte par Genre (aucune chambre mixte).
  * Respect de la capacité maximale déclarée de chaque chambre.
  * Les personnes non placées pour manque de lits sont listées en alerte.
* **Priorité** : MUST | **Estimation** : L

#### US-4.3 : Répartition Automatique des Carrefours de prière
* **En tant que** : Administrateur
* **Je veux** : Répartir les retraitants dans des mini-groupes de prière équilibrés
* **Afin de** : Favoriser des échanges enrichissants.
* **Critères d'acceptation** :
  * Répartition homogène des genres (M/F) dans chaque groupe.
  * Brassage des tranches d'âges pour éviter que tous les plus jeunes soient dans le même groupe.
* **Priorité** : MUST | **Estimation** : M

---

### 🪪 Epic 5 : Générateur de Badges PDF & QR Codes

#### US-5.1 : Configuration de l'Arrière-plan du Badge
* **En tant que** : Administrateur
* **Je veux** : Uploader l'image de l'affiche de la retraite comme fond de badge
* **Afin de** : Personnaliser visuellement les badges de l'événement.
* **Critères d'acceptation** :
  * Uploader accepte les formats standards (.jpg, .png).
  * Stockage de l'image dans le Bucket Supabase.
  * Visualisation en direct du rendu avec un texte d'exemple superposé.
* **Priorité** : MUST | **Estimation** : M

#### US-5.2 : Génération PDF des Badges & QR Codes
* **En tant que** : Administrateur
* **Je veux** : Exporter un fichier PDF prêt pour impression contenant tous les badges
* **Afin de** : Les distribuer physiquement aux participants.
* **Critères d'acceptation** :
  * Le PDF contient une page par badge (ou disposition 4 par page A4).
  * Chaque badge comprend le nom, rôle, le fond d'affiche, le QR code de présence unique et le Carrefour (ou Commission).
  * Le QR code de présence scanne vers une URL de validation sécurisée de l'app.
* **Priorité** : MUST | **Estimation** : L
