-- Migration 004 : Notifications Push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    subscription_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_member_subscription UNIQUE (member_id, subscription_json)
);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Membres : lecture/écriture de leurs propres abonnements"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = member_id)
WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Admins : lecture de tous les abonnements"
ON public.push_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = auth.uid() AND m.role = 'Admin'
  )
);
