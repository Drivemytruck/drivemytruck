"use client";

import dynamic from "next/dynamic";

// Leaflet needs `window`, so the map is only rendered in the browser.
export const JobsMapLoader = dynamic(() => import("./JobsMap"), {
  ssr: false,
  loading: () => <div className="flex h-[65vh] min-h-[380px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Loading map…</div>,
});
