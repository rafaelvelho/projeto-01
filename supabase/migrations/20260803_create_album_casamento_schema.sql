-- Álbum coletivo: casamentos, fotos, sessões (ADR-0002 + portão ADR-0001)
-- Applied via Supabase MCP apply_migration (name: create_album_casamento_schema)

create extension if not exists pgcrypto;

create table if not exists public.casamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data date not null,
  descricao_romantica text not null default '',
  senha_hash text not null,
  codigo_noivos_hash text not null,
  slug_privado text not null unique,
  slug_publico text not null unique,
  publicado boolean not null default false,
  congelado_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.fotos (
  id uuid primary key default gen_random_uuid(),
  casamento_id uuid not null references public.casamentos(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists fotos_casamento_id_idx on public.fotos (casamento_id, created_at desc);

create table if not exists public.sessoes (
  token uuid primary key default gen_random_uuid(),
  casamento_id uuid not null references public.casamentos(id) on delete cascade,
  papel text not null check (papel in ('convidado', 'noivos')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists sessoes_casamento_id_idx on public.sessoes (casamento_id);

alter table public.casamentos enable row level security;
alter table public.fotos enable row level security;
alter table public.sessoes enable row level security;

revoke all on public.casamentos from anon, authenticated;
revoke all on public.fotos from anon, authenticated;
revoke all on public.sessoes from anon, authenticated;

grant select, insert, update, delete on public.casamentos to service_role;
grant select, insert, update, delete on public.fotos to service_role;
grant select, insert, update, delete on public.sessoes to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-album',
  'fotos-album',
  false,
  10485760,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
