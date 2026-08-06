# Fatni Photography

Next.js portfolio for **Fatni Photography** (Ayoub El Fatni) — travel, street, and After Dark.

## Local

```bash
npm install
npm run dev
```

Site uses the local catalog in `src/data/photos.ts` until Supabase has photos.

## Supabase (admin upload / remove / reorder)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run `supabase/migrations/20260806000000_photos.sql`.
3. **Authentication → Users** → add yourself (email + password).
4. Copy Project URL + anon key from **Settings → API**.
5. Copy `.env.example` to `.env.local` and fill:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

6. Restart `npm run dev`, open `/admin`, sign in, upload photos.

Public gallery reads Supabase when the `photos` table has rows; otherwise it falls back to the local catalog.

## Vercel

```bash
npx vercel login
npx vercel --prod
```

Add the same env vars in **Vercel → Project → Settings → Environment Variables**, then redeploy.

### Custom domain

1. Buy a domain (e.g. `fatni.photography` or `fatniphotography.com`).
2. In Vercel → **Settings → Domains** → add it.
3. Follow Vercel’s DNS instructions at your registrar.

Admin stays at `https://your-domain.com/admin` (bookmark only — not linked on public pages).
