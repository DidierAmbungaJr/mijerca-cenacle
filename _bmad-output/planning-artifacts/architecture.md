# Architecture Technique : MIJERCA Cénacle

**Projet** : Application Web MIJERCA Cénacle  
**Version** : 1.0.0  
**Statut** : En cours de validation  
**Date** : 13 Juin 2026  
**Auteur** : Winston (System Architect)  

---

## 1. Choix Technologiques (Tech Stack)

```
+-------------------------------------------------------------+
|                       FRONTEND (PWA)                        |
|   React.js (Vite) + Vanilla CSS (Tokens) + Workbox (PWA)    |
+-------------------------------------------------------------+
                              |
                     HTTPS / WebSockets
                              v
+-------------------------------------------------------------+
|                      BACKEND & STORAGE                      |
|      Supabase (PostgreSQL, Auth, RLS, Storage Buckets)     |
+-------------------------------------------------------------+
```

### 1.1. Frontend
* **Framework** : **React 18 / 19** avec **Vite** comme bundler pour sa rapidité de compilation et sa configuration PWA simplifiée via `vite-plugin-pwa`.
* **Styling** : **Vanilla CSS** avec un système de variables personnalisé (design tokens) afin de respecter la charte graphique et d'assurer une compatibilité totale sans dépendance volumineuse (maintien du bundle < 5 Mo).
* **PWA & Offline** : **Workbox** pour la gestion fine des Service Workers, de la mise en cache préventive des assets statiques et de la mise en cache dynamique des fichiers audio volumineux.
* **Badges & QR Codes** : 
  * `pdf-lib` : Pour générer le document PDF côté client, assembler les calques de texte sur l'image de fond importée par l'admin.
  * `qrcode` : Bibliothèque de génération de QR Codes en JavaScript (côté client).

### 1.2. Backend & Données
* **Base de données & Auth** : **Supabase** (PostgreSQL managé) avec gestion intégrée de l'authentification (email/mot de passe).
* **Sécurité** : RLS (Row Level Security) directement géré en base de données pour empêcher la lecture ou la modification de données sensibles par des utilisateurs non autorisés.
* **Stockage de fichiers (Storage Buckets)** :
  * `meditations-audio` : Bucket public contenant les fichiers MP3 des méditations quotidiennes.
  * `retreat-flyers` : Bucket contenant les affiches/backgrounds des badges importés par les administrateurs.

---

## 2. Structure des Fichiers du Projet (React + Vite)

```
/
├── public/                 # Assets statiques globaux, manifest.json, favicons
├── src/
│   ├── assets/             # Images, logos, icônes globales
│   ├── components/         # Composants d'interface réutilisables
│   │   ├── common/         # Boutons, inputs, cartes glassmorphism
│   │   ├── admin/          # Composants spécifiques à la console admin
│   │   └── mobile/         # Composants spécifiques à l'expérience membre
│   ├── context/            # Contextes React (AuthContext, OfflineContext)
│   ├── hooks/              # Hooks personnalisés (useAudioPlayer, useOfflineStatus)
│   ├── services/           # Logique API & Supabase Client
│   │   ├── supabase.js     # Initialisation du client Supabase
│   │   ├── db.js           # Requêtes et mutations BDD
│   │   └── pdfGenerator.js # Génération des badges PDF et QR code
│   ├── styles/             # Variables CSS globales, utilitaires et thèmes
│   │   ├── variables.css   # Déclaration des design tokens
│   │   └── main.css        # Styles applicatifs globaux
│   ├── App.jsx             # Composant racine avec le routage
│   ├── main.jsx            # Point d'entrée de l'application
│   └── sw.js               # Service Worker personnalisé (Workbox)
├── index.html              # Point d'entrée HTML
├── vite.config.js          # Configuration Vite + Plugin PWA
└── package.json            # Dépendances et scripts
```

---

## 3. Schéma de Base de Données (PostgreSQL DDL)

Voici le script SQL DDL complet pour initialiser la base de données PostgreSQL dans Supabase :

