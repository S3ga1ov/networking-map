/**
 * Core document model for a Networking Map.
 *
 * This module is intentionally framework-agnostic: no Obsidian and no React
 * imports. The same code can power the Obsidian view today and a standalone web
 * build later. The serialized form (see {@link serialize}) is *also* the
 * `.netmap` file format and the human-readable export format.
 */

export const CURRENT_VERSION = 1;

/** Allowed person colors (label keys; actual hex lives in the UI theme). */
export type PersonColor = "blue" | "pink" | "gray";

/** Importance of a person — drives node size. */
export type PersonSize = "normal" | "important" | "key";

/** The connection styles. */
export type LinkStyle =
  | "bold-black"
  | "thin-black"
  | "dashed-black"
  | "thin-green"
  | "thin-red";

/**
 * Arrowhead direction on a link, indicating who takes initiative in the
 * contact. "both" marks mutual initiative.
 */
export type LinkDirection = "none" | "forward" | "backward" | "both";

/** A trust ring. Radius is in logical (map) units, measured from the center. */
export interface Circle {
  id: string;
  label: string;
  radius: number;
}

/** Axes overlay: a rotation (degrees) and the four sector labels, clockwise. */
export interface Axes {
  /** Rotation of the axis cross in degrees (0 = vertical/horizontal). */
  rotation: number;
  /** Exactly four sector labels, clockwise from the top-right quadrant. */
  sectors: [string, string, string, string];
}

/** A person placed on the map. Position is in logical units, center = (0,0). */
export interface Person {
  id: string;
  last: string;
  first: string;
  patronymic: string;
  color: PersonColor;
  /** Importance — drives node radius. Defaults to "normal". */
  size: PersonSize;
  x: number;
  y: number;
  /** Inline notes (md or json). Empty when promoted to a vault note. */
  notes: string;
  /** Vault path of a promoted `.md` note, or null when notes are inline. */
  notePath: string | null;
  createdAt: string;
}

/** A connection layer. Layers carry only links; people are layer-independent. */
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
}

/** A connection between two people, belonging to a layer. */
export interface Link {
  id: string;
  layerId: string;
  source: string;
  target: string;
  style: LinkStyle;
  /** Arrowhead direction (initiative). Defaults to "none". */
  direction: LinkDirection;
}

/** Pan/zoom state of the canvas. */
export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface DocMeta {
  title: string;
  createdAt: string;
  /** Name shown at the center point (the map's author). */
  author: string;
}

export interface NetMapDocument {
  version: number;
  meta: DocMeta;
  viewport: Viewport;
  circles: Circle[];
  axes: Axes;
  people: Person[];
  layers: Layer[];
  activeLayerId: string;
  links: Link[];
}

export const DEFAULT_LAYER_ID = "default";

/** Default sector labels, clockwise: Работа, Семья, Друзья, Услуги. */
export const DEFAULT_SECTORS: [string, string, string, string] = [
  "Работа",
  "Семья",
  "Друзья",
  "Услуги",
];

/** Default trust rings, inner → outer. */
export function defaultCircles(): Circle[] {
  return [
    { id: "trust", label: "Круг поддержки", radius: 160 },
    { id: "productivity", label: "Круг продуктивности", radius: 300 },
    { id: "development", label: "Круг развития", radius: 440 },
  ];
}

/** Build a fresh, empty document. */
export function createEmptyDocument(
  title = "Карта связей",
  author = "Вы",
  now: string = new Date().toISOString(),
): NetMapDocument {
  return {
    version: CURRENT_VERSION,
    meta: { title, createdAt: now, author },
    viewport: { zoom: 1, panX: 0, panY: 0 },
    circles: defaultCircles(),
    axes: { rotation: 0, sectors: [...DEFAULT_SECTORS] },
    people: [],
    layers: [
      { id: DEFAULT_LAYER_ID, name: "Общая схема связей", visible: true },
    ],
    activeLayerId: DEFAULT_LAYER_ID,
    links: [],
  };
}

/** Serialize a document to the `.netmap` file string (pretty JSON). */
export function serialize(doc: NetMapDocument): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * Parse a `.netmap` file string into a document, running migrations and
 * filling defaults. Throws on malformed JSON; returns a fresh document for an
 * empty string (a freshly created, never-saved file).
 */
export function deserialize(raw: string): NetMapDocument {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return createEmptyDocument();
  const parsed = JSON.parse(trimmed) as Partial<NetMapDocument>;
  return migrate(parsed);
}

/**
 * Upgrade an older/partial document to the current shape. Centralizes all
 * backward-compatibility so the rest of the code can assume a complete doc.
 */
export function migrate(input: Partial<NetMapDocument>): NetMapDocument {
  const base = createEmptyDocument();
  const sectors = input.axes?.sectors;
  const doc: NetMapDocument = {
    version: CURRENT_VERSION,
    meta: { ...base.meta, ...input.meta },
    viewport: { ...base.viewport, ...input.viewport },
    circles:
      Array.isArray(input.circles) && input.circles.length > 0
        ? input.circles.map((c) => ({ ...c }))
        : base.circles,
    axes: {
      rotation: input.axes?.rotation ?? 0,
      sectors:
        Array.isArray(sectors) && sectors.length === 4
          ? ([...sectors] as [string, string, string, string])
          : [...base.axes.sectors],
    },
    people: Array.isArray(input.people)
      ? input.people.map(normalizePerson)
      : [],
    layers:
      Array.isArray(input.layers) && input.layers.length > 0
        ? input.layers.map((l) => ({ ...l, visible: l.visible ?? true }))
        : base.layers,
    activeLayerId: input.activeLayerId ?? base.activeLayerId,
    links: Array.isArray(input.links)
      ? input.links.map((l) => ({
          ...l,
          direction: (l as Partial<Link>).direction ?? ("none" as const),
        }))
      : [],
  };

  // Guarantee the active layer exists.
  if (!doc.layers.some((l) => l.id === doc.activeLayerId)) {
    doc.activeLayerId = doc.layers[0].id;
  }
  return doc;
}

function normalizePerson(p: Partial<Person>): Person {
  return {
    id: p.id ?? generateId("p"),
    last: p.last ?? "",
    first: p.first ?? "",
    patronymic: p.patronymic ?? "",
    color: (p.color as PersonColor) ?? "gray",
    size: (p.size as PersonSize) ?? "normal",
    x: p.x ?? 0,
    y: p.y ?? 0,
    notes: p.notes ?? "",
    notePath: p.notePath ?? null,
    createdAt: p.createdAt ?? new Date().toISOString(),
  };
}

/** Small, dependency-free id generator (unique enough for a single map). */
export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}_${time}${rand}`;
}
