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
   * Récupère les inscrits validés avec les données membres complètes
   * (genre + date_naissance nécessaires pour l'algorithme de tri).
   */
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
   * Met à jour le carrefour_id dans chaque registration.
   * @param {Array<{registrationId: string, carrefourId: string}>} assignments
   */
  async assignCarrefours(assignments) {
    await Promise.all(
      assignments.map(({ registrationId, carrefourId }) =>
        supabase
          .from('registrations')
          .update({ carrefour_id: carrefourId })
          .eq('id', registrationId)
      )
    )
  }
}

