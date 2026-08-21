# Fatni Photography

Next.js photography site for two public identities:

| Deployment | `NEXT_PUBLIC_SITE_ID` | Production origin |
| --- | --- | --- |
| Fatni Photography | `fatni-photography` (default) | https://www.fatniphotography.com |
| Ayoub El Fatni | `ayoub-el-fatni` | https://ayoub-el-fatni.vercel.app |

The same codebase serves both. Site ID selects navigation, routes, and which Supabase `sites` / `collections` rows are public.

## Architecture

- **Public app** — server-rendered pages, CSS grid galleries, client lightbox only where interaction is required.
- **Admin** — `/admin` only. `AdminProvider` mounts in the admin layout, not the public root.
- **Catalogue** — production reads Supabase `collections → collection_photos → photos`. There is no silent fallback to the static fixture.
- **Images** — masters live in `masters/images/`. Web derivatives in `public/images/` (tile ~800px, display ~1800px, dedicated hero). Supabase-hosted originals are rewritten to Storage image transforms.
- **Auth / RLS** — public `SELECT`; writes require `public.is_app_admin()`.

## Local setup

```bash
git clone <repo>
cd <repo>
npm install
cp .env.example .env.local
```

Fill `.env.local` (see below). Then:

```bash
npm run dev
```

Without Supabase env vars, development uses the Fatni fixture in `src/data/photos.ts`. To force that fixture even when Supabase is configured:

```bash
USE_LOCAL_CATALOG=1 npm run dev
```

Do not set `USE_LOCAL_CATALOG` in production. A failed production query surfaces an error state; it does not switch to the fixture.

```bash
npm run lint
npm run typecheck
npm test
npm run build          # needs Supabase env, or USE_LOCAL_CATALOG=1 for a local/CI smoke build
```

Node 20.9+ (`.nvmrc` pins 22).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | Public anon key (safe to expose in the browser) |
| `NEXT_PUBLIC_SITE_ID` | Recommended | `fatni-photography` or `ayoub-el-fatni` |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin for that deployment |
| `USE_LOCAL_CATALOG` | Dev only | `1` to read `src/data/photos.ts` |

The anon key is not a secret. Do not commit service-role keys.

## Database

`supabase/migrations/*.sql` is the only bootstrap history. Apply every file in timestamp order (Supabase CLI `db push` / `migration up`, or SQL Editor in order).

Final RLS:

- Anonymous and authenticated users can **read** `sites`, `collections`, `collection_photos`, `photos`, and public storage objects.
- Insert / update / delete on those tables and on `storage.objects` in the `photos` bucket require `is_app_admin()`.
- `app_admins` has no client policies; only the security-definer function reads it.

`supabase/archive/` is historical and must not be applied.

### Create an administrator

1. Authentication → Users → add the operator (email + password).
2. Copy the user UUID.
3. Run `supabase/bootstrap-admin.sql` after replacing `REPLACE_WITH_AUTH_USER_UUID`.

The sites/collections migration seeds the existing production admin UUID when that Auth user already exists. A greenfield project without that user still applies; then run the bootstrap file.

## Photography workflow

1. Put the camera original in `masters/images/…` (never overwrite masters).
2. `npm run images` writes:
   - `public/images/<path>` display JPEG
   - `public/images/tile/<path>` tile JPEG
   - `public/images/hero/startrails.jpg` for the Fatni homepage
   - `src/data/image-manifest.json`
3. Add or replace the row in Supabase (`photos`) via `/admin`.
4. Assign it to a collection and set order in `/admin/collections`.
5. Save triggers `revalidatePath("/", "layout")` so public pages refresh (ISR, 60s).

Public pages request tile/display/hero derivatives, not masters. Masters are outside `public/` and are omitted from Vercel uploads.

## Public routes

**Fatni:** `/`, `/work`, `/work/{nature,urban,astro,street,monochrome}`, `/about`, `/contact`. `/after-dark` redirects to `/work`.

**Ayoub:** `/`, `/projects`, `/projects/after-dark`, `/monochrome`, `/about`, `/contact`. `/work` redirects to `/projects/after-dark`.

Admin is unlinked: `/admin`, `/admin/library` (Fatni), `/admin/collections`.

## Deployment

Two Vercel projects, same repository, different env:

**Fatni**

```
NEXT_PUBLIC_SITE_ID=fatni-photography
NEXT_PUBLIC_SITE_URL=https://www.fatniphotography.com
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
```

**Ayoub**

```
NEXT_PUBLIC_SITE_ID=ayoub-el-fatni
NEXT_PUBLIC_SITE_URL=https://ayoub-el-fatni.vercel.app
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
```

Cross-site nav uses those production origins, not preview hostnames.
