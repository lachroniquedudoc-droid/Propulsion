-- ==========================================
-- PROPULSION PLATFORM BDD SCHEMA ADDITIONS (PHASE 7)
-- Database: PostgreSQL (Supabase)
-- Author: Gamaliel TANKEU (UX/UI & Senior DB Architect)
-- Date: June 2026
-- ==========================================

-- 1. Table des messages privés membre-à-membre
create table if not exists public.private_messages (
    id uuid default gen_random_uuid() primary key,
    sender_id uuid references public.members on delete cascade not null,
    receiver_id uuid references public.members on delete cascade not null,
    content text not null,
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habiliter RLS pour private_messages
alter table public.private_messages enable row level security;

-- Politiques RLS pour private_messages
create policy "Les membres lisent les messages qu'ils envoient ou reçoivent."
    on public.private_messages for select
    using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Les membres envoient des messages privés."
    on public.private_messages for insert
    with check (auth.uid() = sender_id);

-- 2. Table des notifications des membres
create table if not exists public.member_notifications (
    id uuid default gen_random_uuid() primary key,
    member_id uuid references public.members on delete cascade not null,
    title text not null,
    content text not null,
    category text not null check (category in ('Finance', 'Social', 'Système', 'Événement')),
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habiliter RLS pour member_notifications
alter table public.member_notifications enable row level security;

-- Politiques RLS pour member_notifications
create policy "Les membres gèrent leurs propres notifications."
    on public.member_notifications for all
    using (auth.uid() = member_id);
