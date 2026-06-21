-- Migration 006 : Commissions de service pour les retraites
-- À exécuter dans : Supabase SQL Editor

-- 1. Mettre à jour la contrainte CHECK de commission dans la table registrations
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_commission_check;

ALTER TABLE public.registrations ADD CONSTRAINT registrations_commission_check 
  CHECK (commission IN ('Accueil', 'Logistique', 'Intercession', 'Liturgie', 'Protocole', 'Sante', 'Decoration', 'Animation'));

-- 2. Ajouter le champ commission à la table members pour identifier la commission d'un Responsable
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS commission TEXT;
