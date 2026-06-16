-- Migration 001 : Table des Membres
-- À exécuter dans : Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    genre TEXT NOT NULL CHECK (genre IN ('M', 'F')),
    date_naissance DATE NOT NULL,
    telephone TEXT,
    role TEXT NOT NULL DEFAULT 'Membre' CHECK (role IN ('Membre', 'Responsable', 'Admin')),
    date_inscription TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Méditations (indépendante des autres modules)
CREATE TABLE IF NOT EXISTS public.meditations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date_publication DATE NOT NULL UNIQUE,
    texte_biblique TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    auteur TEXT
);

-- RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meditations ENABLE ROW LEVEL SECURITY;

-- Politique : les membres lisent leur propre profil
CREATE POLICY "Membres : lecture propre profil"
ON public.members FOR SELECT
USING (auth.uid() = id);

-- Politique : les admins voient tous les membres
CREATE POLICY "Admins : lecture tous les membres"
ON public.members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = auth.uid() AND m.role = 'Admin'
  )
);

-- Méditations : lecture publique pour les membres connectés
CREATE POLICY "Membres connectés : lecture méditations"
ON public.meditations FOR SELECT
USING (auth.role() = 'authenticated');
