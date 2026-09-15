import { useEffect, useMemo, useRef, useState } from 'react';
import { Destination, Status } from '../types';
import { id, debounce } from '../utils';
import {
  searchPlace,
  reverseGeocode,
  GeocodeResult,
} from '../geocode';
import {
  IconSearch,
  IconSpinner,
  IconClose,
} from '../icons';
import LocationPicker from './LocationPicker';

const statusLabels: Record<Status, string> = {
  want_to_go: 'Want to go',
  planned: 'Planned',
  visited: 'Visited',
};

type SearchState =
  | 'idle'
  | 'searching'
  | 'found'
  | 'notfound'
  | 'error';

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

  const [start, setStart] = useState(
    value?.tripStart || ''
  );

  const [end, setEnd] = useState(
    value?.tripEnd || ''
  );

  const [companions, setCompanions] = useState(
    value?.companions.join(', ') || ''
  );

  const [lat, setLat] = useState(
    value?.lat ?? 20
  );

  const [lng, setLng] = useState(
    value?.lng ?? 0
  );

  const [zoom, setZoom] = useState(
    value ? 6 : 2
  );

  // Existing destinations already have a valid location.
  // New destinations must select a place from search
  // or successfully resolve a location from the map.
  const [locationValidated, setLocationValidated] =
    useState(!!value);

  const [query, setQuery] = useState(
    value
      ? `${value.name}, ${value.country}`
      : ''
  );

  const [searchState, setSearchState] =
    useState<SearchState>(
      value ? 'found' : 'idle'
    );

  const [results, setResults] = useState<
    GeocodeResult[]
  >([]);

  const abortRef =
    useRef<AbortController | null>(null);

  const runSearch = useRef(
    debounce(async (q: string) => {
      if (q.trim().length < 2) {
        setSearchState('idle');
        setResults([]);
        return;
      }

      abortRef.current?.abort();

      const controller =
        new AbortController();

      abortRef.current = controller;

      setSearchState('searching');

      try {
        const hits = await searchPlace(
          q,
          controller.signal
        );

        setResults(hits);

        setSearchState(
          hits.length
            ? 'found'
            : 'notfound'
        );
      } catch (e) {
        if (
          (e as any)?.name !== 'AbortError'
        ) {
          setSearchState('error');
          setResults([]);
        }
      }
    }, 550)
  ).current;

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  const pickResult = (
    r: GeocodeResult
  ) => {
    setName(r.city);
    setCountry(r.country || '');

    setLat(r.lat);
    setLng(r.lng);
    setZoom(11);

    setLocationValidated(
      Boolean(r.city && r.country)
    );

    // Keep the selected place visible
    // in the search field.
    setQuery(r.label);

    setResults([]);
    setSearchState('found');
  };

  const reverseAbortRef =
    useRef<AbortController | null>(null);

  const runReverse = useRef(
    debounce(
      async (
        revLat: number,
        revLng: number
      ) => {
        reverseAbortRef.current?.abort();

        const controller =
          new AbortController();

        reverseAbortRef.current =
          controller;

        try {
          const {
            city,
            country: revCountry,
          } = await reverseGeocode(
            revLat,
            revLng,
            controller.signal
          );

          if (
            city &&
            revCountry
          ) {
            setName(city);
            setCountry(revCountry);

            setQuery(
              `${city}, ${revCountry}`
            );

            setLocationValidated(true);
          } else {
            setLocationValidated(false);
          }
        } catch (e) {
          if (
            (e as any)?.name !==
            'AbortError'
          ) {
            console.error(
              'Error obtaining location:',
              e
            );

            setLocationValidated(false);
          }
        }
      },
      400
    )
  ).current;

  const handleLocationChange = (
    newLat: number,
    newLng: number
  ) => {
    setLat(newLat);
    setLng(newLng);

    // The coordinates changed, so wait for
    // reverse geocoding to validate the new place.
    setLocationValidated(false);

    runReverse(
      newLat,
      newLng
    );
  };

  const dateError = useMemo(() => {
    if (!start || !end) {
      return null;
    }

    return end < start
      ? "The end date can't be before the start date."
      : null;
  }, [start, end]);

  const canSave =
    locationValidated &&
    name.trim().length > 0 &&
    country.trim().length > 0 &&
    !dateError;

  return (
    <div
      className="overlay active"
      onMouseDown={e =>
        e.target === e.currentTarget &&
        close()
      }
    >
      <div className="modal">
        <div className="modal-header">
          <h2>
            {value
              ? 'Edit destination'
              : 'New destination'}
          </h2>

          <button
            className="modal-close"
            aria-label="Close"
            onClick={close}
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Search */}
          <div className="field">
            <label>
              Search for a place
            </label>

            <div className="search-box">
              <IconSearch
                size={15}
                className="search-box-icon"
              />

              <input
                value={query}
                onChange={e =>
                  setQuery(e.target.value)
                }
                placeholder="Try a city, landmark or region…"
              />

              {searchState ===
                'searching' && (
                <IconSpinner
                  className="search-box-spinner"
                />
              )}
            </div>

            {searchState ===
              'searching' && (
              <p className="hint hint-searching">
                Searching…
              </p>
            )}

            {searchState ===
              'notfound' && (
              <p className="hint hint-notfound">
                No matches found. Try a
                different spelling.
              </p>
            )}

            {searchState ===
              'error' && (
              <p className="hint hint-notfound">
                Search failed. Try again
                or select a location on
                the map below.
              </p>
            )}

            {results.length > 0 && (
              <ul className="search-results">
                {results.map((r, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() =>
                        pickResult(r)
                      }
                    >
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Location information */}
          <div className="field-row">
            <div className="field">
              <label>
                City
              </label>

              <input
                value={name}
                readOnly
                placeholder="Select a place above"
              />
            </div>

            <div className="field">
              <label>
                Country
              </label>

              <input
                value={country}
                readOnly
                placeholder="Select a place above"
              />
            </div>
          </div>

          {/* Status */}
          <div className="field">
            <label>
              Status
            </label>

            <select
              aria-label="Status"
              value={status}
              onChange={e =>
                setStatus(
                  e.target.value as Status
                )
              }
            >
              {Object.entries(
                statusLabels
              ).map(([v, l]) => (
                <option
                  value={v}
                  key={v}
                >
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Companions */}
          <div className="field">
            <label>
              Traveling with (optional)
            </label>

            <input
              value={companions}
              onChange={e =>
                setCompanions(
                  e.target.value
                )
              }
              placeholder="Comma-separated names"
            />
          </div>

          {/* Trip dates */}
          <div className="field">
            <label>
              Trip dates
            </label>

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
                    setStart(
                      e.target.value
                    )
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
                  min={
                    start || undefined
                  }
                  aria-invalid={
                    !!dateError
                  }
                  value={end}
                  style={{
                    borderRadius: '5px',
                    width: '100px',
                  }}
                  onChange={e =>
                    setEnd(
                      e.target.value
                    )
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

          {/* Map */}
          <div className="field">
            <label>
              Location on the map
            </label>

            <LocationPicker
              lat={lat}
              lng={lng}
              zoom={zoom}
              onChange={
                handleLocationChange
              }
            />

            {!locationValidated && (
              <p className="hint hint-notfound">
                Select a place from the
                search results or choose a
                valid location on the map.
              </p>
            )}
          </div>

          {/* Footer */}
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
                  id:
                    value?.id || id(),
                  name: name.trim(),
                  country:
                    country.trim(),
                  type: 'city',
                  status,
                  companions:
                    companions
                      .split(',')
                      .map(x =>
                        x.trim()
                      )
                      .filter(Boolean),
                  tripStart: start,
                  tripEnd: end,
                  lat,
                  lng,
                  journal:
                    value?.journal || [],
                  photos:
                    value?.photos || [],
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