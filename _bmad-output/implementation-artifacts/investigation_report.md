# Rapport d'Investigation BMad : Implémentation SEO & Open Graph (LandingPage)

* **Date** : 21 Juin 2026
* **Auteur** : Winston (Architecte) & Amelia (Dev)
* **Objet** : Analyse de la gestion dynamique du DOM pour le SEO dans `LandingPage.jsx`

---

## 🔍 Constatations & Symptômes
En analysant l'implémentation de la modification dynamique du `<head>` dans [LandingPage.jsx](file:///home/didier-ambunga-jr/Documents/Mes%20projets/mijerca-cenacle/src/components/common/LandingPage.jsx#L54-L74), les éléments suivants ont été relevés :

```javascript
  useEffect(() => {
    document.title = 'MIJERCA Cénacle – Communauté de Foi & Fraternité'
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.content =
      'Découvrez le groupe MIJERCA Cénacle : retraites spirituelles, méditations quotidiennes, réunions de prière et fraternité à Kinshasa.'

    // Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]') || document.createElement('meta')
    ogTitle.setAttribute('property', 'og:title')
    ogTitle.content = 'MIJERCA Cénacle – Communauté de Foi & Fraternité'
    document.head.appendChild(ogTitle)

    return () => {
      document.title = 'MIJERCA Cénacle'
    }
  }, [])
```

---

## 🔬 Hypothèses & Analyse Technique

### Hypothèse 1 : Fuite de balises META au démontage du composant
* **Statut** : **VALIDÉ** ⚠️
* **Explication** : Lorsque le composant `LandingPage` est démonté (par exemple, l'utilisateur clique sur "Se connecter" et l'application bascule sur le formulaire de connexion), le titre repasse bien à `'MIJERCA Cénacle'` grâce au cleanup effecteur :
  ```javascript
  return () => { document.title = 'MIJERCA Cénacle' }
  ```
  Cependant, les balises `meta[name="description"]` et `meta[property="og:title"]` créées à la volée restent attachées au `<head>` du document HTML. Si d'autres pages possèdent leur propre structure de SEO, cela peut provoquer des conflits ou laisser des descriptions inadaptées sur d'autres vues de la PWA.

### Hypothèse 2 : Ajout redondant d'éléments existants (Append)
* **Statut** : **VALIDÉ** ⚠️
* **Explication** : Pour `ogTitle`, le code effectue un appel inconditionnel à `document.head.appendChild(ogTitle)`. Si l'élément existait déjà dans le document, `appendChild` le déplace simplement en dernière position dans le parent. Bien que cela ne lève pas d'erreur, c'est redondant par rapport à la logique plus propre utilisée pour `metaDesc` qui utilise un bloc conditionnel `if (!metaDesc)`.

### Hypothèse 3 : Absence de métadonnées Open Graph clés pour les partages de retraites
* **Statut** : **INFO** ℹ️
* **Explication** : Pour garantir de superbes aperçus sur WhatsApp (qui est le principal canal de partage mentionné dans le PRD pour les jeunes à Kinshasa), il manque des balises Open Graph clés telles que :
  * `og:description` (permettant d'avoir le résumé de la paroisse sous le titre sur WhatsApp).
  * `og:image` (pour afficher l'affiche par défaut du groupe ou de la retraite en cours).
  * `og:type` (défini à `website`).

---

## 🛠️ Solutions Proposées

### 1. Nettoyage strict au démontage (Cleanup)
Nous devrions mémoriser si nous avons nous-mêmes créé les balises dans le DOM pour les supprimer lors du démontage du composant, ou au minimum restaurer des valeurs par défaut pour l'ensemble du site.

### 2. Standardisation de la création conditionnelle
Modifier la gestion de `ogTitle` pour n'appeler `appendChild` que si la balise vient d'être instanciée :
```javascript
let ogTitle = document.querySelector('meta[property="og:title"]')
if (!ogTitle) {
  ogTitle = document.createElement('meta')
  ogTitle.setAttribute('property', 'og:title')
  document.head.appendChild(ogTitle)
}
ogTitle.content = 'MIJERCA Cénacle – Communauté de Foi & Fraternité'
```

### 3. Enrichissement pour partage WhatsApp (Open Graph complet)
Ajouter la gestion dynamique de `og:description`, `og:type` et `og:image` (utilisant par exemple l'image de la retraite en vedette si elle est chargée).
