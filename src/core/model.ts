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

/**
 * A pie slice of the coordinate plane. `start` is the boundary angle (degrees,
 * screen convention: 0 = right, 90 = down, clockwise). A sector spans from its
 * own `start` to the next sector's `start`, wrapping around 360°.
 */
export interface Sector {
  id: string;
  label: string;
  start: number;
}

/** Axes overlay: an ordered ring of angular sectors (≥1), sorted by `start`. */
export interface Axes {
  sectors: Sector[];
}

/** Reserved id for the central author point when used as a connection endpoint. */
export const CENTER_ID = "__center__";

/** A person placed on the map. Position is in logical units, center = (0,0). */
export interface Person {
  id: string;
  last: string;
  first: string;
  patronymic: string;
  /**
   * Optional label the node initials are derived from instead of the name
   * (e.g. "мама" → М, "лысый чёрт" → ЛЧ). Empty = use ФИ initials.
   */
  alias: string;
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

/** Default sector labels, by quadrant (top-right, bottom-right, BL, TL). */
export const DEFAULT_SECTORS: [string, string, string, string] = [
  "Работа",
  "Семья",
  "Друзья",
  "Услуги",
];

/**
 * Default sectors as angular slices matching the classic four quadrants
 * (screen angles: 0 = right, 90 = down). Sorted by `start`.
 */
export function defaultSectors(
  labels: [string, string, string, string] = DEFAULT_SECTORS,
): Sector[] {
  const [work, family, friends, services] = labels;
  return [
    { id: "s_family", label: family, start: 0 }, // bottom-right
    { id: "s_friends", label: friends, start: 90 }, // bottom-left
    { id: "s_services", label: services, start: 180 }, // top-left
    { id: "s_work", label: work, start: 270 }, // top-right
  ];
}

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
    axes: { sectors: defaultSectors() },
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
  const doc: NetMapDocument = {
    version: CURRENT_VERSION,
    meta: { ...base.meta, ...input.meta },
    viewport: { ...base.viewport, ...input.viewport },
    circles:
      Array.isArray(input.circles) && input.circles.length > 0
        ? input.circles.map((c) => ({ ...c }))
        : base.circles,
    axes: { sectors: migrateSectors(input.axes) },
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

/** Normalize an angle into [0, 360). */
export function normAngle(a: number): number {
  return ((a % 360) + 360) % 360;
}

/** Migrate the axes field from any historical shape to a sorted Sector[]. */
function migrateSectors(axes: Partial<NetMapDocument>["axes"] | undefined): Sector[] {
  const raw = axes?.sectors as unknown;
  if (!Array.isArray(raw) || raw.length === 0) return defaultSectors();

  // New shape: array of objects with a numeric `start`.
  if (typeof raw[0] === "object" && raw[0] !== null && "start" in raw[0]) {
    const sectors = (raw as Partial<Sector>[]).map((s, i) => ({
      id: s.id ?? generateId("s"),
      label: s.label ?? `${i + 1}`,
      start: normAngle(s.start ?? 0),
    }));
    return sectors.sort((a, b) => a.start - b.start);
  }

  // Old shape: 4 label strings + a `rotation`, one per quadrant.
  const labels = raw as string[];
  const r = (axes as { rotation?: number })?.rotation ?? 0;
  const four: [string, string, string, string] = [
    labels[0] ?? DEFAULT_SECTORS[0],
    labels[1] ?? DEFAULT_SECTORS[1],
    labels[2] ?? DEFAULT_SECTORS[2],
    labels[3] ?? DEFAULT_SECTORS[3],
  ];
  return defaultSectors(four)
    .map((s) => ({ ...s, start: normAngle(s.start + r) }))
    .sort((a, b) => a.start - b.start);
}

function normalizePerson(p: Partial<Person>): Person {
  return {
    id: p.id ?? generateId("p"),
    last: p.last ?? "",
    first: p.first ?? "",
    patronymic: p.patronymic ?? "",
    alias: p.alias ?? "",
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
