# Spécification de Story : US-2.3

**ID** : US-2.3  
**Titre** : Bouton de Partage Rapide sur WhatsApp  
**Épique** : Epic 2 — Vie Spirituelle & Cache Offline (PWA)  
**Estimation** : 1 Story Point  
**Statut** : Complété (Done)  
**Responsable** : Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

Pour accroître l'engagement et simplifier la diffusion des méditations de la MIJERCA Cénacle dans les groupes de prière existants (notamment sur WhatsApp), cette story implémente un bouton de partage en un clic. Il permet de composer automatiquement un message d'invitation contenant le texte biblique du jour et l'adresse de l'application web.

---

## 2. Critères d'Acceptation (Vérifications obligatoires)

* **CA-1** : L'interface du lecteur audio propose un bouton de partage clairement identifiable avec l'icône ou le texte WhatsApp.
* **CA-2** : Le clic sur le bouton ouvre une nouvelle fenêtre (ou redirige vers l'application WhatsApp mobile) en utilisant l'URL universelle `https://api.whatsapp.com/send`.
* **CA-3** : Le message prérempli contient la date du jour, le texte de la méditation tronqué proprement si trop long (avec des points de suspension), et l'URL de connexion.
* **CA-4** : Le lien de partage s'ouvre avec la balise sécurisée `target="_blank"` et la protection `rel="noreferrer"`.

---

## 3. Guide d'Implémentation Technique

### 3.1. Fichiers concernés
* **`src/components/mobile/MeditationPlayer.jsx`** : Intégration du bouton et formatage dynamique de la chaîne de partage.

### 3.2. Formatage du message de partage

Dans `MeditationPlayer.jsx`, nous générons dynamiquement l'URL d'envoi. Pour éviter les coupures de chaînes dans les navigateurs, nous encodons proprement les caractères spéciaux via `encodeURIComponent` :

```javascript
const handleShareWhatsApp = () => {
  const dateFormatted = new Date(meditation.date_publication).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long'
  });
  
  // Tronque le texte si très long pour rester sous la limite recommandée de WhatsApp
  const rawText = meditation.texte_biblique || '';
  const cleanText = rawText.length > 150 ? `${rawText.substring(0, 150)}...` : rawText;
  
  const shareText = `🕊️ *MIJERCA Cénacle - Méditation du ${dateFormatted}* 🕊️\n\n« ${cleanText} »\n\n👉 Retrouve le texte complet et la méditation audio du jour sur notre application : ${window.location.origin}`;
  
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};
```

---

## 4. Plan de Vérification & Tests

### Vérification Manuelle
1. Ouvrir l'application sur un smartphone ou un navigateur de bureau.
2. Cliquer sur le bouton "Partager cette méditation sur WhatsApp".
3. Confirmer que la page de redirection de WhatsApp s'ouvre dans un nouvel onglet.
4. Valider la structure du message prérempli dans l'interface de sélection de contact WhatsApp :
   * Les emojis 🕊️ s'affichent correctement.
   * La mise en forme en gras (ex: `*MIJERCA Cénacle*`) est active.
   * L'URL pointe bien vers le domaine de l'application locale.
5. Envoyer le message à un contact de test et s'assurer que le lien cliquable fonctionne.
