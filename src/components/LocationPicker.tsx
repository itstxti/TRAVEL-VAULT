import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const pinIcon = L.divIcon({
  className: '',
  html: `<div class="picker-pin"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 20],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Keeps the map view in sync whenever lat/lng change from outside the map
// itself (typed coordinates, a geocoding result, a country pick) — this is
// the "self-updating" part: the map always reflects the current pin.
function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      map.setView([lat, lng], zoom);
      first.current = false;
      return;
    }
    map.flyTo([lat, lng], Math.max(map.getZoom(), zoom), { duration: 0.6 });
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function LocationPicker({
  lat, lng, zoom = 5, onChange,
}: {
  lat: number; lng: number; zoom?: number; onChange: (lat: number, lng: number) => void;
}) {
  return (
    <div className="location-picker">
      <MapContainer center={[lat, lng]} zoom={zoom} scrollWheelZoom={false} className="picker-map">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={pinIcon} draggable eventHandlers={{
          dragend: e => {
            const p = (e.target as L.Marker).getLatLng();
            onChange(p.lat, p.lng);
          }
        }} />
        <ClickHandler onPick={onChange} />
        <Recenter lat={lat} lng={lng} zoom={zoom} />
      </MapContainer>
      <div className="bottom-bar-map">
        <p className="picker-hint">Click the map or drag the pin to set the exact spot.</p>
        <div className="coord-readout">
          <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
        </div>
      </div>
    </div>

  );
}

