"use client";
import { useState } from "react";

export interface Place { lat: number; lng: number; address: string; city: string }

// Uses the browser's GPS, then OpenStreetMap Nominatim to turn coordinates into a readable address.
export default function LocationPicker({ onPick }: { onPick: (p: Place) => void }) {
  const [status, setStatus] = useState("");

  function locate() {
    if (!navigator.geolocation) return setStatus("This browser does not support location.");
    setStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let address = "";
        let city = "";
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const j = await r.json();
          address = j.display_name ?? "";
          city = j.address?.city || j.address?.town || j.address?.suburb || j.address?.state_district || "";
        } catch {}
        onPick({ lat, lng, address, city });
        setStatus(`Pinned at ${lat.toFixed(5)}, ${lng.toFixed(5)} (accuracy about ${Math.round(pos.coords.accuracy)} m). Stand at the PG's gate for the best result.`);
      },
      (e) => setStatus(`Could not get location: ${e.message}`),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <div>
      <button type="button" onClick={locate} className="btn-ghost">Use my current location</button>
      {status && <p className="mt-1 text-xs text-slate-600">{status}</p>}
    </div>
  );
}
