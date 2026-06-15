# Spécification de Story : US-5.1

**ID** : US-5.1  
**Titre** : Configuration de l'Arrière-plan du Badge  
**Épique** : Epic 5 — Générateur de Badges PDF & QR Codes  
**Estimation** : 3 Story Points  
**Statut** : Complété (Done)  
**Responsable** : Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

Pour chaque retraite, l'équipe MIJERCA produit des badges physiques personnalisés avec l'affiche de l'événement en fond. Cette story implémente la première brique du générateur de badges : **le téléversement de l'image de fond** par l'Administrateur et la **prévisualisation en direct** du rendu final du badge avec un texte d'exemple superposé.

C'est un prérequis indispensable à US-5.2 (Génération PDF), qui utilisera l'URL stockée pour assembler les badges.

---

## 2. Critères d'Acceptation

* **CA-1** : L'interface admin propose un sélecteur de fichier acceptant uniquement les formats `.jpg`, `.png`, `.jpeg`, `.webp`.
* **CA-2** : Dès la sélection du fichier, une **prévisualisation en direct** s'affiche : l'image est rendue en tant que fond du badge, avec un bloc de texte d'exemple superposé (Nom, Rôle, Carrefour).
* **CA-3** : Un bouton "Enregistrer ce fond" uploade le fichier dans le bucket Supabase `retreat-flyers` et sauvegarde l'URL publique dans le champ `retreats.image_affiche_url`.
* **CA-4** : Le panneau affiche un indicateur de progression pendant l'upload et un message de succès ou d'erreur à la fin.
* **CA-5** : Si une image de fond existe déjà pour la retraite sélectionnée, elle est chargée automatiquement dans la prévisualisation.
* **CA-6** : En mode Démo, la prévisualisation fonctionne avec un objet `File` local (lecture via `FileReader`), sans appel au bucket Supabase.

---

## 3. Guide d'Implémentation Technique

### 3.1. Fichiers à créer / modifier
1. **`src/services/badgeService.js`** : Gestion de l'upload vers le bucket Supabase `retreat-flyers` et mise à jour de `retreats.image_affiche_url`.
2. **`src/components/admin/BadgeBackgroundPanel.jsx`** : Composant UI avec file picker, prévisualisation live (div CSS overlay), et bouton de sauvegarde.
3. **`src/App.jsx`** : Intégration du panneau dans la vue admin après `CarrefourRepartitionPanel`.

### 3.2. Upload Supabase Storage
```javascript
// Chemin dans le bucket : {retreat_id}/background.{ext}
const filePath = `${retreatId}/background.${ext}`
await supabase.storage.from('retreat-flyers').upload(filePath, file, { upsert: true })
const { data: urlData } = supabase.storage.from('retreat-flyers').getPublicUrl(filePath)
await supabase.from('retreats').update({ image_affiche_url: urlData.publicUrl }).eq('id', retreatId)
```

### 3.3. Prévisualisation CSS (sans canvas)
La prévisualisation utilise une `div` en position relative avec :
- L'image de fond (`background-image: url(...)`) en `object-fit: cover`
- Un bloc de texte en position absolue sur un fond semi-transparent (`rgba(0,0,0,0.5)`)
- Proportions badge A6 simulées : ratio 1.41 (largeur / hauteur)

---

## 4. Plan de Vérification

1. Sélectionner une image `.jpg` depuis le disque → **Vérifier** la prévisualisation instantanée.
2. Tenter d'uploader un fichier `.pdf` → **Vérifier** que le file picker le refuse (attribut `accept`).
3. Cliquer "Enregistrer" → **Vérifier** dans Supabase Storage que le fichier est présent dans `retreat-flyers/{retreat_id}/background.jpg`.
4. Recharger la page → **Vérifier** que la prévisualisation se recharge depuis l'URL Supabase.
5. Mode Démo : sélectionner une image → **Vérifier** la prévisualisation sans erreur réseau.
