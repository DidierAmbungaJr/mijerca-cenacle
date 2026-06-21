import { supabase } from './supabase'

export const rosterService = {
  /**
   * Récupère tous les membres triés par nom et prénom
   * @returns {Promise<Array>}
   */
  async getMembers() {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('nom', { ascending: true })
      .order('prenom', { ascending: true })
      
    if (error) {
      console.error("Erreur lors de la récupération du roster :", error)
      throw error
    }
    return data
  },

  /**
   * Met à jour le rôle d'un membre
   * @param {string} memberId 
   * @param {string} role 
   * @returns {Promise<any>}
   */
  async updateMemberRole(memberId, role) {
    const { data, error } = await supabase
      .from('members')
      .update({ role })
      .eq('id', memberId)
      
    if (error) {
      console.error(`Erreur lors de la modification du rôle du membre ${memberId} :`, error)
      throw error
    }
    return data
  },

  /**
   * Met à jour le statut d'activation d'un compte membre
   * @param {string} memberId 
   * @param {boolean} estActif 
   * @returns {Promise<any>}
   */
  async toggleMemberStatus(memberId, estActif) {
    const { data, error } = await supabase
      .from('members')
      .update({ est_actif: estActif })
      .eq('id', memberId)
      
    if (error) {
      console.error(`Erreur lors de la modification du statut actif du membre ${memberId} :`, error)
      throw error
    }
    return data
  }
}
