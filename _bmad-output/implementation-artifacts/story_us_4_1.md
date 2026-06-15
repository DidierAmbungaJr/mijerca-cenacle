# Spécification de Story : US-4.1

**ID** : US-4.1  
**Titre** : Inscription en ligne aux Retraites  
**Épique** : Epic 4 — Organisation des Retraites & Algorithmes  
**Estimation** : 1 Story Point  
**Statut** : Complété (Done)  
**Responsable** : Amelia (Dev)  

---

## 1. Contexte & Valeur Métier

La première étape de la gestion des retraites est la collecte des inscriptions. Actuellement, ce processus se fait par listes papier ou formulaires WhatsApp, ce qui est source d'erreurs et de doublons. Cette story implémente un formulaire d'inscription numérique pour les **membres connectés** directement depuis la vue mobile, ainsi qu'un panneau côté **admin** permettant de gérer la liste des retraites actives (créer une retraite, voir les inscrits). Le verrouillage des doublons se fait directement par la contrainte d'unicité `unique(retreat_id, member_id)` en base de données.

---

## 2. Critères d'Acceptation (Vérifications obligatoires)

* **CA-1** : L'interface membre affiche la liste des retraites actives (statut = `'Active'`) avec le titre, les dates de début/fin et un bouton "S'inscrire".
* **CA-2** : Un membre connecté peut s'inscrire à une retraite active. L'inscription crée un enregistrement dans la table `public.registrations` avec le statut `'En attente'`.
* **CA-3** : Si le membre est déjà inscrit à cette retraite (contrainte `unique` de la BDD), le formulaire affiche un message d'information "Vous êtes déjà inscrit(e) à cette retraite." au lieu du bouton d'inscription.
* **CA-4** : L'interface admin (console bureau) permet de créer une nouvelle retraite (titre, date de début, date de fin) via un formulaire dédié.
* **CA-5** : Un compteur dynamique indique en temps réel le nombre d'inscrits pour chaque retraite dans la vue admin (ex. "47 inscrit(s)").
* **CA-6** : En mode Démo, le formulaire simule les appels Supabase et confirme l'inscription avec un message de succès visuel, sans écriture en base de données.

---

## 3. Guide d'Implémentation Technique

### 3.1. Fichiers à créer / modifier

1. **`db/schema.sql`** : Ajouter les tables `retreats` et `registrations` (déjà définies dans l'architecture, à compléter dans le fichier de migration existant).
2. **`src/services/retreatService.js`** : Nouveau module de service pour les requêtes API relatives aux retraites et inscriptions.
3. **`src/components/mobile/RetreatRegistrationCard.jsx`** : Nouveau composant pour l'affichage et le formulaire d'inscription côté membre.
4. **`src/components/admin/RetreatManagementPanel.jsx`** : Nouveau composant pour la création de retraites et la vue des inscrits côté admin.
5. **`src/App.jsx`** : Intégrer `RetreatRegistrationCard` dans la vue membre et `RetreatManagementPanel` dans la vue admin (en remplacement de la section badge statique actuelle).

### 3.2. Tables DDL à ajouter dans `db/schema.sql`

```sql
-- Table des Retraites (conforme à l'architecture)
CREATE TABLE IF NOT EXISTS public.retreats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titre TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    lieu TEXT,
    image_affiche_url TEXT,
    statut TEXT NOT NULL DEFAULT 'Planifiee'
        CHECK (statut IN ('Planifiee', 'Active', 'Terminee'))
);

-- Table des Inscriptions aux Retraites (conforme à l'architecture)
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retreat_id UUID REFERENCES public.retreats(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    commission TEXT CHECK (commission IN (
        'Accueil', 'Logistique', 'Intercession', 'Decoration', 'Animation', 'Protocole'
    )),
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    carrefour_id UUID REFERENCES public.carrefours(id) ON DELETE SET NULL,
    statut_inscription TEXT NOT NULL DEFAULT 'En attente'
        CHECK (statut_inscription IN ('En attente', 'Validee', 'Annulee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_retreat_member UNIQUE (retreat_id, member_id)
);

-- Index pour accélérer les comptages d'inscrits par retraite
CREATE INDEX IF NOT EXISTS idx_registrations_retreat ON public.registrations(retreat_id);
```

### 3.3. Service `retreatService.js`

```javascript
import { supabase } from './supabase'

export const retreatService = {
  // Récupère les retraites actives (vue membre)
  async getActiveRetreats() {
    const { data, error } = await supabase
      .from('retreats')
      .select('id, titre, date_debut, date_fin, lieu, statut')
      .eq('statut', 'Active')
      .order('date_debut', { ascending: true })
    if (error) throw error
    return data || []
  },

  // Récupère toutes les retraites (vue admin)
  async getAllRetreats() {
    const { data, error } = await supabase
      .from('retreats')
      .select(`
        id, titre, date_debut, date_fin, statut,
        registrations(count)
      `)
      .order('date_debut', { ascending: false })
    if (error) throw error
    return (data || []).map(r => ({
      ...r,
      nb_inscrits: r.registrations?.[0]?.count ?? 0
    }))
  },

  // Vérifie si le membre est déjà inscrit à une retraite
  async getMemberRegistration(retreatId, memberId) {
    const { data, error } = await supabase
      .from('registrations')
      .select('id, statut_inscription')
      .eq('retreat_id', retreatId)
      .eq('member_id', memberId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  // Inscrit le membre à la retraite
  async registerMember(retreatId, memberId) {
    const { error } = await supabase
      .from('registrations')
      .insert([{ retreat_id: retreatId, member_id: memberId }])
    // Code 23505 = violation de contrainte d'unicité PostgreSQL
    if (error && error.code === '23505') {
      throw new Error('ALREADY_REGISTERED')
    }
    if (error) throw error
  },

  // Crée une nouvelle retraite (admin)
  async createRetreat(titre, dateDebut, dateFin, lieu) {
    const { data, error } = await supabase
      .from('retreats')
      .insert([{ titre, date_debut: dateDebut, date_fin: dateFin, lieu, statut: 'Planifiee' }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Active / désactive une retraite (admin)
  async updateRetreatStatus(retreatId, statut) {
    const { error } = await supabase
      .from('retreats')
      .update({ statut })
      .eq('id', retreatId)
    if (error) throw error
  }
}
```

---

## 4. Plan de Vérification & Tests

### Vérification Manuelle
1. **Vue Membre** : Se connecter en tant que Membre. Vérifier que la liste des retraites actives apparaît dans la section "Ma Retraite" de la vue mobile.
2. **Inscription** : Cliquer sur "S'inscrire". Vérifier dans Supabase qu'une ligne est créée dans `registrations` avec le bon `member_id`, `retreat_id` et le statut `'En attente'`.
3. **Protection doublon** : Recharger la page et cliquer à nouveau sur "S'inscrire". Vérifier que le message "Vous êtes déjà inscrit(e)" s'affiche et qu'aucune ligne dupliquée n'est créée en base.
4. **Vue Admin** : Se connecter en tant qu'Admin. Créer une nouvelle retraite avec un titre, une date de début et de fin. Vérifier qu'elle apparaît dans la liste avec le compteur à 0 inscrit.
5. **Activation** : Changer le statut d'une retraite de `Planifiee` à `Active` depuis la console admin. Vérifier qu'elle apparaît immédiatement dans la vue membre.
6. **Mode Démo** : Vérifier que le formulaire d'inscription simule correctement le succès et affiche le message de confirmation sans erreur API.
