-- =============================================================================
-- PROPULSION — MIGRATION: MODULE DE DISCIPLINE
-- =============================================================================

-- Table des actions disciplinaires
CREATE TABLE IF NOT EXISTS public.disciplinary_actions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    action_type text NOT NULL CHECK (action_type IN ('Avertissement', 'Suspension temporaire', 'Exclusion définitive')),
    reason text NOT NULL,
    admin_notes text,
    created_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_discipline_member ON public.disciplinary_actions(member_id);

-- RLS
ALTER TABLE public.disciplinary_actions ENABLE ROW LEVEL SECURITY;

-- Les membres voient leurs propres sanctions
CREATE POLICY "discipline_own_select" ON public.disciplinary_actions 
    FOR SELECT USING (auth.uid() = member_id);

-- Les admins gèrent tout
CREATE POLICY "discipline_admin_all" ON public.disciplinary_actions 
    FOR ALL USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = auth.uid() AND m.role IN ('Admin', 'Modérateur')));

-- Déclencheur pour suspendre automatiquement après 3 avertissements
CREATE OR REPLACE FUNCTION public.check_warnings_and_suspend()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    warning_count integer;
BEGIN
    IF NEW.action_type = 'Avertissement' THEN
        SELECT COUNT(*) INTO warning_count 
        FROM public.disciplinary_actions 
        WHERE member_id = NEW.member_id AND action_type = 'Avertissement';

        -- La nouvelle action est déjà comptée ou sera comptée (after insert),
        -- donc warning_count = 3 signifie qu'il vient de recevoir son 3e
        IF warning_count >= 3 THEN
            -- Mettre à jour le statut du membre
            UPDATE public.members 
            SET status = 'Suspendu'
            WHERE id = NEW.member_id;

            -- Ajouter une note automatique
            INSERT INTO public.disciplinary_actions (member_id, action_type, reason, created_by)
            VALUES (NEW.member_id, 'Suspension temporaire', 'Suspension automatique suite à 3 avertissements.', NEW.created_by);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_suspend_after_warnings ON public.disciplinary_actions;
CREATE TRIGGER tr_suspend_after_warnings
    AFTER INSERT ON public.disciplinary_actions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_warnings_and_suspend();
