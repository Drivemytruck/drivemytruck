"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export type AdminMapData = {
  jobs: { id: string; lat: number; lng: number; price: string; status: string; title: string; when: string; company: string }[];
  drivers: { userId: string; lat: number; lng: number; name: string; info: string; available: boolean }[];
  companies: { userId: string; lat: number; lng: number; name: string; info: string }[];
};

function pin(price: string, status: string) {
  const cls = status === "OPEN" ? "" : status === "FILLED" ? " dmt-pin--applied" : " dmt-pin--muted";
  return L.divIcon({ className: "", html: `<div class="dmt-pin${cls}">${price}</div>`, iconSize: [64, 30], iconAnchor: [32, 30], popupAnchor: [0, -28] });
}

export default function AdminMap({ data }: { data: AdminMapData }) {
  const [show, setShow] = useState({ jobs: true, drivers: true, companies: true, past: false });
  const jobs = data.jobs.filter((j) => show.past || j.status === "OPEN" || j.status === "FILLED");
  const all = [...data.jobs, ...data.drivers, ...data.companies];
  const bounds = all.length > 1 ? L.latLngBounds(all.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2) : null;

  const toggle = (k: keyof typeof show, label: string, swatch: string) => (
    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm">
      <input type="checkbox" checked={show[k]} onChange={(e) => setShow((s) => ({ ...s, [k]: e.target.checked }))} className="accent-brand-500" />
      <span className={`inline-block h-3 w-3 rounded-full ${swatch}`} />
      {label}
    </label>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {toggle("jobs", `Jobs (${data.jobs.filter((j) => j.status === "OPEN" || j.status === "FILLED").length})`, "bg-brand-500")}
        {toggle("past", "Past / cancelled", "bg-slate-400")}
        {toggle("drivers", `Drivers (${data.drivers.length})`, "bg-emerald-500")}
        {toggle("companies", `Companies (${data.companies.length})`, "bg-navy-900")}
      </div>
      <div className="relative z-0">
        <MapContainer
          {...(bounds ? { bounds } : { center: [52.6, -1.6] as [number, number], zoom: 6 })}
          scrollWheelZoom
          className="h-[70vh] min-h-[420px] w-full rounded-2xl border border-slate-200 shadow-sm"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          {show.drivers &&
            data.drivers.map((d) => (
              <CircleMarker
                key={d.userId}
                center={[d.lat, d.lng]}
                radius={8}
                pathOptions={{ color: "#fff", weight: 2, fillColor: d.available ? "#10b981" : "#6ee7b7", fillOpacity: 1 }}
              >
                <Popup>
                  <p className="text-sm font-bold text-navy-900">🚚 {d.name}</p>
                  <p className="text-xs text-slate-600">{d.info}</p>
                  <a href={`/admin/users/${d.userId}`} className="mt-1 block text-xs font-semibold text-brand-600 underline">
                    Open driver →
                  </a>
                </Popup>
              </CircleMarker>
            ))}
          {show.companies &&
            data.companies.map((c) => (
              <CircleMarker key={c.userId} center={[c.lat, c.lng]} radius={8} pathOptions={{ color: "#fff", weight: 2, fillColor: "#0b2a5b", fillOpacity: 1 }}>
                <Popup>
                  <p className="text-sm font-bold text-navy-900">🏢 {c.name}</p>
                  <p className="text-xs text-slate-600">{c.info}</p>
                  <a href={`/admin/users/${c.userId}`} className="mt-1 block text-xs font-semibold text-brand-600 underline">
                    Open company →
                  </a>
                </Popup>
              </CircleMarker>
            ))}
          {show.jobs &&
            jobs.map((j) => (
              <Marker key={j.id} position={[j.lat, j.lng]} icon={pin(j.price, j.status)}>
                <Popup>
                  <p className="text-sm font-bold text-navy-900">{j.title}</p>
                  <p className="text-xs text-slate-600">
                    {j.company} · {j.when}
                  </p>
                  <p className="text-xs text-slate-600">Status: {j.status}</p>
                  <a href={`/admin/jobs/${j.id}`} className="mt-1 block text-xs font-semibold text-brand-600 underline">
                    Open job →
                  </a>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500">
        Red = open job · dark blue = booked job · grey = past/cancelled · green dot = driver (bright = available today) · navy dot = company depot.
        Locations are approximate (postcode).
      </p>
    </div>
  );
}
