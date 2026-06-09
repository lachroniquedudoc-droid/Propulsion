-- =============================================================================
-- MIGRATION: MEMBRES — POLITIQUES RLS MANQUANTES
-- Date: 2026-06-06
-- Description: Ajoute les politiques permettant à chaque membre de lire,
--              créer et mettre à jour sa propre ligne dans public.members.
--              Sans ces politiques, l'onboarding échoue avec des erreurs RLS.
--              Le trigger enforce_member_fields_protection protège les champs
--              sensibles (role, status, unique_id) côté serveur.
-- =============================================================================

-- Lecture : un membre peut toujours voir sa propre ligne (dashboard, profil)
DROP POLICY IF EXISTS "members_select_own" ON public.members;
CREATE POLICY "members_select_own" ON public.members
    FOR SELECT
    USING (auth.uid() = id);

-- Insertion : un membre peut créer sa propre ligne
-- (fallback si le trigger handle_new_auth_user n'a pas encore tourné)
DROP POLICY IF EXISTS "members_insert_own" ON public.members;
CREATE POLICY "members_insert_own" ON public.members
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Mise à jour : un membre peut modifier sa propre ligne
-- Le trigger enforce_member_fields_protection bloque role/status/unique_id
DROP POLICY IF EXISTS "members_update_own" ON public.members;
CREATE POLICY "members_update_own" ON public.members
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
