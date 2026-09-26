"use client";

import {
  AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, ChevronUp, Copy, Italic, Lock, Trash2, Unlock,
} from "lucide-react";
import type { ImageElement, ShapeElement, SleeveElement, TextElement } from "@/lib/sleeve/doc";
import { FONTS } from "@/lib/sleeve/safe";
import { Num, Row, Seg, Slide, Swatches } from "./controls";

type Patch = (p: Partial<SleeveElement>) => void;

export function Panel({
  el, onPatch, onDuplicate, onDelete, onReorder,
}: {
  el: SleeveElement | null;
  onPatch: Patch;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (to: "forward" | "backward" | "front" | "back") => void;
}) {
  if (!el) {
    return (
      <p className="text-sm text-espresso/55">
        Nothing selected. Click something on the sleeve, or add a piece from the bar above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button type="button" onClick={() => onReorder("forward")} title="Bring forward"
          className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral">
          <ChevronUp className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => onReorder("backward")} title="Send backward"
          className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral">
          <ChevronDown className="w-4 h-4" />
        </button>
        <button type="button" onClick={onDuplicate} title="Duplicate"
          className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral">
          <Copy className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => onPatch({ locked: !el.locked })} title={el.locked ? "Unlock" : "Lock"}
          className="btn-pill px-3 py-2 border-2 border-espresso/12 hover:border-coral">
          {el.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
        <button type="button" onClick={onDelete} title="Delete"
          className="btn-pill px-3 py-2 border-2 border-espresso/12 text-coral hover:border-coral ml-auto">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {el.kind === "text" && <TextControls el={el} onPatch={onPatch} />}
      {el.kind === "image" && <ImageControls el={el} onPatch={onPatch} />}
      {el.kind === "shape" && <ShapeControls el={el} onPatch={onPatch} />}

      <Row label="Rotate">
        <Num value={el.rotation} onChange={(v) => onPatch({ rotation: v })} min={-180} max={180} suffix="°" />
      </Row>
      <Row label="Opacity">
        <Slide value={el.opacity} onChange={(v) => onPatch({ opacity: v })} min={0.1} max={1} step={0.05} />
      </Row>
    </div>
  );
}

function TextControls({ el, onPatch }: { el: TextElement; onPatch: Patch }) {
  return (
    <>
      <textarea
        value={el.text}
        onChange={(e) => onPatch({ text: e.target.value.slice(0, 200) })}
        rows={2}
        className="w-full rounded-2xl border-2 border-espresso/12 bg-white/80 px-3 py-2 focus:border-coral focus:outline-none"
      />
      <p className="text-xs text-espresso/45 -mt-1">Enter starts a new line.</p>

      <Row label="Font">
        <select
          value={el.font}
          onChange={(e) => onPatch({ font: e.target.value as TextElement["font"] })}
          className="rounded-xl border-2 border-espresso/12 bg-white/80 px-2.5 py-1.5 text-sm focus:border-coral focus:outline-none"
        >
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </Row>

      <Row label="Size">
        <Num value={el.fontSize} onChange={(v) => onPatch({ fontSize: v })} min={2} max={90} step={0.5} suffix="mm" />
      </Row>

      <Row label="Style">
        <span className="flex gap-1.5">
          <Seg value={el.bold ? "on" : "off"} onChange={(v) => onPatch({ bold: v === "on" })}
            options={[{ value: "off", label: <Bold className="w-4 h-4 opacity-40" />, title: "Regular" },
                      { value: "on", label: <Bold className="w-4 h-4" />, title: "Bold" }]} />
          <Seg value={el.italic ? "on" : "off"} onChange={(v) => onPatch({ italic: v === "on" })}
            options={[{ value: "off", label: <Italic className="w-4 h-4 opacity-40" />, title: "Upright" },
                      { value: "on", label: <Italic className="w-4 h-4" />, title: "Italic" }]} />
        </span>
      </Row>

      <Row label="Align">
        <Seg
          value={el.align}
          onChange={(v) => onPatch({ align: v })}
          options={[
            { value: "left", label: <AlignLeft className="w-4 h-4" /> },
            { value: "center", label: <AlignCenter className="w-4 h-4" /> },
            { value: "right", label: <AlignRight className="w-4 h-4" /> },
          ]}
        />
      </Row>

      <Row label="Curve">
        <Slide value={el.curve} onChange={(v) => onPatch({ curve: v })} min={-120} max={120} step={2} />
      </Row>
      <Row label="Tracking">
        <Slide value={el.letterSpacing} onChange={(v) => onPatch({ letterSpacing: v })} min={-0.5} max={3} step={0.05} />
      </Row>
      <Row label="Line height">
        <Slide value={el.lineHeight} onChange={(v) => onPatch({ lineHeight: v })} min={0.8} max={2.2} step={0.05} />
      </Row>
      <Row label="Colour">
        <Swatches value={el.fill} onChange={(v) => onPatch({ fill: v })} />
      </Row>
    </>
  );
}

function ImageControls({ el, onPatch }: { el: ImageElement; onPatch: Patch }) {
  const aspect = el.height > 0 ? el.width / el.height : 1;
  return (
    <>
      <Row label="Width">
        <Num
          value={el.width}
          /* Height follows, so an uploaded logo is never squashed. */
          onChange={(v) => onPatch({ width: v, height: v / aspect })}
          min={2}
          max={300}
          suffix="mm"
        />
      </Row>
      <Row label="Height">
        <Num value={el.height} onChange={(v) => onPatch({ height: v, width: v * aspect })} min={2} max={120} suffix="mm" />
      </Row>
    </>
  );
}

function ShapeControls({ el, onPatch }: { el: ShapeElement; onPatch: Patch }) {
  return (
    <>
      <Row label="Shape">
        <Seg
          value={el.shape}
          onChange={(v) => onPatch({ shape: v })}
          options={[
            { value: "rect", label: "▭" },
            { value: "ellipse", label: "◯" },
            { value: "line", label: "—" },
          ]}
        />
      </Row>
      <Row label="Width">
        <Num value={el.width} onChange={(v) => onPatch({ width: v })} min={1} max={300} suffix="mm" />
      </Row>
      {el.shape !== "line" && (
        <Row label="Height">
          <Num value={el.height} onChange={(v) => onPatch({ height: v })} min={1} max={120} suffix="mm" />
        </Row>
      )}
      {el.shape === "rect" && (
        <Row label="Corner">
          <Num value={el.radius} onChange={(v) => onPatch({ radius: v })} min={0} max={30} step={0.5} suffix="mm" />
        </Row>
      )}
      {el.shape !== "line" && (
        <Row label="Fill">
          <Swatches value={el.fill} onChange={(v) => onPatch({ fill: v })} allowNone />
        </Row>
      )}
      <Row label="Line">
        <Swatches value={el.stroke} onChange={(v) => onPatch({ stroke: v })} allowNone />
      </Row>
      <Row label="Thickness">
        <Num value={el.strokeWidth} onChange={(v) => onPatch({ strokeWidth: v })} min={0} max={20} step={0.25} suffix="mm" />
      </Row>
    </>
  );
}
