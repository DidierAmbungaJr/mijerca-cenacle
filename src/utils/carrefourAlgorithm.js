/**
 * carrefourAlgorithm.js
 * Module utilitaire PUR (zéro dépendance externe).
 * Contient uniquement la logique de tri et de distribution des carrefours.
 * Facilite les tests unitaires isolés.
 */

/**
 * Calcule l'âge en années à partir d'une date de naissance (string ISO).
 * @param {string} dateNaissance - ex: '2002-03-15'
 * @returns {number} âge en années (décimal)
 */
function calculateAge(dateNaissance) {
  const ageMsec = Date.now() - new Date(dateNaissance).getTime()
  return ageMsec / (1000 * 60 * 60 * 24 * 365.25)
}

/**
 * Entrelace deux tableaux de façon alternée.
 * [A1, A2, A3] + [B1, B2] → [A1, B1, A2, B2, A3]
 * @param {Array} arrA
 * @param {Array} arrB
 * @returns {Array}
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
 * Retourne la tranche d'âge libellée d'une personne.
 * @param {number} age
 * @returns {'Jeune'|'Junior'|'Senior'}
 */
export function getTrancheAge(age) {
  if (age < 20) return 'Jeune'
  if (age <= 25) return 'Junior'
  return 'Senior'
}

/**
 * Algorithme principal de répartition équilibrée.
 *
 * Stratégie : tri par genre + âge → entrelacement croisé M/F → distribution Round-Robin
 *
 * @param {Array} registrants
 *   Liste d'objets avec la structure :
 *   { id: string, member: { id, nom, prenom, genre: 'M'|'F', date_naissance: string } }
 * @param {number} nbCarrefours - Nombre de groupes à créer (≥ 1)
 * @returns {Array<{ members: Array }>}
 *   Tableau de nbCarrefours groupes, chacun avec ses membres enrichis de { age, trancheAge }
 */
export function distributeToCarrefours(registrants, nbCarrefours) {
  if (!registrants || registrants.length === 0) return []
  const n = Math.max(1, nbCarrefours)

  // Enrichissement : calcul âge + tranche pour chaque inscrit
  const enriched = registrants.map(r => ({
    ...r,
    age: calculateAge(r.member.date_naissance),
    genre: r.member.genre,
    trancheAge: getTrancheAge(calculateAge(r.member.date_naissance))
  }))

  // Tri par genre (M d'abord), puis par âge croissant dans chaque genre
  const garcons = enriched.filter(r => r.genre === 'M').sort((a, b) => a.age - b.age)
  const filles  = enriched.filter(r => r.genre === 'F').sort((a, b) => a.age - b.age)

  // Entrelacement croisé : [G-jeune, F-jeune, G-moyen, F-moyen, ...]
  const interleaved = interleave(garcons, filles)

  // Distribution Round-Robin circulaire
  const groups = Array.from({ length: n }, () => ({ members: [] }))
  interleaved.forEach((registrant, i) => {
    groups[i % n].members.push(registrant)
  })

  return groups
}

/**
 * Calcule les statistiques de résumé d'un groupe pour l'affichage dans le tableau.
 * @param {{ members: Array }} group
 * @param {string} nom - Nom du carrefour
 * @returns {{ nom, total, garcons, filles, ageMin, ageMax }}
 */
export function computeGroupStats(group, nom) {
  const { members } = group
  if (!members || members.length === 0) {
    return { nom, total: 0, garcons: 0, filles: 0, ageMin: null, ageMax: null }
  }
  const ages = members.map(m => Math.floor(m.age))
  return {
    nom,
    total: members.length,
    garcons: members.filter(m => m.genre === 'M').length,
    filles: members.filter(m => m.genre === 'F').length,
    ageMin: Math.min(...ages),
    ageMax: Math.max(...ages)
  }
}
