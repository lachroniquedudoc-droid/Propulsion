-- ==========================================
-- PROPULSION PLATFORM BDD SCHEMA ADDITIONS (PHASE 3)
-- Database: PostgreSQL (Supabase)
-- Author: Gamaliel TANKEU (UX/UI & Senior DB Architect)
-- Date: June 2026
-- ==========================================

-- 1. Ajout de la colonne de parrainage dans la table des membres
alter table public.members 
add column if not exists referred_by uuid references public.members(id) on delete set null;

-- 2. Table des soumissions de challenges hebdomadaires
create table if not exists public.challenge_submissions (
    id uuid default gen_random_uuid() primary key,
    member_id uuid references public.members on delete cascade not null,
    challenge_week integer not null,
    deliverable_url text not null,
    comments text,
    points_awarded integer default 0 not null,
    status text not null default 'En cours' check (status in ('En cours', 'Validé', 'Rejeté')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habiliter RLS pour la sécurité
alter table public.challenge_submissions enable row level security;

-- 3. Politiques de sécurité RLS pour challenge_submissions
create policy "Les membres gèrent leurs propres livrables de challenge."
    on public.challenge_submissions for all
    using (auth.uid() = member_id);

create policy "Les Admins/Modérateurs voient et notent tous les challenges."
    on public.challenge_submissions for all
    using (
        exists (
            select 1 from public.members m 
            where m.id = auth.uid() 
            and m.role in ('Admin', 'Modérateur')
        )
    );
