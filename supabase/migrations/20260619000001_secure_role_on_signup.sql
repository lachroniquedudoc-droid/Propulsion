-- =============================================================================
-- SÉCURITÉ : Empêcher l'auto-attribution d'un rôle Admin/Modérateur à l'inscription
-- Un utilisateur ne peut jamais s'auto-assigner Admin ou Modérateur via l'API.
-- Seuls Standard, Pro, Élite sont acceptés depuis les métadonnées de signup.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_role text;
BEGIN
  -- N'accepter que Standard / Pro / Élite depuis les métadonnées de signup.
  -- Tout autre rôle (Admin, Modérateur, ou valeur inconnue) est forcé à Standard.
  v_role := CASE
    WHEN new.raw_user_meta_data->>'role' IN ('Standard', 'Pro', 'Élite')
    THEN new.raw_user_meta_data->>'role'
    ELSE 'Standard'
  END;

  INSERT INTO public.members (
    id,
    first_name,
    last_name,
    whatsapp,
    role,
    status
  ) VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'Membre'),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    v_role,
    'En attente de paiement'
  );

  RETURN new;
END;
$$;
