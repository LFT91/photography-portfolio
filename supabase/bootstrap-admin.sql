-- Grant catalogue/storage write access to one Auth user.
--
-- 1. Authentication → Users → create the administrator (email + password).
-- 2. Copy that user's UUID.
-- 3. Replace the placeholder below and run this file in the SQL Editor.
--
-- Writes still go through public.is_app_admin(). Anonymous visitors and
-- ordinary authenticated users cannot mutate photos, collections, or storage.

insert into public.app_admins (user_id)
values ('REPLACE_WITH_AUTH_USER_UUID'::uuid)
on conflict (user_id) do nothing;
