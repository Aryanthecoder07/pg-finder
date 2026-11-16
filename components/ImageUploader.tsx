"use client";
import { useState } from "react";

// Direct browser -> Cloudinary upload using an UNSIGNED preset (no server code needed).
export default function ImageUploader({ urls, onChange }: { urls: string[]; onChange: (u: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    if (!cloud || !preset) return alert("Set the Cloudinary env vars to enable photo uploads.");
    setBusy(true);
    try {
      const added: string[] = [];
      for (const f of Array.from(files).slice(0, 6)) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("upload_preset", preset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd });
        const j = await res.json();
        if (j.secure_url) added.push(j.secure_url);
      }
      onChange([...urls, ...added].slice(0, 10));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="label">Photos (rooms, washrooms, food, kitchen)</span>
      <input type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} className="text-sm" />
      {busy && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {urls.map((u) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={u} src={u} alt="" className="h-20 w-20 rounded object-cover" />
        ))}
      </div>
    </div>
  );
}
