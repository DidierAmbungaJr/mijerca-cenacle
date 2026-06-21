# Spécification de Story : US-4.4

**ID** : US-4.4  
**Titre** : Gestion des Commissions de Travail  
**Épique** : Epic 4 — Retraites Spirituelles & Logistique (ou Epic 4 — Commissions)  
**Estimation** : 2 Story Points  
**Statut** : A faire (Todo)  
**Responsable** : Amelia (Dev)

---

## 1. Contexte & Valeur Métier

Pendant les retraites spirituelles du Cénacle, la répartition des tâches est organisée par **commissions de service** (Accueil, Liturgie, Logistique, etc.). 
Cette story permet aux administrateurs d'assigner chaque inscrit validé à une commission de service spécifique. De plus, elle offre aux responsables de commissions un espace mobile dédié "Ma Commission" pour voir les membres de leur équipe et les coordonner.

---

## 2. Critères d'Acceptation

* **CA-1** : Dans l'onglet Retraites de la console d'administration, l'administrateur peut assigner un membre inscrit et validé à une commission de service (mise à jour de `registrations.commission`).
* **CA-2** : Les commissions disponibles dans le système sont : "Accueil", "Logistique", "Intercession", "Liturgie", "Protocole", "Sante".
* **CA-3** : Un utilisateur identifié comme `Responsable` d'une commission (ex: rôle `'Responsable'` et champ `members.commission` défini) voit un onglet ou section dédié "**Ma Commission**" sur son espace mobile.
* **CA-4** : La section "**Ma Commission**" affiche le nom de la commission, le nombre de membres assignés, et le tableau contenant le nom, prénom, genre et numéro de téléphone de chaque retraitant de son équipe.
* **CA-5** : **Mode Démo** : Des commissions fictives sont pré-assignées aux membres en démo et la vue "Ma Commission" s'affiche pour un responsable démo.

---

## 3. Architecture & Modèle de Données

### 3.1. Script de Migration SQL
Créer le fichier [006_retreat_commissions.sql](file:///home/didier-ambunga-jr/Documents/Mes%20projets/mijerca-cenacle/db/migrations/006_retreat_commissions.sql) :

```sql
-- Migration 006 : Commissions de service pour les retraites

-- 1. Mettre à jour la contrainte de commission dans registrations
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_commission_check;

ALTER TABLE public.registrations ADD CONSTRAINT registrations_commission_check 
  CHECK (commission IN ('Accueil', 'Logistique', 'Intercession', 'Liturgie', 'Protocole', 'Sante', 'Decoration', 'Animation'));

-- 2. Ajouter le champ commission à la table members pour identifier la commission d'un Responsable
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS commission TEXT;
```

---

## 4. Guide d'Implémentation Technique

### 4.1. Fichiers à modifier / créer

1. **[006_retreat_commissions.sql](file:///home/didier-ambunga-jr/Documents/Mes%20projets/mijerca-cenacle/db/migrations/006_retreat_commissions.sql) [NEW]** : Script de migration SQL.
2. **`src/services/commissionService.js` [NEW]** : Service pour récupérer les retraitants d'une commission pour une retraite active (`getCommissionTeam(retreatId, commission)`).
3. **`src/components/mobile/CommissionTeamPanel.jsx` [NEW]** : Composant UI mobile affichant l'équipe d'une commission pour le responsable.
4. **`src/components/admin/RetreatManagementPanel.jsx` [MODIFY]** : Ajouter la possibilité d'assigner une commission aux inscrits validés (sélecteur de commission à côté de l'inscription).
5. **`src/App.jsx` [MODIFY]** : Rendre le `<CommissionTeamPanel />` dans l'espace mobile si l'utilisateur est un Responsable d'une commission.

---

## 5. Plan de Vérification

### 5.1. Validation du Mode Démo (CA-5)
1. Se connecter en mode démo **Responsable** (le profil démo aura le rôle `Responsable` et la commission `Accueil`).
2. Vérifier que la section "**Ma Commission (Accueil)**" s'affiche avec la liste des membres fictifs assignés à l'Accueil.
3. Se connecter en mode démo **Admin**.
4. Aller sur le panneau des retraites, modifier la commission d'un inscrit démo et vérifier le changement en mémoire.

### 5.2. Validation en Mode Réel
1. Exécuter la migration SQL `006_retreat_commissions.sql`.
2. Assigner un membre comme `Responsable` de la commission `Logistique` en base.
3. Assigner d'autres membres inscrits à la commission `Logistique` pour une retraite active.
4. Se connecter avec le compte du responsable et vérifier l'affichage correct des membres de la commission `Logistique`.
