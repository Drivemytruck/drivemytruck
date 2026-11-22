"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export type MapJob = {
  id: string;
  lat: number;
  lng: number;
  price: string;
  title: string;
  company: string;
  when: string;
  place: string;
  distance: number | null;
  badge?: string;
};

const MILE = 1609.34;
const UK_CENTER: [number, number] = [52.6, -1.6];

function pin(price: string, highlighted: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="dmt-pin${highlighted ? " dmt-pin--applied" : ""}">${price}</div>`,
    iconSize: [64, 30],
    iconAnchor: [32, 30],
    popupAnchor: [0, -28],
  });
}

export default function JobsMap({
  jobs,
  home,
  radiusMiles,
}: {
  jobs: MapJob[];
  home: { lat: number; lng: number } | null;
  radiusMiles: number;
}) {
  const center: [number, number] = home ? [home.lat, home.lng] : UK_CENTER;
  const zoom = home ? (radiusMiles > 60 ? 7 : radiusMiles > 30 ? 8 : 9) : 6;
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-[65vh] min-h-[380px] w-full rounded-2xl border border-slate-200 shadow-sm">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      {home && (
        <>
          <Circle center={[home.lat, home.lng]} radius={radiusMiles * MILE} pathOptions={{ color: "#0b2a5b", weight: 1.5, fillOpacity: 0.06 }} />
          <CircleMarker center={[home.lat, home.lng]} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#1d4a8c", fillOpacity: 1 }}>
            <Popup>You (home postcode)</Popup>
          </CircleMarker>
        </>
      )}
      {jobs.map((j) => (
        <Marker key={j.id} position={[j.lat, j.lng]} icon={pin(j.price, !!j.badge)}>
          <Popup>
            <div className="min-w-48 space-y-1 font-sans">
              <p className="text-sm font-bold text-navy-900">{j.title}</p>
              <p className="text-xs text-slate-600">{j.company}</p>
              <p className="text-xs text-slate-600">📍 {j.place}{j.distance != null && ` · ${Math.round(j.distance)} mi`}</p>
              <p className="text-xs text-slate-600">🕒 {j.when}</p>
              <p className="text-base font-extrabold text-brand-500">{j.price}</p>
              <a href={`/jobs/${j.id}`} className="mt-1 block rounded-lg bg-brand-500 px-3 py-2 text-center text-xs font-semibold !text-white">
                View job →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
