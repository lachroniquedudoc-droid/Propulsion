-- =============================================================================
-- PROPULSION — SCHÉMA COMPLET CONSOLIDÉ
-- À appliquer en une seule fois dans le SQL Editor de Supabase
-- Toutes migrations 000 à 005 + corrections incluses
-- =============================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- Séquence pour les IDs Propulsion
create sequence if not exists member_seq start 1000;


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.members (
    id           uuid references auth.users on delete cascade primary key,
    first_name   text not null,
    last_name    text not null,
    whatsapp     text not null,
    role         text not null default 'Standard'
                     check (role in ('Standard','Pro','Élite','Modérateur','Admin')),
    status       text not null default 'En attente de paiement'
                     check (status in (
                         'Actif','En attente de paiement','Paiement à valider','Expiré',
                         'Suspendu','Renouvellement en attente','Gratuit exceptionnel','Invité','Ancien membre'
                     )),
    unique_id    text unique,
    city         text,
    sector       text,
    company      text,
    bio          text,
    avatar_url   text,
    referred_by  uuid references public.members(id) on delete set null,
    is_private   boolean not null default false,
    created_at   timestamptz default timezone('utc', now()) not null,
    updated_at   timestamptz default timezone('utc', now()) not null
);

create table if not exists public.subscriptions (
    id          uuid default gen_random_uuid() primary key,
    member_id   uuid references public.members on delete cascade not null,
    tier        text not null check (tier in ('Standard','Pro','Élite')),
    start_date  timestamptz not null,
    end_date    timestamptz not null,
    status      text not null default 'active' check (status in ('active','expired','cancelled')),
    created_at  timestamptz default timezone('utc', now()) not null
);

create table if not exists public.payments (
    id           uuid default gen_random_uuid() primary key,
    member_id    uuid references public.members on delete cascade not null,
    method       text not null check (method in (
                     'MTN MoMo','Orange Money','Wave',
                     'Airtel Money','M-Pesa','Moov Money',
                     'Stripe','Virement'
                 )),
    sender_info  text not null,
    amount       numeric(12,2) not null,
    proof_url    text,
    status       text not null default 'En attente'
                     check (status in ('En attente','Validé','Rejeté')),
    created_at   timestamptz default timezone('utc', now()) not null
);

create table if not exists public.masterclasses (
    id           uuid default gen_random_uuid() primary key,
    title        text not null,
    description  text,
    youtube_id   text not null,
    category     text not null check (category in ('Vente','Investissement','Négociation','Croissance','Stratégie','Leadership')),
    tier_required text not null default 'Standard' check (tier_required in ('Standard','Pro','Élite')),
    created_at   timestamptz default timezone('utc', now()) not null
);

create table if not exists public.content_progress (
    member_id      uuid references public.members on delete cascade not null,
    masterclass_id uuid references public.masterclasses on delete cascade not null,
    seconds_watched integer default 0 not null,
    completed       boolean default false not null,
    updated_at      timestamptz default timezone('utc', now()) not null,
    primary key (member_id, masterclass_id)
);

create table if not exists public.challenge_submissions (
    id               uuid default gen_random_uuid() primary key,
    member_id        uuid references public.members on delete cascade not null,
    challenge_week   integer not null,
    deliverable_url  text not null,
    comments         text,
    points_awarded   integer default 0 not null,
    status           text not null default 'En cours'
                         check (status in ('En cours','Validé','Rejeté')),
    created_at       timestamptz default timezone('utc', now()) not null,
    updated_at       timestamptz default timezone('utc', now()) not null
);

create table if not exists public.events (
    id            uuid default gen_random_uuid() primary key,
    title         text not null,
    description   text not null,
    event_date    timestamptz not null,
    event_type    text not null check (event_type in ('Physique','En ligne')),
    location      text not null,
    price         integer default 0 not null,
    spots_max     integer,
    tier_required text not null default 'Standard' check (tier_required in ('Standard','Pro','Élite')),
    created_at    timestamptz default timezone('utc', now()) not null
);

create table if not exists public.event_registrations (
    id           uuid default gen_random_uuid() primary key,
    event_id     uuid references public.events on delete cascade not null,
    member_id    uuid references public.members on delete cascade not null,
    ticket_code  text not null unique,
    created_at   timestamptz default timezone('utc', now()) not null,
    unique(event_id, member_id)
);

create table if not exists public.social_posts (
    id          uuid default gen_random_uuid() primary key,
    author_id   uuid references public.members on delete cascade not null,
    title       text not null default '',
    content     text not null,
    category    text not null check (category in ('Business','Opportunités','Entraide','Annonces')),
    likes_count integer default 0 not null,
    created_at  timestamptz default timezone('utc', now()) not null
);

create table if not exists public.social_comments (
    id         uuid default gen_random_uuid() primary key,
    post_id    uuid references public.social_posts on delete cascade not null,
    author_id  uuid references public.members on delete cascade not null,
    content    text not null,
    created_at timestamptz default timezone('utc', now()) not null
);

