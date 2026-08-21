# Archived SQL (not a bootstrap path)

`setup.sql` and `seed-catalog.sql` are historical. Do not run them on a new
or production project.

Canonical bootstrap is `supabase/migrations/*.sql` applied in timestamp order.
Those migrations end with `is_app_admin()` write locks. The archived setup
file predates that model and would let any authenticated user write photos.

After migrations, create an Auth user and run `supabase/bootstrap-admin.sql`.
