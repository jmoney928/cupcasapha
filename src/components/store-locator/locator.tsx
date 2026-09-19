"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Search, LocateFixed, Navigation, Clock, AtSign, MapPin } from "lucide-react";
import { stockists as all, distanceKm, directionsUrl, typeLabel, type Stockist } from "@/lib/stockists";

const StockistMap = dynamic(() => import("./map").then((m) => m.StockistMap), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full animate-pulse rounded-3xl bg-cream-deep md:h-full" />,
});

type Origin = { lat: number; lng: number; label: string };
const RADII = [10, 25, 50, 100, 250] as const;

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

export function StoreLocator() {
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [radius, setRadius] = useState<(typeof RADII)[number]>(50);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Results: within radius of origin if we have one, otherwise text match, otherwise everything.
  const results = useMemo(() => {
    let list: Array<Stockist & { km?: number }> = all;
    if (origin) {
      list = all
        .map((s) => ({ ...s, km: distanceKm(origin.lat, origin.lng, s.lat, s.lng) }))
        .filter((s) => s.km! <= radius)
        .sort((a, b) => a.km! - b.km!);
    } else if (query.trim()) {
      const q = norm(query);
      list = all.filter((s) => [s.name, s.city, s.postal, s.address, s.province].some((f) => norm(f).includes(q)));
    }
    return list;
  }, [origin, radius, query]);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) { setOrigin(null); setStatus(null); setCenter(null); return; }
    // 1) a café or city we already know → centre on it without geocoding
    const local = all.find((s) => [s.city, s.name, s.postal].some((f) => norm(f).startsWith(norm(q))));
    if (local) {
      setOrigin({ lat: local.lat, lng: local.lng, label: local.city });
      setCenter({ lat: local.lat, lng: local.lng, zoom: 11 });
      setStatus(`Cafés near ${local.city}`);
      return;
    }
    // 2) otherwise geocode (OpenStreetMap Nominatim; fine at low volume, swap for a paid geocoder at scale)
    setBusy(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca,us&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (!data.length) { setStatus(`We couldn't find “${q}”. Try a city or postal code.`); setOrigin(null); return; }
      const lat = Number(data[0].lat), lng = Number(data[0].lon);
      setOrigin({ lat, lng, label: data[0].display_name.split(",")[0] });
      setCenter({ lat, lng, zoom: 11 });
      setStatus(`Cafés near ${data[0].display_name.split(",").slice(0, 2).join(",")}`);
    } catch {
      setStatus("Search is unavailable right now. Try browsing the list below.");
    } finally {
      setBusy(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) { setStatus("Your browser doesn't share location. Type a city or postal code instead."); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setOrigin({ lat, lng, label: "you" });
        setCenter({ lat, lng, zoom: 12 });
        setQuery("");
        setStatus("Cafés near you");
        setBusy(false);
      },
      () => { setStatus("We couldn't get your location. Type a city or postal code instead."); setBusy(false); },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  function select(id: string) {
    setActiveId(id);
    const s = all.find((x) => x.id === id);
    if (s) setCenter({ lat: s.lat, lng: s.lng, zoom: 14 });
    document.getElementById(`stockist-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      {/* controls + list */}
      <div className="flex flex-col gap-4">
        <form onSubmit={search} className="flex flex-col gap-2 rounded-3xl border border-espresso/10 bg-white/70 p-3">
          <div className="flex gap-2">
            <label className="relative flex-1">
              <span className="sr-only">City, postal code or café name</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City, postal code or café"
                inputMode="search"
                className="w-full rounded-full border border-espresso/15 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-espresso"
              />
            </label>
            <button type="submit" disabled={busy} className="btn-pill bg-espresso px-4 py-2.5 text-sm text-cream disabled:opacity-50">Search</button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={locate} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-espresso/15 bg-white px-3 py-1.5 font-bold hover:bg-cream-deep disabled:opacity-50">
              <LocateFixed className="h-3.5 w-3.5 text-coral" /> Use my location
            </button>
            <label className="ml-auto inline-flex items-center gap-1.5 font-semibold text-espresso/70">
              Within
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value) as (typeof RADII)[number])} className="rounded-full border border-espresso/15 bg-white px-2 py-1 font-bold">
                {RADII.map((r) => <option key={r} value={r}>{r} km</option>)}
              </select>
            </label>
          </div>
        </form>

        <div className="flex items-baseline justify-between px-1 text-sm">
          <span className="font-bold">{status ?? (query.trim() ? `Matches for “${query.trim()}”` : "All locations")}</span>
          <span className="text-espresso/50">{results.length} {results.length === 1 ? "place" : "places"}</span>
        </div>

        {results.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-espresso/20 p-6 text-center">
            <p className="font-display text-lg font-extrabold">No cafés here yet.</p>
            <p className="mt-1 text-sm text-espresso/60">Try a wider radius, or tell us where you’d like to see cupcasa — we’ll reach out to the café.</p>
            <a href="#nominate" className="btn-pill mt-4 inline-flex bg-coral px-4 py-2 text-sm text-white">Nominate a café</a>
          </div>
        ) : (
          <ol className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-[560px]">
            {results.map((s) => (
              <li key={s.id} id={`stockist-${s.id}`}>
                <button
                  type="button"
                  onClick={() => select(s.id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${activeId === s.id ? "border-espresso bg-white shadow-md" : "border-espresso/10 bg-white/70 hover:bg-white"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-lg font-extrabold leading-tight">{s.name}</div>
                      <div className="mt-0.5 text-sm text-espresso/70">{s.address}, {s.city} {s.province} · {typeLabel[s.type]}</div>
                    </div>
                    {s.km != null && <span className="shrink-0 rounded-full bg-cream-deep px-2.5 py-1 text-xs font-bold">{s.km < 1 ? "<1" : Math.round(s.km)} km</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-espresso/60">
                    {s.hours && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.hours}</span>}
                    <span className="inline-flex items-center gap-1">Cups: {s.sizes.map((z) => `${z}oz`).join(" · ")}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={directionsUrl(s)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-full bg-espresso px-3 py-1.5 text-xs font-bold text-cream hover:bg-espresso-soft">
                      <Navigation className="h-3.5 w-3.5" /> Directions
                    </a>
                    {s.instagram && (
                      <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-full border border-espresso/15 bg-white px-3 py-1.5 text-xs font-bold hover:bg-cream-deep">
                        <AtSign className="h-3.5 w-3.5" /> {s.instagram}
                      </a>
                    )}
                    {s.website && (
                      <a href={s.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-full border border-espresso/15 bg-white px-3 py-1.5 text-xs font-bold hover:bg-cream-deep">
                        <MapPin className="h-3.5 w-3.5" /> Website
                      </a>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* map */}
      <div className="min-h-[320px] overflow-hidden rounded-3xl border border-espresso/10 lg:min-h-[640px]">
        <StockistMap stockists={results} activeId={activeId} center={center} onSelect={select} />
      </div>
    </div>
  );
}
