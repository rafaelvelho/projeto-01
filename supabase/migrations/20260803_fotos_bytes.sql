-- Tamanho de cada foto para o painel dos noivos (contagem / GB).
alter table public.fotos
  add column if not exists bytes bigint;