```sql
-- Active l'extension uuid-ossp pour la génération de clés primaires complexes
create extension if not exists "uuid-ossp";

-- 1. Table des Membres
create table public.members (
    id uuid primary key default uuid_generate_v4(),
    nom text not null,
    prenom text not null,
    genre text not null check (genre in ('M', 'F')),
    date_naissance date not null,
    telephone text,
    role text not null default 'Membre' check (role in ('Membre', 'Responsable', 'Admin')),
    date_inscription timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Table des Réunions Hebdomadaires
create table public.meetings (
    id uuid primary key default uuid_generate_v4(),
    date_reunion date not null,
    theme text not null,
    orateur text
);

-- 3. Table de suivi des Présences
create table public.attendances (
    id uuid primary key default uuid_generate_v4(),
    meeting_id uuid references public.meetings(id) on delete cascade not null,
    member_id uuid references public.members(id) on delete cascade not null,
    present boolean default false not null,
    note text,
    unique(meeting_id, member_id)
);

-- 4. Table des Retraites
create table public.retreats (
    id uuid primary key default uuid_generate_v4(),
    titre text not null,
    date_debut date not null,
    date_fin date not null,
    image_affiche_url text,
    statut text not null default 'Planifiee' check (statut in ('Planifiee', 'Active', 'Terminee'))
);

-- 5. Table des Logements (Chambres)
create table public.rooms (
    id uuid primary key default uuid_generate_v4(),
    retreat_id uuid references public.retreats(id) on delete cascade not null,
    nom_chambre text not null,
    capacite integer not null check (capacite > 0),
    genre_chambre text not null check (genre_chambre in ('M', 'F'))
);

-- 6. Table des Carrefours (Mini-groupes de prière)
create table public.carrefours (
    id uuid primary key default uuid_generate_v4(),
    retreat_id uuid references public.retreats(id) on delete cascade not null,
    nom_carrefour text not null,
    animateur_id uuid references public.members(id) on delete set null
);

-- 7. Table des Inscriptions aux retraites
create table public.registrations (
    id uuid primary key default uuid_generate_v4(),
    retreat_id uuid references public.retreats(id) on delete cascade not null,
    member_id uuid references public.members(id) on delete cascade not null,
    commission text check (commission in ('Accueil', 'Logistique', 'Intercession', 'Decoration', 'Animation', 'Protocole')),
    room_id uuid references public.rooms(id) on delete set null,
    carrefour_id uuid references public.carrefours(id) on delete set null,
    statut_inscription text not null default 'En attente' check (statut_inscription in ('En attente', 'Validee', 'Annulee')),
    unique(retreat_id, member_id)
);

-- 8. Table des Méditations Quotidiennes
create table public.meditations (
    id uuid primary key default uuid_generate_v4(),
    date_publication date not null unique,
    texte_biblique text not null,
    audio_url text not null,
    auteur text
);
```

---

## 4. Politique de Sécurité Row Level Security (RLS)

Toutes les tables doivent avoir la RLS activée pour protéger l'intégrité des données des fidèles :

```sql
alter table public.members enable row level security;
alter table public.attendances enable row level security;
alter table public.registrations enable row level security;
alter table public.meditations enable row level security;

-- Exemple de règles RLS :
-- 1. Les membres peuvent modifier uniquement leurs propres informations
create policy "Les membres lisent et écrivent leur propre profil"
on public.members for all
using (auth.uid() = id);

-- 2. Seuls les administrateurs peuvent modifier les tables de gestion (Réunions, Présences, Inscriptions, Retraites)
create policy "Les admins ont tout contrôle sur les réunions"
on public.meetings for all
using (
  exists (
    select 1 from public.members
    where members.id = auth.uid() and members.role = 'Admin'
  )
);
```

---

## 5. Stratégie PWA et Cache du Service Worker

Pour s'adapter aux problématiques réseau de Kinshasa :

1. **Pre-caching (Assets Applicatifs)** :
   * Tous les fichiers JS, CSS, HTML, icônes et polices de caractères locaux sont téléchargés et mis en cache dès l'installation de l'application.
2. **Runtime Caching (Méditations de la semaine)** :
   * **Texte Biblique (API Metadata)** : Stratégie *Stale-While-Revalidate* (Affiche instantanément le texte local et met à jour en arrière-plan si réseau disponible).
   * **Audios MP3** : Stratégie *Cache-First* (Vérifie d'abord si le fichier audio est dans le cache de l'appareil. Si oui, aucune requête réseau n'est émise. Si non, télécharge et stocke en cache).
3. **Mise à jour en un clic** : L'interface utilisateur avertira le jeune lorsqu'une nouvelle version de l'application est disponible avec un bouton "Mettre à jour".
