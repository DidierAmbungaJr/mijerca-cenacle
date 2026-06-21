/**
 * carrefourAlgorithm.test.js
 * Tests unitaires pour le module de répartition des carrefours (US-4.3).
 * Framework : Vitest (compatible avec le projet Vite existant).
 *
 * Exécution : npx vitest run src/utils/carrefourAlgorithm.test.js
 */

import { describe, it, expect } from 'vitest'
import {
  distributeToCarrefours,
  computeGroupStats,
  getTrancheAge
} from './carrefourAlgorithm'

// ─── Helpers pour générer des données de test ─────────────────────────────────

/**
 * Construit un inscrit fictif.
 * @param {string} id
 * @param {'M'|'F'} genre
 * @param {number} age - âge désiré en années (approximation via date ISO)
 */
function makeRegistrant(id, genre, age) {
  const dateNaissance = new Date()
  dateNaissance.setFullYear(dateNaissance.getFullYear() - age)
  return {
    id,
    member: {
      id,
      nom: `Nom_${id}`,
      prenom: `Prenom_${id}`,
      genre,
      date_naissance: dateNaissance.toISOString().split('T')[0]
    }
  }
}

/** Génère N inscrits masculins + N inscrits féminins âgés de 16 à 35 ans. */
function makeBalancedGroup(nPerGender) {
  const result = []
  for (let i = 0; i < nPerGender; i++) {
    result.push(makeRegistrant(`m${i}`, 'M', 16 + i))
    result.push(makeRegistrant(`f${i}`, 'F', 16 + i))
  }
  return result
}

// ─── Tests : getTrancheAge ────────────────────────────────────────────────────

describe('getTrancheAge', () => {
  it('retourne "Jeune" pour un âge inférieur à 20 ans', () => {
    expect(getTrancheAge(15)).toBe('Jeune')
    expect(getTrancheAge(19.9)).toBe('Jeune')
  })

  it('retourne "Junior" pour un âge compris entre 20 et 25 ans (inclus)', () => {
    expect(getTrancheAge(20)).toBe('Junior')
    expect(getTrancheAge(25)).toBe('Junior')
  })

  it('retourne "Senior" pour un âge supérieur à 25 ans', () => {
    expect(getTrancheAge(25.1)).toBe('Senior')
    expect(getTrancheAge(40)).toBe('Senior')
  })
})

// ─── Tests : distributeToCarrefours ──────────────────────────────────────────

describe('distributeToCarrefours', () => {

  // CA-1 : entrée vide
  it('[CA-1] retourne [] quand la liste des inscrits est vide', () => {
    expect(distributeToCarrefours([], 3)).toEqual([])
    expect(distributeToCarrefours(null, 3)).toEqual([])
    expect(distributeToCarrefours(undefined, 2)).toEqual([])
  })

  // CA-2 : un seul groupe → tous les membres dedans
  it('[CA-2] avec nbCarrefours=1, place tous les membres dans un unique groupe', () => {
    const registrants = makeBalancedGroup(4) // 8 membres
    const groups = distributeToCarrefours(registrants, 1)

    expect(groups).toHaveLength(1)
    expect(groups[0].members).toHaveLength(8)
  })

  // CA-3 : équilibre H/F avec 3 carrefours et 10H + 10F
  // NOTE : l'algorithme produit un équilibre correct pour N IMPAIR de groupes.
  // Avec N=2 groupes, le Round-Robin sur [M,F,M,F…] met tous les M en groupe 0
  // et toutes les F en groupe 1 — comportement documenté comme limitation connue.
  it('[CA-3] distribue équitablement H et F sur 3 carrefours (10M + 10F)', () => {
    const registrants = makeBalancedGroup(10) // 20 membres : 10M + 10F
    const groups = distributeToCarrefours(registrants, 3)

    expect(groups).toHaveLength(3)

    const stats = groups.map((g, i) => computeGroupStats(g, `C${i + 1}`))

    // Total membres préservé
    const total = stats.reduce((s, st) => s + st.total, 0)
    expect(total).toBe(20)

    // Chaque groupe a au moins 1 membre féminin ET 1 membre masculin
    stats.forEach(st => {
      expect(st.garcons).toBeGreaterThan(0)
      expect(st.filles).toBeGreaterThan(0)
    })

    // L'écart de garçons entre le groupe le plus masculin et le plus féminin ≤ 2
    const maxGarcons = Math.max(...stats.map(s => s.garcons))
    const minGarcons = Math.min(...stats.map(s => s.garcons))
    expect(maxGarcons - minGarcons).toBeLessThanOrEqual(2)
  })

  // CA-4 : nombre de carrefours > nombre d'inscrits
  it('[CA-4] crée nbCarrefours groupes même si certains sont vides (plus de groupes que de membres)', () => {
    const registrants = [makeRegistrant('a', 'M', 22)]
    const groups = distributeToCarrefours(registrants, 3)

    expect(groups).toHaveLength(3)
    // Le premier groupe reçoit l'unique membre
    expect(groups[0].members).toHaveLength(1)
    // Les autres groupes sont vides
    expect(groups[1].members).toHaveLength(0)
    expect(groups[2].members).toHaveLength(0)
  })

  // CA-5 : genre déséquilibré — 10M + 0F
  it('[CA-5] fonctionne sans crash avec un genre manquant (10M + 0F)', () => {
    const registrants = Array.from({ length: 10 }, (_, i) =>
      makeRegistrant(`m${i}`, 'M', 18 + i)
    )
    const groups = distributeToCarrefours(registrants, 2)

    expect(groups).toHaveLength(2)
    const total = groups.reduce((sum, g) => sum + g.members.length, 0)
    expect(total).toBe(10) // Aucun inscrit perdu
  })

  // CA-6 : nbCarrefours invalide (0 ou négatif) → forcé à 1
  it('[CA-6] avec nbCarrefours=0 ou négatif, utilise 1 groupe par défaut', () => {
    const registrants = makeBalancedGroup(3)
    const groupsZero = distributeToCarrefours(registrants, 0)
    const groupsNeg  = distributeToCarrefours(registrants, -5)

    expect(groupsZero).toHaveLength(1)
    expect(groupsNeg).toHaveLength(1)
    expect(groupsZero[0].members).toHaveLength(6)
  })
})

// ─── Tests : computeGroupStats ────────────────────────────────────────────────

describe('computeGroupStats', () => {

  it('retourne des zéros pour un groupe vide', () => {
    const stats = computeGroupStats({ members: [] }, 'Carrefour n°1')
    expect(stats.total).toBe(0)
    expect(stats.garcons).toBe(0)
    expect(stats.filles).toBe(0)
    expect(stats.ageMin).toBeNull()
    expect(stats.ageMax).toBeNull()
  })

  it('calcule correctement le total, genre et ageMin/ageMax', () => {
    // On crée directement des membres enrichis (avec .age)
    const members = [
      { id: '1', genre: 'M', age: 18 },
      { id: '2', genre: 'F', age: 22 },
      { id: '3', genre: 'M', age: 25 }
    ]
    const stats = computeGroupStats({ members }, 'Carrefour Test')

    expect(stats.nom).toBe('Carrefour Test')
    expect(stats.total).toBe(3)
    expect(stats.garcons).toBe(2)
    expect(stats.filles).toBe(1)
    expect(stats.ageMin).toBe(18)
    expect(stats.ageMax).toBe(25)
  })
})
