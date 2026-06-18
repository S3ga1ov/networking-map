import { useState } from "react";
import { useMapStore, useMapStoreApi } from "../StoreContext";
import { renameSector } from "../../core/commands";

/**
 * The quadrant axes (a rotatable cross) and the four sector labels. Labels stay
 * upright, sit on the diagonals between the axes, and are double-click editable.
 */
export function AxesOverlay() {
  const api = useMapStoreApi();
  const circles = useMapStore((s) => s.doc.circles);
  const axes = useMapStore((s) => s.doc.axes);
  const zoom = useMapStore((s) => s.viewport.zoom);
  const [editing, setEditing] = useState<0 | 1 | 2 | 3 | null>(null);

  const outer = Math.max(...circles.map((c) => c.radius), 100);
  const reach = outer + 48;
  const sectorFont = 15 / zoom;
  const labelR = outer + sectorFont * 1.4;
  const inv = 1 / zoom;
  const rot = (axes.rotation * Math.PI) / 180;

  // Axis direction unit vectors (screen coords, y down).
  const a1 = { x: Math.cos(rot), y: Math.sin(rot) };
  const a2 = { x: -Math.sin(rot), y: Math.cos(rot) };

  // Diagonal unit directions for sector label centers, clockwise from top-right.
  const diagBase = [
    { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
    { x: Math.SQRT1_2, y: Math.SQRT1_2 },
    { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
    { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
  ];
  const rotate = (p: { x: number; y: number }) => ({
    x: p.x * Math.cos(rot) - p.y * Math.sin(rot),
    y: p.x * Math.sin(rot) + p.y * Math.cos(rot),
  });

  return (
    <g className="nm-axes">
      <line
        x1={-a1.x * reach}
        y1={-a1.y * reach}
        x2={a1.x * reach}
        y2={a1.y * reach}
        className="nm-axis-line"
      />
      <line
        x1={-a2.x * reach}
        y1={-a2.y * reach}
        x2={a2.x * reach}
        y2={a2.y * reach}
        className="nm-axis-line"
      />

      {axes.sectors.map((label, i) => {
        const idx = i as 0 | 1 | 2 | 3;
        const dir = rotate(diagBase[i]);
        const cx = dir.x * labelR;
        const cy = dir.y * labelR;
        if (editing === idx) {
          return (
            <g key={i} transform={`translate(${cx}, ${cy}) scale(${inv})`}>
              <foreignObject x={-80} y={-13} width={160} height={26}>
                <input
                  className="nm-input nm-inline-edit"
                  autoFocus
                  defaultValue={label}
                  onBlur={(e) => {
                    const v = e.target.value.trim() || label;
                    api.getState().apply((doc) => renameSector(doc, idx, v));
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
        return (
          <text
            key={i}
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            className="nm-sector-label"
            onDoubleClick={() => setEditing(idx)}
            style={{ cursor: "text", fontSize: sectorFont }}
          >
            {label}
          </text>
        );
      })}
    </g>
  );
}
