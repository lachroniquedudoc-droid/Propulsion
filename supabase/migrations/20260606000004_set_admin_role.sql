-- Passer betterzapp@gmail.com en Admin
UPDATE public.members
SET role   = 'Admin',
    status = 'Actif'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'betterzapp@gmail.com' LIMIT 1
);
