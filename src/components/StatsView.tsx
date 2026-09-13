import React, { useMemo } from 'react';
import { Destination } from '../types';
import { tripDays } from '../utils';
import { countryData, flag } from '../data';
import { IconStampEmpty, IconCamera, IconNotebook, IconCalendar } from '../icons';

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

interface TripExtreme {
  name: string;
  days: number;
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
  soloTrips: number;
  tripsWithCompanions: number;
  companionFrequency: NamedCount[];
}

// Single pass over `dest` (and each destination's own photos/journal arrays,
// which is unavoidable since that's where the data lives). Everything the
// page needs comes out of this one reduce instead of the dozen+ separate
// .filter()/.map() calls a naive version would run over the same array.
function computeStats(dest: Destination[]): Stats {
  const countryMap = new Map<string, CountryStat>();
  const companionCounts = new Map<string, number>();

  let visited = 0, planned = 0, wantToGo = 0;
  let photos = 0, journalEntries = 0;
  let destinationsWithPhotos = 0, destinationsWithJournal = 0;
  let mostPhotographed: NamedCount | null = null;
  let latestJournalDate: string | null = null;
  let tripCount = 0, totalTripDays = 0;
  let longestTrip: TripExtreme | null = null;
  let shortestTrip: TripExtreme | null = null;
  let soloTrips = 0, tripsWithCompanions = 0;

  for (const d of dest) {
    if (d.status === 'visited') visited++;
    else if (d.status === 'planned') planned++;
    else wantToGo++;

    const key = d.country || 'Unspecified';
    const c = countryMap.get(key) ?? { country: key, total: 0, visited: 0, planned: 0, wantToGo: 0 };
    c.total++;
    if (d.status === 'visited') c.visited++;
    else if (d.status === 'planned') c.planned++;
    else c.wantToGo++;
    countryMap.set(key, c);

    if (d.photos.length) {
      photos += d.photos.length;
      destinationsWithPhotos++;
      if (!mostPhotographed || d.photos.length > mostPhotographed.count) {
        mostPhotographed = { name: d.name, count: d.photos.length };
      }
    }

    if (d.journal.length) {
      journalEntries += d.journal.length;
      destinationsWithJournal++;
      for (const entry of d.journal) {
        if (!latestJournalDate || entry.date > latestJournalDate) latestJournalDate = entry.date;
      }
    }

    const days = tripDays(d.tripStart, d.tripEnd);
    if (days !== null) {
      tripCount++;
      totalTripDays += days;
      if (!longestTrip || days > longestTrip.days) longestTrip = { name: d.name, days };
      if (!shortestTrip || days < shortestTrip.days) shortestTrip = { name: d.name, days };
      if (d.companions.length) tripsWithCompanions++;
      else soloTrips++;
    }

    for (const companion of d.companions) {
      companionCounts.set(companion, (companionCounts.get(companion) ?? 0) + 1);
    }
  }

  const countryBreakdown = [...countryMap.values()].sort((a, b) => b.total - a.total || a.country.localeCompare(b.country));
  const companionFrequency = [...companionCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    total: dest.length,
    visited,
    planned,
    wantToGo,
    countriesTotal: countryMap.size,
    countriesVisited: countryBreakdown.filter(c => c.visited > 0).length,
    photos,
    journalEntries,
    destinationsWithPhotos,
    destinationsWithJournal,
    avgPhotosPerDestination: destinationsWithPhotos ? photos / destinationsWithPhotos : 0,
    mostPhotographed,
    latestJournalDate,
    countryBreakdown,
    tripCount,
    totalTripDays,
    avgTripDays: tripCount ? totalTripDays / tripCount : 0,
    longestTrip,
    shortestTrip,
    soloTrips,
    tripsWithCompanions,
    companionFrequency,
  };
}

