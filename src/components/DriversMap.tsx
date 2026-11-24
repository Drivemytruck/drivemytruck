"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export type MapDriver = { id: string; lat: number; lng: number; label: string; name: string; info: string; when: string; verified: boolean };

const MILE = 1609.34;

function pin(label: string, verified: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="dmt-pin ${verified ? "dmt-pin--driver" : "dmt-pin--muted"}">${label}</div>`,
    iconSize: [80, 30],
    iconAnchor: [40, 30],
    popupAnchor: [0, -28],
  });
}

export default function DriversMap({
  drivers,
  home,
  radiusMiles,
  labels,
}: {
  drivers: MapDriver[];
  home: { lat: number; lng: number } | null;
  radiusMiles: number;
  labels: { open: string; base: string };
}) {
  const center: [number, number] = home ? [home.lat, home.lng] : [52.6, -1.6];
  const zoom = home ? (radiusMiles > 60 ? 7 : radiusMiles > 30 ? 8 : 9) : 6;
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-[65vh] min-h-[380px] w-full rounded-2xl border border-slate-200 shadow-sm">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {home && (
        <>
          <Circle center={[home.lat, home.lng]} radius={radiusMiles * MILE} pathOptions={{ color: "#0b2a5b", weight: 1.5, fillOpacity: 0.05 }} />
          <CircleMarker center={[home.lat, home.lng]} radius={8} pathOptions={{ color: "#fff", weight: 2, fillColor: "#0b2a5b", fillOpacity: 1 }}>
            <Popup>{labels.base}</Popup>
          </CircleMarker>
        </>
      )}
      {drivers.map((d) => (
        <Marker key={d.id} position={[d.lat, d.lng]} icon={pin(d.label, d.verified)}>
          <Popup>
            <div className="min-w-48 space-y-1 font-sans">
              <p className="text-sm font-bold text-navy-900">{d.name}</p>
              <p className="text-xs text-slate-600">{d.info}</p>
              <p className="text-xs font-semibold text-emerald-700">📅 {d.when}</p>
              <a href={`/drivers/${d.id}`} className="mt-1 block rounded-lg bg-brand-500 px-3 py-2 text-center text-xs font-semibold !text-white">
                {labels.open}
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
