-- Optional display size for gallery tiles (1 = full column width)
alter table public.photos
  add column if not exists display_scale real not null default 1;

alter table public.photos
  drop constraint if exists photos_display_scale_check;

alter table public.photos
  add constraint photos_display_scale_check
  check (display_scale >= 0.45 and display_scale <= 1.35);
