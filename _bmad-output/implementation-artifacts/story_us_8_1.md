# Spécification de Story : US-8.1

**ID** : US-8.1  
**Titre** : Console Admin de Gestion du Roster & Rôles  
**Épique** : Epic 8 — Console d'Administration & Gestion des Membres  
**Estimation** : 3 Story Points  
**Statut** : A faire (Todo)  
**Responsable** : Amelia (Dev)

---

## 1. Contexte & Valeur Métier

Pour assurer le bon fonctionnement de la communauté du Cénacle et l'administration des accès, le comité d'administration doit disposer d'une **console de gestion des membres**. 
Cette story implémente la visualisation de l'ensemble des membres inscrits, la possibilité de modifier leurs rôles (Membre, Responsable, Admin) pour leur accorder des privilèges, et l'activation/désactivation de leurs comptes pour bloquer les connexions non autorisées en cas de besoin.

---

## 2. Critères d'Acceptation

* **CA-1** : Un nouveau panneau "**Roster des Membres**" est visible sur la console d'administration (vue Admin).
* **CA-2** : Le panneau affiche un tableau contenant le nom, prénom, email, téléphone, rôle actuel et statut de connexion (Actif / Désactivé) de chaque membre.
* **CA-3** : L'administrateur peut modifier le rôle d'un membre via un menu déroulant (Membre, Responsable, Admin). La modification est sauvegardée immédiatement en base de données.
* **CA-4** : L'administrateur peut activer ou désactiver un compte membre via un interrupteur ou un bouton d'action. Si un compte est désactivé, l'utilisateur est immédiatement déconnecté de l'application et ne peut plus s'y reconnecter.
* **CA-5** : L'administrateur peut filtrer les membres par rôle et effectuer une recherche instantanée par nom ou prénom en temps réel.
* **CA-6** : **Mode Démo** : Les modifications de rôles et de statuts s'effectuent localement en mémoire pour validation visuelle, sans persistance Supabase. Des comptes d'exemples avec différents statuts sont pré-remplis.

---

## 3. Architecture & Modèle de Données

### 3.1. Script de Migration SQL
Créer le fichier [005_members_roster_admin.sql](file:///home/didier-ambunga-jr/Documents/Mes%20projets/mijerca-cenacle/db/migrations/005_members_roster_admin.sql) pour mettre à jour la table `public.members` :

```sql
-- Migration 005 : Roster des Membres & Rôles
-- Ajouter les colonnes email et est_actif
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS est_actif BOOLEAN NOT NULL DEFAULT true;

-- Politique RLS pour permettre aux Admins de modifier les profils des membres
CREATE POLICY "Admins : modification de tous les membres"
ON public.members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = auth.uid() AND m.role = 'Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = auth.uid() AND m.role = 'Admin'
  )
);
```

---

## 4. Guide d'Implémentation Technique

### 4.1. Fichiers à modifier / créer

1. **[005_members_roster_admin.sql](file:///home/didier-ambunga-jr/Documents/Mes%20projets/mijerca-cenacle/db/migrations/005_members_roster_admin.sql) [NEW]** : Script de migration de base de données.
2. **`src/services/rosterService.js` [NEW]** : Service pour récupérer la liste des membres, mettre à jour leur rôle et changer leur statut actif/inactif dans Supabase.
3. **`src/components/admin/RosterManagementPanel.jsx` [NEW]** : Composant UI affichant le tableau des membres, les sélecteurs de rôles, les boutons d'activation/désactivation, la recherche et les filtres.
4. **`src/context/AuthContext.jsx` [MODIFY]** : Mettre à jour `fetchProfile` pour vérifier si le compte du membre est actif (`est_actif === false`). Si désactivé, déconnecter automatiquement l'utilisateur avec un message explicite.
5. **`src/App.jsx` [MODIFY]** : Intégrer `<RosterManagementPanel />` dans la console d'administration.

---

## 5. Plan de Vérification

### 5.1. Validation du Mode Démo (CA-6)
1. Se connecter en mode démo Administrateur.
2. Cliquer sur le panneau Roster des Membres.
3. **Recherche & Filtres (CA-5)** : Rechercher "Sarah" ou filtrer par rôle "Responsable" pour s'assurer que le filtrage fonctionne instantanément.
4. **Changement de Rôle (CA-3)** : Changer le rôle d'un membre démo (ex: de Membre à Responsable). Vérifier que le changement s'applique visuellement.
5. **Désactivation (CA-4)** : Cliquer sur "Désactiver" pour un membre démo. Vérifier que son statut passe à "Désactivé".

### 5.2. Validation du Mode Réel & Sécurité
1. Exécuter la migration SQL `005_members_roster_admin.sql` dans Supabase.
2. Créer un utilisateur membre test.
3. Se connecter en tant qu'Administrateur réel.
4. Accéder au panneau Roster, localiser le membre test, et changer son rôle en "Responsable". Vérifier en base que la modification a été appliquée.
5. Cliquer sur "Désactiver" pour ce membre test.
6. Essayer de se connecter avec le compte de ce membre test -> **Vérifier** qu'il est immédiatement déconnecté ou bloqué lors de l'authentification avec un message indiquant que son compte est désactivé.
