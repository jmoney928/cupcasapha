"use client";

import { useRouter } from "next/navigation";
import { SleeveEditor } from "./editor";
import { stashSleeve } from "@/lib/sleeve/handoff";

/**
 * The designer on /sleeve, with a way out of it.
 *
 * Without this the page is a dead end dressed as a tool: you draw a sleeve, download an SVG, and
 * are left to find the shop and start again. The button hands the live document to the builder,
 * which picks it up at its design step whatever size the bundle ends up being.
 */
export function StandaloneSleeveEditor() {
  const router = useRouter();

  return (
    <SleeveEditor
      carryLabel="Order this sleeve"
      onCarry={(doc) => {
        stashSleeve(doc);
        router.push("/shop");
      }}
    />
  );
}