-- Note : la table s'appelle market_offers (nom utilisé dans le code)
create table if not exists public.market_offers (
    id               uuid default gen_random_uuid() primary key,
    author_id        uuid references public.members on delete cascade not null,
    title            text not null,
    description      text not null,
    price            text not null,
    category         text not null check (category in ('Prestation','Produit','Formation','Conseil','Autre')),
    whatsapp         text not null,
    created_at       timestamptz default timezone('utc', now()) not null
);

create table if not exists public.private_messages (
    id          uuid default gen_random_uuid() primary key,
    sender_id   uuid references public.members on delete cascade not null,
    receiver_id uuid references public.members on delete cascade not null,
    content     text not null,
    is_read     boolean default false not null,
    created_at  timestamptz default timezone('utc', now()) not null
);

create table if not exists public.member_notifications (
    id         uuid default gen_random_uuid() primary key,
    member_id  uuid references public.members on delete cascade not null,
    title      text not null,
    content    text not null,
    category   text not null check (category in ('Finance','Social','Système','Événement')),
    is_read    boolean default false not null,
    created_at timestamptz default timezone('utc', now()) not null
);

create table if not exists public.resources (
    id             uuid default gen_random_uuid() primary key,
    title          text not null,
    description    text not null,
    category       text not null,
    file_url       text not null,
    tier_required  text not null check (tier_required in ('Standard','Pro','Élite')),
    download_count integer default 0 not null,
    created_at     timestamptz default timezone('utc', now()) not null
);

create table if not exists public.support_tickets (
    id          uuid default gen_random_uuid() primary key,
    member_id   uuid references public.members on delete cascade not null,
    category    text not null check (category in ('Facturation','Technique','Affaires','Autre')),
    subject     text not null,
    description text not null,
    priority    text not null check (priority in ('Faible','Moyen','Urgent')),
    status      text not null default 'Nouveau' check (status in ('Nouveau','En cours','Résolu')),
    created_at  timestamptz default timezone('utc', now()) not null
);

create table if not exists public.support_messages (
    id          uuid default gen_random_uuid() primary key,
    ticket_id   uuid references public.support_tickets on delete cascade not null,
    sender_type text not null check (sender_type in ('membre','support')),
    content     text not null,
    created_at  timestamptz default timezone('utc', now()) not null
);


-- ─────────────────────────────────────────────────────────────────────────────
-- FONCTIONS & TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Génération de l'ID unique Propulsion
create or replace function public.generate_propulsion_id()
returns trigger 
language plpgsql 
security definer 
set search_path = public, extensions
as $$
declare
    role_code text;
    seq_val   integer;
begin
    if new.unique_id is null then
        role_code := case new.role
            when 'Standard' then 'STD'
            when 'Pro'      then 'PRO'
            when 'Élite'    then 'ELT'
            else 'ADM'
        end;
        select nextval('member_seq') into seq_val;
        new.unique_id := 'PROP-' || role_code || '-2026-' || to_char(seq_val, 'FM0000');
    end if;
    return new;
end;
$$;

drop trigger if exists tr_generate_propulsion_id on public.members;
create trigger tr_generate_propulsion_id
    before insert on public.members
    for each row execute function public.generate_propulsion_id();


-- Création automatique du profil membre lors de l'inscription Auth
create or replace function public.handle_new_auth_user()
returns trigger 
language plpgsql 
security definer 
set search_path = public, extensions
as $$
begin
    insert into public.members (id, first_name, last_name, whatsapp, role, status)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'first_name', 'Membre'),
        coalesce(new.raw_user_meta_data->>'last_name',  ''),
        coalesce(new.raw_user_meta_data->>'whatsapp',   ''),
        coalesce(new.raw_user_meta_data->>'role',       'Standard'),
        'En attente de paiement'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists tr_on_auth_user_created on auth.users;
create trigger tr_on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_auth_user();


-- Fonction utilitaire pour la hiérarchie des rôles
create or replace function public.get_role_weight(user_role text)
returns integer as $$
begin
    return case user_role
        when 'Standard'    then 1
        when 'Pro'         then 2
        when 'Élite'       then 3
        when 'Modérateur'  then 4
        when 'Admin'       then 5
        else 0
    end;
end;
$$ language plpgsql security definer;


-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.members              enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.payments             enable row level security;
alter table public.masterclasses        enable row level security;
alter table public.content_progress     enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.events               enable row level security;
alter table public.event_registrations  enable row level security;
alter table public.social_posts         enable row level security;
alter table public.social_comments      enable row level security;
alter table public.market_offers        enable row level security;
alter table public.private_messages     enable row level security;
alter table public.member_notifications enable row level security;
alter table public.resources            enable row level security;
alter table public.support_tickets      enable row level security;
alter table public.support_messages     enable row level security;


-- Helper function pour récupérer le rôle du membre connecté sans récursion
create or replace function public.get_my_role()
returns text 
language plpgsql 
security definer
set search_path = public
as $$
begin
    return (select role from public.members where id = auth.uid());
end;
$$;


