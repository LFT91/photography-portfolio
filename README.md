# Fatni Photography

Next.js portfolio for **Fatni Photography** and **Ayoub El Fatni**.

Public production is static: catalogue files plus generated images, deployed on Vercel.

## Local

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The local curator is at `/admin` in development only.

## Catalogue

Canonical source of truth:

- `src/content/photos.ts`
- `src/content/collections.ts`
- `src/content/sites.ts`
- `src/data/image-manifest.json`

The curator writes these files in the working tree. Commit and deploy when you want the public sites to update. It never pushes to GitHub on its own.

## Add Photograph

Set `MASTERS_DIR` in `.env.local` to an existing folder **outside** Git. New originals are copied there; web derivatives (480 / 800 / 1200 / 1800) are generated into `public/images/generated/`.

If `MASTERS_DIR` is missing, Add Photograph stays disabled.

## Production

Two Vercel projects, same repo:

- Fatni: `NEXT_PUBLIC_SITE_ID=fatni-photography`
- Ayoub: `NEXT_PUBLIC_SITE_ID=ayoub-el-fatni`

`/admin` is unavailable in production builds.
