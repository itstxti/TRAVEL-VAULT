# TRAVEL VAULT
A React + TypeScript travel planner for saving destinations, planning trips, and tracking the places you've visited.

![status](https://img.shields.io/badge/status-portfolio_project-blue) ![deps](https://img.shields.io/badge/dependencies-react_%2B_leaflet-lightgrey) ![license](https://img.shields.io/badge/license-MIT-green)

## Features

| Module | What it does |
|---|---|
| Destinations | Add cities or countries with a status: Want to go, Planned, Visited |
| List view | Filter destinations by status, see all of them at a glance |
| Map view | See every destination plotted on an interactive map |
| Location search | Type a place name and pick from geocoded suggestions to auto-fill coordinates |
| Trip details | Track companions and trip start/end dates per destination |
| Journal | Add dated journal entries to any destination |
| Gallery | Attach photos to a destination and browse them in a lightbox |
| Stats | Running totals for destinations, visited, planned, and countries visited |

## Stack

— React 18 + TypeScript<br>
— Vite<br>
— Supabase
— Google OAuth

## Getting started
 
```bash
git clone https://github.com/itstxti/TRAVEL-VAULT
cd TRAVEL-VAULT
npm install
npm run dev
```

## Known limitations

— **Google-only auth.** There's no email/password or other OAuth provider yet.<<br>
— **Geocoding depends on Nominatim's public API**, which is rate-limited and requires an internet connection to search for new places.

## License

MIT — see [LICENSE](./LICENSE).
