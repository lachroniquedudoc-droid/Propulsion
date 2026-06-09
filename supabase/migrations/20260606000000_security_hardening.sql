-- =============================================================================
-- MIGRATION: SECURITY HARDENING
-- Date: 2026-06-06
-- Description: Élimination de la récursion RLS, protection du rôle et statut 
--              des membres via trigger, et sécurisation des paiements contre l'auto-validation.
-- =============================================================================

-- 1. Nettoyage des anciennes politiques sur public.members qui causent la récursion
DROP POLICY IF EXISTS "Les membres Pro/Élite peuvent consulter l'annuaire public." ON public.members;
DROP POLICY IF EXISTS "Les Admins ont tous les droits sur les membres." ON public.members;
DROP POLICY IF EXISTS "members_select_directory" ON public.members;
DROP POLICY IF EXISTS "members_admin_all" ON public.members;

-- 2. Création de la fonction utilitaire sans récursion avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT role FROM public.members WHERE id = auth.uid());
END;
$$;

-- 3. Recréation des politiques de sécurité sur public.members
DROP POLICY IF EXISTS "members_select_directory" ON public.members;
DROP POLICY IF EXISTS "members_admin_all"        ON public.members;

CREATE POLICY "members_select_directory" ON public.members
    FOR SELECT
    USING (
        public.get_my_role() IN ('Pro', 'Élite', 'Modérateur', 'Admin')
        AND is_private = false
    );

CREATE POLICY "members_admin_all" ON public.members
    FOR ALL
    USING (
        public.get_my_role() = 'Admin'
    );

-- 4. Protection des colonnes sensibles (role, status, unique_id) de public.members par Trigger
CREATE OR REPLACE FUNCTION public.enforce_member_fields_protection()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Si l'utilisateur n'est pas Admin
    IF public.get_my_role() IS DISTINCT FROM 'Admin' THEN
        -- Interdire le changement de rôle
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Sécurité : Vous ne pouvez pas modifier votre propre rôle.';
        END IF;
        
        -- Interdire le changement de statut (sauf de "En attente de paiement" à "Paiement à valider")
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            IF OLD.status = 'En attente de paiement' AND NEW.status = 'Paiement à valider' THEN
                -- Autorisé lors de l'envoi de la preuve
            ELSE
                RAISE EXCEPTION 'Sécurité : Vous ne pouvez pas modifier votre propre statut.';
            END IF;
        END IF;

        -- Interdire le changement de unique_id
        IF NEW.unique_id IS DISTINCT FROM OLD.unique_id THEN
            RAISE EXCEPTION 'Sécurité : Vous ne pouvez pas modifier votre identifiant unique.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_member_fields_protection ON public.members;
CREATE TRIGGER tr_enforce_member_fields_protection
    BEFORE UPDATE ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_member_fields_protection();

-- 5. Sécurisation de la table public.payments (Anti-Auto-Validation)
DROP POLICY IF EXISTS "payments_own_all"     ON public.payments;
DROP POLICY IF EXISTS "payments_admin_select" ON public.payments;
DROP POLICY IF EXISTS "payments_select_own"  ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own"  ON public.payments;
DROP POLICY IF EXISTS "payments_admin_all"   ON public.payments;

-- Lecture : Les membres voient leurs propres paiements
CREATE POLICY "payments_select_own" ON public.payments
    FOR SELECT
    USING (auth.uid() = member_id);

-- Insertion : Les membres peuvent insérer uniquement en statut "En attente" pour eux-mêmes
CREATE POLICY "payments_insert_own" ON public.payments
    FOR INSERT
    WITH CHECK (auth.uid() = member_id AND status = 'En attente');

-- Tout : Les admins et modérateurs peuvent tout faire (valider, rejeter, lister) sur tous les paiements
CREATE POLICY "payments_admin_all" ON public.payments
    FOR ALL
    USING (public.get_my_role() IN ('Admin', 'Modérateur'));

-- 6. Mise à jour de la politique d'écriture sur public.system_settings
DROP POLICY IF EXISTS "Allow write access to system_settings" ON public.system_settings;
CREATE POLICY "Allow write access to system_settings" 
    ON public.system_settings 
    FOR ALL 
    USING (public.get_my_role() IN ('Admin', 'Modérateur'));
