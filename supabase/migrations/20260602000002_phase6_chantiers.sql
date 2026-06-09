-- ==========================================
-- PROPULSION PLATFORM BDD SCHEMA ADDITIONS (PHASE 6)
-- Database: PostgreSQL (Supabase)
-- Author: Gamaliel TANKEU (UX/UI & Senior DB Architect)
-- Date: June 2026
-- ==========================================

-- 1. Table des événements
create table if not exists public.events (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text not null,
    event_date timestamp with time zone not null,
    event_type text not null check (event_type in ('Physique', 'En ligne')),
    location text not null,
    price integer default 0 not null,
    spots_max integer,
    tier_required text not null default 'Standard' check (tier_required in ('Standard', 'Pro', 'Élite')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habiliter RLS pour events
alter table public.events enable row level security;

-- Politiques RLS pour events
create policy "Tous les membres actifs voient les événements."
    on public.events for select
    using (true);

create policy "Seuls les Admins gèrent les événements."
    on public.events for all
    using (
        exists (
            select 1 from public.members m 
            where m.id = auth.uid() 
            and m.role in ('Admin', 'Modérateur')
        )
    );

-- 2. Table des inscriptions aux événements
create table if not exists public.event_registrations (
    id uuid default gen_random_uuid() primary key,
    event_id uuid references public.events on delete cascade not null,
    member_id uuid references public.members on delete cascade not null,
    ticket_code text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(event_id, member_id)
);

-- Habiliter RLS pour event_registrations
alter table public.event_registrations enable row level security;

-- Politiques RLS pour event_registrations
create policy "Les membres voient et créent leurs propres inscriptions."
    on public.event_registrations for all
    using (auth.uid() = member_id);

create policy "Les Admins voient toutes les inscriptions aux événements."
    on public.event_registrations for select
    using (
        exists (
            select 1 from public.members m 
            where m.id = auth.uid() 
            and m.role in ('Admin', 'Modérateur')
        )
    );

-- 3. Table du fil d'activité social (Social Network)
create table if not exists public.social_posts (
    id uuid default gen_random_uuid() primary key,
    author_id uuid references public.members on delete cascade not null,
    title text not null,
    content text not null,
    category text not null check (category in ('Business', 'Opportunités', 'Entraide', 'Annonces')),
    likes_count integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habiliter RLS pour social_posts
alter table public.social_posts enable row level security;

-- Politiques RLS pour social_posts
create policy "Tous les membres lisent le fil d'actualité."
    on public.social_posts for select
    using (true);

create policy "Tous les membres actifs créent des posts."
    on public.social_posts for insert
    with check (auth.uid() = author_id);

create policy "Les auteurs modifient ou suppriment leurs posts."
    on public.social_posts for update
    using (auth.uid() = author_id);

create policy "Les Admins modèrent les posts."
    on public.social_posts for all
    using (
        exists (
            select 1 from public.members m 
            where m.id = auth.uid() 
            and m.role in ('Admin', 'Modérateur')
        )
    );

-- 4. Table des commentaires sociaux
create table if not exists public.social_comments (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references public.social_posts on delete cascade not null,
    author_id uuid references public.members on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habiliter RLS pour social_comments
alter table public.social_comments enable row level security;

-- Politiques RLS pour social_comments
create policy "Tous les membres voient les commentaires."
    on public.social_comments for select
    using (true);

create policy "Tous les membres actifs commentent."
    on public.social_comments for insert
    with check (auth.uid() = author_id);

-- 5. Table du Marché Interne / Offres de Services
create table if not exists public.marketplace_offers (
    id uuid default gen_random_uuid() primary key,
    author_id uuid references public.members on delete cascade not null,
    title text not null,
    description text not null,
    price text not null,
    category text not null check (category in ('Prestation', 'Produit', 'Formation', 'Autre')),
    whatsapp_contact text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habiliter RLS pour marketplace_offers
alter table public.marketplace_offers enable row level security;

-- Politiques RLS pour marketplace_offers
create policy "Tous les membres voient les offres du marché."
    on public.marketplace_offers for select
    using (true);

create policy "Seuls les membres Pro et Élite créent des offres."
    on public.marketplace_offers for insert
    with check (
        auth.uid() = author_id 
        and exists (
            select 1 from public.members m 
            where m.id = auth.uid() 
            and m.role in ('Pro', 'Élite', 'Admin', 'Modérateur')
        )
    );

create policy "Les auteurs modifient leurs offres."
    on public.marketplace_offers for update
    using (auth.uid() = author_id);
