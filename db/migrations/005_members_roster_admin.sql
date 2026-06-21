-- Migration 005 : Roster des Membres & Rôles
-- À exécuter dans : Supabase SQL Editor

-- Ajouter les colonnes email et est_actif si elles n'existent pas
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS est_actif BOOLEAN NOT NULL DEFAULT true;

-- Politique RLS pour permettre aux Admins de modifier les profils des membres (rôle, statut)
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
