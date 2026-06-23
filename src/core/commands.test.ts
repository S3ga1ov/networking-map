import { describe, expect, it } from "vitest";
import {
  addLayer,
  addLink,
  addMapNote,
  addNoteLink,
  addPerson,
  CIRCLE_GAP,
  moveMapNote,
  removeMapNote,
  resizeMapNote,
  setMapNoteText,
  deleteLayer,
  deletePerson,
  MIN_CIRCLE_RADIUS,
  movePerson,
  removeLink,
  removeNoteLink,
  removeSector,
  resizeCircle,
  setActiveLayer,
  setLinkDirection,
  setLayerVisible,
  setSectorStart,
  splitSector,
} from "./commands";
import {
  CENTER_ID,
  createEmptyDocument,
  deserialize,
  DEFAULT_LAYER_ID,
  serialize,
} from "./model";
import { History } from "./history";

function withTwoPeople() {
  let doc = createEmptyDocument();
  const a = addPerson(doc, { last: "A", first: "A", color: "blue", x: 10, y: 10 });
  doc = a.doc;
  const b = addPerson(doc, { last: "B", first: "B", color: "pink", x: -10, y: -10 });
  doc = b.doc;
  return { doc, aId: a.person.id, bId: b.person.id };
}

describe("addPerson", () => {
  it("appends a person without mutating the input", () => {
    const doc = createEmptyDocument();
    const { doc: next, person } = addPerson(doc, {
      last: "Иванов",
      first: "Иван",
      color: "gray",
      x: 1,
      y: 2,
    });
    expect(doc.people).toHaveLength(0); // input untouched
    expect(next.people).toHaveLength(1);
    expect(person.notePaths).toEqual([]);
    expect(person.color).toBe("gray");
  });
});

describe("movePerson", () => {
  it("updates only the target person's coordinates", () => {
    const { doc, aId, bId } = withTwoPeople();
    const next = movePerson(doc, aId, 99, 88);
    expect(next.people.find((p) => p.id === aId)).toMatchObject({ x: 99, y: 88 });
    expect(next.people.find((p) => p.id === bId)).toMatchObject({ x: -10, y: -10 });
  });
});

describe("deletePerson", () => {
  it("removes the person and any links touching them", () => {
    const { doc, aId, bId } = withTwoPeople();
    const linked = addLink(doc, aId, bId, "thin-black");
    expect(linked.links).toHaveLength(1);
    const next = deletePerson(linked, aId);
    expect(next.people).toHaveLength(1);
    expect(next.links).toHaveLength(0);
  });
});

describe("links", () => {
  it("assigns links to the active layer by default", () => {
    const { doc, aId, bId } = withTwoPeople();
    const next = addLink(doc, aId, bId, "bold-black");
    expect(next.links[0].layerId).toBe(DEFAULT_LAYER_ID);
  });

  it("ignores self-links and exact duplicates", () => {
    const { doc, aId, bId } = withTwoPeople();
    let next = addLink(doc, aId, aId, "thin-red");
    expect(next.links).toHaveLength(0);
    next = addLink(doc, aId, bId, "thin-red");
    next = addLink(next, bId, aId, "thin-red"); // reversed dup, same style/layer
    expect(next.links).toHaveLength(1);
  });

  it("removes a link by id", () => {
    const { doc, aId, bId } = withTwoPeople();
    const linked = addLink(doc, aId, bId, "dashed-black");
    const next = removeLink(linked, linked.links[0].id);
    expect(next.links).toHaveLength(0);
  });

  it("defaults direction to none and can set it", () => {
    const { doc, aId, bId } = withTwoPeople();
    const linked = addLink(doc, aId, bId, "thin-green");
    expect(linked.links[0].direction).toBe("none");
    const next = setLinkDirection(linked, linked.links[0].id, "both");
    expect(next.links[0].direction).toBe("both");
  });
});

