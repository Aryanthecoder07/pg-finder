"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ReviewForm from "./ReviewForm";
import { emptyReview, validateReview } from "@/lib/types";
import { getPosition } from "@/lib/geoClient";

export default function AddReview({ pgId, signedIn }: { pgId: string; signedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(emptyReview());
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <a className="btn inline-block" href={`/signin?callbackUrl=${encodeURIComponent(`/pg/${pgId}`)}`}>
        Sign in with Google to review
      </a>
    );
  }

  async function submit() {
    const err = validateReview(review);
    if (err) return setError(err);
    setBusy(true);
    setError("");
    const geo = await getPosition(); // fresh reading, used only to decide the "verified on-site" badge
    const res = await fetch(`/api/pgs/${pgId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...review, geo }),
    });
    setBusy(false);
    const j = await res.json();
    if (!res.ok) return setError(j.error ?? "Something went wrong.");
    setOpen(false);
    setReview(emptyReview());
    setMsg(
      j.verified
        ? "Review posted and verified on-site."
        : "Review posted, but not verified on-site. To get the badge, submit while you are at the PG with location allowed."
    );
    router.refresh();
  }

  return (
    <div>
      {msg && <p className="mb-2 text-sm text-teal-800">{msg}</p>}
      {!open ? (
        <button className="btn" onClick={() => { setMsg(""); setOpen(true); }}>I live here: add my review</button>
      ) : (
        <div className="rounded-lg border border-slate-200 p-4">
          <ReviewForm value={review} onChange={setReview} />
          <p className="mt-3 text-xs text-slate-500">Submit while you are at the PG with location allowed to get the “verified on-site” badge. Your exact position is not saved.</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button className="btn" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Post review"}</button>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
