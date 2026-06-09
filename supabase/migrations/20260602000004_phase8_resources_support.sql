-- ==========================================
-- PROPULSION PLATFORM BDD SCHEMA ADDITIONS (PHASE 8)
-- Database: PostgreSQL (Supabase)
-- Author: Gamaliel TANKEU (UX/UI & Senior DB Architect)
-- Date: June 2026
-- ==========================================

-- 1. Table des ressources de la bibliothèque (PDF, guides, templates)
create table if not exists public.resources (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text not null,
    category text not null,
    file_url text not null,
    tier_required text not null check (tier_required in ('Standard', 'Pro', 'Élite')),
    download_count integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habiliter RLS pour resources
alter table public.resources enable row level security;

-- Politiques RLS pour resources
create policy "Les membres authentifiés lisent toutes les fiches de ressources."
    on public.resources for select
    using (auth.role() = 'authenticated');

-- 2. Table des tickets de support client / helpdesk
create table if not exists public.support_tickets (
    id uuid default gen_random_uuid() primary key,
    member_id uuid references public.members on delete cascade not null,
    category text not null check (category in ('Facturation', 'Technique', 'Affaires', 'Autre')),
    subject text not null,
    description text not null,
    priority text not null check (priority in ('Faible', 'Moyen', 'Urgent')),
    status text not null check (status in ('Nouveau', 'En cours', 'Résolu')) default 'Nouveau',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habiliter RLS pour support_tickets
alter table public.support_tickets enable row level security;

-- Politiques RLS pour support_tickets
create policy "Les membres gèrent leurs propres tickets de support."
    on public.support_tickets for all
    using (
        auth.uid() = member_id or 
        exists (
            select 1 from public.members 
            where id = auth.uid() and role in ('Admin', 'Modérateur')
        )
    );

-- 3. Table des messages des discussions de tickets de support
create table if not exists public.support_messages (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references public.support_tickets on delete cascade not null,
    sender_type text not null check (sender_type in ('membre', 'support')),
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habiliter RLS pour support_messages
alter table public.support_messages enable row level security;

-- Politiques RLS pour support_messages
create policy "Les membres et le support lisent et insèrent des messages s'ils ont accès au ticket."
    on public.support_messages for all
    using (
        exists (
            select 1 from public.support_tickets t
            where t.id = ticket_id 
            and (
                t.member_id = auth.uid() or 
                exists (
                    select 1 from public.members m 
                    where m.id = auth.uid() and m.role in ('Admin', 'Modérateur')
                )
            )
        )
    );
