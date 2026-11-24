"use client";

import dynamic from "next/dynamic";

export const DriversMapLoader = dynamic(() => import("./DriversMap"), {
  ssr: false,
  loading: () => <div className="flex h-[65vh] min-h-[380px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">…</div>,
});
