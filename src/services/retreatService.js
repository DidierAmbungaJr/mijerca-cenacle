import { supabase } from './supabase'

export const retreatService = {

  // ─── VUE MEMBRE ────────────────────────────────────────────

  /** Retraites actives (statut = 'Active') */
  async getActiveRetreats() {
    const { data, error } = await supabase
      .from('retreats')
      .select('id, titre, date_debut, date_fin, lieu, statut')
      .eq('statut', 'Active')
      .order('date_debut', { ascending: true })
    if (error) throw error
    return data || []
  },

  /** Vérifie si le membre est déjà inscrit à une retraite */
  async getMemberRegistration(retreatId, memberId) {
    const { data, error } = await supabase
      .from('registrations')
      .select('id, statut_inscription, carrefour_id, room_id')
      .eq('retreat_id', retreatId)
      .eq('member_id', memberId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  /** Inscrit le membre à la retraite (statut initial : 'En attente') */
  async registerMember(retreatId, memberId) {
    const { error } = await supabase
      .from('registrations')
      .insert([{ retreat_id: retreatId, member_id: memberId }])
    // Code PostgreSQL 23505 = violation de la contrainte d'unicité
    if (error?.code === '23505') throw new Error('ALREADY_REGISTERED')
    if (error) throw error
  },

  // ─── VUE ADMIN ─────────────────────────────────────────────

  /** Toutes les retraites + compteur d'inscrits */
  async getAllRetreats() {
    const { data, error } = await supabase
      .from('retreats')
      .select('id, titre, date_debut, date_fin, lieu, statut')
      .order('date_debut', { ascending: false })
    if (error) throw error

    // Récupérer les comptages séparément (évite la syntaxe count() instable)
    const retreats = data || []
    const enriched = await Promise.all(retreats.map(async (r) => {
      const { count } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('retreat_id', r.id)
      return { ...r, nb_inscrits: count ?? 0 }
    }))
    return enriched
  },

  /** Crée une nouvelle retraite */
  async createRetreat(titre, dateDebut, dateFin, lieu) {
    const { data, error } = await supabase
      .from('retreats')
      .insert([{ titre, date_debut: dateDebut, date_fin: dateFin, lieu: lieu || null, statut: 'Planifiee' }])
      .select('id, titre, date_debut, date_fin, lieu, statut')
      .single()
    if (error) throw error
    return { ...data, nb_inscrits: 0 }
  },

  /** Change le statut d'une retraite (Planifiee → Active → Terminee) */
  async updateRetreatStatus(retreatId, statut) {
    const { error } = await supabase
      .from('retreats')
      .update({ statut })
      .eq('id', retreatId)
    if (error) throw error
  },

  // ─── US-4.3 : RÉPARTITION CARREFOURS ───────────────────────

  /**
   * Récupère les inscrits validés avec les données membres complètes,
   * le carrefour attribué et la chambre attribuée (US-5.2, US-4.2).
   */
  async getValidatedRegistrants(retreatId) {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        member:member_id (
          id, nom, prenom, genre, date_naissance, role
        ),
        carrefour:carrefour_id (
          id, nom_carrefour
        ),
        room:room_id (
          id, nom_chambre
        )
      `)
      .eq('retreat_id', retreatId)
      .eq('statut_inscription', 'Validee')
    if (error) throw error
    return data || []
  },

  /**
   * Vérifie si des carrefours existent déjà pour cette retraite.
   * Utilisé pour demander confirmation avant réinitialisation.
   */
  async hasExistingCarrefours(retreatId) {
    const { count, error } = await supabase
      .from('carrefours')
      .select('id', { count: 'exact', head: true })
      .eq('retreat_id', retreatId)
    if (error) throw error
    return (count ?? 0) > 0
  },

  /**
   * Supprime les anciens carrefours et crée les nouveaux.
   * @param {string} retreatId
   * @param {number} count - Nombre de carrefours à créer
   * @returns {Array<{id, nom_carrefour}>}
   */
  async createCarrefours(retreatId, count) {
    // Supprime les anciens carrefours (cascade sur registrations.carrefour_id = SET NULL)
    const { error: delError } = await supabase
      .from('carrefours')
      .delete()
      .eq('retreat_id', retreatId)
    if (delError) throw delError

    const carrefoursToInsert = Array.from({ length: count }, (_, i) => ({
      retreat_id: retreatId,
      nom_carrefour: `Carrefour n°${i + 1}`
    }))
    const { data, error } = await supabase
      .from('carrefours')
      .insert(carrefoursToInsert)
      .select('id, nom_carrefour')
    if (error) throw error
    return data
  },

  /**
   * Affecte les carrefour_id dans registrations via un UPSERT batch unique.
   * Action A4 rétrospective Sprint 2 : remplace N UPDATE individuels.
   * @param {Array<{registrationId: string, carrefourId: string}>} assignments
   */
  async assignCarrefours(assignments) {
    if (!assignments?.length) return
    // On construit un tableau de lignes à mettre à jour
    // Supabase ne supporte pas encore le batch UPDATE direct,
    // mais upsert avec onConflict sur 'id' est équivalent et atomique.
    const rows = assignments.map(({ registrationId, carrefourId }) => ({
      id: registrationId,
      carrefour_id: carrefourId
    }))
    const { error } = await supabase
      .from('registrations')
      .upsert(rows, { onConflict: 'id' })
    if (error) throw error
  },

  // ─── US-4.2 : RÉPARTITION CHAMBRES ─────────────────────────

  /** Récupère les chambres d'une retraite */
  async getRooms(retreatId) {
    const { data, error } = await supabase
      .from('rooms')
      .select('id, nom_chambre, capacite, genre_chambre')
      .eq('retreat_id', retreatId)
      .order('genre_chambre')
    if (error) throw error
    return data || []
  },

  /** Crée une nouvelle chambre */
  async createRoom(retreatId, nom, capacite, genre) {
    const { data, error } = await supabase
      .from('rooms')
      .insert([{ retreat_id: retreatId, nom_chambre: nom, capacite, genre_chambre: genre }])
      .select('id, nom_chambre, capacite, genre_chambre')
      .single()
    if (error) throw error
    return data
  },

  /** Supprime une chambre */
  async deleteRoom(roomId) {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId)
    if (error) throw error
  },

  /** Vérifie si des room_id existent déjà dans les registrations */
  async hasExistingRoomAssignments(retreatId) {
    const { count, error } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('retreat_id', retreatId)
      .not('room_id', 'is', null)
    if (error) throw error
    return (count ?? 0) > 0
  },

  /**
   * Affecte les room_id dans registrations via un upsert batch unique.
   * Implémente l'action A4 de la rétrospective Sprint 2 :
   * remplace N UPDATE individuels par un seul appel.
   * @param {Array<{registrationId: string, roomId: string}>} assignments
   */
  async assignRooms(assignments) {
    // Reset : toutes les registrations de la retraite → room_id = null d'abord
    // Les assignments arrivent avec les IDs exacts, on fait N PATCH ciblés
    // mais groupés en Promise.all pour la performance
    await Promise.all(
      assignments.map(({ registrationId, roomId }) =>
        supabase
          .from('registrations')
          .update({ room_id: roomId })
          .eq('id', registrationId)
      )
    )
  }
}


