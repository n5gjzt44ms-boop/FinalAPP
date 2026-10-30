-- ============================================================
-- FICHIER 2 : supabase_schema.sql
-- Copiez-collez ce code dans :
-- Supabase → SQL Editor → New Query → Run
-- ============================================================

-- ---- UTILISATEURS ----------------------------------------
-- La table auth.users est gérée par Supabase automatiquement.
-- On crée une table "profils" liée pour stocker les infos métier.

create table public.profils (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  prenom      text,
  nom         text,
  role        text not null default 'aspirant', -- 'aspirant' | 'admin'
  promo       text,
  created_at  timestamptz default now()
);

-- Activer RLS (Row Level Security)
alter table public.profils enable row level security;

-- Un aspirant voit uniquement son propre profil
create policy "profil_select_own" on public.profils
  for select using (auth.uid() = id);

-- Un admin voit tous les profils
create policy "profil_select_admin" on public.profils
  for select using (
    exists (select 1 from public.profils p where p.id = auth.uid() and p.role = 'admin')
  );

-- Mise à jour du profil par son propriétaire
create policy "profil_update_own" on public.profils
  for update using (auth.uid() = id);

-- ---- RESSOURCES ------------------------------------------

create table public.ressources (
  id          uuid default gen_random_uuid() primary key,
  module_id   int not null,               -- 1 à 4
  titre       text not null,
  type        text not null,              -- 'pdf' | 'doc' | 'cad' | 'quiz'
  taille      text,                       -- ex: "3.1 Mo"
  storage_path text,                      -- chemin dans Supabase Storage
  url_externe text,                       -- si fichier externe
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now(),
  ordre       int default 0
);

alter table public.ressources enable row level security;

-- Tous les connectés voient les ressources
create policy "ressources_select_all" on public.ressources
  for select using (auth.role() = 'authenticated');

-- Seuls les admins créent / modifient / suppriment
create policy "ressources_write_admin" on public.ressources
  for all using (
    exists (select 1 from public.profils p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---- QUIZ ------------------------------------------------

create table public.quiz (
  id          uuid default gen_random_uuid() primary key,
  module_id   int not null,
  titre       text not null,
  filiere     text not null default 'tp',  -- 'tp' | 'agricole' | 'industriel' | 'commun'
  niveau      int not null default 1,      -- ordre de passage (1, 2, 3...)
  total_points int not null default 20,
  seuil       int not null default 14,
  actif       bool default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

alter table public.quiz enable row level security;

create policy "quiz_select_all" on public.quiz
  for select using (auth.role() = 'authenticated');

create policy "quiz_write_admin" on public.quiz
  for all using (
    exists (select 1 from public.profils p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---- QUESTIONS -------------------------------------------

create table public.questions (
  id          uuid default gen_random_uuid() primary key,
  quiz_id     uuid references public.quiz(id) on delete cascade,
  enonce      text not null,
  options     jsonb not null,   -- tableau de strings: ["option A", "option B", ...]
  bonne_reponse int not null,   -- index dans options (0-based)
  points      int not null default 2,
  competence  text,             -- ex: 'C2', 'S3'
  justification text,           -- explication pédagogique
  ordre       int default 0
);

alter table public.questions enable row level security;

-- Les aspirants voient les questions SAUF la bonne réponse
-- (la bonne réponse est filtrée côté frontend pendant le quiz)
create policy "questions_select_all" on public.questions
  for select using (auth.role() = 'authenticated');

create policy "questions_write_admin" on public.questions
  for all using (
    exists (select 1 from public.profils p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---- TENTATIVES DE QUIZ ----------------------------------

create table public.tentatives (
  id            uuid default gen_random_uuid() primary key,
  aspirant_id   uuid references auth.users(id) on delete cascade,
  quiz_id       uuid references public.quiz(id) on delete cascade,
  score         int not null,
  total_points  int not null default 20,
  valide        bool not null,            -- score >= seuil
  reponses      jsonb not null,           -- {question_id: index_repondu, ...}
  resultats_par_competence jsonb,         -- {C1: {score:4, total:4}, ...}
  completed_at  timestamptz default now(),
  -- ⭐ CONTRAINTE CLEF : une seule tentative par aspirant par quiz
  unique(aspirant_id, quiz_id)
);

alter table public.tentatives enable row level security;

-- Un aspirant voit ses propres tentatives
create policy "tentatives_select_own" on public.tentatives
  for select using (auth.uid() = aspirant_id);

-- Un admin voit toutes les tentatives
create policy "tentatives_select_admin" on public.tentatives
  for select using (
    exists (select 1 from public.profils p where p.id = auth.uid() and p.role = 'admin')
  );

-- Un aspirant insère sa propre tentative (une seule fois grâce au UNIQUE)
create policy "tentatives_insert_own" on public.tentatives
  for insert with check (auth.uid() = aspirant_id);

-- Seul un admin peut supprimer une tentative (pour débloquer exceptionnellement)
create policy "tentatives_delete_admin" on public.tentatives
  for delete using (
    exists (select 1 from public.profils p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---- RESSOURCES CONSULTÉES -------------------------------
-- Pour suivre la progression aspirant

create table public.consultations (
  id            uuid default gen_random_uuid() primary key,
  aspirant_id   uuid references auth.users(id) on delete cascade,
  ressource_id  uuid references public.ressources(id) on delete cascade,
  consulted_at  timestamptz default now(),
  unique(aspirant_id, ressource_id)
);

alter table public.consultations enable row level security;

create policy "consultations_own" on public.consultations
  for all using (auth.uid() = aspirant_id);

create policy "consultations_admin" on public.consultations
  for select using (
    exists (select 1 from public.profils p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---- TOKENS ADMIN ----------------------------------------
-- Pour les liens d'invitation admin

create table public.admin_tokens (
  token       text primary key default gen_random_uuid()::text,
  created_by  uuid references auth.users(id),
  used_by     uuid references auth.users(id),
  used_at     timestamptz,
  expires_at  timestamptz default (now() + interval '7 days'),
  created_at  timestamptz default now()
);

alter table public.admin_tokens enable row level security;

create policy "admin_tokens_admin" on public.admin_tokens
  for all using (
    exists (select 1 from public.profils p where p.id = auth.uid() and p.role = 'admin')
  );

-- ---- TRIGGER : créer profil automatiquement à l'inscription

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profils (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'aspirant')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- STORAGE : bucket pour les fichiers de cours ----------
-- À créer dans Supabase → Storage → New Bucket
-- Nom : "ressources" — Public : false (accès authentifié uniquement)
-- Exécutez ensuite :

insert into storage.buckets (id, name, public) values ('ressources', 'ressources', false);

create policy "ressources_storage_read" on storage.objects
  for select using (bucket_id = 'ressources' and auth.role() = 'authenticated');

create policy "ressources_storage_write" on storage.objects
  for insert with check (
    bucket_id = 'ressources' and
    exists (select 1 from public.profils p where p.id = auth.uid() and p.role = 'admin')
  );
