-- Allow enlarging past one column; app caps per-file by native resolution
alter table public.photos
  drop constraint if exists photos_display_scale_check;

alter table public.photos
  add constraint photos_display_scale_check
  check (display_scale >= 0.45 and display_scale <= 3);
