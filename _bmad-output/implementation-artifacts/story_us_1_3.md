# Spécification de Story : US-1.3

**ID** : US-1.3  
**Titre** : Charte Graphique & Structure CSS (Glassmorphism)  
**Épique** : Epic 1 — Socle Technique & Authentification  
**Estimation** : 1 Story Point  
**Statut** : Complété (Done)  
**Responsable** : Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

Cette story formalise l'intégration du design system de l'application. Elle permet d'établir une interface utilisateur premium, cohérente et responsive sur tous les écrans en implémentant les jetons de conception (design tokens), les effets de verre dépoli (glassmorphism), ainsi que les animations d'interaction des boutons et cartes.

---

## 2. Critères d'Acceptation (Vérifications obligatoires)

* **CA-1** : Les couleurs de base (violet royal `#4F1E6F`, doré sacré `#E6C229`, gris ardoise sombre `#0E0B16`) sont déclarées comme variables CSS globales (`--primary-color`, `--accent-color`, `--bg-dark`).
* **CA-2** : Les classes utilitaires `.glass-panel` et `.glass-button` (avec sa variante `.accent`) sont définies et appliquent des ombres portées, bordures transparentes et filtres de flou d'arrière-plan.
* **CA-3** : Les boutons disposent d'un effet au survol (hover) fluide (légère translation verticale de `-2px` et intensification de l'ombre portée).
* **CA-4** : La mise en page globale supporte le redimensionnement d'écran de manière réactive (Responsive Design mobile-first).

---

## 3. Guide d'Implémentation Technique

### 3.1. Fichiers concernés
* **`src/styles/variables.css`** : Déclaration des tokens de couleur, polices et paramètres de flou.
* **`src/styles/main.css`** : Déclaration des réinitialisations globales (resets), règles typographiques de base, sélecteurs d'alignement et classes d'habillage (Glassmorphism).

*(Note : Ces fichiers ont été initiés lors des stories US-1.1 et US-1.2 pour l'affichage des premières démos et doivent être audités et complétés si nécessaire pour cette story).*

---

## 4. Plan de Vérification & Tests

### Vérification Manuelle
1. Lancer le serveur local : `npm run dev`.
2. Ouvrir l'application dans Chrome/Firefox et activer l'inspecteur d'éléments (F12).
3. Redimensionner la fenêtre pour tester la réactivité :
   * Largeur mobile (ex: 375px) : La grille des statistiques doit s'empiler verticalement sur une seule colonne.
   * Largeur bureau (ex: 1200px) : La grille doit se répartir horizontalement sur 3 colonnes.
4. Survoler les boutons "Se connecter", "Écouter" et "Partager" : vérifier la présence de la transition de déplacement et de l'effet d'ombre d'élévation.
