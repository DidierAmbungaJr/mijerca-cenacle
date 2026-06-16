-- Migration 002 : Réunions Hebdomadaires & Présences
-- Dépend de : 001_members_meditations.sql

CREATE TABLE IF NOT EXISTS public.reunions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    theme VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.presences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    reunion_id UUID REFERENCES public.reunions(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_member_reunion UNIQUE (member_id, reunion_id)
);

CREATE INDEX IF NOT EXISTS idx_presences_reunion ON public.presences(reunion_id);
CREATE INDEX IF NOT EXISTS idx_presences_member ON public.presences(member_id);

-- RLS
ALTER TABLE public.reunions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins : gestion complète réunions"
ON public.reunions FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "Admins : gestion complète présences"
ON public.presences FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role = 'Admin')
);
