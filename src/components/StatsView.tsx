import React, { useMemo } from 'react';
import { Destination } from '../types';
import { tripDays } from '../utils';
import {
  IconStampEmpty,
  IconCamera,
  IconNotebook,
  IconCalendar,
} from '../icons';

interface CountryStat {
  country: string;
  total: number;
  visited: number;
  planned: number;
  wantToGo: number;
}

interface NamedCount {
  name: string;
  count: number;
}

interface CompanionStat {
  name: string;
  total: number;
  visited: number;
  planned: number;
  wantToGo: number;
}

interface TripExtreme {
  name: string;
  days: number;
}

interface LatestTrip {
  name: string;
  date: string;
}

interface Stats {
  total: number;
  visited: number;
  planned: number;
  wantToGo: number;

  countriesTotal: number;
  countriesVisited: number;

  photos: number;
  journalEntries: number;
  destinationsWithPhotos: number;
  destinationsWithJournal: number;
  avgPhotosPerDestination: number;

  mostPhotographed: NamedCount | null;
  latestJournalDate: string | null;

  countryBreakdown: CountryStat[];

  tripCount: number;
  totalTripDays: number;
  avgTripDays: number;
  longestTrip: TripExtreme | null;
  shortestTrip: TripExtreme | null;
  latestTrip: LatestTrip | null;

  soloTrips: number;
  soloVisited: number;
  soloPlanned: number;
  soloWantToGo: number;

  tripsWithCompanions: number;
  companionsVisited: number;
  companionsPlanned: number;
  companionsWantToGo: number;

  companionFrequency: CompanionStat[];
}

