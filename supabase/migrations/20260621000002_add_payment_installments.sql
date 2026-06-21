-- =============================================================================
-- PROPULSION — MIGRATION: PAIEMENTS EN TRANCHES
-- =============================================================================

-- Table de suivi des paiements partiels
CREATE TABLE IF NOT EXISTS public.payment_installments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    tier_target text NOT NULL CHECK (tier_target IN ('Pro', 'Élite')),
    total_amount numeric(12,2) NOT NULL,
    amount_paid numeric(12,2) NOT NULL DEFAULT 0,
    deadline timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'En cours' 
        CHECK (status IN ('En cours', 'Soldé', 'En retard', 'Annulé')),
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_installments_member ON public.payment_installments(member_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON public.payment_installments(status);

-- RLS
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "installments_own_all" ON public.payment_installments 
    FOR ALL USING (auth.uid() = member_id);

CREATE POLICY "installments_admin_all" ON public.payment_installments 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = auth.uid() AND m.role IN ('Admin', 'Modérateur')));

-- Lier les paiements partiels aux tranches
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS installment_id uuid REFERENCES public.payment_installments(id) ON DELETE SET NULL;
