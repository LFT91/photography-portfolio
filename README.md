# Fatni Photography

One repository, two public photography sites:

| Deployment | `NEXT_PUBLIC_SITE_ID` | Production origin |
| --- | --- | --- |
| Fatni Photography | `fatni-photography` (default) | https://www.fatniphotography.com |
| Ayoub El Fatni | `ayoub-el-fatni` | https://ayoub-el-fatni.vercel.app |

They share frontend primitives and one static catalogue. They are not one public site.

## Architecture

Next.js + a typed static catalogue + two site configurations + pre-generated responsive JPEGs + Vercel + CI.

```
site config
  → collection
  → ordered photo IDs
  → photo metadata
  → static derivative
  → gallery / lightbox
```

There is no production database, no SQL, no Supabase, and no admin CMS.

- Catalogue: `src/content/photos.json`, `src/content/collections.json` (thin TypeScript wrappers in `src/content/*.ts`), `src/content/sites.ts`
- Images: `public/images/` (small 480 / tile 800 / large 1200 / lightbox 1800 / dedicated hero 1600), requested with a content-hash `?v=` query
- Local curator: `tools/curator/` (not part of the public Vercel app)
- Camera originals stay **outside Git**

## Local

```bash
npm install
cp .env.example .env.local
npm run dev
```

`NEXT_PUBLIC_SITE_ID` selects the brand. Omit it to work on Fatni.

Local curation (not available in production):

```bash
npm run curate
```

That starts a **separate** localhost Next app from `tools/curator/` on `127.0.0.1:3000` and opens `/admin`. Ordinary `npm run dev` and production builds do not include curator routes. Save writes `src/content/photos.json` and `src/content/collections.json` only — it never pushes to GitHub. Double-click `Photography Curator.command` to do the same from Finder; `Stop Photography Curator.command` stops only that local curator.

Add Photograph copies the original to `~/Pictures/Fatni Photography Masters` (outside Git) and generates the same web derivatives as `npm run images`. `MASTERS_DIR` is an optional override.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Daily use

1. Double-click `Photography Curator.command`
2. Curate visually in the browser
3. Save
4. Ready to publish
5. Commit/push when ready

## Photography workflow

1. Add the camera original to the durable off-repo master archive. Never overwrite a master in place.
2. Add or update the photograph in `src/content/photos.json` and place its ID in the correct ordered array in `src/content/collections.json`.
3. `MASTERS_DIR=/path/to/masters/images npm run images`
4. Review locally (`npm run dev`).
5. Commit and push. CI runs lint, typecheck, tests, and both site builds. Vercel deploys.

`npm run images` never writes to masters. If a public catalogue photograph has no master, it fails before pruning stale files under `public/images/`.

Do not run the generator against an incomplete master archive.

## Public routes

**Fatni:** `/`, `/work`, `/work/{nature,urban,astro,street,monochrome}`, `/about`, `/contact`. `/after-dark` redirects to `/work`.

**Ayoub:** `/`, `/projects`, `/projects/after-dark`, `/monochrome`, `/about`, `/contact`. `/work` redirects to `/projects/after-dark`.

## Deployment

Two Vercel projects, same repository, different env:

**Fatni**

```
NEXT_PUBLIC_SITE_ID=fatni-photography
NEXT_PUBLIC_SITE_URL=https://www.fatniphotography.com
```

**Ayoub**

```
NEXT_PUBLIC_SITE_ID=ayoub-el-fatni
NEXT_PUBLIC_SITE_URL=https://ayoub-el-fatni.vercel.app
```

Cross-site nav uses those production origins, not preview hostnames.
