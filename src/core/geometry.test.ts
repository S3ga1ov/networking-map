import { describe, expect, it } from "vitest";
import {
  initials,
  aliasInitials,
  displayInitials,
  fullName,
  ringOf,
  ringCircleOf,
  sectorOf,
  sectorLabelOf,
  screenToLogical,
  logicalToScreen,
  personAt,
} from "./geometry";
import { defaultCircles, defaultSectors, type Axes, type Person } from "./model";

const axes: Axes = { sectors: defaultSectors() };

describe("initials", () => {
  it("defaults to surname-first (Ф+И), uppercased", () => {
    expect(initials("Иванов", "Иван")).toBe("ИИ");
    expect(initials("smith", "john")).toBe("SJ");
  });
  it("can put the given-name letter first (И+Ф)", () => {
    expect(initials("smith", "john", false)).toBe("JS");
  });
  it("handles missing parts", () => {
    expect(initials("", "Иван")).toBe("И");
    expect(initials("Иванов", "")).toBe("И");
    expect(initials("", "")).toBe("");
  });
});

describe("aliasInitials / displayInitials", () => {
  it("takes one letter from one word, two from two words", () => {
    expect(aliasInitials("мама")).toBe("М");
    expect(aliasInitials("лысый чёрт")).toBe("ЛЧ");
    expect(aliasInitials("  раз два три  ")).toBe("РД");
    expect(aliasInitials("")).toBe("");
  });

  it("prefers the alias over the name when present", () => {
    expect(
      displayInitials({ alias: "мама", last: "Иванова", first: "Бэла" }),
    ).toBe("М");
    expect(
      displayInitials({ alias: "", last: "Иванова", first: "Бэла" }),
    ).toBe("ИБ");
    expect(
      displayInitials({ last: "Volkov", first: "Vasiliy" }, false),
    ).toBe("VV");
  });
});

describe("fullName", () => {
  it("joins present parts and collapses gaps", () => {
    expect(fullName({ last: "Иванов", first: "Иван", patronymic: "" })).toBe(
      "Иванов Иван",
    );
    expect(
      fullName({ last: "Иванов", first: "Иван", patronymic: "Иванович" }),
    ).toBe("Иванов Иван Иванович");
  });
});

describe("ringOf / ringCircleOf", () => {
  const circles = defaultCircles(); // 160, 300, 440

  it("classifies by distance from center", () => {
    expect(ringOf({ x: 0, y: 0 }, circles)).toBe(0);
    expect(ringOf({ x: 150, y: 0 }, circles)).toBe(0);
    expect(ringOf({ x: 0, y: 200 }, circles)).toBe(1);
    expect(ringOf({ x: 400, y: 0 }, circles)).toBe(2);
    expect(ringOf({ x: 500, y: 0 }, circles)).toBe(3); // outside all
  });

  it("returns the containing circle or null when outside", () => {
    expect(ringCircleOf({ x: 100, y: 0 }, circles)?.id).toBe("trust");
    expect(ringCircleOf({ x: 250, y: 0 }, circles)?.id).toBe("productivity");
    expect(ringCircleOf({ x: 999, y: 0 }, circles)).toBeNull();
  });
});

describe("sectorOf / sectorLabelOf", () => {
  it("maps quadrants to default sector labels (y down)", () => {
    expect(sectorLabelOf({ x: 100, y: -100 }, axes)).toBe("Работа"); // top-right
    expect(sectorLabelOf({ x: 100, y: 100 }, axes)).toBe("Семья"); // bottom-right
    expect(sectorLabelOf({ x: -100, y: 100 }, axes)).toBe("Друзья"); // bottom-left
    expect(sectorLabelOf({ x: -100, y: -100 }, axes)).toBe("Услуги"); // top-left
  });

  it("returns a valid index for any point", () => {
    const i = sectorOf({ x: 5, y: 5 }, axes);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThan(axes.sectors.length);
  });

  it("a single sector swallows the whole plane", () => {
    const one: Axes = { sectors: [{ id: "a", label: "All", start: 0 }] };
    expect(sectorOf({ x: -3, y: 7 }, one)).toBe(0);
    expect(sectorLabelOf({ x: -3, y: 7 }, one)).toBe("All");
  });
});

describe("screen <-> logical round trip", () => {
  it("is invertible", () => {
    const viewport = { zoom: 1.5, panX: 20, panY: -10 };
    const center = { x: 400, y: 300 };
    const logical = { x: 123, y: -45 };
    const screen = logicalToScreen(logical, viewport, center);
    const back = screenToLogical(screen, viewport, center);
    expect(back.x).toBeCloseTo(logical.x, 6);
    expect(back.y).toBeCloseTo(logical.y, 6);
  });
});

describe("personAt", () => {
  const mk = (id: string, x: number, y: number): Person => ({
    id,
    last: "L",
    first: "F",
    patronymic: "",
    alias: "",
    color: "gray",
    size: "normal",
    notePaths: [],
    x,
    y,
    createdAt: "now",
  });

  it("returns the topmost (last) person within the hit radius", () => {
    const people = [mk("a", 0, 0), mk("b", 5, 5)];
    expect(personAt({ x: 4, y: 4 }, people, 20)?.id).toBe("b");
    expect(personAt({ x: 0, y: 0 }, people, 3)?.id).toBe("a");
    expect(personAt({ x: 999, y: 999 }, people, 20)).toBeNull();
  });
});
