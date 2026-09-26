"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sleeveDieline } from "@/lib/sleeve/dielines";
import { layout } from "@/lib/sleeve/geometry";
import type { SleeveDoc, SleeveElement } from "@/lib/sleeve/doc";
import { elementBounds, renderDoc, type Measurer } from "@/lib/sleeve/render-doc";

type Drag =
  | { mode: "move"; id: string; grabX: number; grabY: number; startX: number; startY: number }
  | { mode: "resize"; id: string; startW: number; startDist: number; start: SleeveElement }
  | { mode: "rotate"; id: string; startAngle: number; startRotation: number };

const HANDLE = 3.2; // mm
const ROTATE_ARM = 9; // mm above the box

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Turn a point in sheet space into the element's own frame, so rotation stops mattering. */
function toLocal(px: number, py: number, el: SleeveElement) {
  const a = rad(-el.rotation);
  const dx = px - el.x;
  const dy = py - el.y;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
}

/** And back again, for drawing handles where the rotated corners actually are. */
function toSheet(lx: number, ly: number, el: SleeveElement) {
  const a = rad(el.rotation);
  return { x: el.x + lx * Math.cos(a) - ly * Math.sin(a), y: el.y + lx * Math.sin(a) + ly * Math.cos(a) };
}

export function SleeveCanvas({
  doc,
  selectedId,
  measure,
  onSelect,
  onChange,
  onCommit,
  showGuides,
}: {
  doc: SleeveDoc;
  selectedId: string | null;
  measure: Measurer;
  onSelect: (id: string | null) => void;
  /** Live, during a drag — not pushed onto the undo stack. */
  onChange: (doc: SleeveDoc) => void;
  /** End of a gesture — this is what undo steps back to. */
  onCommit: () => void;
  showGuides: boolean;
}) {
  const d = sleeveDieline(doc.size);
  const l = layout(d);
  const wrap = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const selected = doc.elements.find((e) => e.id === selectedId) ?? null;

  /** Client pixels to sheet millimetres. */
  const toMm = useCallback(
    (clientX: number, clientY: number) => {
      const box = wrap.current?.getBoundingClientRect();
      if (!box) return { x: 0, y: 0 };
      return { x: ((clientX - box.left) / box.width) * l.width, y: ((clientY - box.top) / box.height) * l.height };
    },
    [l.width, l.height]
  );

  const hitTest = useCallback(
    (px: number, py: number) => {
      /* Topmost first: the thing you can see is the thing you grab. */
      for (let i = doc.elements.length - 1; i >= 0; i--) {
        const el = doc.elements[i];
        if (el.locked) continue;
        const b = elementBounds(el, measure);
        const p = toLocal(px, py, el);
        const padX = Math.max(b.width / 2, 2);
        const padY = Math.max(b.height / 2, 2);
        if (Math.abs(p.x) <= padX && Math.abs(p.y) <= padY) return el;
      }
      return null;
    },
    [doc.elements, measure]
  );

  function onPointerDown(e: React.PointerEvent) {
    const { x, y } = toMm(e.clientX, e.clientY);
    /* Capture keeps a drag alive past the edge of the canvas; some pointers refuse it. */
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}

    if (selected) {
      const b = elementBounds(selected, measure);
      const hw = b.width / 2;
      const hh = b.height / 2;

      const rotateAt = toSheet(0, -hh - ROTATE_ARM, selected);
      if (Math.hypot(x - rotateAt.x, y - rotateAt.y) <= HANDLE) {
        setDrag({
          mode: "rotate",
          id: selected.id,
          startAngle: (Math.atan2(y - selected.y, x - selected.x) * 180) / Math.PI,
          startRotation: selected.rotation,
        });
        return;
      }

      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
        const c = toSheet(sx * hw, sy * hh, selected);
        if (Math.hypot(x - c.x, y - c.y) <= HANDLE) {
          setDrag({
            mode: "resize",
            id: selected.id,
            startW: b.width,
            startDist: Math.max(Math.hypot(x - selected.x, y - selected.y), 0.1),
            start: selected,
          });
          return;
        }
      }
    }

    const hit = hitTest(x, y);
    onSelect(hit?.id ?? null);
    if (hit) setDrag({ mode: "move", id: hit.id, grabX: x, grabY: y, startX: hit.x, startY: hit.y });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const { x, y } = toMm(e.clientX, e.clientY);
    const el = doc.elements.find((c) => c.id === drag.id);
    if (!el) return;

    if (drag.mode === "move") {
      patch(drag.id, { x: drag.startX + (x - drag.grabX), y: drag.startY + (y - drag.grabY) });
      return;
    }

    if (drag.mode === "rotate") {
      const now = (Math.atan2(y - el.y, x - el.x) * 180) / Math.PI;
      let next = drag.startRotation + (now - drag.startAngle);
      /* Snap to the straight angles, which is what people are usually reaching for. */
      const snapped = Math.round(next / 15) * 15;
      if (Math.abs(next - snapped) < 3) next = snapped;
      patch(drag.id, { rotation: Math.round(next * 10) / 10 });
      return;
    }

    const ratio = Math.max(0.1, Math.hypot(x - el.x, y - el.y) / drag.startDist);
    const start = drag.start;
    if (start.kind === "text") {
      /* Type and box scale together, so a corner drag makes the text bigger without re-wrapping it. */
      patch(drag.id, {
        fontSize: Math.min(90, Math.max(2, Math.round(start.fontSize * ratio * 10) / 10)),
        width: Math.min(400, Math.max(6, Math.round(start.width * ratio * 10) / 10)),
      });
    } else {
      patch(drag.id, {
        width: Math.max(1, Math.round(start.width * ratio * 10) / 10),
        height: Math.max(0, Math.round(start.height * ratio * 10) / 10),
      });
    }
  }

  function patch(id: string, p: Partial<SleeveElement>) {
    onChange({ ...doc, elements: doc.elements.map((e) => (e.id === id ? ({ ...e, ...p } as SleeveElement) : e)) });
  }

  function endDrag() {
    if (drag) {
      setDrag(null);
      onCommit();
    }
  }

  /* Keep the selection box glued to the element while it is being edited from the panel too. */
  const [, force] = useState(0);
  useEffect(() => force((v) => v + 1), [doc]);

  return (
    <div
      ref={wrap}
      className="relative w-full select-none touch-none"
      style={{ aspectRatio: `${l.width} / ${l.height}` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="absolute inset-0 [&>svg]:w-full [&>svg]:h-full"
        dangerouslySetInnerHTML={{ __html: renderDoc(doc, { guides: showGuides, measure, idPrefix: "cv" }) }}
      />
      <svg viewBox={`0 0 ${l.width} ${l.height}`} className="absolute inset-0 w-full h-full pointer-events-none">
        {selected && <Selection el={selected} measure={measure} />}
      </svg>
    </div>
  );
}

function Selection({ el, measure }: { el: SleeveElement; measure: Measurer }) {
  const b = elementBounds(el, measure);
  const hw = Math.max(b.width, 2) / 2;
  const hh = Math.max(b.height, 2) / 2;
  const corners = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([sx, sy]) => toSheet(sx * hw, sy * hh, el));
  const rotateAt = toSheet(0, -hh - ROTATE_ARM, el);
  const top = toSheet(0, -hh, el);

  return (
    <g>
      <rect
        x={el.x - hw}
        y={el.y - hh}
        width={hw * 2}
        height={hh * 2}
        transform={`rotate(${el.rotation} ${el.x} ${el.y})`}
        fill="none"
        stroke="#e8735a"
        strokeWidth={0.4}
      />
      <line x1={top.x} y1={top.y} x2={rotateAt.x} y2={rotateAt.y} stroke="#e8735a" strokeWidth={0.4} />
      <circle cx={rotateAt.x} cy={rotateAt.y} r={HANDLE * 0.6} fill="#e8735a" />
      {corners.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={HANDLE * 0.6} fill="#ffffff" stroke="#e8735a" strokeWidth={0.4} />
      ))}
    </g>
  );
}
