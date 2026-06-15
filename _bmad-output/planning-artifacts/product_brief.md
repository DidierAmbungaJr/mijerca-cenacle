# Product Brief : MIJERCA Cénacle

**Statut** : En cours de validation  
**Date** : 13 Juin 2026  
**Auteur** : John (Product Manager) & Mary (Business Analyst)  
**Destinataire** : Didier  

---

## 1. Description du Projet & Vision

**MIJERCA Cénacle** est une application web moderne ( Progressive Web App ) conçue pour le groupe des jeunes du Renouveau charismatique catholique de la paroisse Saint Charles Lwanga à Kinshasa-Bandalungwa (RDC). 

L'application répond à un double objectif :
1. **Accompagnement Spirituel Quotidien** : Offrir aux jeunes un outil mobile accessible, même hors ligne, pour nourrir leur foi au jour le jour.
2. **Efficacité Opérationnelle & Logistique** : Fournir au comité de gestion un tableau de bord complet (PC/Mobile) pour le suivi des présences aux réunions hebdomadaires et l'organisation complexe des retraites.

---

## 2. Objectifs Stratégiques

* **Zéro papier** : Dématérialiser complètement le suivi des présences et la gestion des inscriptions aux retraites.
* **Logistique automatisée** : Éliminer la répartition manuelle fastidieuse des participants dans les chambres et les carrefours de prière.
* **Accessibilité réseau** : Garantir que les contenus spirituels soient disponibles malgré les connexions instables de Kinshasa grâce à un cache local intelligent.

---

## 3. Personas & Utilisateurs Cibles

### 🧑‍💻 Les Membres (Les Jeunes du Cénacle)
* **Usage** : Principalement sur smartphone (PWA).
* **Besoins** : Accéder aux méditations quotidiennes (textes et audios), être notifiés des prières, s'inscrire aux retraites, connaître son carrefour et son logement pour une retraite, et partager des contenus sur WhatsApp.

### 👥 Les Administrateurs / Encadreurs (Comité de Gestion)
* **Usage** : Sur PC ou tablette/smartphone.
* **Besoins** : Gérer la liste des membres, cocher manuellement les présences lors des séances hebdomadaires, paramétrer les retraites, uploader les arrière-plans d'affiches, lancer la génération de badges PDF et gérer la répartition des participants.

### 🌐 Le Grand Public
* **Usage** : Sur n'importe quel navigateur.
* **Besoins** : Visiter la page d'accueil de la paroisse/groupe, consulter le calendrier des grands événements publics à venir et découvrir le ministère MIJERCA Cénacle.

---

## 4. Périmètre Fonctionnel (Spécifications par Module)

### 📖 Module 1 : Vie Spirituelle & PWA (Côté Utilisateur)
* **Méditations quotidiennes** : Affichage du texte biblique et lecture du fichier audio de la méditation du jour.
* **Mise en cache (Hors ligne)** : Téléchargement automatique en tâche de fond des méditations de la semaine en cours pour écoute et lecture hors ligne.
* **Notifications Push** : Rappels quotidiens programmés pour les temps de prière officiels.
* **Partage WhatsApp** : Lien de partage rapide vers l'audio/texte de la méditation pour faciliter la diffusion dans les groupes de prière.

### 📋 Module 2 : Gestion des Présences aux Réunions
* **Feuille d'appel numérique** : Liste triable des membres avec case à cocher pour validation par un administrateur à chaque réunion hebdomadaire.
* **Historique des présences** : Suivi statistique des présences par membre pour identifier les jeunes inactifs ou assidus.

### ⛺ Module 3 : Logistique des Retraites
* **Portail d'Inscription** : Formulaire en ligne permettant aux jeunes de s'inscrire à une retraite à venir (saisie du nom, genre, âge, contact, etc.).
* **Répartition Automatique Intelligente** :
  * **Logements** : Algorithme répartissant les participants par chambre selon leur genre (strictement non-mixte).
  * **Carrefours** : Création automatique de mini-groupes de prière équilibrés en mixité (âge et genre).
* **Gestion des Commissions** : Attribution des encadreurs (responsables) à leurs commissions de travail respectives (Logistique, Accueil, Intercession, etc.).

### 🪪 Module 4 : Générateur de Badges PDF
* **Personnalisation graphique** : Possibilité pour l'administrateur d'importer une image de fond (correspondant à l'affiche officielle de la retraite).
* **Génération dynamique** : Export d'un document PDF prêt à l'impression contenant les badges de tous les inscrits avec :
  * Nom et prénom.
  * Rôle dans la retraite (Retraitant, Responsable, etc.).
  * Un QR Code unique pour l'identification/check-in.
  * *Pour les jeunes* : Le nom du **Carrefour** de prière attribué.
  * *Pour les encadreurs* : Le nom de leur **Commission** de travail.

### 🖥️ Module 5 : Administration Générale & Vitrine
* **Landing Page Publique** : Page d'accueil esthétique présentant le groupe MIJERCA Cénacle de la paroisse Saint Charles Lwanga.
* **Calendrier des événements** : Liste publique des activités et des retraites à venir.
* **Console d'Administration (PC)** : Gestion des comptes utilisateurs, modification des rôles de sécurité (Admin vs Membre) et mise en ligne des méditations.

---

## 5. Contraintes Techniques & Non-Fonctionnelles

* **Technologie Frontend** : React.js + Vite avec implémentation de Service Workers pour la compatibilité PWA.
* **Backend & Données** : Database SQL/NoSQL (ex. Supabase ou Firebase) pour la synchronisation, le stockage des fichiers audio et l'authentification sécurisée.
* **Performance** : Temps de chargement optimal sur connexions mobiles 3G/4G.
* **Design** : Visuellement attrayant (style moderne avec thèmes harmonieux), hautement responsive.

---

## 6. Éléments Hors Périmètre (Out of Scope) pour la V1

* Paiement en ligne des frais de retraite (les inscriptions sont gérées en ligne, mais le paiement se fait physiquement ou par mobile money externe pour l'instant).
* Messagerie instantanée interne (remplacée par le partage et les groupes WhatsApp existants).
