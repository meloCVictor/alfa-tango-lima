-- ==========================================================
-- Curso Alvorada — schema da área logada (rodar no SQL Editor do Supabase)
-- ==========================================================

-- Perfil de cada aluno, ligado ao usuário de autenticação do Supabase
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    nome text,
    email text,
    telefone text,
    cargo text,
    liberado boolean not null default false,
    is_admin boolean not null default false,
    created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists is_admin boolean not null default false;

alter table public.profiles enable row level security;

-- Cada aluno só pode ver/editar o próprio perfil
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
    for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id);

-- Função auxiliar (security definer) para checar se o usuário logado é admin, sem recursão de RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
    select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Admin pode ver e liberar/editar o acesso de qualquer aluno
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
    for select using (public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
    for update using (public.is_admin());

-- Cria automaticamente uma linha em profiles quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, nome, email, telefone, cargo)
    values (
        new.id,
        new.raw_user_meta_data ->> 'nome',
        new.email,
        new.raw_user_meta_data ->> 'telefone',
        new.raw_user_meta_data ->> 'cargo'
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Módulos do curso (links do Google Drive), visíveis só para alunos liberados
create table if not exists public.modulos (
    id serial primary key,
    titulo text not null,
    descricao text,
    link text not null,
    ordem int not null default 0
);

alter table public.modulos enable row level security;

drop policy if exists "modulos_select_liberados" on public.modulos;
create policy "modulos_select_liberados" on public.modulos
    for select using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.liberado = true
        )
    );

drop policy if exists "modulos_select_admin" on public.modulos;
create policy "modulos_select_admin" on public.modulos
    for select using (public.is_admin());

-- Exemplo: cadastre os módulos reais depois de criar a tabela
-- insert into public.modulos (titulo, descricao, link, ordem) values
--   ('Módulo 1 - Resolução de Questões I', 'Aula gravada', 'https://drive.google.com/...', 1),
--   ('Módulo 2 - Resolução de Questões II', 'Aula gravada', 'https://drive.google.com/...', 2),
--   ('Módulo 3 - Resolução de Questões III', 'Aula gravada', 'https://drive.google.com/...', 3),
--   ('Aula ao vivo - Revisão Geral', 'Gravação da live', 'https://drive.google.com/...', 4);

-- ==========================================================
-- Passo único e manual: torne sua própria conta admin depois de se cadastrar
-- normalmente pelo formulário do site (troque o e-mail abaixo pelo seu):
--
-- update public.profiles set is_admin = true where email = 'seu-email@gmail.com';
--
-- Depois disso, acesse /admin.html logado com essa conta para liberar alunos.
-- ==========================================================
