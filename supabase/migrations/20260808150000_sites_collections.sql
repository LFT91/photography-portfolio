-- Phase 1 (additive): sites, collections, collection_photos + admin UUID lock-down.
-- Does NOT drop or rewrite photos.categories / photos.sort_order / night_kind.
-- Does NOT change application code. Safe for current production after this runs.
--
-- Admin allow-list uses auth user: 88b0fa67-b865-4c1e-ad1a-25a35efd92b5
-- Do not apply remotely until explicitly requested.
--
-- After applying, run:
--   supabase/validation/20260808150000_sites_collections_validation.sql

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Admin allow-list (single operator for now)
-- ---------------------------------------------------------------------------
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

-- No policies on app_admins: only privileged/security-definer roles read it.

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to anon, authenticated;

do $$
declare
  -- Admin Auth user UID (Authentication → Users)
  admin_user_id_text text := '88b0fa67-b865-4c1e-ad1a-25a35efd92b5';
  admin_user_id uuid;
begin
  if admin_user_id_text = 'REPLACE_WITH_YOUR_AUTH_USER_UUID'
     or admin_user_id_text is null
     or btrim(admin_user_id_text) = '' then
    raise exception
      'Phase 1 migration blocked: set admin_user_id_text to your auth.users.id (Authentication → Users → User UID).';
  end if;

  begin
    admin_user_id := admin_user_id_text::uuid;
  exception
    when invalid_text_representation then
      raise exception
        'Phase 1 migration blocked: admin_user_id_text is not a valid UUID: %',
        admin_user_id_text;
  end;

  if not exists (select 1 from auth.users where id = admin_user_id) then
    raise exception
      'Phase 1 migration blocked: no auth.users row for %. Check Authentication → Users.',
      admin_user_id;
  end if;

  insert into public.app_admins (user_id)
  values (admin_user_id)
  on conflict (user_id) do nothing;
end $$;

-- ---------------------------------------------------------------------------
-- sites / collections / collection_photos
-- ---------------------------------------------------------------------------
create table if not exists public.sites (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  site_id text not null references public.sites (id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists public.collection_photos (
  collection_id uuid not null references public.collections (id) on delete cascade,
  photo_id uuid not null references public.photos (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (collection_id, photo_id)
);

create index if not exists collections_site_sort_idx
  on public.collections (site_id, sort_order);

create index if not exists collection_photos_order_idx
  on public.collection_photos (collection_id, sort_order);

create index if not exists collection_photos_photo_idx
  on public.collection_photos (photo_id);

-- ---------------------------------------------------------------------------
-- Seed sites + collections (idempotent)
-- ---------------------------------------------------------------------------
insert into public.sites (id, name)
values
  ('fatni-photography', 'Fatni Photography'),
  ('ayoub-el-fatni', 'Ayoub El Fatni')
on conflict (id) do update set name = excluded.name;

-- Fatni collections mirror current PhotoCategory labels exactly (title = category string).
insert into public.collections (site_id, slug, title, sort_order)
values
  ('fatni-photography', 'nature', 'Nature', 0),
  ('fatni-photography', 'urban', 'Urban', 1),
  ('fatni-photography', 'astro', 'Astro', 2),
  ('fatni-photography', 'street', 'Street', 3),
  ('fatni-photography', 'monochrome', 'Monochrome', 4),
  ('fatni-photography', 'after-dark', 'After Dark', 5)
on conflict (site_id, slug) do update
set title = excluded.title,
    sort_order = excluded.sort_order;

-- Ayoub collections start empty (membership backfill intentionally skipped).
insert into public.collections (site_id, slug, title, sort_order)
values
  ('ayoub-el-fatni', 'selected-work', 'Selected Work', 0),
  ('ayoub-el-fatni', 'monochrome', 'Monochrome', 1),
  ('ayoub-el-fatni', 'after-dark', 'After Dark', 2)
on conflict (site_id, slug) do update
set title = excluded.title,
    sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Backfill Fatni collection_photos from photos.categories
-- Visible order today = filter by category, then order by photos.sort_order.
-- Independent dense sort_order per collection (0..n-1), same relative order.
-- ---------------------------------------------------------------------------
insert into public.collection_photos (collection_id, photo_id, sort_order)
select
  c.id as collection_id,
  ranked.photo_id,
  ranked.pos as sort_order
from (
  select
    cat as category_title,
    p.id as photo_id,
    (row_number() over (
      partition by cat
      order by p.sort_order asc, p.created_at asc, p.id asc
    ) - 1)::integer as pos
  from public.photos p
  cross join lateral unnest(p.categories) as cat
  where cat is not null
    and btrim(cat) <> ''
) ranked
join public.collections c
  on c.site_id = 'fatni-photography'
 and c.title = ranked.category_title
on conflict (collection_id, photo_id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS on new tables: public read, admin write
-- ---------------------------------------------------------------------------
alter table public.sites enable row level security;
alter table public.collections enable row level security;
alter table public.collection_photos enable row level security;

drop policy if exists "Public can read sites" on public.sites;
create policy "Public can read sites"
  on public.sites for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert sites" on public.sites;
create policy "Admins can insert sites"
  on public.sites for insert
  to authenticated
  with check (public.is_app_admin());

drop policy if exists "Admins can update sites" on public.sites;
create policy "Admins can update sites"
  on public.sites for update
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Admins can delete sites" on public.sites;
create policy "Admins can delete sites"
  on public.sites for delete
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Public can read collections" on public.collections;
create policy "Public can read collections"
  on public.collections for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert collections" on public.collections;
create policy "Admins can insert collections"
  on public.collections for insert
  to authenticated
  with check (public.is_app_admin());

drop policy if exists "Admins can update collections" on public.collections;
create policy "Admins can update collections"
  on public.collections for update
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Admins can delete collections" on public.collections;
create policy "Admins can delete collections"
  on public.collections for delete
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Public can read collection_photos" on public.collection_photos;
create policy "Public can read collection_photos"
  on public.collection_photos for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert collection_photos" on public.collection_photos;
create policy "Admins can insert collection_photos"
  on public.collection_photos for insert
  to authenticated
  with check (public.is_app_admin());

drop policy if exists "Admins can update collection_photos" on public.collection_photos;
create policy "Admins can update collection_photos"
  on public.collection_photos for update
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Admins can delete collection_photos" on public.collection_photos;
create policy "Admins can delete collection_photos"
  on public.collection_photos for delete
  to authenticated
  using (public.is_app_admin());

-- ---------------------------------------------------------------------------
-- Tighten existing photos + storage write policies (keep public SELECT)
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated can insert photos" on public.photos;
drop policy if exists "Authenticated can update photos" on public.photos;
drop policy if exists "Authenticated can delete photos" on public.photos;

create policy "Admins can insert photos"
  on public.photos for insert
  to authenticated
  with check (public.is_app_admin());

create policy "Admins can update photos"
  on public.photos for update
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "Admins can delete photos"
  on public.photos for delete
  to authenticated
  using (public.is_app_admin());

-- Keep existing "Public can read photos" as-is.

drop policy if exists "Authenticated upload photo files" on storage.objects;
drop policy if exists "Authenticated update photo files" on storage.objects;
drop policy if exists "Authenticated delete photo files" on storage.objects;

create policy "Admins upload photo files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos' and public.is_app_admin());

create policy "Admins update photo files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'photos' and public.is_app_admin())
  with check (bucket_id = 'photos' and public.is_app_admin());

create policy "Admins delete photo files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos' and public.is_app_admin());

-- Keep existing "Public read photo files" as-is.
