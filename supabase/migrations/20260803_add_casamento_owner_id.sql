-- Noivos autenticados: dono do casamento (Auth)
alter table public.casamentos
  add column if not exists owner_id uuid references auth.users (id) on delete set null;

create index if not exists casamentos_owner_id_idx on public.casamentos (owner_id);