function computeStats(dest: Destination[]): Stats {
  const countryMap = new Map<string, CountryStat>();

  const companionCounts = new Map<
    string,
    {
      total: number;
      visited: number;
      planned: number;
      wantToGo: number;
    }
  >();

  let visited = 0;
  let planned = 0;
  let wantToGo = 0;

  let photos = 0;
  let journalEntries = 0;

  let destinationsWithPhotos = 0;
  let destinationsWithJournal = 0;

  let visitedPhotos = 0;
  let visitedDestinationsWithPhotos = 0;

  let mostPhotographed: NamedCount | null = null;
  let latestJournalDate: string | null = null;

  let tripCount = 0;
  let totalTripDays = 0;

  let longestTrip: TripExtreme | null = null;
  let shortestTrip: TripExtreme | null = null;
  let latestTrip: LatestTrip | null = null;

  let soloTrips = 0;
  let soloVisited = 0;
  let soloPlanned = 0;
  let soloWantToGo = 0;

  let tripsWithCompanions = 0;
  let companionsVisited = 0;
  let companionsPlanned = 0;
  let companionsWantToGo = 0;

  for (const d of dest) {
    /*
     * Destination status
     */
    if (d.status === 'visited') {
      visited++;
    } else if (d.status === 'planned') {
      planned++;
    } else {
      wantToGo++;
    }

    /*
     * Countries
     */
    const key = d.country || 'Unspecified';

    const c = countryMap.get(key) ?? {
      country: key,
      total: 0,
      visited: 0,
      planned: 0,
      wantToGo: 0,
    };

    c.total++;

    if (d.status === 'visited') {
      c.visited++;
    } else if (d.status === 'planned') {
      c.planned++;
    } else {
      c.wantToGo++;
    }

    countryMap.set(key, c);

    /*
     * Photos
     */
    if (d.photos.length) {
      photos += d.photos.length;
      destinationsWithPhotos++;

      if (
        !mostPhotographed ||
        d.photos.length > mostPhotographed.count
      ) {
        mostPhotographed = {
          name: d.name,
          count: d.photos.length,
        };
      }

      /*
       * Average photos per visited destination
       *
       * Only visited destinations with photos
       * are considered.
       */
      if (d.status === 'visited') {
        visitedPhotos += d.photos.length;
        visitedDestinationsWithPhotos++;
      }
    }

    /*
     * Journal
     */
    if (d.journal.length) {
      journalEntries += d.journal.length;
      destinationsWithJournal++;

      for (const entry of d.journal) {
        if (
          !latestJournalDate ||
          entry.date > latestJournalDate
        ) {
          latestJournalDate = entry.date;
        }
      }
    }

    /*
     * Trips
     *
     * Only visited destinations with valid start/end dates
     * are counted as completed trips.
     */
    const days = tripDays(
      d.tripStart,
      d.tripEnd
    );

    if (
      d.status === 'visited' &&
      days !== null
    ) {
      tripCount++;
      totalTripDays += days;

      if (
        !longestTrip ||
        days > longestTrip.days
      ) {
        longestTrip = {
          name: d.name,
          days,
        };
      }

      if (
        !shortestTrip ||
        days < shortestTrip.days
      ) {
        shortestTrip = {
          name: d.name,
          days,
        };
      }

      /*
       * Latest completed trip
       *
       * Based on the most recent trip end date.
       */
      if (
        d.tripEnd &&
        (
          !latestTrip ||
          d.tripEnd > latestTrip.date
        )
      ) {
        latestTrip = {
          name: d.name,
          date: d.tripEnd,
        };
      }
    }

    /*
     * Solo / companion trips
     *
     * These include all destinations regardless of status.
     */
    if (d.companions.length) {
      tripsWithCompanions++;

      if (d.status === 'visited') {
        companionsVisited++;
      } else if (d.status === 'planned') {
        companionsPlanned++;
      } else {
        companionsWantToGo++;
      }
    } else {
      soloTrips++;

      if (d.status === 'visited') {
        soloVisited++;
      } else if (d.status === 'planned') {
        soloPlanned++;
      } else {
        soloWantToGo++;
      }
    }

    /*
     * Travel companions
     */
    for (const companion of d.companions) {
      const current = companionCounts.get(companion) ?? {
        total: 0,
        visited: 0,
        planned: 0,
        wantToGo: 0,
      };

      current.total++;

      if (d.status === 'visited') {
        current.visited++;
      } else if (d.status === 'planned') {
        current.planned++;
      } else {
        current.wantToGo++;
      }

      companionCounts.set(
        companion,
        current
      );
    }
  }

  /*
   * Countries sorted by number of destinations
   */
  const countryBreakdown = [
    ...countryMap.values(),
  ].sort(
    (a, b) =>
      b.total - a.total ||
      a.country.localeCompare(b.country)
  );

  /*
   * Travel companions sorted by total trips
   */
  const companionFrequency = [
    ...companionCounts.entries(),
  ]
    .map(([name, stats]) => ({
      name,
      total: stats.total,
      visited: stats.visited,
      planned: stats.planned,
      wantToGo: stats.wantToGo,
    }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.name.localeCompare(b.name)
    )
    .slice(0, 8);

  return {
    total: dest.length,

    visited,
    planned,
    wantToGo,

    countriesTotal: countryMap.size,

    countriesVisited:
      countryBreakdown.filter(
        c => c.visited > 0
      ).length,

    photos,
    journalEntries,

    destinationsWithPhotos,
    destinationsWithJournal,

    avgPhotosPerDestination:
      visitedDestinationsWithPhotos > 0
        ? visitedPhotos /
          tripCount // All visited destinations are considered for this average
        : 0,

    mostPhotographed,
    latestJournalDate,

    countryBreakdown,

    tripCount,
    totalTripDays,

    avgTripDays: tripCount
      ? totalTripDays / tripCount
      : 0,

    longestTrip,
    shortestTrip,
    latestTrip,

    soloTrips,
    soloVisited,
    soloPlanned,
    soloWantToGo,

    tripsWithCompanions,
    companionsVisited,
    companionsPlanned,
    companionsWantToGo,

    companionFrequency,
  };
}

function OverviewCard({
  value,
  label,
  detail,
  accent,
}: {
  value: number | string;
  label: string;
  detail?: string;
  accent?: 'visited' | 'planned' | 'want_to_go';
}) {
  return (
    <div
      className={
        'stats-card' +
        (accent
          ? ` stats-card-accent-${accent}`
          : '')
      }
    >
      <b>{value}</b>

      <span>{label}</span>

      {detail && (
        <small className="stats-card-detail">
          {detail}
        </small>
      )}
    </div>
  );
}

function CompanionSummaryCard({
  total,
  label,
  visited,
  planned,
  wantToGo,
}: {
  total: number;
  label: string;
  visited: number;
  planned: number;
  wantToGo: number;
}) {
  return (
    <div className="stats-card companion-summary-card">
      <b>{total}</b>

      <span>{label}</span>

      <div className="companion-summary-breakdown">
        {visited > 0 && (
          <span>
            <i className="legend-dot bar-visited" />
            {visited} visited
          </span>
        )}

        {planned > 0 && (
          <span>
            <i className="legend-dot bar-planned" />
            {planned} planned
          </span>
        )}

        {wantToGo > 0 && (
          <span>
            <i className="legend-dot bar-want_to_go" />
            {wantToGo} want to go
          </span>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="stats-mini-stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="stats-section-title">
      {children}
    </div>
  );
}

export default function StatsView({
  dest,
}: {
  dest: Destination[];
}) {
  const stats = useMemo(
    () => computeStats(dest),
    [dest]
  );

  if (!stats.total) {
    return (
      <section className="view active">
        <div className="empty-state">
          <IconStampEmpty className="empty-state-icon" />

          <h1>Nothing to measure yet</h1>

          <p>
            Add a few destinations and your travel
            statistics will show up here.
          </p>
        </div>
      </section>
    );
  }

  /*
   * Top 5 countries
   */
  const topCountries = stats.countryBreakdown
    .slice()
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.country.localeCompare(b.country)
    )
    .slice(0, 5);

  return (
    <section className="view active stats-view">

      {/* Overview */}
      <div className="stats-section">
        <SectionTitle>
          Overview
        </SectionTitle>

        <div className="stats-card-grid stats-primary-grid">
          <OverviewCard
            value={stats.total}
            label="Destinations"
          />

          <OverviewCard
            value={stats.visited}
            label="Visited"
            accent="visited"
          />

          <OverviewCard
            value={stats.planned}
            label="Planned"
            accent="planned"
          />

          <OverviewCard
            value={stats.wantToGo}
            label="Want to go"
            accent="want_to_go"
          />
        </div>

        <div className="stats-secondary-row">
          <MiniStat
            value={stats.countriesTotal}
            label="Countries"
          />

          <MiniStat
            value={stats.photos}
            label="Photos"
          />

          <MiniStat
            value={stats.journalEntries}
            label="Journal entries"
          />
        </div>
      </div>

      {/* Destination Status */}
      <div className="stats-section">
        <SectionTitle>
          Destination Status
        </SectionTitle>

        <div className="stats-card destination-status-card">
          <div className="status-donut">
            <svg
              viewBox="0 0 120 120"
              className="status-donut-svg"
            >
              {(() => {
                const total =
                  stats.visited +
                  stats.planned +
                  stats.wantToGo;

                if (total === 0) {
                  return (
                    <circle
                      cx="60"
                      cy="60"
                      r="45"
                      fill="none"
                      stroke="var(--paper-dark)"
                      strokeWidth="14"
                    />
                  );
                }

                const circumference =
                  2 * Math.PI * 45;

                const visitedLength =
                  (stats.visited / total) *
                  circumference;

                const plannedLength =
                  (stats.planned / total) *
                  circumference;

                const wantToGoLength =
                  (stats.wantToGo / total) *
                  circumference;

                let offset = 0;

                const segments = [
                  {
                    value: stats.visited,
                    length: visitedLength,
                    className:
                      'donut-visited',
                  },
                  {
                    value: stats.planned,
                    length: plannedLength,
                    className:
                      'donut-planned',
                  },
                  {
                    value: stats.wantToGo,
                    length: wantToGoLength,
                    className:
                      'donut-want-to-go',
                  },
                ];

                return segments.map(
                  segment => {
                    const currentOffset =
                      offset;

                    offset += segment.length;

                    if (
                      segment.value === 0
                    ) {
                      return null;
                    }

                    return (
                      <circle
                        key={
                          segment.className
                        }
                        cx="60"
                        cy="60"
                        r="45"
                        fill="none"
                        className={
                          segment.className
                        }
                        strokeWidth="14"
                        strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                        strokeDashoffset={
                          -currentOffset
                        }
                      />
                    );
                  }
                );
              })()}

              <text
                x="60"
                y="56"
                textAnchor="middle"
                className="donut-total"
              >
                {stats.total}
              </text>

              <text
                x="60"
                y="70"
                textAnchor="middle"
                className="donut-label"
              >
                DESTINATIONS
              </text>
            </svg>
          </div>

          <div className="status-legend">
            <div className="status-legend-item">
              <span className="legend-dot bar-visited" />
              <span>Visited</span>
              <b>{stats.visited}</b>
            </div>

            <div className="status-legend-item">
              <span className="legend-dot bar-planned" />
              <span>Planned</span>
              <b>{stats.planned}</b>
            </div>

            <div className="status-legend-item">
              <span className="legend-dot bar-want_to_go" />
              <span>Want to go</span>
              <b>{stats.wantToGo}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Top Countries */}
      <div className="stats-section">
        <SectionTitle>
          Top Countries
        </SectionTitle>

        <div className="stats-card">
          <div className="bar-chart">
            {topCountries.map(c => (
              <div
                className="bar-row"
                key={c.country}
              >
                <span className="bar-label">
                  {c.country}
                </span>

                <div className="bar-track country-bar-track">
                  <div
                    className="country-bar-segments"
                    style={{
                      width: '100%',
                    }}
                  >
                    {c.visited > 0 && (
                      <div
                        className="country-bar-segment bar-visited"
                        style={{
                          width: `${
                            (c.visited /
                              c.total) *
                            100
                          }%`,
                        }}
                      />
                    )}

                    {c.planned > 0 && (
                      <div
                        className="country-bar-segment bar-planned"
                        style={{
                          width: `${
                            (c.planned /
                              c.total) *
                            100
                          }%`,
                        }}
                      />
                    )}

                    {c.wantToGo > 0 && (
                      <div
                        className="country-bar-segment bar-want_to_go"
                        style={{
                          width: `${
                            (c.wantToGo /
                              c.total) *
                            100
                          }%`,
                        }}
                      />
                    )}
                  </div>
                </div>

                <span className="bar-value">
                  {c.total}
                </span>
              </div>
            ))}
          </div>

          <div className="country-legend">
            <span>
              <i className="legend-dot bar-visited" />
              Visited
            </span>

            <span>
              <i className="legend-dot bar-planned" />
              Planned
            </span>

            <span>
              <i className="legend-dot bar-want_to_go" />
              Want to go
            </span>
          </div>
        </div>
      </div>

      {/* Travel Activity */}
      {stats.tripCount > 0 && (
        <div className="stats-section">
          <SectionTitle>
            <IconCalendar size={17} />
            Travel Activity
          </SectionTitle>

          <div className="stats-card-grid">
            <OverviewCard
              value={stats.totalTripDays}
              label="Total days"
            />

            <OverviewCard
              value={stats.tripCount}
              label="Trips"
            />

            <OverviewCard
              value={stats.avgTripDays.toFixed(1)}
              label="Avg. trip length"
            />
          </div>

          <div className="stats-card-grid">
            <OverviewCard
              value={
                stats.longestTrip?.days ?? 0
              }
              label="Longest trip"
              detail={
                stats.longestTrip?.name
              }
            />

            <OverviewCard
              value={
                stats.shortestTrip?.days ?? 0
              }
              label="Shortest trip"
              detail={
                stats.shortestTrip?.name
              }
            />

            <OverviewCard
              value={
                stats.latestTrip
                  ? new Date(
                      stats.latestTrip.date +
                        'T00:00:00'
                    ).toLocaleDateString('en-GB')
                  : '—'
              }
              label="Latest trip"
              detail={
                stats.latestTrip?.name
              }
            />
          </div>
        </div>
      )}

      {/* Journal + Gallery */}
      <div className="stats-two-col">

        <div className="stats-section">
          <SectionTitle>
            <IconNotebook size={17} />
            Journal
          </SectionTitle>

          <div className="stats-card-grid stats-card-grid-narrow">
            <OverviewCard
              value={stats.journalEntries}
              label="Entries"
            />

            <OverviewCard
              value={
                stats.destinationsWithJournal
              }
              label="With entries"
            />
          </div>

          {stats.latestJournalDate && (
            <p className="stats-footnote">
              Latest entry:{' '}
              <b>
                {stats.latestJournalDate}
              </b>
            </p>
          )}
        </div>

        <div className="stats-section">
          <SectionTitle>
            <IconCamera size={17} />
            Gallery
          </SectionTitle>

          <div className="stats-card-grid stats-card-grid-narrow">
            <OverviewCard
              value={stats.photos}
              label="Photos"
            />

            <OverviewCard
              value={stats.avgPhotosPerDestination.toFixed(
                1
              )}
              label="Avg. / destination"
            />
          </div>

          {stats.mostPhotographed && (
            <p className="stats-footnote">
              Most photographed:{' '}
              <b>
                {stats.mostPhotographed.name}
              </b>{' '}
              ·{' '}
              {stats.mostPhotographed.count}{' '}
              photos
            </p>
          )}
        </div>

      </div>

      {/* Travel Companions */}
      {stats.companionFrequency.length > 0 && (
        <div className="stats-section">
          <SectionTitle>
            Travel Companions
          </SectionTitle>

          <div className="stats-card">

            <div
              className="stats-card-grid stats-card-grid-narrow"
              style={{
                marginBottom: 16,
              }}
            >
              <CompanionSummaryCard
                total={stats.soloTrips}
                label="Solo trips"
                visited={
                  stats.soloVisited
                }
                planned={
                  stats.soloPlanned
                }
                wantToGo={
                  stats.soloWantToGo
                }
              />

              <CompanionSummaryCard
                total={
                  stats.tripsWithCompanions
                }
                label="With companions"
                visited={
                  stats.companionsVisited
                }
                planned={
                  stats.companionsPlanned
                }
                wantToGo={
                  stats.companionsWantToGo
                }
              />
            </div>

            <div className="bar-chart">
              {stats.companionFrequency.map(
                c => (
                  <div
                    className="bar-row"
                    key={c.name}
                  >
                    <span className="bar-label">
                      {c.name}
                    </span>

                    <div className="bar-track country-bar-track">
                      <div
                        className="country-bar-segments"
                        style={{
                          width: '100%',
                        }}
                      >
                        {c.visited > 0 && (
                          <div
                            className="country-bar-segment bar-visited"
                            style={{
                              width: `${
                                (c.visited /
                                  c.total) *
                                100
                              }%`,
                            }}
                          />
                        )}

                        {c.planned > 0 && (
                          <div
                            className="country-bar-segment bar-planned"
                            style={{
                              width: `${
                                (c.planned /
                                  c.total) *
                                100
                              }%`,
                            }}
                          />
                        )}

                        {c.wantToGo > 0 && (
                          <div
                            className="country-bar-segment bar-want_to_go"
                            style={{
                              width: `${
                                (c.wantToGo /
                                  c.total) *
                                100
                              }%`,
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <span className="bar-value">
                      {c.total}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="country-legend">
              <span>
                <i className="legend-dot bar-visited" />
                Visited
              </span>

              <span>
                <i className="legend-dot bar-planned" />
                Planned
              </span>

              <span>
                <i className="legend-dot bar-want_to_go" />
                Want to go
              </span>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}