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
BEGIN
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
    CASE
      WHEN new.raw_user_meta_data->>'role' IN ('Standard', 'Pro', 'Élite')
      THEN new.raw_user_meta_data->>'role'
      ELSE 'Standard'
    END,
    'En attente de paiement'
  );
  RETURN new;
END;
$$;
