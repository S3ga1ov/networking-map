import { describe, expect, it } from "vitest";
import {
  initials,
  fullName,
  ringOf,
  ringCircleOf,
  sectorOf,
  screenToLogical,
  logicalToScreen,
  personAt,
} from "./geometry";
import { defaultCircles, type Axes, type Person } from "./model";

const axes: Axes = { rotation: 0, sectors: ["Работа", "Семья", "Друзья", "Услуги"] };

describe("initials", () => {
  it("takes first letters of last + first, uppercased", () => {
    expect(initials("Иванов", "Иван")).toBe("ИИ");
    expect(initials("smith", "john")).toBe("SJ");
  });
  it("handles missing parts", () => {
    expect(initials("", "Иван")).toBe("И");
    expect(initials("Иванов", "")).toBe("И");
    expect(initials("", "")).toBe("");
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

describe("sectorOf", () => {
  it("maps quadrants clockwise from top-right (y down)", () => {
    expect(sectorOf({ x: 100, y: -100 }, axes)).toBe(0); // top-right Работа
    expect(sectorOf({ x: 100, y: 100 }, axes)).toBe(1); // bottom-right Семья
    expect(sectorOf({ x: -100, y: 100 }, axes)).toBe(2); // bottom-left Друзья
    expect(sectorOf({ x: -100, y: -100 }, axes)).toBe(3); // top-left Услуги
  });

  it("respects a 90° rotation", () => {
    const rotated: Axes = { ...axes, rotation: 90 };
    // A point that was top-right becomes a different sector once axes rotate.
    const before = sectorOf({ x: 100, y: -100 }, axes);
    const after = sectorOf({ x: 100, y: -100 }, rotated);
    expect(after).not.toBe(before);
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
    color: "gray",
    size: "normal",
    x,
    y,
    notes: "",
    notePath: null,
    createdAt: "now",
  });

  it("returns the topmost (last) person within the hit radius", () => {
    const people = [mk("a", 0, 0), mk("b", 5, 5)];
    expect(personAt({ x: 4, y: 4 }, people, 20)?.id).toBe("b");
    expect(personAt({ x: 0, y: 0 }, people, 3)?.id).toBe("a");
    expect(personAt({ x: 999, y: 999 }, people, 20)).toBeNull();
  });
});
