-- Remove retired Fatni "After Dark" collection.
-- After Dark lives only on Ayoub El Fatni going forward.
-- Safe when membership count is 0; still deletes any leftover memberships.
-- Idempotent.

delete from public.collection_photos
where collection_id in (
  select id
  from public.collections
  where site_id = 'fatni-photography'
    and slug = 'after-dark'
);

delete from public.collections
where site_id = 'fatni-photography'
  and slug = 'after-dark';
