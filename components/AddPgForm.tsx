"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationPicker, { Place } from "@/components/LocationPicker";
import ReviewForm from "@/components/ReviewForm";
import { emptyReview, validateReview } from "@/lib/types";
import { getPosition } from "@/lib/geoClient";

export default function AddPgForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("coed");
  const [place, setPlace] = useState<Place | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [review, setReview] = useState(emptyReview());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!place) return setError("Pin the PG's location first.");
    const err = validateReview(review);
    if (err) return setError(err);
    setBusy(true);
    setError("");
    const geo = await getPosition(); // fresh reading, used only to decide the "verified on-site" badge
    const res = await fetch("/api/pgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, gender, address, city, lat: place.lat, lng: place.lng, review, geo }),
    });
    setBusy(false);
    const j = await res.json();
    if (!res.ok) return setError(j.error ?? "Something went wrong.");
    router.push(`/pg/${j.id}`);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Add the PG you live in</h1>

      <label className="block"><span className="label">PG name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>

      <label className="block"><span className="label">For</span>
        <select className="input" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="boys">Boys</option><option value="girls">Girls</option><option value="coed">Co-ed</option>
        </select></label>

      <LocationPicker onPick={(p) => { setPlace(p); setAddress(p.address); setCity(p.city); }} />

      <label className="block"><span className="label">Address (edit if needed)</span>
        <textarea rows={2} className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></label>
      <label className="block"><span className="label">City (for example Hyderabad, Bengaluru)</span>
        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} /></label>

      <h2 className="pt-2 text-lg font-semibold">Your review</h2>
      <ReviewForm value={review} onChange={setReview} />

      <p className="text-xs text-slate-500">Submit while you are at the PG with location allowed to get the “verified on-site” badge. Your exact position is not saved.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Publish"}</button>
    </div>
  );
}
