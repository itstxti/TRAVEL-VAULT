# TRAVEL VAULT
A React + TypeScript travel planner for saving destinations, planning trips, and tracking the places you've visited.

![status](https://img.shields.io/badge/status-portfolio_project-blue) ![deps](https://img.shields.io/badge/dependencies-react_%2B_leaflet-lightgrey) ![license](https://img.shields.io/badge/license-MIT-green)

## Motivation
A place to keep every destination in one spot: the ones you're dreaming about, the ones you've actually booked, and the ones you've already crossed off.

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

## Structure

```
index.html            → app entry point
src/
  App.tsx              → top-level state and layout
  types.ts              → shared types (Destination, JournalEntry, Photo…)
  storage.ts             → localStorage + IndexedDB persistence
  geocode.ts              → place search via OpenStreetMap Nominatim
  data.ts                  → country list + flag helper
  components/
    Card.tsx                → destination card in list view
    List.tsx                 → list view with filtering
    MapView.tsx                → Leaflet map view
    LocationPicker.tsx          → geocoded location search input
    DestinationModal.tsx         → add/edit a destination
    JournalModal.tsx              → journal entries for a destination
    GalleryModal.tsx               → photo gallery for a destination
    Lightbox.tsx                    → full-screen photo viewer
```

## Stack

— React 18 + TypeScript<br>
— Vite<br>
— Leaflet / react-leaflet (map rendering)<br>
— OpenStreetMap Nominatim (free, no-API-key geocoding)<br>
— Browser localStorage + IndexedDB (all data stays on-device)


## Getting started
 
```bash
git clone https://github.com/itstxti/TRAVEL-VAULT
cd TRAVEL-VAULT
npm install
npm run dev
```

## How to use

### Add a destination

1. Click **Add destination**.
2. Search for a city or country — the location picker uses OpenStreetMap to suggest matches and fills in the coordinates for you.
3. Pick a status: **Want to go**, **Planned**, or **Visited**.
4. Optionally add trip dates and companions.
5. Save. It now shows up in both the **List** and **Map** tabs.

### Browse your destinations

- Switch between the **List** and **Map** tabs at the top.
- Use the filter chips (**All / Want to go / Planned / Visited**) to narrow the list down.
- The stats row at the top always reflects your current totals — destinations, visited, planned, and distinct countries visited.

### Keep a journal

1. Open a destination and go to its **Journal**.
2. Add an entry — it's saved with today's date.
3. Entries stay attached to that destination and build up into a trip log over time.

### Add photos

1. Open a destination's **Gallery**.
2. Upload photos — they're stored locally in your browser (IndexedDB), not uploaded anywhere.
3. Click any photo to open it full-screen in the lightbox and step through the rest of the gallery.

### Edit or remove a destination

1. Open the destination and click **Edit** to change its details, status, or dates.
2. Click **Delete** to remove it — you'll be asked to confirm, since this can't be undone.

**A couple of things to keep in mind:** everything you add — destinations, journal entries, photos — is stored only in your browser (localStorage + IndexedDB). Nothing is sent to a server. Clearing your browser data or switching browsers/devices means starting fresh.

## Known limitations

— **No sync.** Data lives in one browser on one device; there's no account system or cloud backup.<br>
— **No export/import yet.** There's currently no way to back up or transfer your data outside the browser.<br>
— **Geocoding depends on Nominatim's public API**, which is rate-limited and requires an internet connection to search for new places.

## License

MIT — see [LICENSE](./LICENSE).