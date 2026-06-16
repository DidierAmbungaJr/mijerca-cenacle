-- Migration 003 : Module Retraites (Inscriptions, Chambres, Carrefours)
-- Dépend de : 001_members_meditations.sql

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

-- Table des Chambres / Logements
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

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_registrations_retreat ON public.registrations(retreat_id);
CREATE INDEX IF NOT EXISTS idx_registrations_member ON public.registrations(member_id);
CREATE INDEX IF NOT EXISTS idx_carrefours_retreat ON public.carrefours(retreat_id);
CREATE INDEX IF NOT EXISTS idx_rooms_retreat ON public.rooms(retreat_id);

-- RLS
ALTER TABLE public.retreats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrefours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Retraites : visibles par tous les membres authentifiés
CREATE POLICY "Membres : lecture retraites actives"
ON public.retreats FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins : gestion complète retraites"
ON public.retreats FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'Admin')
);

-- Inscriptions : chaque membre voit et gère la sienne
CREATE POLICY "Membres : gestion propre inscription"
ON public.registrations FOR ALL
USING (member_id = auth.uid());

CREATE POLICY "Admins : gestion complète inscriptions"
ON public.registrations FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'Admin')
);

-- Chambres & Carrefours : lecture pour membres authentifiés
CREATE POLICY "Membres : lecture chambres"
ON public.rooms FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins : gestion complète chambres"
ON public.rooms FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "Membres : lecture carrefours"
ON public.carrefours FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins : gestion complète carrefours"
ON public.carrefours FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'Admin')
);
