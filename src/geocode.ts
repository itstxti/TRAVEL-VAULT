export interface GeocodeResult {
  label: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// Shared address-parsing logic used by both forward search and reverse
// lookup, so the two paths can't drift out of sync with each other.
export function parseAddress(item: any): { city: string; country: string } {
  const a = item.address || {};
  const fallback = item.display_name ? item.display_name.split(',')[0] : '';
  const city = a.city || a.town || a.village || a.municipality || a.county || fallback;
  const country = a.country || '';
  return { city, country };
}

// Uses the free OpenStreetMap Nominatim API (same tile provider already used
// for the map view). No API key required; kept to a single low-frequency
// request per search thanks to debouncing in the caller.
export async function searchPlace(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=en&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('geocoding request failed');
  const data = await res.json();
  return (data as any[]).map(item => {
    const { city, country } = parseAddress(item);
    return { label: item.display_name as string, city, country, lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
  });
}

// Reverse geocoding: turn a lat/lng (from a map click or pin drag) into a
// city/country guess. Same 1 req/sec Nominatim policy applies, so callers
// must debounce + cancel in-flight requests themselves (see DestinationModal).
export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<{ city: string; country: string }> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('reverse geocoding failed');
  const data = await res.json();
  return parseAddress(data);
}