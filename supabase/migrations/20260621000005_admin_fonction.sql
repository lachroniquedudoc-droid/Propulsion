-- =============================================================================
-- RÔLES ADMIN DISTINCTS : colonne fonction sur membres admin/modérateur
-- Valeurs suggérées (non contraintes) : Commercial, Responsable pays,
-- Responsable contenu, Responsable support — extensible sans migration
-- =============================================================================

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS fonction text;

-- RLS : un admin peut mettre à jour sa propre fonction ou celle de n'importe qui
-- (couvert par la policy UPDATE existante sur Admin)
