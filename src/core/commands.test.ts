import { describe, expect, it } from "vitest";
import {
  addLayer,
  addLink,
  addPerson,
  deleteLayer,
  deletePerson,
  movePerson,
  removeLink,
  resizeCircle,
  setActiveLayer,
  setLinkDirection,
  setLayerVisible,
  setNotePath,
  setNotes,
} from "./commands";
import { createEmptyDocument, DEFAULT_LAYER_ID } from "./model";
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
    expect(person.notePath).toBeNull();
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

describe("notes promotion", () => {
  it("setNotePath clears inline notes when a note path is set", () => {
    const { doc, aId } = withTwoPeople();
    const noted = setNotes(doc, aId, "inline text");
    const promoted = setNotePath(noted, aId, "People/A.md");
    const person = promoted.people.find((p) => p.id === aId)!;
    expect(person.notePath).toBe("People/A.md");
    expect(person.notes).toBe("");
  });
});

describe("resizeCircle", () => {
  it("clamps to a minimum radius", () => {
    const doc = createEmptyDocument();
    const next = resizeCircle(doc, "trust", 5);
    expect(next.circles.find((c) => c.id === "trust")?.radius).toBe(20);
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
