import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';
import { Destination, Status } from '../types';
import { IconStampEmpty } from '../icons';


const statusLabels: Record<Status, string> = {
  want_to_go: 'Want to go',
  planned: 'Planned',
  visited: 'Visited',
};

const statusColors: Record<Status, string> = {
  want_to_go: '#A8A8A8',
  planned: '#E9C46A',
  visited: '#2A9D8F',
};

export default function MapView({
  list,
}: {
  list: Destination[];
}) {
  return (
    <section className="view active">
      {list.length === 0 ? (
        <div className="empty-state">
          <IconStampEmpty className="empty-state-icon" />         
          <h1>No destinations to show yet</h1>
          <p>
            Add a destination to see it appear on the map.
          </p>
        </div>
      ) : (
        <>
          <div className="map-legend">
            {Object.entries(statusColors).map(([status, color]) => (
              <span key={status}>
                <span
                  className="legend-dot"
                  style={{ background: color }}
                />
                {statusLabels[status as Status]}
              </span>
            ))}
          </div>

          <MapContainer
            id="map-full"
            center={[20, 0]}
            zoom={2}
            scrollWheelZoom
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {list.map((destination) => (
              <Marker
                key={destination.id}
                position={[
                  destination.lat,
                  destination.lng,
                ]}
                icon={L.divIcon({
                  className: '',
                  html: `
                    <div
                      style="
                        width:16px;
                        height:16px;
                        border-radius:50%;
                        background:${statusColors[destination.status]};
                        border:2px solid #1B2A3D;
                      "
                    ></div>
                  `,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                })}
              >
                <Popup>
                  <strong>{destination.name}</strong>
                  <br />
                  {destination.country}
                  <br />
                  {statusLabels[destination.status]}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </>
      )}
    </section>
  );
}