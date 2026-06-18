/**
 * Standalone SVG export. Rendered from the document (not the live DOM) so the
 * output is self-contained: explicit colors, its own viewBox, no CSS variables.
 */

import { initials, type Point } from "../geometry";
import { type NetMapDocument } from "../model";

const RING_STROKE = "#b9c0cc";
const AXIS_STROKE = "#cfd4dc";
const TEXT_MUTED = "#6b7280";
const TEXT_NORMAL = "#1f2937";
const NODE_RADIUS = 22;
const SIZE_RADIUS: Record<string, number> = {
  normal: 22,
  important: 31,
  key: 42,
};
const radiusOf = (size: string | undefined) => SIZE_RADIUS[size ?? "normal"] ?? 22;

const PERSON: Record<string, { fill: string; stroke: string; text: string }> = {
  blue: { fill: "#bfe3ff", stroke: "#4a90d9", text: "#0b3a5b" },
  pink: { fill: "#ffd1e3", stroke: "#d9609a", text: "#5b0b35" },
  gray: { fill: "#dcdfe4", stroke: "#8a9099", text: "#2b2f36" },
};

const LINK: Record<string, { stroke: string; width: number; dash?: string }> = {
  "bold-black": { stroke: "#1b1b1b", width: 4 },
  "thin-black": { stroke: "#1b1b1b", width: 1.5 },
  "dashed-black": { stroke: "#1b1b1b", width: 1.5, dash: "7 5" },
  "thin-green": { stroke: "#2e9e4f", width: 1.5 },
  "thin-red": { stroke: "#d23b3b", width: 1.5 },
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Compute a square content bound (half-extent) centered on the origin. */
function halfExtent(doc: NetMapDocument): number {
  const maxRing = Math.max(...doc.circles.map((c) => c.radius), 100) + 60;
  let people = 0;
  for (const p of doc.people) {
    const r = radiusOf(p.size);
    people = Math.max(people, Math.abs(p.x) + r, Math.abs(p.y) + r);
  }
  return Math.max(maxRing, people) + 20;
}

/** Build a complete, standalone SVG document string for the map. */
export function renderSvgString(doc: NetMapDocument): string {
  const half = halfExtent(doc);
  const size = half * 2;
  const vb = `${-half} ${-half} ${size} ${size}`;
  const parts: string[] = [];

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(size)}" height="${Math.round(size)}" viewBox="${vb}">`,
  );
  parts.push(`<rect x="${-half}" y="${-half}" width="${size}" height="${size}" fill="#ffffff"/>`);

  // Arrowhead markers, one per line color.
  const marker = (id: string, fill: string) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${fill}"/></marker>`;
  parts.push(
    `<defs>${marker("nm-arrow-line", "#1b1b1b")}${marker("nm-arrow-green", "#2e9e4f")}${marker("nm-arrow-red", "#d23b3b")}</defs>`,
  );

  // Axes + sector labels.
  parts.push(renderAxes(doc, half));

  // Rings (outer first) + labels.
  const rings = [...doc.circles].sort((a, b) => b.radius - a.radius);
  for (const c of rings) {
    parts.push(
      `<circle cx="0" cy="0" r="${c.radius}" fill="none" stroke="${RING_STROKE}" stroke-width="1.5"/>`,
    );
    parts.push(
      `<text x="0" y="${-c.radius + 16}" text-anchor="middle" font-size="12" fill="${TEXT_MUTED}">${esc(c.label)}</text>`,
    );
  }

  // Links (visible layers only).
  const visible = new Set(doc.layers.filter((l) => l.visible).map((l) => l.id));
  const pos = new Map<string, Point>(doc.people.map((p) => [p.id, { x: p.x, y: p.y }]));
  const rad = new Map<string, number>(doc.people.map((p) => [p.id, radiusOf(p.size)]));
  for (const link of doc.links) {
    if (!visible.has(link.layerId)) continue;
    const a = pos.get(link.source);
    const b = pos.get(link.target);
    if (!a || !b) continue;
    const s = LINK[link.style] ?? LINK["thin-black"];
    const dash = s.dash ? ` stroke-dasharray="${s.dash}"` : "";
    // Trim to each node's edge so arrowheads are visible.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ra = rad.get(link.source) ?? NODE_RADIUS;
    const rb = rad.get(link.target) ?? NODE_RADIUS;
    const fits = len > ra + rb + 8;
    const ax = a.x + (dx / len) * (fits ? ra : 0);
    const ay = a.y + (dy / len) * (fits ? ra : 0);
    const bx = b.x - (dx / len) * (fits ? rb : 0);
    const by = b.y - (dy / len) * (fits ? rb : 0);
    const dir = link.direction ?? "none";
    const arrowId =
      link.style === "thin-green"
        ? "nm-arrow-green"
        : link.style === "thin-red"
          ? "nm-arrow-red"
          : "nm-arrow-line";
    const ms =
      dir === "backward" || dir === "both" ? ` marker-start="url(#${arrowId})"` : "";
    const me =
      dir === "forward" || dir === "both" ? ` marker-end="url(#${arrowId})"` : "";
    parts.push(
      `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${s.stroke}" stroke-width="${s.width}"${dash}${ms}${me}/>`,
    );
  }

  // Center point + author.
  parts.push(`<circle cx="0" cy="0" r="6" fill="${TEXT_NORMAL}"/>`);
  parts.push(
    `<text x="0" y="-12" text-anchor="middle" font-size="13" font-weight="600" fill="${TEXT_NORMAL}">${esc(doc.meta.author)}</text>`,
  );

  // People nodes.
  for (const p of doc.people) {
    const c = PERSON[p.color] ?? PERSON.gray;
    const r = radiusOf(p.size);
    parts.push(`<g transform="translate(${p.x}, ${p.y})">`);
    parts.push(
      `<circle r="${r}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/>`,
    );
    parts.push(
      `<text text-anchor="middle" dominant-baseline="central" font-size="${(r * 0.68).toFixed(1)}" font-weight="600" fill="${c.text}">${esc(initials(p.last, p.first))}</text>`,
    );
    parts.push(`</g>`);
  }

  parts.push(`</svg>`);
  return parts.join("");
}

function renderAxes(doc: NetMapDocument, half: number): string {
  const rot = (doc.axes.rotation * Math.PI) / 180;
  const reach = half - 10;
  const a1 = { x: Math.cos(rot), y: Math.sin(rot) };
  const a2 = { x: -Math.sin(rot), y: Math.cos(rot) };
  const out: string[] = [];
  out.push(
    `<line x1="${-a1.x * reach}" y1="${-a1.y * reach}" x2="${a1.x * reach}" y2="${a1.y * reach}" stroke="${AXIS_STROKE}" stroke-width="1.5"/>`,
  );
  out.push(
    `<line x1="${-a2.x * reach}" y1="${-a2.y * reach}" x2="${a2.x * reach}" y2="${a2.y * reach}" stroke="${AXIS_STROKE}" stroke-width="1.5"/>`,
  );

  const labelR = Math.max(...doc.circles.map((c) => c.radius), 100) + 26;
  const diag = [
    { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
    { x: Math.SQRT1_2, y: Math.SQRT1_2 },
    { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
    { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
  ];
  doc.axes.sectors.forEach((label, i) => {
    const d = diag[i];
    const x = (d.x * Math.cos(rot) - d.y * Math.sin(rot)) * labelR;
    const y = (d.x * Math.sin(rot) + d.y * Math.cos(rot)) * labelR;
    out.push(
      `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="600" fill="${TEXT_MUTED}">${esc(label.toUpperCase())}</text>`,
    );
  });
  return out.join("");
}