describe("layers", () => {
  it("creates a layer, makes it active, and can toggle visibility", () => {
    const doc = createEmptyDocument();
    const { doc: withLayer, layer } = addLayer(doc, "Слой 2");
    expect(withLayer.activeLayerId).toBe(layer.id);
    const hidden = setLayerVisible(withLayer, layer.id, false);
    expect(hidden.layers.find((l) => l.id === layer.id)?.visible).toBe(false);
  });

  it("deleting a layer drops its links and reassigns active layer", () => {
    const { doc, aId, bId } = withTwoPeople();
    const { doc: withLayer, layer } = addLayer(doc, "Слой 2");
    const linked = addLink(withLayer, aId, bId, "thin-black", layer.id);
    expect(linked.links).toHaveLength(1);
    const next = deleteLayer(linked, layer.id);
    expect(next.links).toHaveLength(0);
    expect(next.activeLayerId).toBe(DEFAULT_LAYER_ID);
  });

  it("refuses to delete the last layer", () => {
    const doc = createEmptyDocument();
    const next = deleteLayer(doc, DEFAULT_LAYER_ID);
    expect(next.layers).toHaveLength(1);
  });

  it("setActiveLayer ignores unknown ids", () => {
    const doc = createEmptyDocument();
    expect(setActiveLayer(doc, "nope").activeLayerId).toBe(DEFAULT_LAYER_ID);
  });
});

describe("note links", () => {
  it("adds, deduplicates, and removes linked notes", () => {
    const { doc, aId } = withTwoPeople();
    let next = addNoteLink(doc, aId, "People/A.md");
    next = addNoteLink(next, aId, "People/A.md"); // duplicate ignored
    next = addNoteLink(next, aId, "Contacts/A2.md");
    next = addNoteLink(next, aId, ""); // empty ignored
    let person = next.people.find((p) => p.id === aId)!;
    expect(person.notePaths).toEqual(["People/A.md", "Contacts/A2.md"]);

    next = removeNoteLink(next, aId, "People/A.md");
    person = next.people.find((p) => p.id === aId)!;
    expect(person.notePaths).toEqual(["Contacts/A2.md"]);
  });
});

describe("resizeCircle", () => {
  it("clamps to a minimum radius", () => {
    const doc = createEmptyDocument();
    const next = resizeCircle(doc, "trust", 5);
    expect(next.circles.find((c) => c.id === "trust")?.radius).toBe(
      MIN_CIRCLE_RADIUS,
    );
  });

  it("keeps an inner ring from growing past the next ring (with a gap)", () => {
    const doc = createEmptyDocument(); // trust 160, productivity 300
    const next = resizeCircle(doc, "trust", 999);
    const trust = next.circles.find((c) => c.id === "trust")!.radius;
    const prod = next.circles.find((c) => c.id === "productivity")!.radius;
    expect(trust).toBeLessThanOrEqual(prod - CIRCLE_GAP);
  });
});