function OverviewCard({ value, label, accent }: { value: number | string; label: string; accent?: 'visited' | 'planned' | 'want_to_go' }) {
  return (
    <div className={'stats-card' + (accent ? ` stats-card-accent-${accent}` : '')}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function MiniStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="stats-mini-stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="stats-section-title">{children}</div>;
}

export default function StatsView({ dest }: { dest: Destination[] }) {
  const stats = useMemo(() => computeStats(dest), [dest]);

  if (!stats.total) {
    return (
      <section className="view active">
        <div className="empty-state">
          <IconStampEmpty className="empty-state-icon" />
          <h1>Nothing to measure yet</h1>
          <p>Add a few destinations and your travel statistics will show up here.</p>
        </div>
      </section>
    );
  }

  const maxStatus = Math.max(stats.visited, stats.planned, stats.wantToGo, 1);
  const maxCompanion = Math.max(...stats.companionFrequency.map(c => c.count), 1);

  const topCountries = stats.countryBreakdown
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const maxCountry = Math.max(
    ...topCountries.map(c => c.total),
    1
  );

  return (
    <section className="view active stats-view">
      <div className="stats-section">
        <SectionTitle>Overview</SectionTitle>
        <div className="stats-card-grid stats-primary-grid">
          <OverviewCard value={stats.total} label="Destinations" />
          <OverviewCard value={stats.visited} label="Visited" accent="visited" />
          <OverviewCard value={stats.planned} label="Planned" accent="planned" />
          <OverviewCard value={stats.wantToGo} label="Want to go" accent="want_to_go" />
        </div>
        <div className="stats-secondary-row">
          <MiniStat value={stats.countriesTotal} label="Countries" />
          <MiniStat value={stats.photos} label="Photos" />
          <MiniStat value={stats.journalEntries} label="Journal entries" />
        </div>
      </div>

      <div className="stats-section">
        <SectionTitle>Destination Status</SectionTitle>
        <div className="stats-card">
          <div className="bar-chart">
            {([
              ['Visited', stats.visited, 'visited'],
              ['Planned', stats.planned, 'planned'],
              ['Want to go', stats.wantToGo, 'want_to_go'],
            ] as const).map(([label, value, statusKey]) => (
              <div className="bar-row" key={label}>
                <span className="bar-label">{label}</span>
                <div className="bar-track">
                  <div className={`bar-fill bar-${statusKey}`} style={{ width: `${(value / maxStatus) * 100}%` }} />
                </div>
                <span className="bar-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-section">
        <SectionTitle>Top Countries</SectionTitle>
        <div className="stats-card">
          <div className="bar-chart">
            {stats.countryBreakdown
              .slice()
              .sort((a, b) => b.total - a.total)
              .slice(0, 5)
              .map(c => (
                <div className="bar-row" key={c.country}>
                  <span className="bar-label">{c.country}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(c.total / maxCountry) * 100}%`,
                      }}
                    />
                  </div>

                  <span className="bar-value">{c.total}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {stats.tripCount > 0 && (
        <div className="stats-section">
          <SectionTitle><IconCalendar size={17} /> Travel Activity</SectionTitle>
          <div className="stats-card-grid">
            <OverviewCard value={stats.totalTripDays} label="Total days" />
            <OverviewCard value={stats.tripCount} label="Trips" />
            <OverviewCard value={stats.avgTripDays.toFixed(1)} label="Avg. trip length" />
            <OverviewCard value={stats.longestTrip?.days ?? 0} label="Longest trip" />
            <OverviewCard value={stats.shortestTrip?.days ?? 0} label="Shortest trip" />
          </div>
          {(stats.longestTrip || stats.shortestTrip) && (
            <p className="stats-footnote">
              {stats.longestTrip && <>Longest: <b>{stats.longestTrip.name}</b> ({stats.longestTrip.days} days)</>}
              {stats.longestTrip && stats.shortestTrip && ' · '}
              {stats.shortestTrip && <>Shortest: <b>{stats.shortestTrip.name}</b> ({stats.shortestTrip.days} days)</>}
            </p>
          )}
        </div>
      )}

      <div className="stats-two-col">
        <div className="stats-section">
          <SectionTitle><IconNotebook size={17} /> Journal</SectionTitle>
          <div className="stats-card-grid stats-card-grid-narrow">
            <OverviewCard value={stats.journalEntries} label="Entries" />
            <OverviewCard value={stats.destinationsWithJournal} label="With entries" />
          </div>
          {stats.latestJournalDate && (
            <p className="stats-footnote">Latest entry: <b>{stats.latestJournalDate}</b></p>
          )}
        </div>

        <div className="stats-section">
          <SectionTitle><IconCamera size={17} /> Gallery</SectionTitle>
          <div className="stats-card-grid stats-card-grid-narrow">
            <OverviewCard value={stats.photos} label="Photos" />
            <OverviewCard value={stats.avgPhotosPerDestination.toFixed(1)} label="Avg. / destination" />
          </div>
          {stats.mostPhotographed && (
            <p className="stats-footnote">
              Most photographed: <b>{stats.mostPhotographed.name}</b> · {stats.mostPhotographed.count} photos
            </p>
          )}
        </div>
      </div>

      {stats.companionFrequency.length > 0 && (
        <div className="stats-section">
          <SectionTitle>Travel Companions</SectionTitle>
          <div className="stats-card">
            <div className="stats-card-grid stats-card-grid-narrow" style={{ marginBottom: 16 }}>
              <OverviewCard value={stats.soloTrips} label="Solo trips" />
              <OverviewCard value={stats.tripsWithCompanions} label="With companions" />
            </div>
            <div className="country-stat-list">
              {stats.companionFrequency.map(c => (
                <div className="country-stat-row" key={c.name}>
                  <span className="country-stat-name">{c.name}</span>
                  <div className="bar-track bar-track-small">
                    <div className="bar-fill bar-planned" style={{ width: `${(c.count / maxCompanion) * 100}%` }} />
                  </div>
                  <span className="country-stat-count">{c.count} trip{c.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}