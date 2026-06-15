# Spécification de Story : US-4.3

**ID** : US-4.3  
**Titre** : Répartition Automatique des Carrefours de prière  
**Épique** : Epic 4 — Organisation des Retraites & Algorithmes  
**Estimation** : 3 Story Points  
**Statut** : Complété (Done)  
**Responsable** : Winston (Architecte) / Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

Lors de chaque retraite, les participants sont répartis en **carrefours** : de petits groupes de prière et de partage spirituel (env. 8–12 personnes). Actuellement, cette répartition se fait manuellement sur papier et prend plusieurs heures. Elle est source de déséquilibres (groupes mono-genre ou mono-tranche d'âge).

Cette story implémente un **algorithme de répartition équilibrée automatique** : l'Admin clique sur un bouton, l'algorithme lit la liste des inscrits validés pour une retraite, calcule le bon nombre de carrefours, crée les groupes en Supabase et affecte chaque participant à un carrefour de façon équilibrée en genre et en âge.

> **Dépendance** : Cette story requiert que US-4.1 soit complétée (la table `registrations` doit exister et contenir des inscrits avec le statut `'Validee'`).

---

## 2. Critères d'Acceptation (Vérifications obligatoires)

* **CA-1** : L'interface admin affiche un panneau "Répartition des Carrefours" pour chaque retraite ayant des inscrits validés. Il contient un bouton "**Lancer la répartition automatique**".
* **CA-2** : Au clic, l'algorithme calcule le nombre de carrefours nécessaires : `N = Math.ceil(total_inscrits_valides / 10)` (au moins 1 carrefour).
* **CA-3** : L'algorithme crée les `N` carrefours dans la table `public.carrefours` (nommés "Carrefour n°1", "Carrefour n°2", etc.) **s'ils n'existent pas déjà**. Si une répartition existe déjà, une confirmation est demandée avant de la réinitialiser.
* **CA-4** : La répartition équilibre simultanément les genres (M/F) et les tranches d'âge. Chaque carrefour doit contenir un ratio H/F et une distribution d'âge aussi proches que possible de la moyenne globale.
* **CA-5** : Chaque `registration` des inscrits validés reçoit un `carrefour_id` mis à jour dans Supabase.
* **CA-6** : Une fois la répartition terminée, l'interface affiche un tableau récapitulatif avec, pour chaque carrefour : le nom, le nombre total de membres, le nombre de garçons, le nombre de filles, et la tranche d'âge (min-max).
* **CA-7** : En Mode Démo, l'algorithme s'exécute localement sur les données fictives (sans appel Supabase) et affiche le tableau récapitulatif.

---

## 3. Spécification Détaillée de l'Algorithme de Répartition

L'algorithme est **purement client-side** (JavaScript), ce qui le rend testable sans réseau et très rapide.

### 3.1. Stratégie de tri : Interleaving par score

L'approche retenue est un **tri par score composite** suivi d'un **placement circulaire (round-robin)** :

```
ENTRÉE : Liste d'inscrits validés, chacun avec { genre, date_naissance }

ÉTAPE 1 — Calcul de l'âge
  Pour chaque inscrit :
    age = (Date.now() - new Date(date_naissance)) / (1000 * 60 * 60 * 24 * 365.25)

ÉTAPE 2 — Tri primaire par genre, tri secondaire par âge
  Trier la liste complète par (genre ASC, age ASC)
  → Résultat : tous les garçons triés par âge, puis toutes les filles triées par âge

ÉTAPE 3 — Entrelacement (Shuffle croisé)
  Intercaler les garçons et les filles de façon alternée :
    [G-jeune, F-jeune, G-moyen, F-moyen, G-senior, F-senior, ...]
  Si le nombre de garçons ≠ filles, les membres excédentaires sont ajoutés à la fin.

ÉTAPE 4 — Distribution Round-Robin
  Pour i de 0 à total_inscrits - 1 :
    carrefour_cible = i % N
    carrefours[carrefour_cible].push(inscrits_entrelaces[i])

SORTIE : Tableau de N carrefours, chacun avec ses membres affectés.
```

### 3.2. Tranches d'âge de référence

Pour le calcul de l'équilibre et l'affichage du résumé :
- **Jeune** : < 20 ans
- **Junior** : 20–25 ans
- **Senior** : > 25 ans

---

## 4. Guide d'Implémentation Technique

### 4.1. Fichiers à créer / modifier

1. **`src/services/retreatService.js`** : Ajouter les méthodes Supabase pour la lecture des inscrits validés, la création des carrefours, et la mise à jour des `carrefour_id` dans `registrations`.
2. **`src/utils/carrefourAlgorithm.js`** : Nouveau fichier utilitaire **pur** (sans dépendance Supabase) contenant uniquement la logique de tri et de distribution. Facilite les tests unitaires isolés.
3. **`src/components/admin/CarrefourRepartitionPanel.jsx`** : Nouveau composant React gérant l'UI du panel de répartition (bouton de lancement, spinner, tableau récapitulatif).
4. **`src/App.jsx`** : Intégrer `CarrefourRepartitionPanel` dans la vue admin.

### 4.2. Méthodes à ajouter dans `retreatService.js`

```javascript
// Récupère les inscrits validés d'une retraite avec les données membres
async getValidatedRegistrants(retreatId) {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      id,
      member:member_id (
        id, nom, prenom, genre, date_naissance
      )
    `)
    .eq('retreat_id', retreatId)
    .eq('statut_inscription', 'Validee')
  if (error) throw error
  return data || []
},

