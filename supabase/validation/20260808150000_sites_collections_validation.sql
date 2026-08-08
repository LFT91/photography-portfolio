-- Validation for Phase 1 sites/collections migration.
-- Run in Supabase SQL Editor AFTER the migration succeeds.
-- Expect: ordering mismatches = 0; orphaned legacy categories = 0;
--         photos-with-categories-but-no-membership = 0.

-- 1) Total master photos
select count(*) as total_master_photos
from public.photos;

-- 2) Photo count per legacy category (unnest photos.categories)
select
  cat as legacy_category,
  count(*) as photo_count
from public.photos p
cross join lateral unnest(p.categories) as cat
group by cat
order by cat;

-- 3) Membership count per Fatni collection
select
  c.slug,
  c.title,
  count(cp.photo_id) as membership_count
from public.collections c
left join public.collection_photos cp on cp.collection_id = c.id
where c.site_id = 'fatni-photography'
group by c.slug, c.title, c.sort_order
order by c.sort_order;

-- 3b) Ayoub collections should be empty for now
select
  c.slug,
  c.title,
  count(cp.photo_id) as membership_count
from public.collections c
left join public.collection_photos cp on cp.collection_id = c.id
where c.site_id = 'ayoub-el-fatni'
group by c.slug, c.title, c.sort_order
order by c.sort_order;

-- 4) Legacy categories with no corresponding Fatni collection title
select distinct cat as legacy_category_without_collection
from public.photos p
cross join lateral unnest(p.categories) as cat
where cat is not null
  and btrim(cat) <> ''
  and not exists (
    select 1
    from public.collections c
    where c.site_id = 'fatni-photography'
      and c.title = cat
  )
order by 1;

-- 5) Photos that have at least one category but no Fatni collection membership
select
  p.id,
  p.title,
  p.categories,
  p.sort_order
from public.photos p
where cardinality(p.categories) > 0
  and not exists (
    select 1
    from public.collection_photos cp
    join public.collections c on c.id = cp.collection_id
    where cp.photo_id = p.id
      and c.site_id = 'fatni-photography'
  )
order by p.sort_order, p.title;

-- 5b) Photos with empty categories (informational; expected to have no membership)
select
  p.id,
  p.title,
  p.sort_order
from public.photos p
where coalesce(cardinality(p.categories), 0) = 0
order by p.sort_order, p.title;

-- 6) Ordering comparison: legacy visible order vs collection_photos.sort_order
--    Expect zero rows if backfill preserved relative order within each category.
with legacy as (
  select
    cat as category_title,
    p.id as photo_id,
    p.title,
    p.sort_order as legacy_sort_order,
    (row_number() over (
      partition by cat
      order by p.sort_order asc, p.created_at asc, p.id asc
    ) - 1)::integer as legacy_pos
  from public.photos p
  cross join lateral unnest(p.categories) as cat
  where cat is not null
    and btrim(cat) <> ''
),
modern as (
  select
    c.title as category_title,
    cp.photo_id,
    cp.sort_order as collection_pos
  from public.collection_photos cp
  join public.collections c on c.id = cp.collection_id
  where c.site_id = 'fatni-photography'
)
select
  coalesce(l.category_title, m.category_title) as category_title,
  coalesce(l.photo_id, m.photo_id) as photo_id,
  l.title,
  l.legacy_sort_order,
  l.legacy_pos,
  m.collection_pos,
  case
    when l.photo_id is null then 'missing_in_legacy'
    when m.photo_id is null then 'missing_in_collection_photos'
    when l.legacy_pos is distinct from m.collection_pos then 'order_mismatch'
    else 'ok'
  end as status
from legacy l
full outer join modern m
  on l.photo_id = m.photo_id
 and l.category_title = m.category_title
where l.legacy_pos is distinct from m.collection_pos
   or l.photo_id is null
   or m.photo_id is null
order by category_title, coalesce(l.legacy_pos, m.collection_pos);

-- 6b) Summary: should all be ok_count matching memberships, mismatch_count = 0
with legacy as (
  select
    cat as category_title,
    p.id as photo_id,
    (row_number() over (
      partition by cat
      order by p.sort_order asc, p.created_at asc, p.id asc
    ) - 1)::integer as legacy_pos
  from public.photos p
  cross join lateral unnest(p.categories) as cat
  where cat is not null
    and btrim(cat) <> ''
),
modern as (
  select
    c.title as category_title,
    cp.photo_id,
    cp.sort_order as collection_pos
  from public.collection_photos cp
  join public.collections c on c.id = cp.collection_id
  where c.site_id = 'fatni-photography'
),
compared as (
  select
    case
      when l.legacy_pos is not distinct from m.collection_pos
       and l.photo_id is not null
       and m.photo_id is not null
        then 1
      else 0
    end as is_ok
  from legacy l
  full outer join modern m
    on l.photo_id = m.photo_id
   and l.category_title = m.category_title
)
select
  count(*) as compared_rows,
  sum(is_ok) as ok_count,
  count(*) - sum(is_ok) as mismatch_count
from compared;

-- 7) Admin lock-down sanity
select
  (select count(*) from public.app_admins) as admin_count,
  (select user_id from public.app_admins limit 1) as admin_user_id;
