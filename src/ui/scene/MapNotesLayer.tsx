import { useCallback, useLayoutEffect, useRef } from "react";
import { useMapStore, useMapStoreApi } from "../StoreContext";
import { useT } from "../LangContext";
import { useConfirm } from "../ConfirmContext";
import {
  logicalToScreen,
  screenToLogical,
  type Point,
} from "../../core/geometry";
import type { MapNote } from "../../core/model";

interface Props {
  center: Point;
  svg: React.RefObject<SVGSVGElement>;
}

/**
 * Shrink/grow the textarea font so the text fills the note without overflowing.
 * Works in logical px (the CSS `scale(zoom)` transform doesn't affect layout
 * metrics), so it stays correct at any zoom.
 */
function fitFont(el: HTMLTextAreaElement | null, height: number): void {
  if (!el) return;
  const max = Math.max(10, Math.min(30, Math.floor(height / 6)));
  let lo = 6;
  let hi = max;
  let best = lo;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    el.style.fontSize = `${mid}px`;
    if (el.scrollHeight <= el.clientHeight + 1) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  el.style.fontSize = `${best}px`;
}

/**
 * Free-floating text notes ("stickies") rendered as an HTML overlay above the
 * SVG. Plain HTML (not an SVG foreignObject) avoids the Chromium repaint
 * artifacts — flicker and ghosting — that foreignObject shows under transforms.
 */
export function MapNotesLayer({ center, svg }: Props) {
  const notes = useMapStore((s) => s.doc.mapNotes);
  return (
    <div className="nm-mapnotes-overlay">
      {notes.map((note) => (
        <MapNoteItem key={note.id} note={note} center={center} svg={svg} />
      ))}
    </div>
  );
}

function MapNoteItem({
  note,
  center,
  svg,
}: {
  note: MapNote;
  center: Point;
  svg: React.RefObject<SVGSVGElement>;
}) {
  const api = useMapStoreApi();
  const t = useT();
  const confirm = useConfirm();
  const viewport = useMapStore((s) => s.viewport);
  const selected = useMapStore((s) => s.selectedMapNoteId === note.id);
  const autoFocus = useMapStore((s) => s.editingMapNoteId === note.id);
  const drag = useMapStore((s) => (s.mapNoteDrag?.id === note.id ? s.mapNoteDrag : null));
  const resize = useMapStore((s) =>
    s.mapNoteResize?.id === note.id ? s.mapNoteResize : null,
  );

  const x = drag ? drag.x : note.x;
  const y = drag ? drag.y : note.y;
  const w = resize ? resize.width : note.width;
  const h = resize ? resize.height : note.height;
  const screen = logicalToScreen({ x, y }, viewport, center);

  const toLogical = useCallback(
    (e: { clientX: number; clientY: number }): Point => {
      const rect = svg.current?.getBoundingClientRect();
      return screenToLogical(
        { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) },
        api.getState().viewport,
        center,
      );
    },
    [api, center, svg],
  );

  const dragRef = useRef<{ offX: number; offY: number } | null>(null);
  const onBarDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toLogical(e);
    dragRef.current = { offX: p.x - note.x, offY: p.y - note.y };
    api.getState().selectMapNote(note.id);
  };
  const onBarMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    const p = toLogical(e);
    api.getState().dragMapNoteTo(note.id, p.x - dragRef.current.offX, p.y - dragRef.current.offY);
  };
  const onBarUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    dragRef.current = null;
    api.getState().commitMapNoteDrag();
  };

  const resizing = useRef(false);
  const onResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    resizing.current = true;
  };
  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizing.current) return;
    e.stopPropagation();
    const p = toLogical(e);
    api.getState().resizeMapNoteTo(note.id, p.x - note.x, p.y - note.y);
  };
  const onResizeUp = (e: React.PointerEvent) => {
    if (!resizing.current) return;
    e.stopPropagation();
    resizing.current = false;
    api.getState().commitMapNoteResize();
  };

  const onDelete = () => {
    void confirm({ message: t("confirm.mapNote") }).then((ok) => {
      if (ok) api.getState().removeMapNote(note.id);
    });
  };

  // Adaptive font: largest size at which the text fits the note's height.
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fit = useCallback(() => fitFont(textRef.current, h), [h]);
  useLayoutEffect(fit, [fit, note.text, w]);

  return (
    <div
      className={"nm-mapnote" + (selected ? " is-selected" : "")}
      style={{
        left: screen.x,
        top: screen.y,
        width: w,
        height: h,
        transform: `scale(${viewport.zoom})`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="nm-mapnote-bar"
        onPointerDown={onBarDown}
        onPointerMove={onBarMove}
        onPointerUp={onBarUp}
      >
        <button
          className="nm-mapnote-del"
          title={t("btn.delete")}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
        >
          ×
        </button>
      </div>
      <textarea
        ref={textRef}
        className="nm-mapnote-text"
        placeholder={t("mapnote.placeholder")}
        defaultValue={note.text}
        autoFocus={autoFocus}
        onInput={fit}
        onFocus={() => api.getState().selectMapNote(note.id)}
        onBlur={(e) => {
          if (e.target.value !== note.text)
            api.getState().setMapNoteText(note.id, e.target.value);
        }}
      />
      <div
        className="nm-mapnote-resize"
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
      />
    </div>
  );
}
