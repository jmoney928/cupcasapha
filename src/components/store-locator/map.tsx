"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Stockist } from "@/lib/stockists";

/** Leaflet + OpenStreetMap tiles: no API key. Attribution is required and kept on. */
export function StockistMap({
  stockists,
  activeId,
  center,
  onSelect,
}: {
  stockists: Stockist[];
  activeId: string | null;
  center: { lat: number; lng: number; zoom?: number } | null;
  onSelect: (id: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // create map once
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    m.setView([49.5, -85], 4); // Canada
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  // sync markers
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current.clear();
    stockists.forEach((s) => {
      const mk = L.marker([s.lat, s.lng], { icon: pin(s.id === activeId), title: s.name, riseOnHover: true })
        .addTo(m)
        .on("click", () => onSelectRef.current(s.id));
      mk.bindTooltip(s.name, { direction: "top", offset: [0, -30] });
      markers.current.set(s.id, mk);
    });
    if (!center && stockists.length > 0) {
      m.fitBounds(L.latLngBounds(stockists.map((s) => [s.lat, s.lng] as [number, number])).pad(0.2), { maxZoom: 13 });
    }
  }, [stockists, activeId, center]);

  // move to explicit center (search / my location / selection)
  useEffect(() => {
    const m = map.current;
    if (!m || !center) return;
    m.flyTo([center.lat, center.lng], center.zoom ?? 12, { duration: 0.6 });
  }, [center]);

  return <div ref={el} className="h-[320px] w-full rounded-3xl md:h-full" role="region" aria-label="Map of cafés" />;
}

function pin(active: boolean) {
  const fill = active ? "#1a1a1a" : "#e8735a";
  return L.divIcon({
    className: "",
    html: `<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg"><path d="M15 37c6-9 13-15.5 13-22A13 13 0 0 0 2 15c0 6.5 7 13 13 22z" fill="${fill}" stroke="#ede9de" stroke-width="2"/><circle cx="15" cy="15" r="5" fill="#ede9de"/></svg>`,
    iconSize: [30, 38],
    iconAnchor: [15, 37],
    tooltipAnchor: [0, -30],
  });
}
