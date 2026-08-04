-- Uma conta de noivos = no máximo um casamento/álbum.
create unique index if not exists casamentos_one_per_owner
  on public.casamentos (owner_id)
  where owner_id is not null;
