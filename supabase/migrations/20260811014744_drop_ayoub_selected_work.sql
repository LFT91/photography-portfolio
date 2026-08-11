-- Remove retired Ayoub "Selected Work" collection from Collection Manager.
-- Safe: collection had zero memberships after curation apply.
-- Idempotent.

delete from public.collection_photos
where collection_id in (
  select id
  from public.collections
  where site_id = 'ayoub-el-fatni'
    and slug = 'selected-work'
);

delete from public.collections
where site_id = 'ayoub-el-fatni'
  and slug = 'selected-work';
