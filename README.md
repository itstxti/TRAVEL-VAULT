# TRAVEL VAULT
A React + TypeScript travel planner for saving destinations, planning trips, and tracking the places you've visited.

![status](https://img.shields.io/badge/status-portfolio_project-blue) ![deps](https://img.shields.io/badge/dependencies-react_%2B_leaflet-lightgrey) ![license](https://img.shields.io/badge/license-MIT-green)

## Features

**Trip planning**
- Add destinations as a city or a country, each with a status: Want to go, Planned, Visited
- Location search with autocomplete (OpenStreetMap/Nominatim) auto-fills coordinates and country — or drop a pin on the map instead
- Track companions and trip start/end dates per destination
- Dated journal entries per destination
- Photo gallery per destination with a lightbox viewer

**Views**
- List view, grouped by country, filterable by status
- Map view with every destination plotted
- Running stats: total destinations, visited, planned, countries visited

**Accounts & data**
- Sign in with Google or email/password, including password reset
- Each account's data is fully isolated — both on the server (Postgres row-level security) and in the browser (namespaced local storage), so switching accounts in the same browser never mixes data
- Works offline: destinations and photos are read from local storage/IndexedDB first, then synced to Supabase in the background
- Multi-device sync with three-way conflict resolution (see [Architecture](#architecture))
- Export the whole vault as a `.zip` backup and re-import it later

## Tech Stack

| Layer | Choice |
|---|---|
| UI | React 18 + TypeScript, hand-written CSS (no framework) |
| Build tool | Vite |
| Maps | Leaflet + React-Leaflet, OpenStreetMap tiles |
| Geocoding | Nominatim public API (no key required) |
| Backend | Supabase (Postgres, Auth, Storage) |
| Auth providers | Google OAuth, email/password (via Supabase Auth) |
| Local persistence | `localStorage` (destination metadata) + `IndexedDB` (photo binaries) |
| Backup format | `.zip`, built client-side with JSZip |

## Architecture

Travel Vault is a client-only SPA — there's no custom backend server, Supabase is the entire backend (Postgres + Auth + Storage, all accessed directly from the browser with the anon key, protected by row-level security).

**Local-first, sync-on-top.** The UI always reads and writes to the browser first (`localStorage` for destination/journal data, `IndexedDB` for photo bytes), so the app is usable offline and feels instant. Every local write is queued and pushed to Supabase in the background; every local key is namespaced by the signed-in user's id, so two accounts in the same browser never share a cache.

```
React state (App.tsx)
   │
   ├─ localStorage  (destinations, per user id)      ──┐
   ├─ IndexedDB     (photo data URLs)                 │
   │                                                   ▼
   └────────────────────────────────────────►  sync.ts / pull.ts / migrate.ts
                                                        │
                                                        ▼
                                        Supabase (Postgres + Storage)
                                        RLS: auth.uid() = user_id
```

Three modules own the sync logic:

- **`migrate.ts`** — runs once per account, the first time it signs in with local data and nothing yet on the server. One-way, one-shot upload; it never overwrites existing server data.
- **`sync.ts`** (push) — debounced upload of whatever destination the user just edited or deleted. Photo binaries are only re-uploaded when they haven't been uploaded before, so editing a caption doesn't re-send the image.
- **`pull.ts`** (pull) — runs on load, every 45s, and on `online`/focus events. Fetches the account's rows from Postgres and does a **three-way merge** per field (base ↔ local ↔ remote): if only one side changed since the last known-synced state, that side wins with no data loss; a genuine same-field conflict falls back to local. Deletes are tombstoned (`deleted_at`) rather than hard-deleted, so they propagate correctly across devices.

Every table (`destinations`, `journal_entries`, `photos`) and the `photos` storage bucket enforce `auth.uid() = user_id` via RLS policies (see `supabase/migrations/0001_init.sql`), so isolation between accounts is guaranteed server-side regardless of what the client sends.

## Deployment

The app builds to static files, so it deploys to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.) with no server component.

**1. Set up Supabase**
- Create a project at [supabase.com](https://supabase.com)
- Run `supabase/migrations/0001_init.sql` in the SQL Editor (or via `supabase db push`) — this creates the tables, RLS policies, and the `photos` storage bucket
- Under **Authentication → Providers**, enable **Google** and **Email**
- Under **Authentication → URL Configuration**, add your deployed origin (and `http://localhost:5173` for local dev) to **Redirect URLs** — required for OAuth and for the password-reset email link to work

**2. Configure environment variables**

Copy `.env.example` to `.env` and fill in your project's values from **Project Settings → API**:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

These are baked into the build by Vite (`import.meta.env`), so set them in your hosting provider's environment variables **before** building — rotating a key means a new deploy, not just a config change.

**3. Build and deploy**

```bash
npm install
npm run build   # outputs static files to dist/
```

Point your host at the `dist/` folder. There's nothing else to configure server-side — the Supabase anon key is safe to expose publicly, since all access control is enforced by RLS, not by keeping the key secret.

## Getting started
 
```bash
git clone https://github.com/itstxti/TRAVEL-VAULT
cd TRAVEL-VAULT
npm install
npm run dev
```

Email/password login uses Supabase's built-in Email provider — it's on by default, but double-check under Authentication → Providers in your Supabase project. If "Confirm email" is enabled there, new sign-ups won't get a session until they click the confirmation link.

## Known limitations

— **No other OAuth providers.** Only Google is wired up; adding GitHub/Apple/etc. would follow the same `signInWithOAuth` pattern.<br>
— **Geocoding depends on Nominatim's public API**, which is rate-limited and requires an internet connection to search for new places.

## License

MIT — see [LICENSE](./LICENSE).
