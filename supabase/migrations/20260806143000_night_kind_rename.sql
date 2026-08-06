-- After Dark filters: Street/Urban/Landscape/Astro → Atmosphere/Astro/Other

alter table public.photos drop constraint if exists photos_night_kind_check;

update public.photos
set night_kind = 'Atmosphere'
where night_kind = 'Street';

update public.photos
set night_kind = 'Other'
where night_kind in ('Urban', 'Landscape');

-- Light-trail long exposures that were tagged Astro (title match) move to Other.
-- True sky Astro rows stay as Astro.
update public.photos
set night_kind = 'Other'
where night_kind = 'Astro'
  and lower(title) like '%long exposure%';

alter table public.photos
  add constraint photos_night_kind_check
  check (night_kind is null or night_kind in ('Atmosphere', 'Astro', 'Other'));
