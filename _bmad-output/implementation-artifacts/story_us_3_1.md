# Spécification de Story : US-3.1

**ID** : US-3.1  
**Titre** : Feuille d'Appel Numérique (Admin)  
**Épique** : Epic 3 — Réunions & Présences Hebdomadaires  
**Estimation** : 1 Story Point  
**Statut** : Complété (Done)  
**Responsable** : Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

Cette story remplace les listes d'appel physiques par une solution numérique robuste. L'administrateur de réunion doit pouvoir sélectionner une date spécifique, rechercher instantanément un membre de la paroisse par nom ou prénom, et basculer en un clic l'état de présence de chaque jeune. La persistance directe en base de données garantit des rapports d'assiduité précis et à jour.

---

## 2. Critères d'Acceptation (Vérifications obligatoires)

* **CA-1** : Les tables relationnelles `reunions` et `presences` sont créées dans le schéma public de Supabase avec des contraintes d'intégrité de clé étrangère et d'unicité.
* **CA-2** : L'interface d'administration permet de choisir la date de la réunion (sélecteur HTML5 standard). La date par défaut est la date locale du jour.
* **CA-3** : Si aucune réunion n'existe en base de données pour la date sélectionnée, le premier clic sur une case à cocher l'initialise automatiquement.
* **CA-4** : La liste affiche les membres triés par ordre alphabétique (`nom` croissant, puis `prenom`).
* **CA-5** : Un champ de recherche textuel permet un filtrage instantané côté client en tapant quelques lettres du nom ou du prénom.
* **CA-6** : L'état visuel de la case à cocher reflète l'état persistant en base. L'action utilisateur bascule l'état via un `upsert` API sans perturber le reste de la liste. Un état de chargement visuel discret empêche les doubles clics accidentels pendant l'appel réseau.

---

## 3. Guide d'Implémentation Technique

### 3.1. Fichiers à créer / modifier

1. **`db/schema.sql`** : Script DDL de création des tables.
2. **`src/services/presenceService.js`** : Module d'interaction avec la base de données pour les présences et réunions.
3. **`src/App.jsx`** : Remplacer l'état fictif par l'intégration de `presenceService` et le rendu de la grille de pointage.

### 3.2. Script DDL de Base de Données

```sql
-- Table des réunions hebdomadaires
CREATE TABLE IF NOT EXISTS public.reunions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    theme VARCHAR(255)
);

-- Table de pointage des présences
CREATE TABLE IF NOT EXISTS public.presences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    reunion_id UUID REFERENCES public.reunions(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_member_reunion UNIQUE (member_id, reunion_id)
);

-- Index pour optimiser les jointures de rapports de présence
CREATE INDEX IF NOT EXISTS idx_presences_reunion ON public.presences(reunion_id);
CREATE INDEX IF NOT EXISTS idx_presences_member ON public.presences(member_id);
```

### 3.3. Service de Données `presenceService.js`

```javascript
import { supabase } from './supabase'

export const presenceService = {
  // Récupère la liste alphabétique des membres
  async getMembers() {
    const { data, error } = await supabase
      .from('members')
      .select('id, nom, prenom, role')
      .order('nom', { ascending: true })
      .order('prenom', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Récupère ou insère la réunion du jour
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
    return data
  },

  // Enregistre ou bascule la présence d'un membre
  async togglePresence(memberId, reunionId, present) {
    const { error } = await supabase
      .from('presences')
      .upsert({
        member_id: memberId,
        reunion_id: reunionId,
        present: present
      }, { onConflict: 'member_id,reunion_id' })
    
    if (error) throw error
  }
}
```

---

## 4. Plan de Vérification & Tests

### Vérification Manuelle
1. **Création des tables** : Exécuter le script SQL dans l'éditeur Supabase de la paroisse et s'assurer que les tables sont créées.
2. **Affichage initial** : Vérifier que la liste des membres est chargée par ordre alphabétique depuis Supabase.
3. **Recherche / Filtres** : Saisir un texte dans le champ de recherche. Confirmer que la liste filtre instantanément les résultats côté client (ex. taper "Am" affiche "Ambunga Didier").
4. **Pointage en direct** : Cocher un membre. Vérifier dans Supabase qu'une ligne est bien ajoutée/mise à jour dans la table `presences` avec la bonne date de réunion.
5. **Mode Hors-ligne** : Tenter de cocher un membre alors que la connexion réseau est simulée comme coupée. S'assurer que l'application affiche un message d'erreur clair et ne perd pas l'état visuel initial de la case.
