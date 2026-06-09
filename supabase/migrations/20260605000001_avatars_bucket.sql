-- Bucket public pour les photos de profil membres
insert into storage.buckets (id, name, public)
    values ('avatars', 'avatars', true)
    on conflict (id) do nothing;

-- Tout membre authentifié peut uploader dans son propre dossier
create policy "Membres peuvent uploader leur avatar."
    on storage.objects for insert
    with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- Les avatars sont publics (bucket public = lecture sans auth OK)
-- Mais on ajoute aussi une policy pour la cohérence RLS
create policy "Avatars lisibles par tous."
    on storage.objects for select
    using (bucket_id = 'avatars');

-- Le membre peut remplacer son propre avatar
create policy "Membres peuvent remplacer leur avatar."
    on storage.objects for update
    using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
