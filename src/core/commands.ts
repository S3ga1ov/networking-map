/**
 * Pure, immutable document mutations. Every command takes a document and
 * returns a *new* document, never mutating the input. This keeps undo/redo
 * trivial (snapshots) and keeps the logic portable across web/Obsidian builds.
 */

import {
  generateId,
  normAngle,
  type Circle,
  type Layer,
  type Link,
  type LinkDirection,
  type LinkStyle,
  type NetMapDocument,
  type Person,
  type PersonColor,
  type PersonSize,
  type Sector,
  type Viewport,
} from "./model";

export interface NewPersonInput {
  last: string;
  first: string;
  patronymic?: string;
  alias?: string;
  color: PersonColor;
  size?: PersonSize;
  x: number;
  y: number;
}

export function addPerson(
  doc: NetMapDocument,
  input: NewPersonInput,
  now: string = new Date().toISOString(),
): { doc: NetMapDocument; person: Person } {
  const person: Person = {
    id: generateId("p"),
    last: input.last,
    first: input.first,
    patronymic: input.patronymic ?? "",
    alias: input.alias ?? "",
    color: input.color,
    size: input.size ?? "normal",
    x: input.x,
    y: input.y,
    notes: "",
    notePath: null,
    createdAt: now,
  };
  return { doc: { ...doc, people: [...doc.people, person] }, person };
}

export function movePerson(
  doc: NetMapDocument,
  id: string,
  x: number,
  y: number,
): NetMapDocument {
  return mapPerson(doc, id, (p) => ({ ...p, x, y }));
}

export function renamePerson(
  doc: NetMapDocument,
  id: string,
  parts: Pick<Person, "last" | "first" | "patronymic">,
): NetMapDocument {
  return mapPerson(doc, id, (p) => ({ ...p, ...parts }));
}

/** Set the optional node label the initials are derived from. */
export function setAlias(
  doc: NetMapDocument,
  id: string,
  alias: string,
): NetMapDocument {
  return mapPerson(doc, id, (p) => ({ ...p, alias }));
}

export function setColor(
  doc: NetMapDocument,
  id: string,
  color: PersonColor,
): NetMapDocument {
  return mapPerson(doc, id, (p) => ({ ...p, color }));
}

export function setSize(
  doc: NetMapDocument,
  id: string,
  size: PersonSize,
): NetMapDocument {
  return mapPerson(doc, id, (p) => ({ ...p, size }));
}

export function setNotes(
  doc: NetMapDocument,
  id: string,
  notes: string,
): NetMapDocument {
  return mapPerson(doc, id, (p) => ({ ...p, notes }));
}

/** Record that a person's notes now live in a vault note (clears inline text). */
export function setNotePath(
  doc: NetMapDocument,
  id: string,
  notePath: string | null,
): NetMapDocument {
  return mapPerson(doc, id, (p) => ({
    ...p,
    notePath,
    notes: notePath ? "" : p.notes,
  }));
}

/** Remove a person and every link touching them. */
export function deletePerson(doc: NetMapDocument, id: string): NetMapDocument {
  return {
    ...doc,
    people: doc.people.filter((p) => p.id !== id),
    links: doc.links.filter((l) => l.source !== id && l.target !== id),
  };
}

export function addLink(
  doc: NetMapDocument,
  source: string,
  target: string,
  style: LinkStyle,
  layerId: string = doc.activeLayerId,
): NetMapDocument {
  if (source === target) return doc;
  // Avoid an exact duplicate (same endpoints, layer, and style).
  const exists = doc.links.some(
    (l) =>
      l.layerId === layerId &&
      l.style === style &&
      ((l.source === source && l.target === target) ||
        (l.source === target && l.target === source)),
  );
  if (exists) return doc;
  const link: Link = {
    id: generateId("l"),
    layerId,
    source,
    target,
    style,
    direction: "none",
  };
  return { ...doc, links: [...doc.links, link] };
}

export function removeLink(doc: NetMapDocument, id: string): NetMapDocument {
  return { ...doc, links: doc.links.filter((l) => l.id !== id) };
}

export function setLinkStyle(
  doc: NetMapDocument,
  id: string,
  style: LinkStyle,
): NetMapDocument {
  return {
    ...doc,
    links: doc.links.map((l) => (l.id === id ? { ...l, style } : l)),
  };
}

export function setLinkDirection(
  doc: NetMapDocument,
  id: string,
  direction: LinkDirection,
): NetMapDocument {
  return {
    ...doc,
    links: doc.links.map((l) => (l.id === id ? { ...l, direction } : l)),
  };
}

export function addLayer(
  doc: NetMapDocument,
  name: string,
): { doc: NetMapDocument; layer: Layer } {
  const layer: Layer = { id: generateId("layer"), name, visible: true };
  return {
    doc: { ...doc, layers: [...doc.layers, layer], activeLayerId: layer.id },
    layer,
  };
}

export function renameLayer(
  doc: NetMapDocument,
  id: string,
  name: string,
): NetMapDocument {
  return {
    ...doc,
    layers: doc.layers.map((l) => (l.id === id ? { ...l, name } : l)),
  };
}

export function setLayerVisible(
  doc: NetMapDocument,
  id: string,
  visible: boolean,
): NetMapDocument {
  return {
    ...doc,
    layers: doc.layers.map((l) => (l.id === id ? { ...l, visible } : l)),
  };
}

export function setActiveLayer(
  doc: NetMapDocument,
  id: string,
): NetMapDocument {
  if (!doc.layers.some((l) => l.id === id)) return doc;
  return { ...doc, activeLayerId: id };
}

