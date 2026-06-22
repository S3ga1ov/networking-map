import { useCallback, useRef } from "react";
import { useMapStore, useMapStoreApi } from "./StoreContext";
import { useElementSize } from "./useElementSize";
import {
  logicalToScreen,
  screenToLogical,
  type Point,
} from "../core/geometry";
import type { Viewport } from "../core/model";
import { TrustCircles } from "./scene/TrustCircles";
import { AxesOverlay } from "./scene/AxesOverlay";
import { PeopleLayer } from "./scene/PeopleLayer";
import { LinksLayer } from "./scene/LinksLayer";
import { CreatePersonPopup } from "./CreatePersonPopup";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
/** Pointer travel (px) beyond which a press is treated as a pan, not a click. */
const CLICK_SLOP = 4;

export function Canvas() {
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const viewport = useMapStore((s) => s.viewport);
  const api = useMapStoreApi();

  const pendingCreate = useMapStore((s) => s.pendingCreate);

  const svgRef = useRef<SVGSVGElement>(null);
  const gesture = useRef<{
    panning: boolean;
    moved: boolean;
    startScreen: Point;
    startViewport: Viewport;
  } | null>(null);

  const center: Point = { x: size.width / 2, y: size.height / 2 };

  const screenPoint = useCallback((e: { clientX: number; clientY: number }): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    return {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      // Only start a background pan when the press is on empty canvas.
      if (e.target !== svgRef.current) return;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      gesture.current = {
        panning: true,
        moved: false,
        startScreen: screenPoint(e),
        startViewport: api.getState().viewport,
      };
    },
    [api, screenPoint],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const g = gesture.current;
      if (!g || !g.panning) return;
      const p = screenPoint(e);
      const dx = p.x - g.startScreen.x;
      const dy = p.y - g.startScreen.y;
      if (Math.hypot(dx, dy) > CLICK_SLOP) g.moved = true;
      const z = g.startViewport.zoom;
      api.getState().setViewport({
        ...g.startViewport,
        panX: g.startViewport.panX + dx / z,
        panY: g.startViewport.panY + dy / z,
      });
    },
    [api, screenPoint],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const g = gesture.current;
      gesture.current = null;
      if (!g) return;
      const state = api.getState();
      if (g.moved) {
        state.commitViewport();
      } else if (e.target === svgRef.current) {
        // A clean click on empty canvas → open the create-person popup.
        const logical = screenToLogical(screenPoint(e), state.viewport, center);
        state.selectPerson(null);
        state.beginCreate(logical);
      }
    },
    [api, screenPoint, center],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      const state = api.getState();
      const vp = state.viewport;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const z2 = clamp(vp.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      if (z2 === vp.zoom) return;
      const screen = screenPoint(e);
      // Keep the logical point under the cursor fixed across the zoom.
      const lx = (screen.x - center.x) / vp.zoom - vp.panX;
      const ly = (screen.y - center.y) / vp.zoom - vp.panY;
      const panX = (screen.x - center.x) / z2 - lx;
      const panY = (screen.y - center.y) / z2 - ly;
      state.setViewport({ zoom: z2, panX, panY });
      state.commitViewport();
    },
    [api, screenPoint, center],
  );

  const transform = `translate(${center.x}, ${center.y}) scale(${viewport.zoom}) translate(${viewport.panX}, ${viewport.panY})`;

  return (
    <div className="nm-canvas-wrap" ref={containerRef}>
      <svg
        ref={svgRef}
        className="nm-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        <g transform={transform}>
          <AxesOverlay center={center} svg={svgRef} />
          <TrustCircles center={center} svg={svgRef} />
          <LinksLayer />
          <PeopleLayer center={center} svg={svgRef} />
        </g>
      </svg>
      {pendingCreate && (
        <CreatePersonPopup
          screen={logicalToScreen(pendingCreate.at, viewport, center)}
        />
      )}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
