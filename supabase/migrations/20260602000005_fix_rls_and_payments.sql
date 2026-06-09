-- =============================================================================
-- PATCH — Correctifs RLS et contraintes de paiement
-- Date: 2026-06-05
-- =============================================================================

-- 1. Politique INSERT manquante sur public.members
--    Sans elle, l'upsert client échoue si le trigger n'a pas encore tourné.
drop policy if exists "Les membres peuvent créer leur propre profil." on public.members;
create policy "Les membres peuvent créer leur propre profil."
    on public.members for insert
    with check (auth.uid() = id);


-- 2. Élargissement du check constraint sur payments.method
--    Les méthodes Africa (Airtel, M-Pesa, Moov) manquaient dans la liste initiale.
alter table public.payments
    drop constraint if exists payments_method_check;

alter table public.payments
    add constraint payments_method_check
    check (method in (
        'MTN MoMo',
        'Orange Money',
        'Wave',
        'Airtel Money',
        'M-Pesa',
        'Moov Money',
        'Stripe',
        'Virement'
    ));


-- 3. Bucket Supabase Storage pour les preuves de paiement (si pas déjà créé)
insert into storage.buckets (id, name, public)
    values ('payment-proofs', 'payment-proofs', false)
    on conflict (id) do nothing;

-- Politique lecture/écriture du bucket — membres authentifiés uniquement
drop policy if exists "Membres peuvent uploader leurs preuves." on storage.objects;
create policy "Membres peuvent uploader leurs preuves."
    on storage.objects for insert
    with check (
        bucket_id = 'payment-proofs'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

drop policy if exists "Membres voient leurs propres preuves." on storage.objects;
create policy "Membres voient leurs propres preuves."
    on storage.objects for select
    using (
        bucket_id = 'payment-proofs'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

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
