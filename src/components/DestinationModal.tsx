import { useEffect, useMemo, useRef, useState } from 'react';
import { Destination, Status } from '../types';
import { COUNTRIES, countryData } from '../data';
import { id, debounce } from '../utils';
import { searchPlace, reverseGeocode, GeocodeResult } from '../geocode';
import { IconSearch, IconSpinner, IconClose } from '../icons';
import LocationPicker from './LocationPicker';

const statusLabels: Record<Status, string> = {
  want_to_go: 'Want to go',
  planned: 'Planned',
  visited: 'Visited',
};

type SearchState = 'idle' | 'searching' | 'found' | 'notfound' | 'error';

export default function DestinationModal({
  value,
  close,
  onSave,
}: {
  value: Destination | null;
  close: () => void;
  onSave: (d: Destination) => void;
}) {
  const [name, setName] = useState(value?.name || '');
  const [country, setCountry] = useState(value?.country || '');
  const [status, setStatus] = useState<Status>(
    value?.status || 'want_to_go'
  );
  const [start, setStart] = useState(value?.tripStart || '');
  const [end, setEnd] = useState(value?.tripEnd || '');
  const [companions, setCompanions] = useState(
    value?.companions.join(', ') || ''
  );
  const [lat, setLat] = useState(value?.lat ?? 20);
  const [lng, setLng] = useState(value?.lng ?? 0);
  const [zoom, setZoom] = useState(value ? 6 : 2);

  // A destination loaded for editing is already considered valid.
  // A new destination must be validated through search or the map.
  const [locationValidated, setLocationValidated] = useState(!!value);

  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useRef(
    debounce(async (q: string) => {
      if (q.trim().length < 2) {
        setSearchState('idle');
        setResults([]);
        return;
      }

      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setSearchState('searching');

      try {
        const hits = await searchPlace(q, controller.signal);
        setResults(hits);
        setSearchState(hits.length ? 'found' : 'notfound');
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          setSearchState('error');
        }
      }
    }, 550)
  ).current;

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  const pickResult = (r: GeocodeResult) => {
    setName(r.city);
    setCountry(r.country || country);
    setLat(r.lat);
    setLng(r.lng);
    setZoom(11);

    // The city comes directly from the geocoding result.
    setLocationValidated(true);

    setResults([]);
    setQuery('');
    setSearchState('idle');
  };

  const onCountryChange = (v: string) => {
    setCountry(v);

    const c = countryData(v);

    if (c) {
      setLat(c[2]);
      setLng(c[3]);
      setZoom(5);
    }

    // Changing the country means the existing city/location
    // can no longer be considered validated.
    setLocationValidated(false);
  };

  const reverseAbortRef = useRef<AbortController | null>(null);

  const runReverse = useRef(
    debounce(async (revLat: number, revLng: number) => {
      reverseAbortRef.current?.abort();

      const controller = new AbortController();
      reverseAbortRef.current = controller;

      try {
        const {
          city,
          country: revCountry,
        } = await reverseGeocode(
          revLat,
          revLng,
          controller.signal
        );

        if (city) {
          setName(city);
          setLocationValidated(true);
        }

        if (revCountry) {
          setCountry(revCountry);
        }
      } catch (e) {
        if ((e as any)?.name !== 'AbortError') {
          console.error('Error obtaining location:', e);
        }
      }
    }, 400)
  ).current;

  const handleLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);

    // The map position is being changed, so wait for reverse
    // geocoding to confirm the actual location.
    setLocationValidated(false);

    runReverse(newLat, newLng);
  };

  // A trip end date before its start date is never valid.
  const dateError = useMemo(() => {
    if (!start || !end) return null;

    return end < start
      ? "The end date can't be before the start date."
      : null;
  }, [start, end]);

  const canSave =
    name.trim().length > 0 &&
    locationValidated &&
    !dateError;

  return (
    <div
      className="overlay active"
      onMouseDown={e =>
        e.target === e.currentTarget && close()
      }
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{value ? 'Edit destination' : 'New destination'}</h2>

          <button
            className="modal-close"
            aria-label="Close"
            onClick={close}
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>Search for a place</label>

            <div className="search-box">
              <IconSearch
                size={15}
                className="search-box-icon"
              />

              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Try a city, landmark or region…"
              />

              {searchState === 'searching' && (
                <IconSpinner className="search-box-spinner" />
              )}
            </div>

            {searchState === 'searching' && (
              <p className="hint hint-searching">
                Searching…
              </p>
            )}

            {searchState === 'notfound' && (
              <p className="hint hint-notfound">
                No matches found. Try a different spelling.
              </p>
            )}

            {searchState === 'error' && (
              <p className="hint hint-notfound">
                Search failed. You can still set the pin on the map below.
              </p>
            )}

            {results.length > 0 && (
              <ul className="search-results">
                {results.map((r, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => pickResult(r)}
                    >
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="field-row">
            <div className="field">
              <label>Country</label>

              <input
                value={country}
                list="country-list"
                onChange={e =>
                  onCountryChange(e.target.value)
                }
                placeholder="e.g. France, Japan…"
              />

              <datalist id="country-list">
                {COUNTRIES.map(c => (
                  <option key={c[1]} value={c[0]} />
                ))}
              </datalist>
            </div>

            <div className="field">
              <label>City</label>

              <input
                value={name}
                onChange={e => {
                  setName(e.target.value);

                  // Manual changes invalidate the previous
                  // geocoded location.
                  setLocationValidated(false);
                }}
                placeholder="e.g. Kyoto, Lisbon…"
              />

              {!locationValidated && name.trim() && (
                <p className="hint hint-notfound">
                  Select a place from the search results or set its location on the map.
                </p>
              )}
            </div>
          </div>

          <div className="field">
            <label>Status</label>

            <select
              aria-label="Status"
              value={status}
              onChange={e =>
                setStatus(e.target.value as Status)
              }
            >
              {Object.entries(statusLabels).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Traveling with (optional)</label>

            <input
              value={companions}
              onChange={e =>
                setCompanions(e.target.value)
              }
              placeholder="Comma-separated names"
            />
          </div>

          <div className="field">
            <label>Trip dates</label>

            <div className="date-row">
              <div className="start-date">
                <span
                  style={{
                    marginRight: '5px',
                    fontSize: '12px',
                  }}
                >
                  Start:
                </span>

                <input
                  type="date"
                  value={start}
                  style={{
                    borderRadius: '5px',
                    width: '100px',
                  }}
                  onChange={e =>
                    setStart(e.target.value)
                  }
                />
              </div>

              <div className="start-date">
                <span
                  style={{
                    marginRight: '5px',
                    fontSize: '12px',
                  }}
                >
                  End:
                </span>

                <input
                  type="date"
                  min={start || undefined}
                  aria-invalid={!!dateError}
                  value={end}
                  style={{
                    borderRadius: '5px',
                    width: '100px',
                  }}
                  onChange={e =>
                    setEnd(e.target.value)
                  }
                />
              </div>
            </div>

            {dateError && (
              <p
                className="hint hint-notfound"
                role="alert"
              >
                {dateError}
              </p>
            )}
          </div>

          <div className="field">
            <label>Location on the map</label>

            <LocationPicker
              lat={lat}
              lng={lng}
              zoom={zoom}
              onChange={handleLocationChange}
            />
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-ghost"
              onClick={close}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              disabled={!canSave}
              title={
                dateError ||
                (!locationValidated
                  ? 'Select a valid location before saving.'
                  : undefined)
              }
              onClick={() =>
                onSave({
                  id: value?.id || id(),
                  name: name.trim(),
                  country: country.trim(),
                  type: 'city',
                  status,
                  companions: companions
                    .split(',')
                    .map(x => x.trim())
                    .filter(Boolean),
                  tripStart: start,
                  tripEnd: end,
                  lat,
                  lng,
                  journal: value?.journal || [],
                  photos: value?.photos || [],
                })
              }
            >
              Save destination
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}