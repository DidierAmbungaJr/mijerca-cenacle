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
