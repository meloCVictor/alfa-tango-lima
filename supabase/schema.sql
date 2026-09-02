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
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada aluno só pode ver/editar o próprio perfil
create policy "profiles_select_own" on public.profiles
    for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id);

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

create policy "modulos_select_liberados" on public.modulos
    for select using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.liberado = true
        )
    );

-- Exemplo: cadastre os módulos reais depois de criar a tabela
-- insert into public.modulos (titulo, descricao, link, ordem) values
--   ('Módulo 1 - Resolução de Questões I', 'Aula gravada', 'https://drive.google.com/...', 1),
--   ('Módulo 2 - Resolução de Questões II', 'Aula gravada', 'https://drive.google.com/...', 2),
--   ('Módulo 3 - Resolução de Questões III', 'Aula gravada', 'https://drive.google.com/...', 3),
--   ('Aula ao vivo - Revisão Geral', 'Gravação da live', 'https://drive.google.com/...', 4);

-- ==========================================================
-- Como liberar o acesso de um aluno (depois de conferir o PIX no WhatsApp):
-- Table Editor > profiles > localize a linha do aluno pelo e-mail > marque "liberado" = true
-- ==========================================================
