import { supabase } from './supabase'

const BUCKET = 'retreat-flyers'

export const badgeService = {

  /**
   * Uploade l'image de fond dans le bucket Supabase Storage.
   * Chemin : {retreatId}/background.{ext}
   * Utilise `upsert: true` pour écraser un fond existant.
   * @param {string} retreatId
   * @param {File} file - Objet File natif du navigateur
   * @returns {Promise<string>} - URL publique de l'image uploadée
   */
  async uploadBackground(retreatId, file) {
    const ext = file.name.split('.').pop().toLowerCase()
    const filePath = `${retreatId}/background.${ext}`

    // Upload (ou écrasement) dans le bucket
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      })

    if (uploadError) throw uploadError

    // Récupère l'URL publique permanente
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) throw new Error('Impossible de générer l\'URL publique.')

    // Persiste l'URL dans le champ image_affiche_url de la retraite
    const { error: updateError } = await supabase
      .from('retreats')
      .update({ image_affiche_url: publicUrl })
      .eq('id', retreatId)

    if (updateError) throw updateError

    return publicUrl
  },

  /**
   * Récupère l'URL du fond existant pour une retraite donnée.
   * @param {string} retreatId
   * @returns {Promise<string|null>}
   */
  async getExistingBackground(retreatId) {
    const { data, error } = await supabase
      .from('retreats')
      .select('image_affiche_url')
      .eq('id', retreatId)
      .single()

    if (error) return null
    return data?.image_affiche_url || null
  }
}
