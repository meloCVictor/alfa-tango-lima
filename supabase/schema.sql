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

-- Módulos do curso (links do Google Drive), visíveis só para alunos matriculados e liberados
create table if not exists public.modulos (
    id serial primary key,
    titulo text not null,
    descricao text,
    link text not null,
    ordem int not null default 0
);

-- Curso ao qual cada módulo pertence
create table if not exists public.cursos (
    id serial primary key,
    nome text not null,
    slug text not null unique,
    created_at timestamptz not null default now()
);

alter table public.modulos add column if not exists curso_id int references public.cursos (id);

alter table public.cursos enable row level security;

-- Qualquer aluno logado pode ver a lista de cursos (só os nomes, não dá acesso a nada sozinho)
drop policy if exists "cursos_select_authenticated" on public.cursos;
create policy "cursos_select_authenticated" on public.cursos
    for select using (auth.role() = 'authenticated');

-- Matrícula: liga um aluno a um curso específico e controla a liberação daquele curso
create table if not exists public.matriculas (
    id serial primary key,
    aluno_id uuid not null references public.profiles (id) on delete cascade,
    curso_id int not null references public.cursos (id) on delete cascade,
    liberado boolean not null default false,
    created_at timestamptz not null default now(),
    unique (aluno_id, curso_id)
);

alter table public.matriculas enable row level security;

-- Aluno só vê/cria a própria matrícula
drop policy if exists "matriculas_select_own" on public.matriculas;
create policy "matriculas_select_own" on public.matriculas
    for select using (auth.uid() = aluno_id);

drop policy if exists "matriculas_insert_own" on public.matriculas;
create policy "matriculas_insert_own" on public.matriculas
    for insert with check (auth.uid() = aluno_id);

-- Admin vê e libera/revoga a matrícula de qualquer aluno em qualquer curso
drop policy if exists "matriculas_select_admin" on public.matriculas;
create policy "matriculas_select_admin" on public.matriculas
    for select using (public.is_admin());

drop policy if exists "matriculas_update_admin" on public.matriculas;
create policy "matriculas_update_admin" on public.matriculas
    for update using (public.is_admin());

alter table public.modulos enable row level security;

-- Só vê os módulos de um curso quem tem matrícula liberada naquele curso
drop policy if exists "modulos_select_liberados" on public.modulos;
drop policy if exists "modulos_select_matriculado" on public.modulos;
create policy "modulos_select_matriculado" on public.modulos
    for select using (
        exists (
            select 1 from public.matriculas
            where matriculas.curso_id = modulos.curso_id
            and matriculas.aluno_id = auth.uid()
            and matriculas.liberado = true
        )
    );

drop policy if exists "modulos_select_admin" on public.modulos;
create policy "modulos_select_admin" on public.modulos
    for select using (public.is_admin());

-- Cadastre seus cursos (o slug é usado no js/form-handler.js de cada landing page):
-- insert into public.cursos (nome, slug) values
--   ('Curso Alvorada - Legalle', 'alvorada'),
--   ('Novo Curso', 'novo-curso');

-- Depois associe cada módulo ao curso correto:
-- update public.modulos set curso_id = (select id from public.cursos where slug = 'alvorada') where id = 1;

-- Exemplo de módulo:
-- insert into public.modulos (titulo, descricao, link, ordem, curso_id) values
--   ('Módulo 1 - Resolução de Questões I', 'Aula gravada', 'https://drive.google.com/file/d/XXXX/view', 1,
--    (select id from public.cursos where slug = 'alvorada'));

-- ==========================================================
-- Migração única: recupera alunos que se cadastraram ANTES da tabela
-- matriculas existir (ficaram sem matrícula visível no admin).
-- Ajuste o slug do curso se os alunos antigos forem de outro curso.
--
-- insert into public.matriculas (aluno_id, curso_id, liberado)
-- select p.id, (select id from public.cursos where slug = 'alvorada'), p.liberado
-- from public.profiles p
-- where not exists (
--     select 1 from public.matriculas m
--     where m.aluno_id = p.id
--     and m.curso_id = (select id from public.cursos where slug = 'alvorada')
-- );
-- ==========================================================

-- ==========================================================
-- Passo único e manual: torne sua própria conta admin depois de se cadastrar
-- normalmente pelo formulário do site (troque o e-mail abaixo pelo seu):
--
-- update public.profiles set is_admin = true where email = 'seu-email@gmail.com';
--
-- Depois disso, acesse /admin.html logado com essa conta para liberar alunos.
-- ==========================================================
