import { Destination } from '../types';
import { countryData, flag } from '../data';
import { IconStampEmpty } from '../icons';
import Card from './Card';

export default function List({
  list, update, remove, openEdit, openGallery, openNotes,
}: {
  list: Destination[];
  update: (d: Destination) => void;
  remove: (d: Destination) => void;
  openEdit: (d: Destination) => void;
  openGallery: (d: Destination) => void;
  openNotes: (d: Destination) => void;
}) {
  const groups = list.reduce((acc, d) => {
    (acc[d.country || 'Unspecified'] ??= []).push(d);
    return acc;
  }, {} as Record<string, Destination[]>);

  return (
    <section className="view active">
      {!list.length ? (
        <div className="empty-state">
          <IconStampEmpty className="empty-state-icon" />
          <h1>Your vault is empty</h1>
          <p>Add the first place you'd like to travel to.</p>
        </div>
      ) : (
        Object.entries(groups).sort().map(([country, items]) => (
          <div className="country-group" key={country}>
            <div className="country-head">
              <span className="country-flag">{flag(countryData(country)?.[1])}</span>
              <span className="country-name">{country}</span>
              <span className="country-count">{items.length} destination{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="card-grid">
              {items.map(d => (
                <Card key={d.id} d={d} update={update} remove={remove} openEdit={openEdit} openGallery={openGallery} openNotes={openNotes} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
