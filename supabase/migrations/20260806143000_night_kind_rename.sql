-- After Dark filters: Atmosphere / Landscape / Urban

alter table public.photos drop constraint if exists photos_night_kind_check;

-- Prior values → new taxonomy
update public.photos set night_kind = 'Atmosphere' where night_kind = 'Street';
update public.photos set night_kind = 'Landscape' where night_kind in ('Astro', 'Landscape');
update public.photos set night_kind = 'Urban' where night_kind in ('Urban', 'Other');

-- If a previous migration already wrote Atmosphere/Astro/Other:
update public.photos set night_kind = 'Landscape' where night_kind = 'Astro';
update public.photos set night_kind = 'Urban' where night_kind = 'Other';

alter table public.photos
  add constraint photos_night_kind_check
  check (night_kind is null or night_kind in ('Atmosphere', 'Landscape', 'Urban'));
