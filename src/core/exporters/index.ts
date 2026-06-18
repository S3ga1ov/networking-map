export { renderSvgString } from "./svgExport";
export { renderPngBlob } from "./pngExport";

import { serialize, type NetMapDocument } from "../model";

/** The `.netmap` file content is itself the readable JSON export. */
export function exportJson(doc: NetMapDocument): string {
  return serialize(doc);
}

/** Make a filesystem-safe base name from the map title. */
export function exportBaseName(doc: NetMapDocument): string {
  const t = doc.meta.title.trim().replace(/[\\/:*?"<>|]/g, " ").trim();
  return t.length > 0 ? t : "Карта связей";
}
