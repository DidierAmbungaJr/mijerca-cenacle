import { supabase } from './supabase'

export const commissionService = {
  /**
   * Récupère la liste des retraitants validés assignés à une commission spécifique
   * @param {string} retreatId 
   * @param {string} commission 
   * @returns {Promise<Array>}
   */
  async getCommissionTeam(retreatId, commission) {
    if (!retreatId || !commission) return []
    
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        commission,
        member:member_id (
          id,
          nom,
          prenom,
          genre,
          telephone
        )
      `)
      .eq('retreat_id', retreatId)
      .eq('commission', commission)
      .eq('statut_inscription', 'Validee')
      
    if (error) {
      console.error("Erreur lors de la récupération de l'équipe de commission :", error)
      throw error
    }
    
    // Reformater pour aplatir l'objet et simplifier le rendu
    return data.map(r => ({
      registrationId: r.id,
      commission: r.commission,
      memberId: r.member?.id,
      nom: r.member?.nom,
      prenom: r.member?.prenom,
      genre: r.member?.genre,
      telephone: r.member?.telephone
    }))
  },

  /**
   * Assigne ou met à jour la commission de service d'un participant inscrit
   * @param {string} registrationId 
   * @param {string|null} commission 
   * @returns {Promise<any>}
   */
  async assignMemberToCommission(registrationId, commission) {
    const { data, error } = await supabase
      .from('registrations')
      .update({ commission: commission || null })
      .eq('id', registrationId)
      
    if (error) {
      console.error("Erreur lors de l'affectation de la commission :", error)
      throw error
    }
    return data
  }
}
