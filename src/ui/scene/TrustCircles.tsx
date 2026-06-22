import { useCallback, useRef, useState } from "react";
import { useMapStore, useMapStoreApi } from "../StoreContext";
import { renameCircle, setAuthor } from "../../core/commands";
import { screenToLogical, type Point } from "../../core/geometry";
import { CENTER_ID } from "../../core/model";

interface Props {
  center: Point;
  svg: React.RefObject<SVGSVGElement>;
}

/**
 * The three concentric trust rings plus the center author point. Each ring has
 * a drag handle (top) to resize it; ring and center labels are double-click
 * editable. Label sizes compensate for zoom so they stay readable when zoomed
 * out.
 */
export function TrustCircles({ center, svg }: Props) {
  const api = useMapStoreApi();
  const circles = useMapStore((s) => s.doc.circles);
  const author = useMapStore((s) => s.doc.meta.author);
  const resize = useMapStore((s) => s.circleResize);
  const zoom = useMapStore((s) => s.viewport.zoom);
  const linkMode = useMapStore((s) => s.mode === "link");
  const isLinkSource = useMapStore((s) => s.pendingLinkSource === CENTER_ID);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingAuthor, setEditingAuthor] = useState(false);

  const onCenterClick = () => {
    const state = api.getState();
    if (state.mode === "link" && state.pendingLinkSource && state.pendingLinkSource !== CENTER_ID) {
      state.completeLink(CENTER_ID);
    } else {
      state.startLink(CENTER_ID);
    }
  };

  // Keep label text a roughly constant on-screen size.
  const ringFont = 12 / zoom;
  const ringOffset = ringFont * 1.3;
  const authorFont = 14 / zoom;
  const inv = 1 / zoom;

  const effRadius = (id: string, base: number) =>
    resize && resize.id === id ? resize.radius : base;

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

  // Draw outermost first so inner rings sit on top.
  const sorted = [...circles].sort((a, b) => b.radius - a.radius);

  return (
    <g className="nm-circles">
      {sorted.map((c) => {
        const r = effRadius(c.id, c.radius);
        return (
          <g key={c.id}>
            <circle
              cx={0}
              cy={0}
              r={r}
              fill="none"
              stroke="var(--nm-ring-stroke, #b9c0cc)"
              strokeWidth={1.5}
            />
            {editing === c.id ? (
              <g transform={`translate(0, ${-r + ringOffset}) scale(${inv})`}>
                <foreignObject x={-90} y={-13} width={180} height={26}>
                  <input
                    className="nm-input nm-inline-edit"
                    autoFocus
                    defaultValue={c.label}
                    onBlur={(e) => {
                      const v = e.target.value.trim() || c.label;
                      api.getState().apply((doc) => renameCircle(doc, c.id, v));
                      setEditing(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />
                </foreignObject>
              </g>
            ) : (
              <text
                x={0}
                y={-r + ringOffset}
                textAnchor="middle"
                className="nm-ring-label"
                onDoubleClick={() => setEditing(c.id)}
                style={{ cursor: "text", fontSize: ringFont }}
              >
                {c.label}
              </text>
            )}
            <ResizeHandle
              cy={-r}
              r={6 * inv}
              onDrag={(e) => {
                const p = toLogical(e);
                api.getState().resizeCircleTo(c.id, Math.hypot(p.x, p.y));
              }}
              onEnd={() => api.getState().commitCircleResize()}
            />
          </g>
        );
      })}

      {/* Larger transparent hit area so the center is easy to click for links. */}
      <circle
        cx={0}
        cy={0}
        r={14 * inv}
        fill="transparent"
        style={{ cursor: linkMode ? "crosshair" : "pointer" }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onCenterClick();
        }}
      />
      {isLinkSource && (
        <circle
          cx={0}
          cy={0}
          r={11 * inv}
          fill="none"
          stroke="#2e7d32"
          strokeWidth={2 * inv}
          style={{ pointerEvents: "none" }}
        />
      )}
      <circle
        cx={0}
        cy={0}
        r={6 * inv}
        className="nm-center-dot"
        style={{ pointerEvents: "none" }}
      />
      {editingAuthor ? (
        <g transform={`translate(0, ${-authorFont}) scale(${inv})`}>
          <foreignObject x={-90} y={-13} width={180} height={26}>
            <input
              className="nm-input nm-inline-edit"
              autoFocus
              defaultValue={author}
              onBlur={(e) => {
                const v = e.target.value.trim() || author;
                api.getState().apply((doc) => setAuthor(doc, v));
                setEditingAuthor(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditingAuthor(false);
              }}
            />
          </foreignObject>
        </g>
      ) : (
        <text
          x={0}
          y={-authorFont}
          textAnchor="middle"
          className="nm-center-label"
          onDoubleClick={() => setEditingAuthor(true)}
          style={{ cursor: "text", fontSize: authorFont }}
        >
          {author}
        </text>
      )}
    </g>
  );
}

function ResizeHandle(props: {
  cy: number;
  r: number;
  onDrag: (e: { clientX: number; clientY: number }) => void;
  onEnd: () => void;
}) {
  const dragging = useRef(false);
  return (
    <circle
      cx={0}
      cy={props.cy}
      r={props.r}
      className="nm-ring-handle"
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
