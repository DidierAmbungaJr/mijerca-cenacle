import { supabase } from './supabase'

export const presenceService = {
  // Récupère tous les membres par ordre alphabétique
  async getMembers() {
    const { data, error } = await supabase
      .from('members')
      .select('id, nom, prenom, role')
      .order('nom', { ascending: true })
      .order('prenom', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Récupère ou crée la réunion du jour / de la date spécifiée
  async getOrCreateReunion(dateString) {
    const { data: existing, error: selectError } = await supabase
      .from('reunions')
      .select('*')
      .eq('date', dateString)
      .maybeSingle()

    if (selectError) throw selectError
    if (existing) return existing

    const { data: created, error: insertError } = await supabase
      .from('reunions')
      .insert([{ date: dateString }])
      .select()
      .single()

    if (insertError) throw insertError
    return created
  },

  // Récupère l'état de pointage de la réunion
  async getPresencesForReunion(reunionId) {
    const { data, error } = await supabase
      .from('presences')
      .select('member_id, present')
      .eq('reunion_id', reunionId)
    
    if (error) throw error
    return data || []
  },

  // Enregistre ou bascule la présence d'un membre
  async setPresence(memberId, reunionId, present) {
    const { error } = await supabase
      .from('presences')
      .upsert({
        member_id: memberId,
        reunion_id: reunionId,
        present: present
      }, { onConflict: 'member_id,reunion_id' })
    
    if (error) throw error
  },

  // Récupère l'historique complet d'un membre (jointure reunions)
  async getMemberAttendanceHistory(memberId) {
    const { data, error } = await supabase
      .from('presences')
      .select(`
        present,
        reunion:reunion_id (
          id,
          date,
          theme
        )
      `)
      .eq('member_id', memberId)

    if (error) throw error

    // Aplatir et trier par date décroissante
    return (data || [])
      .map(p => ({
        present: p.present,
        date: p.reunion?.date || '',
        theme: p.reunion?.theme || ''
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }
}
