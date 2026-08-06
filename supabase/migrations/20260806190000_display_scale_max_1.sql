-- Cap display scale at full column width so tiles never overlap neighbours
update public.photos
set display_scale = 1
where display_scale > 1;

alter table public.photos
  drop constraint if exists photos_display_scale_check;

alter table public.photos
  add constraint photos_display_scale_check
  check (display_scale >= 0.45 and display_scale <= 1);
