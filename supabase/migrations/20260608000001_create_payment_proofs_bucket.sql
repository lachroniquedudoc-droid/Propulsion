-- =============================================================================
-- Création du bucket payment-proofs (si absent) + policies d'accès admin
-- =============================================================================

insert into storage.buckets (id, name, public)
  values ('payment-proofs', 'payment-proofs', false)
  on conflict (id) do nothing;

-- Membres : uploader leurs propres preuves
drop policy if exists "Membres peuvent uploader leurs preuves." on storage.objects;
create policy "Membres peuvent uploader leurs preuves."
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Membres : lire leurs propres preuves
drop policy if exists "Membres voient leurs propres preuves." on storage.objects;
create policy "Membres voient leurs propres preuves."
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins : lire toutes les preuves (nécessaire pour createSignedUrl)
drop policy if exists "Admins voient toutes les preuves." on storage.objects;
create policy "Admins voient toutes les preuves."
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.members m
      where m.id = auth.uid()
      and m.role in ('Admin', 'Modérateur')
    )
  );