// Crée les carrefours dans la BDD et retourne leurs IDs
async createCarrefours(retreatId, count) {
  // Supprime d'abord les anciens carrefours de cette retraite
  await supabase.from('carrefours').delete().eq('retreat_id', retreatId)

  const carrefours = Array.from({ length: count }, (_, i) => ({
    retreat_id: retreatId,
    nom_carrefour: `Carrefour n°${i + 1}`
  }))
  const { data, error } = await supabase
    .from('carrefours')
    .insert(carrefours)
    .select('id, nom_carrefour')
  if (error) throw error
  return data
},

// Affecte les carrefour_id dans la table registrations
async assignCarrefours(assignments) {
  // assignments = [{ registrationId, carrefourId }, ...]
  const updates = assignments.map(({ registrationId, carrefourId }) =>
    supabase
      .from('registrations')
      .update({ carrefour_id: carrefourId })
      .eq('id', registrationId)
  )
  await Promise.all(updates)
}
```

### 4.3. Module `src/utils/carrefourAlgorithm.js`

```javascript
/**
 * Calcule l'âge en années à partir d'une date de naissance.
 */
function calculateAge(dateNaissance) {
  const ageMsec = Date.now() - new Date(dateNaissance).getTime()
  return ageMsec / (1000 * 60 * 60 * 24 * 365.25)
}

/**
 * Entrelace deux tableaux de façon alternée.
 * [A1, A2, A3] + [B1, B2] → [A1, B1, A2, B2, A3]
 */
function interleave(arrA, arrB) {
  const result = []
  const maxLen = Math.max(arrA.length, arrB.length)
  for (let i = 0; i < maxLen; i++) {
    if (i < arrA.length) result.push(arrA[i])
    if (i < arrB.length) result.push(arrB[i])
  }
  return result
}

/**
 * Algorithme principal de répartition.
 * @param {Array} registrants - Liste de { id, member: { genre, date_naissance } }
 * @param {number} nbCarrefours - Nombre de carrefours à créer
 * @returns {Array} - Tableau de nbCarrefours groupes : [{ members: [...] }, ...]
 */
export function distributeToCarrefours(registrants, nbCarrefours) {
  // Enrichissement avec l'âge calculé
  const enriched = registrants.map(r => ({
    ...r,
    age: calculateAge(r.member.date_naissance),
    genre: r.member.genre
  }))

  // Tri par genre, puis par âge croissant dans chaque genre
  const garcons = enriched.filter(r => r.genre === 'M').sort((a, b) => a.age - b.age)
  const filles  = enriched.filter(r => r.genre === 'F').sort((a, b) => a.age - b.age)

  // Entrelacement croisé
  const interleaved = interleave(garcons, filles)

  // Distribution circulaire (round-robin)
  const groups = Array.from({ length: nbCarrefours }, () => ({ members: [] }))
  interleaved.forEach((registrant, i) => {
    groups[i % nbCarrefours].members.push(registrant)
  })

  return groups
}
```

---

## 5. Format du Tableau Récapitulatif (UI)

Après la répartition, afficher un tableau avec les données suivantes :

| Carrefour | Total | Garçons | Filles | Âge (min – max) |
|:---|:---:|:---:|:---:|:---:|
| Carrefour n°1 | 10 | 5 | 5 | 17 – 29 ans |
| Carrefour n°2 | 10 | 5 | 5 | 18 – 31 ans |
| Carrefour n°3 | 9 | 4 | 5 | 16 – 28 ans |

---

## 6. Plan de Vérification & Tests

### Vérification Algorithmique (Mode Démo)
1. Avec les 5 membres fictifs du mode Démo, déclencher une répartition sur une retraite fictive.
2. **Vérifier** que chaque membre fictif est affecté à exactement 1 carrefour (pas de doublon, pas d'omission).
3. **Vérifier** que le tableau récapitulatif affiche des chiffres cohérents avec le nombre de membres démo.

### Vérification en BDD (Supabase)
1. Inscrire manuellement 25 membres fictifs à une retraite de test avec le statut `'Validee'`.
2. Lancer la répartition depuis la console admin.
3. **Vérifier dans Supabase** que 3 carrefours ont été créés (`ceil(25/10) = 3`) dans la table `carrefours`.
4. **Vérifier** que chaque `registration` des 25 membres a un `carrefour_id` non null.
5. **Vérifier** l'équilibre : aucun carrefour ne doit avoir plus de 2 membres de différence avec les autres (répartition `9/8/8` acceptable, `15/5/5` inacceptable).

### Test de réinitialisation
1. Relancer la répartition une seconde fois.
2. **Vérifier** que la confirmation est demandée avant la réinitialisation.
3. **Vérifier** que les anciens carrefours sont supprimés et remplacés, sans orphelins en BDD.
