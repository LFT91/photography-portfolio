-- Fatni Photography — run once in Supabase SQL Editor (fresh project)
create extension if not exists "pgcrypto";

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  storage_path text not null,
  public_url text not null,
  categories text[] not null default '{}',
  night_kind text check (night_kind is null),
  sort_order integer not null default 0,
  display_scale real not null default 1
    check (display_scale >= 0.45 and display_scale <= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists photos_sort_order_idx on public.photos (sort_order);
create index if not exists photos_categories_idx on public.photos using gin (categories);

alter table public.photos enable row level security;

create policy "Public can read photos"
  on public.photos for select
  to anon, authenticated
  using (true);

create policy "Authenticated can insert photos"
  on public.photos for insert
  to authenticated
  with check (true);

create policy "Authenticated can update photos"
  on public.photos for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete photos"
  on public.photos for delete
  to authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Public read photo files"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'photos');

create policy "Authenticated upload photo files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');

create policy "Authenticated update photo files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'photos');

create policy "Authenticated delete photo files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos');
