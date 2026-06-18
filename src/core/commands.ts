/**
 * Pure, immutable document mutations. Every command takes a document and
 * returns a *new* document, never mutating the input. This keeps undo/redo
 * trivial (snapshots) and keeps the logic portable across web/Obsidian builds.
 */

import {
  generateId,
  type Axes,
  type Circle,
  type Layer,
  type Link,
  type LinkDirection,
  type LinkStyle,
  type NetMapDocument,
  type Person,
  type PersonColor,
  type PersonSize,
  type Viewport,
} from "./model";

export interface NewPersonInput {
  last: string;
  first: string;
  patronymic?: string;
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

export function resizeCircle(
  doc: NetMapDocument,
  id: string,
  radius: number,
): NetMapDocument {
  const clamped = Math.max(20, radius);
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
  index: 0 | 1 | 2 | 3,
  label: string,
): NetMapDocument {
  const sectors = [...doc.axes.sectors] as Axes["sectors"];
  sectors[index] = label;
  return { ...doc, axes: { ...doc.axes, sectors } };
}

export function rotateAxes(
  doc: NetMapDocument,
  rotation: number,
): NetMapDocument {
  return { ...doc, axes: { ...doc.axes, rotation } };
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
