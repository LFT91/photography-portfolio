-- Allow display_scale above one column; UI spans grid tracks when enlarged
alter table public.photos
  drop constraint if exists photos_display_scale_check;

alter table public.photos
  add constraint photos_display_scale_check
  check (display_scale >= 0.45 and display_scale <= 3);
