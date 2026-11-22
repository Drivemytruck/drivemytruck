"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeAvatar, uploadAvatar } from "@/app/account/actions";
import { Avatar } from "./ui";

const SIZE = 320;

/** Center-crops to a square and resizes to 320px JPEG in the browser, so uploads stay tiny. */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), "image/jpeg", 0.85));
}

export function PhotoUpload({ name, src, label }: { name: string; src: string | null; label: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    let blob: Blob;
    try {
      blob = await resize(file);
    } catch {
      setError("Sorry, we couldn't read that image. Please try a different photo.");
      return;
    }
    setPreview(URL.createObjectURL(blob));
    const fd = new FormData();
    fd.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
    start(async () => {
      const res = await uploadAvatar(fd);
      if (res.error) {
        setError(res.error);
        setPreview(null);
      } else router.refresh();
    });
  };

  const shown = preview ?? src;
  return (
    <div className="card flex items-center gap-4 p-4">
      <Avatar name={name} src={shown} size={72} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-navy-900">{label}</p>
        <p className="text-xs text-slate-500">A clear, friendly photo helps you get booked.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="btn-navy btn-sm" disabled={pending} onClick={() => input.current?.click()}>
            {pending ? "Uploading…" : shown ? "Change photo" : "Add photo"}
          </button>
          {shown && !pending && (
            <button
              type="button"
              className="btn-ghost btn-sm text-slate-500"
              onClick={() =>
                start(async () => {
                  await removeAvatar();
                  setPreview(null);
                  router.refresh();
                })
              }
            >
              Remove
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-brand-700">{error}</p>}
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={onPick} />
    </div>
  );
}
