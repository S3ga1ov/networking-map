import { describe, expect, it } from "vitest";
import { renderSvgString } from "./svgExport";
import { exportJson } from "./index";
import { addLink, addPerson } from "../commands";
import { createEmptyDocument, deserialize } from "../model";

function sampleDoc() {
  let doc = createEmptyDocument("Тест", "Автор");
  const a = addPerson(doc, { last: "Иванов", first: "Иван", color: "blue", x: 100, y: -50 });
  doc = a.doc;
  const b = addPerson(doc, { last: "Петров", first: "Пётр", color: "pink", x: -120, y: 80 });
  doc = b.doc;
  return addLink(doc, a.person.id, b.person.id, "thin-red");
}

describe("renderSvgString", () => {
  it("produces a self-contained SVG with people, links, and labels", () => {
    const svg = renderSvgString(sampleDoc());
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("viewBox");
    expect(svg).toContain("ИИ"); // initials of Иванов Иван
    expect(svg).toContain("ПП"); // initials of Петров Пётр
    expect(svg).toContain("#d23b3b"); // thin-red link color
    expect(svg).toContain("РАБОТА"); // sector label, uppercased
    expect(svg).not.toContain("var("); // no CSS variables leak into export
  });

  it("escapes special characters in labels", () => {
    let doc = createEmptyDocument("X", "A & <B>");
    const svg = renderSvgString(doc);
    expect(svg).toContain("A &amp; &lt;B&gt;");
  });
});

describe("JSON export round-trip", () => {
  it("re-imports to an equal document", () => {
    const doc = sampleDoc();
    const json = exportJson(doc);
    const back = deserialize(json);
    expect(back).toEqual(doc);
  });
});
