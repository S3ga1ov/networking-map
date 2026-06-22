import { useMapStore, useMapStoreApi } from "../StoreContext";
import { useT } from "../LangContext";
import {
  LINK_GREEN,
  LINK_RED,
  LINE_COLOR_VAR,
  LINK_STYLES,
  NODE_RADIUS,
  PERSON_SIZE_RADIUS,
} from "../theme";
import { removeLink, setLinkDirection } from "../../core/commands";
import { CENTER_ID, type LinkDirection, type LinkStyle } from "../../core/model";

/** Effective radius of the central point for trimming link ends. */
const CENTER_LINK_RADIUS = 10;

/** One arrowhead marker per line color (Chromium lacks reliable context-stroke). */
const ARROW_MARKERS: { id: string; fill: string }[] = [
  { id: "nm-arrow-line", fill: LINE_COLOR_VAR },
  { id: "nm-arrow-green", fill: LINK_GREEN },
  { id: "nm-arrow-red", fill: LINK_RED },
];

function arrowMarkerId(style: LinkStyle): string {
  if (style === "thin-green") return "nm-arrow-green";
  if (style === "thin-red") return "nm-arrow-red";
  return "nm-arrow-line";
}

/**
 * Renders connections for every visible layer. Drawn before the people layer so
 * nodes sit on top. Arrowheads encode initiative direction. A selected link
 * shows a compact control (direction + delete) at its midpoint.
 */
export function LinksLayer() {
  const api = useMapStoreApi();
  const links = useMapStore((s) => s.doc.links);
  const layers = useMapStore((s) => s.doc.layers);
  const people = useMapStore((s) => s.doc.people);
  const drag = useMapStore((s) => s.drag);
  const zoom = useMapStore((s) => s.viewport.zoom);
  const selectedLinkId = useMapStore((s) => s.selectedLinkId);

  const visibleLayerIds = new Set(
    layers.filter((l) => l.visible).map((l) => l.id),
  );
  const posById = new Map<string, { x: number; y: number }>();
  const radById = new Map<string, number>();
  for (const p of people) {
    posById.set(
      p.id,
      drag && drag.id === p.id ? { x: drag.x, y: drag.y } : { x: p.x, y: p.y },
    );
    radById.set(p.id, PERSON_SIZE_RADIUS[p.size]);
  }
  // The central author point participates in links at the origin.
  posById.set(CENTER_ID, { x: 0, y: 0 });
  radById.set(CENTER_ID, CENTER_LINK_RADIUS);

  return (
    <g className="nm-links">
      <defs>
        {/* One marker per line color (Chromium doesn't reliably support
            context-stroke). auto-start-reverse flips it for the start end. */}
        {ARROW_MARKERS.map((m) => (
          <marker
            key={m.id}
            id={m.id}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" style={{ fill: m.fill }} />
          </marker>
        ))}
      </defs>

      {links.map((link) => {
        if (!visibleLayerIds.has(link.layerId)) return null;
        const a = posById.get(link.source);
        const b = posById.get(link.target);
        if (!a || !b) return null;
        const style = LINK_STYLES[link.style];
        const selected = link.id === selectedLinkId;

        // Shorten the visible segment to each node's edge so arrowheads show.
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const ra = radById.get(link.source) ?? NODE_RADIUS;
        const rb = radById.get(link.target) ?? NODE_RADIUS;
        const fits = len > ra + rb + 8;
        const ax = a.x + ux * (fits ? ra : 0);
        const ay = a.y + uy * (fits ? ra : 0);
        const bx = b.x - ux * (fits ? rb : 0);
        const by = b.y - uy * (fits ? rb : 0);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;

        const dir = link.direction ?? "none";
        const arrow = `url(#${arrowMarkerId(link.style)})`;
        const markerStart =
          dir === "backward" || dir === "both" ? arrow : undefined;
        const markerEnd =
          dir === "forward" || dir === "both" ? arrow : undefined;

        return (
          <g key={link.id}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="transparent"
              strokeWidth={Math.max(14, style.width + 12)}
              style={{ cursor: "pointer" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                api.getState().selectLink(link.id);
              }}
            />
            <line
              x1={ax}
              y1={ay}
              x2={bx}
              y2={by}
              stroke={style.stroke}
              strokeWidth={style.width}
              strokeDasharray={style.dash}
              markerStart={markerStart}
              markerEnd={markerEnd}
              opacity={selected ? 0.9 : 1}
              style={{ pointerEvents: "none" }}
            />
            {selected && (
              <LinkControl
                x={mx}
                y={my}
                zoom={zoom}
                direction={dir}
                onDirection={(d) =>
                  api.getState().apply((doc) => setLinkDirection(doc, link.id, d))
                }
                onDelete={() => {
                  api.getState().apply((doc) => removeLink(doc, link.id));
                  api.getState().selectLink(null);
                }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Compact, constant-size control shown on the selected link. */
function LinkControl(props: {
  x: number;
  y: number;
  zoom: number;
  direction: LinkDirection;
  onDirection: (d: LinkDirection) => void;
  onDelete: () => void;
}) {
  const { x, y, zoom, direction, onDirection, onDelete } = props;
  const t = useT();
  const W = 196;
  const H = 34;
  const dirs: { key: LinkDirection; label: string; title: string }[] = [
    { key: "none", label: "—", title: t("arrow.none") },
    { key: "forward", label: "→", title: t("arrow.forward") },
    { key: "backward", label: "←", title: t("arrow.backward") },
    { key: "both", label: "↔", title: t("arrow.both") },
  ];
  return (
    <g transform={`translate(${x}, ${y}) scale(${1 / zoom})`}>
      <foreignObject x={-W / 2} y={-H / 2} width={W} height={H}>
        <div className="nm-link-control" onPointerDown={(e) => e.stopPropagation()}>
          {dirs.map((d) => (
            <button
              key={d.key}
              title={d.title}
              className={"nm-lc-btn" + (direction === d.key ? " is-active" : "")}
              onClick={() => onDirection(d.key)}
            >
              {d.label}
            </button>
          ))}
          <button className="nm-lc-btn nm-lc-del" title={t("link.delete")} onClick={onDelete}>
            ✕
          </button>
        </div>
      </foreignObject>
    </g>
  );
}
