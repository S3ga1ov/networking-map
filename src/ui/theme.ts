/** Visual constants: person colors and link stroke styles. */

import type { LinkStyle, PersonColor, PersonSize } from "../core/model";

export interface PersonPalette {
  fill: string;
  stroke: string;
  text: string;
  label: string;
}

export const PERSON_COLORS: Record<PersonColor, PersonPalette> = {
  blue: { fill: "#bfe3ff", stroke: "#4a90d9", text: "#0b3a5b", label: "Голубой" },
  pink: { fill: "#ffd1e3", stroke: "#d9609a", text: "#5b0b35", label: "Розовый" },
  gray: { fill: "#dcdfe4", stroke: "#8a9099", text: "#2b2f36", label: "Серый" },
};

export const PERSON_COLOR_ORDER: PersonColor[] = ["blue", "pink", "gray"];

export interface LinkStrokeStyle {
  /** SVG stroke; the black trio uses a theme variable so it inverts. */
  stroke: string;
  width: number;
  dash?: string;
  /** Semantic meaning shown in the legend and the style picker. */
  label: string;
}

/** Theme-aware line color: dark on light themes, light on dark themes. */
export const LINE_COLOR_VAR = "var(--nm-line)";
export const LINK_GREEN = "#2e9e4f";
export const LINK_RED = "#d23b3b";

export const LINK_STYLES: Record<LinkStyle, LinkStrokeStyle> = {
  "bold-black": { stroke: LINE_COLOR_VAR, width: 4, label: "Интенсивные отношения" },
  "thin-black": { stroke: LINE_COLOR_VAR, width: 1.5, label: "Обычные отношения" },
  "dashed-black": {
    stroke: LINE_COLOR_VAR,
    width: 1.5,
    dash: "7 5",
    label: "Нерегулярные отношения",
  },
  "thin-green": { stroke: LINK_GREEN, width: 1.5, label: "Позитивные отношения" },
  "thin-red": { stroke: LINK_RED, width: 1.5, label: "Отношения с проблемами" },
};

export const LINK_STYLE_ORDER: LinkStyle[] = [
  "bold-black",
  "thin-black",
  "dashed-black",
  "thin-green",
  "thin-red",
];

/** Node radius in logical units. */
export const NODE_RADIUS = 22;

/** Node radius per importance level. The "normal" value equals NODE_RADIUS. */
export const PERSON_SIZE_RADIUS: Record<PersonSize, number> = {
  normal: 22,
  important: 31,
  key: 42,
};

export const PERSON_SIZE_ORDER: PersonSize[] = ["normal", "important", "key"];
