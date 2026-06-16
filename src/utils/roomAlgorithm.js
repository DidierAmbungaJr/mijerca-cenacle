/**
 * roomAlgorithm.js
 * Module utilitaire PUR (zéro dépendance externe).
 * Algorithme Room-Fill greedy pour la répartition des chambres.
 * Répartition strictement non-mixte (genre → genre_chambre).
 */

/**
 * Algorithme principal de répartition des chambres.
 *
 * Stratégie : greedy — on remplit les chambres de plus grande capacité en premier.
 *
 * @param {Array} registrants
 *   Liste d'inscrits validés :
 *   [{ id, member: { id, nom, prenom, genre } }, ...]
 * @param {Array} rooms
 *   Liste de chambres disponibles :
 *   [{ id, nom_chambre, capacite, genre_chambre }, ...]
 * @returns {{
 *   assignments: Array<{registrationId, roomId}>,
 *   roomStats: Array<{room, occupants, available}>,
 *   unhoused: Array
 * }}
 */
export function distributeToRooms(registrants, rooms) {
  if (!registrants?.length || !rooms?.length) {
    return { assignments: [], roomStats: [], unhoused: registrants || [] }
  }

  // Séparer par genre
  const garcons = registrants.filter(r => r.member.genre === 'M')
  const filles  = registrants.filter(r => r.member.genre === 'F')

  // Séparer les chambres par genre, triées par capacité décroissante
  const chambresM = rooms
    .filter(r => r.genre_chambre === 'M')
    .sort((a, b) => b.capacite - a.capacite)
  const chambresF = rooms
    .filter(r => r.genre_chambre === 'F')
    .sort((a, b) => b.capacite - a.capacite)

  const assignments = []
  const roomStats = []
  const unhoused = []

  // Remplissage greedy pour un groupe de personnes et un groupe de chambres
  const fill = (persons, chambres) => {
    let personIndex = 0

    for (const room of chambres) {
      const occupants = []
      let placed = 0

      while (placed < room.capacite && personIndex < persons.length) {
        const r = persons[personIndex]
        assignments.push({ registrationId: r.id, roomId: room.id })
        occupants.push(r)
        personIndex++
        placed++
      }

      roomStats.push({
        room,
        occupants,
        available: room.capacite - occupants.length
      })

      if (personIndex >= persons.length) break
    }

    // Personnes restantes non logées
    while (personIndex < persons.length) {
      unhoused.push(persons[personIndex])
      personIndex++
    }
  }

  fill(garcons, chambresM)
  fill(filles, chambresF)

  // Ajouter les chambres vides non utilisées dans roomStats pour le récapitulatif
  const usedRoomIds = new Set(roomStats.map(s => s.room.id))
  for (const room of rooms) {
    if (!usedRoomIds.has(room.id)) {
      roomStats.push({ room, occupants: [], available: room.capacite })
    }
  }

  return { assignments, roomStats, unhoused }
}
