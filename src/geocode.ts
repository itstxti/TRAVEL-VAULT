export interface GeocodeResult {
  label: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
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
    const a = item.address || {};
    const city = a.city || a.town || a.village || a.municipality || a.county || item.display_name.split(',')[0];
    const country = a.country || '';
    return { label: item.display_name as string, city, country, lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
  });
}