-- MEMBERS
create policy "members_insert_own"   on public.members for insert with check (auth.uid() = id);
create policy "members_select_own"   on public.members for select using (auth.uid() = id);
create policy "members_update_own"   on public.members for update using (auth.uid() = id);
create policy "members_select_directory" on public.members for select
    using (public.get_my_role() in ('Pro','Élite','Modérateur','Admin') and is_private = false);
create policy "members_admin_all"    on public.members for all
    using (public.get_my_role() = 'Admin');

-- PAYMENTS
create policy "payments_own_all"     on public.payments for all using (auth.uid() = member_id);
create policy "payments_admin_select" on public.payments for select
    using (exists (select 1 from public.members m where m.id = auth.uid() and m.role in ('Admin','Modérateur')));

-- MASTERCLASSES
create policy "masterclasses_read"   on public.masterclasses for select
    using (exists (select 1 from public.members m where m.id = auth.uid()
        and (m.role in ('Admin','Modérateur') or m.status in ('Actif','Gratuit exceptionnel','Invité'))
        and public.get_role_weight(m.role) >= public.get_role_weight(masterclasses.tier_required)));
create policy "masterclasses_admin"  on public.masterclasses for all
    using (exists (select 1 from public.members m where m.id = auth.uid() and m.role in ('Admin','Modérateur')));

-- CONTENT PROGRESS
create policy "progress_own_all"     on public.content_progress for all using (auth.uid() = member_id);

-- CHALLENGE SUBMISSIONS
create policy "challenges_own_all"   on public.challenge_submissions for all using (auth.uid() = member_id);
create policy "challenges_admin"     on public.challenge_submissions for all
    using (exists (select 1 from public.members m where m.id = auth.uid() and m.role in ('Admin','Modérateur')));

-- EVENTS
create policy "events_read_all"      on public.events for select using (true);
create policy "events_admin"         on public.events for all
    using (exists (select 1 from public.members m where m.id = auth.uid() and m.role in ('Admin','Modérateur')));

-- EVENT REGISTRATIONS
create policy "registrations_own"    on public.event_registrations for all using (auth.uid() = member_id);
create policy "registrations_admin"  on public.event_registrations for select
    using (exists (select 1 from public.members m where m.id = auth.uid() and m.role in ('Admin','Modérateur')));

-- SOCIAL POSTS
create policy "posts_read_all"       on public.social_posts for select using (true);
create policy "posts_insert_own"     on public.social_posts for insert with check (auth.uid() = author_id);
create policy "posts_update_own"     on public.social_posts for update using (auth.uid() = author_id);
create policy "posts_admin"          on public.social_posts for all
    using (exists (select 1 from public.members m where m.id = auth.uid() and m.role in ('Admin','Modérateur')));

-- SOCIAL COMMENTS
create policy "comments_read_all"    on public.social_comments for select using (true);
create policy "comments_insert_own"  on public.social_comments for insert with check (auth.uid() = author_id);

-- MARKET OFFERS
create policy "offers_read_all"      on public.market_offers for select using (true);
create policy "offers_insert_pro"    on public.market_offers for insert
    with check (auth.uid() = author_id and
        exists (select 1 from public.members m where m.id = auth.uid() and m.role in ('Pro','Élite','Admin','Modérateur')));
create policy "offers_update_own"    on public.market_offers for update using (auth.uid() = author_id);

-- PRIVATE MESSAGES
create policy "messages_own"         on public.private_messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "messages_insert_own"  on public.private_messages for insert with check (auth.uid() = sender_id);

-- NOTIFICATIONS
create policy "notifications_own"    on public.member_notifications for all using (auth.uid() = member_id);

-- RESOURCES
create policy "resources_authenticated" on public.resources for select using (auth.role() = 'authenticated');

-- SUPPORT TICKETS
create policy "tickets_own_or_admin" on public.support_tickets for all
    using (auth.uid() = member_id or
        exists (select 1 from public.members where id = auth.uid() and role in ('Admin','Modérateur')));

-- SUPPORT MESSAGES
create policy "support_messages_access" on public.support_messages for all
    using (exists (select 1 from public.support_tickets t where t.id = ticket_id and
        (t.member_id = auth.uid() or
         exists (select 1 from public.members m where m.id = auth.uid() and m.role in ('Admin','Modérateur')))));


-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE — Bucket preuves de paiement
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
    values ('payment-proofs', 'payment-proofs', false)
    on conflict (id) do nothing;

drop policy if exists "storage_proofs_insert" on storage.objects;
create policy "storage_proofs_insert" on storage.objects for insert
    with check (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "storage_proofs_select_own" on storage.objects;
create policy "storage_proofs_select_own" on storage.objects for select
    using (bucket_id = 'payment-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "storage_proofs_select_admin" on storage.objects;
create policy "storage_proofs_select_admin" on storage.objects for select
    using (bucket_id = 'payment-proofs' and
        exists (select 1 from public.members m where m.id = auth.uid() and m.role in ('Admin','Modérateur')));
