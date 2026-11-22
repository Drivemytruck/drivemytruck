"use client";

import dynamic from "next/dynamic";

export const AdminMapLoader = dynamic(() => import("./AdminMap"), {
  ssr: false,
  loading: () => <div className="flex h-[70vh] min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Loading map…</div>,
});
