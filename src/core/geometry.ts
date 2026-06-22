/**
 * Pure geometry helpers for the map. Logical coordinates are centered at the
 * author point (0, 0); +x points right and +y points down (SVG convention).
 *
 * No Obsidian / React / DOM imports — safe to unit-test in isolation.
 */

import type { Axes, Circle, Person, Viewport } from "./model";

export interface Point {
  x: number;
  y: number;
}

/** Euclidean distance from the center (author point). */
export function radius(p: Point): number {
  return Math.hypot(p.x, p.y);
}

/**
 * Which trust ring a point falls into. Returns the index into a radius-sorted
 * list: 0 = innermost ring, ... , `circles.length` = outside every ring.
 * The mapping back to a circle id is left to the caller via the sorted order.
 */
export function ringOf(p: Point, circles: Circle[]): number {
  const r = radius(p);
  const sorted = [...circles].sort((a, b) => a.radius - b.radius);
  for (let i = 0; i < sorted.length; i++) {
    if (r <= sorted[i].radius) return i;
  }
  return sorted.length;
}

/**
 * The circle a point belongs to (innermost containing ring), or null when the
 * point lies outside every ring.
 */
export function ringCircleOf(p: Point, circles: Circle[]): Circle | null {
  const sorted = [...circles].sort((a, b) => a.radius - b.radius);
  const idx = ringOf(p, sorted);
  return idx < sorted.length ? sorted[idx] : null;
}

/** Angle of a point in screen degrees [0,360): 0 = right, 90 = down. */
export function pointAngle(p: Point): number {
  const deg = (Math.atan2(p.y, p.x) * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

/**
 * Index (into `axes.sectors`) of the angular sector a point falls into. Sectors
 * are assumed sorted by `start`; each spans from its `start` to the next
 * sector's `start`, wrapping at 360°. Returns 0 when there are no sectors.
 */
export function sectorOf(p: Point, axes: Axes): number {
  const sectors = axes.sectors;
  if (sectors.length === 0) return 0;
  const angle = pointAngle(p);
  let idx = -1;
  for (let i = 0; i < sectors.length; i++) {
    if (sectors[i].start <= angle) idx = i;
  }
  // Below the first boundary → belongs to the last sector (wraps past 360°).
  return idx === -1 ? sectors.length - 1 : idx;
}

/** Sector label for a point (convenience over {@link sectorOf}). */
export function sectorLabelOf(p: Point, axes: Axes): string {
  const sectors = axes.sectors;
  return sectors.length ? sectors[sectorOf(p, axes)].label : "";
}

/**
 * Initials shown on a node, uppercased. `surnameFirst` puts the last-name letter
 * first (Ф+И); otherwise the first-name letter leads (И+Ф). Falls back
 * gracefully when a part is missing.
 */
export function initials(
  last: string,
  first: string,
  surnameFirst = true,
): string {
  const l = firstGrapheme(last);
  const f = firstGrapheme(first);
  return (surnameFirst ? l + f : f + l).toUpperCase();
}

function firstGrapheme(s: string): string {
  const trimmed = s.trim();
  return trimmed.length > 0 ? Array.from(trimmed)[0] : "";
}

/** Full display name "Last First Patronymic" with extra spaces collapsed. */
export function fullName(p: Pick<Person, "last" | "first" | "patronymic">): string {
  return [p.last, p.first, p.patronymic]
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .join(" ");
}

/**
 * Convert a logical point to screen coordinates given the viewport and the
 * on-screen position of the center. Used by exporters and hit-testing helpers
 * that need to reason outside React's render.
 */
export function logicalToScreen(
  p: Point,
  viewport: Viewport,
  centerScreen: Point,
): Point {
  return {
    x: centerScreen.x + (p.x + viewport.panX) * viewport.zoom,
    y: centerScreen.y + (p.y + viewport.panY) * viewport.zoom,
  };
}

/** Inverse of {@link logicalToScreen}. */
export function screenToLogical(
  s: Point,
  viewport: Viewport,
  centerScreen: Point,
): Point {
  return {
    x: (s.x - centerScreen.x) / viewport.zoom - viewport.panX,
    y: (s.y - centerScreen.y) / viewport.zoom - viewport.panY,
  };
}

/** Distance between two points (for hit-testing nodes). */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * The topmost person within `hitRadius` logical units of a logical point, or
 * null. Iterates in reverse so later-added (visually on-top) nodes win.
 */
export function personAt(
  p: Point,
  people: Person[],
  hitRadius: number,
): Person | null {
  for (let i = people.length - 1; i >= 0; i--) {
    if (distance(p, people[i]) <= hitRadius) return people[i];
  }
  return null;
}
