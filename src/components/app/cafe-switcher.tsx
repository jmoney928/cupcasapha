"use client";

import { useTransition } from "react";
import { switchCafe } from "@/app/portal/actions";

export function CafeSwitcher({ cafes, currentId }: { cafes: { id: string; name: string }[]; currentId: string }) {
  const [pending, start] = useTransition();
  if (cafes.length <= 1) return <span className="truncate font-display text-base font-extrabold">{cafes[0]?.name}</span>;
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Location</span>
      <select
        value={currentId}
        disabled={pending}
        onChange={(e) => start(() => switchCafe(e.target.value))}
        className="max-w-[60vw] truncate rounded-full border bg-white px-3 py-1.5 font-display text-sm font-extrabold md:max-w-xs"
        aria-label="Switch location"
      >
        {cafes.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </label>
  );
}
