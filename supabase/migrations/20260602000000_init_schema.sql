-- ==========================================
-- PROPULSION PLATFORM BDD SCHEMA
-- Database: PostgreSQL (Supabase)
-- Author: Gamaliel TANKEU (UX/UI & Senior DB Architect)
-- Date: June 2026
-- ==========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Sequence for custom Propulsion unique IDs
create sequence if not exists member_seq start 1000;

-- 1. Table des Membres (Profils utilisateurs liés à Supabase Auth)
create table if not exists public.members (
    id uuid references auth.users on delete cascade primary key,
    first_name text not null,
    last_name text not null,
    whatsapp text not null,
    role text not null default 'Standard' check (role in ('Standard', 'Pro', 'Élite', 'Modérateur', 'Admin')),
    status text not null default 'En attente de paiement' check (status in (
        'Actif', 'En attente de paiement', 'Paiement à valider', 'Expiré', 
        'Suspendu', 'Renouvellement en attente', 'Gratuit exceptionnel', 'Invité', 'Ancien membre'
    )),
    unique_id text unique,
    city text,
    sector text,
    company text,
    bio text,
    avatar_url text,
    is_private boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Table des Abonnements / Adhésions
create table if not exists public.subscriptions (
    id uuid default gen_random_uuid() primary key,
    member_id uuid references public.members on delete cascade not null,
    tier text not null check (tier in ('Standard', 'Pro', 'Élite')),
    start_date timestamp with time zone not null,
    end_date timestamp with time zone not null,
    status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Table des Paiements (Preuves et captures pour validation manuelle ou stripe)
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    member_id uuid references public.members on delete cascade not null,
    method text not null check (method in ('MTN MoMo', 'Orange Money', 'Wave', 'Stripe', 'Virement')),
    sender_info text not null,
    amount numeric(12, 2) not null,
    proof_url text, -- capture d'écran stockée dans Supabase Storage
    status text not null default 'En attente' check (status in ('En attente', 'Validé', 'Rejeté')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Table des Masterclasses / Replays vidéos
create table if not exists public.masterclasses (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    youtube_id text not null, -- ID vidéo youtube non répertorié
    category text not null check (category in ('Vente', 'Investissement', 'Négociation', 'Croissance', 'Stratégie', 'Leadership')),
    tier_required text not null default 'Standard' check (tier_required in ('Standard', 'Pro', 'Élite')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Table de Suivi de Progression (Lecture vidéo)
create table if not exists public.content_progress (
    member_id uuid references public.members on delete cascade not null,
    masterclass_id uuid references public.masterclasses on delete cascade not null,
    seconds_watched integer default 0 not null,
    completed boolean default false not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (member_id, masterclass_id)
);

-- ==========================================
-- TRIGGERS / DÉCLENCHEURS AUTOMATIQUES
-- ==========================================

-- Déclencheur : Générer automatiquement un identifiant Propulsion unique lors de la création
create or replace function public.generate_propulsion_id()
returns trigger 
language plpgsql 
security definer 
set search_path = public, extensions
as $$
declare
    role_code text;
    seq_val integer;
begin
    if new.unique_id is null then
        role_code := case new.role
            when 'Standard' then 'STD'
            when 'Pro' then 'PRO'
            when 'Élite' then 'ELT'
            else 'ADM'
        end;
        select nextval('member_seq') into seq_val;
        new.unique_id := 'PROP-' || role_code || '-2026-' || to_char(seq_val, 'FM0000');
    end if;
    return new;
end;
$$;

create trigger tr_generate_propulsion_id
before insert on public.members
for each row execute function public.generate_propulsion_id();


-- Déclencheur : Lier la création de Supabase Auth à notre table public.members
create or replace function public.handle_new_auth_user()
returns trigger 
language plpgsql 
security definer 
set search_path = public, extensions
as $$
begin
    insert into public.members (
        id,
        first_name,
        last_name,
        whatsapp,
        role,
        status
    )
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'first_name', 'Membre'),
        coalesce(new.raw_user_meta_data->>'last_name', ''),
        coalesce(new.raw_user_meta_data->>'whatsapp', ''),
        coalesce(new.raw_user_meta_data->>'role', 'Standard'),
        'En attente de paiement'
    );
    return new;
end;
$$;

create trigger tr_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();


-- ==========================================
-- ROW LEVEL SECURITY (RLS) - SÉCURITÉ DE HIERARCHIE DES NIVEAUX
-- ==========================================

alter table public.members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.masterclasses enable row level security;
alter table public.content_progress enable row level security;

-- Helper function pour déterminer le poids d'un rôle pour la hiérarchie cumulative
create or replace function public.get_role_weight(user_role text)
returns integer as $$
begin
    return case user_role
        when 'Standard' then 1
        when 'Pro' then 2
        when 'Élite' then 3
        when 'Modérateur' then 4
        when 'Admin' then 5
        else 0
    end;
end;
$$ language plpgsql security definer;

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

-- 1. Politiques pour MEMBERS
create policy "Les membres peuvent lire leur propre profil."
    on public.members for select
    using (auth.uid() = id);

create policy "Les membres peuvent modifier leur propre profil."
    on public.members for update
    using (auth.uid() = id);

create policy "Les membres Pro/Élite peuvent consulter l'annuaire public."
    on public.members for select
    using (
        public.get_my_role() in ('Pro', 'Élite', 'Modérateur', 'Admin') 
        and is_private = false
    );

create policy "Les Admins ont tous les droits sur les membres."
    on public.members for all
    using (
        public.get_my_role() = 'Admin'
    );

-- 2. Politiques pour MASTERCLASSES (Hiérarchie d'accès)
create policy "Lecture des masterclass selon le niveau d'adhésion."
    on public.masterclasses for select
    using (
        exists (
            select 1 from public.members m
            where m.id = auth.uid()
            and (
                m.role = 'Admin' or
                m.role = 'Modérateur' or
                m.status = 'Actif' or
                m.status = 'Gratuit exceptionnel' or
                m.status = 'Invité'
            )
            and public.get_role_weight(m.role) >= public.get_role_weight(masterclasses.tier_required)
        )
    );

create policy "Les Admins/Modérateurs gèrent les masterclasses."
    on public.masterclasses for all
    using (
        exists (
            select 1 from public.members m 
            where m.id = auth.uid() 
            and m.role in ('Admin', 'Modérateur')
        )
    );

-- 3. Politiques pour PAYMENTS
create policy "Les membres gèrent leurs propres paiements."
    on public.payments for all
    using (auth.uid() = member_id);

create policy "Les Admins/Modérateurs voient tous les paiements."
    on public.payments for select
    using (
        exists (
            select 1 from public.members m 
            where m.id = auth.uid() 
            and m.role in ('Admin', 'Modérateur')
        )
    );

-- 4. Politiques pour CONTENT PROGRESS
create policy "Les membres gèrent leur propre progression de lecture."
    on public.content_progress for all
    using (auth.uid() = member_id);
