import { useCallback, useRef, useState } from "react";
import { useMapStore, useMapStoreApi } from "../StoreContext";
import { useT } from "../LangContext";
import { useConfirm } from "../ConfirmContext";
import {
  removeSector,
  renameSector,
  splitSector,
} from "../../core/commands";
import { pointAngle, screenToLogical, type Point } from "../../core/geometry";

interface Props {
  center: Point;
  svg: React.RefObject<SVGSVGElement>;
}

/**
 * The angular sector boundaries (rays from the center) and their labels. Each
 * boundary has a drag handle to move it along the arc; each sector label can be
 * renamed (double-click), split, or removed. Labels/handles compensate for zoom.
 */
export function AxesOverlay({ center, svg }: Props) {
  const api = useMapStoreApi();
  const t = useT();
  const confirm = useConfirm();
  const circles = useMapStore((s) => s.doc.circles);
  const sectors = useMapStore((s) => s.doc.axes.sectors);
  const zoom = useMapStore((s) => s.viewport.zoom);
  const sectorDrag = useMapStore((s) => s.sectorDrag);
  const [editing, setEditing] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const outer = Math.max(...circles.map((c) => c.radius), 100);
  const reach = outer + 48;
  const handleR = Math.max(outer * 0.6, 70);
  const sectorFont = 15 / zoom;
  const labelR = outer + sectorFont * 1.4;
  const inv = 1 / zoom;
  const n = sectors.length;

  const startOf = (id: string, base: number) =>
    sectorDrag && sectorDrag.id === id ? sectorDrag.start : base;

  const toAngle = useCallback(
    (e: { clientX: number; clientY: number }): number => {
      const rect = svg.current?.getBoundingClientRect();
      const p = screenToLogical(
        { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) },
        api.getState().viewport,
        center,
      );
      return pointAngle(p);
    },
    [api, center, svg],
  );

  const rad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <g className="nm-axes">
      {sectors.map((sec) => {
        const a = rad(startOf(sec.id, sec.start));
        return (
          <g key={`ray-${sec.id}`}>
            <line
              x1={0}
              y1={0}
              x2={Math.cos(a) * reach}
              y2={Math.sin(a) * reach}
              className="nm-axis-line"
            />
            {n > 1 && (
              <BoundaryHandle
                x={Math.cos(a) * handleR}
                y={Math.sin(a) * handleR}
                r={6 * inv}
                onDrag={(e) => api.getState().dragSectorTo(sec.id, toAngle(e))}
                onEnd={() => api.getState().commitSectorDrag()}
              />
            )}
          </g>
        );
      })}

      {sectors.map((sec, i) => {
        const start = startOf(sec.id, sec.start);
        const next =
          n === 1 ? start + 360 : startOf(sectors[(i + 1) % n].id, sectors[(i + 1) % n].start);
        const span = ((next - start + 360) % 360) || 360;
        const mid = rad(start + span / 2);
        const cx = Math.cos(mid) * labelR;
        const cy = Math.sin(mid) * labelR;

        if (editing === sec.id) {
          return (
            <g key={`lbl-${sec.id}`} transform={`translate(${cx}, ${cy}) scale(${inv})`}>
              <foreignObject x={-90} y={-13} width={180} height={26}>
                <input
                  className="nm-input nm-inline-edit"
                  autoFocus
                  defaultValue={sec.label}
                  onBlur={(e) => {
                    const v = e.target.value.trim() || sec.label;
                    api.getState().apply((doc) => renameSector(doc, sec.id, v));
                    setEditing(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditing(null);
                  }}
                />
              </foreignObject>
            </g>
          );
        }

        const hot = hovered === sec.id;
        return (
          <g
            key={`lbl-${sec.id}`}
            transform={`translate(${cx}, ${cy}) scale(${inv})`}
            onMouseEnter={() => setHovered(sec.id)}
            onMouseLeave={() => setHovered((h) => (h === sec.id ? null : h))}
          >
            {/* Transparent hover surface covering label + tools. */}
            <rect x={-70} y={-16} width={140} height={48} fill="transparent" />
            <text
              x={0}
              y={0}
              textAnchor="middle"
              dominantBaseline="middle"
              className="nm-sector-label"
              style={{ cursor: "text", fontSize: 15 }}
              onDoubleClick={() => setEditing(sec.id)}
            >
              {sec.label}
            </text>
            {hot && (
              <foreignObject x={-30} y={13} width={60} height={26}>
                <div className="nm-sector-tools" onPointerDown={(e) => e.stopPropagation()}>
                  <button
                    className="nm-sector-tool nm-st-split"
                    title={t("sector.split")}
                    onClick={() =>
                      api.getState().apply((doc) => splitSector(doc, sec.id, t("sector.new")).doc)
                    }
                  >
                    +
                  </button>
                  {n > 1 && (
                    <button
                      className="nm-sector-tool nm-st-remove"
                      title={t("sector.remove")}
                      onClick={() => {
                        void confirm({ message: t("confirm.sector") }).then((ok) => {
                          if (ok) api.getState().apply((doc) => removeSector(doc, sec.id));
                        });
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </g>
  );
}

function BoundaryHandle(props: {
  x: number;
  y: number;
  r: number;
  onDrag: (e: { clientX: number; clientY: number }) => void;
  onEnd: () => void;
}) {
  const dragging = useRef(false);
  return (
    <circle
      cx={props.x}
      cy={props.y}
      r={props.r}
      className="nm-sector-handle"
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as Element).setPointerCapture?.(e.pointerId);
        dragging.current = true;
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        e.stopPropagation();
        props.onDrag(e);
      }}
      onPointerUp={(e) => {
        if (!dragging.current) return;
        e.stopPropagation();
        dragging.current = false;
        props.onEnd();
      }}
    />
  );
}
