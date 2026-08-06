-- Museum rooms: Nature / Architecture / Astro / Street / Monochrome / After Dark
-- App no longer uses night_kind subfilters.

alter table public.photos drop constraint if exists photos_night_kind_check;

update public.photos set night_kind = null;

-- Keep column nullable with no enum so legacy rows don't block inserts.
alter table public.photos
  add constraint photos_night_kind_check
  check (night_kind is null);