describe("sectors", () => {
  it("splits a sector into two with the new label", () => {
    const doc = createEmptyDocument(); // 4 default sectors
    const first = doc.axes.sectors[0];
    const { doc: next, sectorId } = splitSector(doc, first.id, "Новый сектор");
    expect(next.axes.sectors).toHaveLength(5);
    const added = next.axes.sectors.find((s) => s.id === sectorId);
    expect(added?.label).toBe("Новый сектор");
    // Stays sorted by start angle.
    const starts = next.axes.sectors.map((s) => s.start);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it("clamps a boundary between its neighbors", () => {
    const doc = createEmptyDocument(); // starts 0, 90, 180, 270
    const second = doc.axes.sectors[1]; // start 90
    const moved = setSectorStart(doc, second.id, 400); // way past neighbor 180
    const s = moved.axes.sectors.find((x) => x.id === second.id)!;
    expect(s.start).toBeLessThan(180);
    expect(s.start).toBeGreaterThan(0);
  });

  it("removes a sector but refuses the last one", () => {
    let doc = createEmptyDocument();
    doc = removeSector(doc, doc.axes.sectors[0].id);
    expect(doc.axes.sectors).toHaveLength(3);
    while (doc.axes.sectors.length > 1) {
      doc = removeSector(doc, doc.axes.sectors[0].id);
    }
    const same = removeSector(doc, doc.axes.sectors[0].id);
    expect(same.axes.sectors).toHaveLength(1);
  });
});

describe("migration", () => {
  it("upgrades the old rotation+4-label axes to angular sectors", () => {
    const old = {
      version: 1,
      meta: { title: "t", createdAt: "x", author: "Y" },
      axes: { rotation: 0, sectors: ["Работа", "Семья", "Друзья", "Услуги"] },
      people: [],
      layers: [{ id: "default", name: "L", visible: true }],
      activeLayerId: "default",
      links: [],
    };
    const doc = deserialize(JSON.stringify(old));
    expect(doc.axes.sectors).toHaveLength(4);
    const labels = doc.axes.sectors.map((s) => s.label).sort();
    expect(labels).toEqual(["Друзья", "Работа", "Семья", "Услуги"]);
    // New format round-trips unchanged.
    expect(deserialize(serialize(doc)).axes).toEqual(doc.axes);
  });

  it("folds legacy notePath into notePaths and drops inline notes", () => {
    const old = {
      version: 1,
      meta: { title: "t", createdAt: "x", author: "Y" },
      people: [
        {
          id: "p1",
          last: "A",
          first: "A",
          color: "blue",
          x: 0,
          y: 0,
          notes: "some inline text",
          notePath: "People/A.md",
          createdAt: "x",
        },
      ],
      layers: [{ id: "default", name: "L", visible: true }],
      activeLayerId: "default",
      links: [],
    };
    const doc = deserialize(JSON.stringify(old));
    const p = doc.people[0];
    expect(p.notePaths).toEqual(["People/A.md"]);
    expect("notes" in p).toBe(false);
    expect("notePath" in p).toBe(false);
  });
});

describe("map notes", () => {
  it("adds, edits, moves, resizes and removes a map note", () => {
    let doc = createEmptyDocument();
    const res = addMapNote(doc, 100, 50);
    doc = res.doc;
    expect(doc.mapNotes).toHaveLength(1);
    const id = res.note.id;

    doc = setMapNoteText(doc, id, "hello");
    doc = moveMapNote(doc, id, 200, 80);
    doc = resizeMapNote(doc, id, 10, 10); // below min → clamped
    const n = doc.mapNotes[0];
    expect(n.text).toBe("hello");
    expect(n).toMatchObject({ x: 200, y: 80 });
    expect(n.width).toBeGreaterThanOrEqual(80);
    expect(n.height).toBeGreaterThanOrEqual(60);

    doc = removeMapNote(doc, id);
    expect(doc.mapNotes).toHaveLength(0);
  });
});

describe("center links", () => {
  it("connects a person to the center point", () => {
    const { doc, aId } = withTwoPeople();
    const next = addLink(doc, CENTER_ID, aId, "thin-black");
    expect(next.links).toHaveLength(1);
    expect(next.links[0].source).toBe(CENTER_ID);
  });
});

describe("History", () => {
  it("undoes and redoes document snapshots", () => {
    const h = new History();
    const doc0 = createEmptyDocument();
    const { doc: doc1 } = addPerson(doc0, {
      last: "A",
      first: "A",
      color: "blue",
      x: 0,
      y: 0,
    });
    h.push(doc0);
    expect(h.canUndo).toBe(true);
    const undone = h.undo(doc1);
    expect(undone).toBe(doc0);
    expect(h.canRedo).toBe(true);
    const redone = h.redo(undone!);
    expect(redone).toBe(doc1);
  });
});
