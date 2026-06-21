import { supabase } from './supabase'

/**
 * Convertit une clé VAPID base64URL en Uint8Array pour le navigateur
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const pushNotificationService = {
  /**
   * Demande la permission et s'abonne au Push
   * @returns {Promise<PushSubscription>}
   */
  async subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error("Les notifications Push ne sont pas supportées par ce navigateur.")
    }

    // Demander la permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error("Permission de notification refusée.")
    }

    const registration = await navigator.serviceWorker.ready
    
    // Vérifier s'il y a déjà un abonnement
    let subscription = await registration.pushManager.getSubscription()
    
    if (!subscription) {
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error("Clé VAPID publique manquante dans la configuration.")
      }
      
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })
    }

    return subscription
  },

  /**
   * Enregistre l'abonnement dans Supabase
   * @param {string} memberId 
   * @param {PushSubscription} subscription 
   */
  async saveSubscriptionToDb(memberId, subscription) {
    if (!memberId || memberId === 'demo-user-id') {
      // En mode démo, on ne sauvegarde pas en BDD
      return
    }

    const subscriptionJson = JSON.parse(JSON.stringify(subscription))
    
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { member_id: memberId, subscription_json: subscriptionJson },
        { onConflict: 'member_id,subscription_json' }
      )
      
    if (error) {
      console.error('Erreur lors de la sauvegarde de l\'abonnement push:', error)
      throw error
    }
  },

  /**
   * Récupère l'état d'abonnement actuel
   * @returns {Promise<PushSubscription|null>}
   */
  async getSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null
    }
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  },
  
  /**
   * Se désabonne des notifications dans le navigateur et optionnellement en base
   * @param {string} memberId
   */
  async unsubscribe(memberId) {
    const subscription = await this.getSubscription()
    if (subscription) {
      const subscriptionJson = JSON.parse(JSON.stringify(subscription))
      await subscription.unsubscribe()
      
      if (memberId && memberId !== 'demo-user-id') {
        // Supprime l'abonnement de la base de données
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('member_id', memberId)
          .eq('subscription_json', subscriptionJson)
          
        if (error) {
          console.error('Erreur lors de la suppression de l\'abonnement push:', error)
        }
      }
    }
  }
}