/** Delete a layer and all its links. Refuses to delete the last layer. */
export function deleteLayer(doc: NetMapDocument, id: string): NetMapDocument {
  if (doc.layers.length <= 1) return doc;
  const layers = doc.layers.filter((l) => l.id !== id);
  const activeLayerId =
    doc.activeLayerId === id ? layers[0].id : doc.activeLayerId;
  return {
    ...doc,
    layers,
    activeLayerId,
    links: doc.links.filter((l) => l.layerId !== id),
  };
}

export const MIN_CIRCLE_RADIUS = 30;
export const CIRCLE_GAP = 24; // logical units kept between adjacent rings

/**
 * Clamp a ring's radius so rings keep their nesting order with a gap: an inner
 * ring can't grow past the next outer ring, and vice versa. Ring order is the
 * order of `circles` (inner → outer).
 */
export function clampCircleRadius(
  circles: Circle[],
  id: string,
  radius: number,
): number {
  const i = circles.findIndex((c) => c.id === id);
  if (i < 0) return Math.max(MIN_CIRCLE_RADIUS, radius);
  const lower = i > 0 ? circles[i - 1].radius + CIRCLE_GAP : MIN_CIRCLE_RADIUS;
  const lo = Math.max(MIN_CIRCLE_RADIUS, lower);
  const upper =
    i < circles.length - 1 ? circles[i + 1].radius - CIRCLE_GAP : Infinity;
  return Math.min(Math.max(radius, lo), Math.max(lo, upper));
}

export function resizeCircle(
  doc: NetMapDocument,
  id: string,
  radius: number,
): NetMapDocument {
  const clamped = clampCircleRadius(doc.circles, id, radius);
  return mapCircle(doc, id, (c) => ({ ...c, radius: clamped }));
}

export function renameCircle(
  doc: NetMapDocument,
  id: string,
  label: string,
): NetMapDocument {
  return mapCircle(doc, id, (c) => ({ ...c, label }));
}

export function renameSector(
  doc: NetMapDocument,
  id: string,
  label: string,
): NetMapDocument {
  return mapSectors(doc, (s) =>
    s.map((sec) => (sec.id === id ? { ...sec, label } : sec)),
  );
}

export const MIN_SECTOR_GAP = 6; // degrees between adjacent boundaries

/** The clamped boundary angle for a sector, keeping a gap from its neighbors. */
export function clampSectorStart(
  sectors: Sector[],
  id: string,
  angle: number,
): number {
  const n = sectors.length;
  if (n <= 1) return normAngle(angle);
  const i = sectors.findIndex((s) => s.id === id);
  if (i < 0) return normAngle(angle);
  const prev = sectors[(i - 1 + n) % n].start;
  const next = sectors[(i + 1) % n].start;
  // Width of the arc the boundary may move within (prev → next, clockwise).
  const width = n === 2 ? 360 : normAngle(next - prev);
  const desired = normAngle(angle - prev);
  const clamped = Math.min(Math.max(desired, MIN_SECTOR_GAP), width - MIN_SECTOR_GAP);
  return normAngle(prev + clamped);
}

/** Move a sector's boundary to a new angle, clamped between its neighbors. */
export function setSectorStart(
  doc: NetMapDocument,
  id: string,
  angle: number,
): NetMapDocument {
  const start = clampSectorStart(doc.axes.sectors, id, angle);
  return mapSectors(doc, (s) =>
    sortSectors(s.map((sec) => (sec.id === id ? { ...sec, start } : sec))),
  );
}

/** Split a sector in two, inserting a new boundary at its mid-angle. */
export function splitSector(
  doc: NetMapDocument,
  id: string,
  newLabel: string,
): { doc: NetMapDocument; sectorId: string } {
  const sectors = doc.axes.sectors;
  const n = sectors.length;
  const i = sectors.findIndex((s) => s.id === id);
  if (i < 0) return { doc, sectorId: "" };
  const start = sectors[i].start;
  const next = n === 1 ? start + 360 : sectors[(i + 1) % n].start;
  const mid = normAngle(start + normAngle(next - start) / 2);
  const sectorId = generateId("s");
  const inserted = { id: sectorId, label: newLabel, start: mid };
  return {
    doc: mapSectors(doc, (s) => sortSectors([...s, inserted])),
    sectorId,
  };
}

/** Remove a sector (its boundary); refuses to drop below one sector. */
export function removeSector(doc: NetMapDocument, id: string): NetMapDocument {
  if (doc.axes.sectors.length <= 1) return doc;
  return mapSectors(doc, (s) => s.filter((sec) => sec.id !== id));
}

export function setAuthor(doc: NetMapDocument, author: string): NetMapDocument {
  return { ...doc, meta: { ...doc.meta, author } };
}

export function setViewport(
  doc: NetMapDocument,
  viewport: Partial<Viewport>,
): NetMapDocument {
  return { ...doc, viewport: { ...doc.viewport, ...viewport } };
}

// ---- internal helpers ------------------------------------------------------

function mapPerson(
  doc: NetMapDocument,
  id: string,
  fn: (p: Person) => Person,
): NetMapDocument {
  return {
    ...doc,
    people: doc.people.map((p) => (p.id === id ? fn(p) : p)),
  };
}

function mapCircle(
  doc: NetMapDocument,
  id: string,
  fn: (c: Circle) => Circle,
): NetMapDocument {
  return {
    ...doc,
    circles: doc.circles.map((c) => (c.id === id ? fn(c) : c)),
  };
}

function sortSectors(s: Sector[]): Sector[] {
  return [...s].sort((a, b) => a.start - b.start);
}

function mapSectors(
  doc: NetMapDocument,
  fn: (s: Sector[]) => Sector[],
): NetMapDocument {
  return { ...doc, axes: { ...doc.axes, sectors: fn(doc.axes.sectors) } };
}
