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

-- =============================================================
-- MODULE RETRAITES (US-4.1 / US-4.3)
-- =============================================================

-- Table des Retraites
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

-- Table des Logements/Chambres
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retreat_id UUID REFERENCES public.retreats(id) ON DELETE CASCADE NOT NULL,
    nom_chambre TEXT NOT NULL,
    capacite INTEGER NOT NULL CHECK (capacite > 0),
    genre_chambre TEXT NOT NULL CHECK (genre_chambre IN ('M', 'F'))
);

-- Table des Carrefours de prière
CREATE TABLE IF NOT EXISTS public.carrefours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    retreat_id UUID REFERENCES public.retreats(id) ON DELETE CASCADE NOT NULL,
    nom_carrefour TEXT NOT NULL,
    animateur_id UUID REFERENCES public.members(id) ON DELETE SET NULL
);

-- Table des Inscriptions aux Retraites
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

-- Index pour les comptages d'inscrits
CREATE INDEX IF NOT EXISTS idx_registrations_retreat ON public.registrations(retreat_id);
CREATE INDEX IF NOT EXISTS idx_registrations_member ON public.registrations(member_id);
CREATE INDEX IF NOT EXISTS idx_carrefours_retreat ON public.carrefours(retreat_id);

