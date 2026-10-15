import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { LatLng } from '../lib/supabase';

// Leaflet's default marker icon paths break under bundlers (Vite/webpack)
// because they're resolved relative to the CSS file, not the JS bundle.
// Re-point them at the bundled asset URLs so the pin actually renders.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: LatLng = { lat: 22.9734, lng: 78.6569 }; // Geographic centre of India
const DEFAULT_ZOOM = 5;
const FOCUSED_ZOOM = 16;

type FarmMapProps = {
  /** The farmer's current/farm point, if known. */
  point: LatLng | null;
  /** Boundary vertices drawn so far, in order. */
  boundary: LatLng[];
  /** Whether tapping the map should add a new boundary vertex. */
  drawing: boolean;
  /** Called with the updated boundary whenever the farmer taps the map while drawing. */
  onBoundaryChange: (boundary: LatLng[]) => void;
  /** Optional CSS height for the map container (defaults to a responsive value). */
  heightClassName?: string;
};

function ClickToDraw({ drawing, boundary, onBoundaryChange }: {
  drawing: boolean;
  boundary: LatLng[];
  onBoundaryChange: (b: LatLng[]) => void;
}) {
  useMapEvents({
    click(e: { latlng: { lat: number; lng: number } }) {
      if (!drawing) return;
      onBoundaryChange([...boundary, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    },
  });
  return null;
}

function RecenterOnChange({ point }: { point: LatLng | null }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!point) return;
    map.setView([point.lat, point.lng], hasCentered.current ? map.getZoom() : FOCUSED_ZOOM);
    hasCentered.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point?.lat, point?.lng]);

  return null;
}

export default function FarmMap({ point, boundary, drawing, onBoundaryChange, heightClassName }: FarmMapProps) {
  const initialCenter = point ?? (boundary[0] ?? DEFAULT_CENTER);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200 ${heightClassName ?? 'h-[320px] sm:h-[420px]'}`}
    >
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={point ? FOCUSED_ZOOM : DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', cursor: drawing ? 'crosshair' : undefined }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {point && <Marker position={[point.lat, point.lng]} />}
        {boundary.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]} />
        ))}
        {boundary.length >= 3 && (
          <Polygon
            positions={boundary.map((p) => [p.lat, p.lng]) as [number, number][]}
            pathOptions={{ color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.25 }}
          />
        )}
        <ClickToDraw drawing={drawing} boundary={boundary} onBoundaryChange={onBoundaryChange} />
        <RecenterOnChange point={point} />
      </MapContainer>
    </div>
  );
}
