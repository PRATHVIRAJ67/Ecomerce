# Ecomerce — URU customer website

**Live:** https://uru-store.prathviholla67.workers.dev

Premium Indian e‑commerce storefront for **URU — Your Village. Your City. Your URU.**
React 19 + Vite + TypeScript + Tailwind v4, hosted on Cloudflare Workers (static assets).

| Folder | |
|---|---|
| `Website/Frontend` | Storefront: home, catalogue, search & filters, product pages, cart, wishlist, checkout (Razorpay + COD), orders & tracking, account, info pages |
| `Shared` | Types, zod validation, constants & design tokens shared with the API and apps |
| `Database` | Supabase migrations, seed and `migrate.mjs` (one shared database for all apps) |
| `Documentation` | Architecture blueprint |

The API lives in [Ecomerge-Admin-Pannel](https://github.com/PRATHVIRAJ67/Ecomerge-Admin-Pannel) (`https://uru-api.prathviholla67.workers.dev`).

## Develop
```bash
npm install
cp Website/Frontend/.env.example Website/Frontend/.env   # publishable values only
npm run dev                                               # http://localhost:5173
```

## Deploy (Cloudflare)
```bash
# Website/Frontend/.env.production → VITE_API_URL=https://uru-api.prathviholla67.workers.dev/api/v1
npm run deploy
```

## Database
```bash
cp Database/config/.env.example Database/config/.env     # DATABASE_URL (secret, never commit)
npm run db:migrate
```
