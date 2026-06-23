import { useState } from "react";
import { useMapStore, useMapStoreApi } from "./StoreContext";
import { useEnv } from "./EnvContext";
import { useT } from "./LangContext";
import { useSurnameFirst } from "./PrefsContext";
import { exportJson, renderPngBlob, renderSvgString } from "../core/exporters";

/** Make a filesystem-safe base name from the map's file name. */
function safeBase(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, " ").trim();
  return cleaned.length > 0 ? cleaned : "Networking map";
}

/** Top-right toolbar: zoom, undo/redo, and export. */
export function Toolbar() {
  const api = useMapStoreApi();
  const env = useEnv();
  const t = useT();
  const surnameFirst = useSurnameFirst();
  const zoom = useMapStore((s) => s.viewport.zoom);
  const [menuOpen, setMenuOpen] = useState(false);

  const doExport = async (kind: "png" | "svg" | "json") => {
    setMenuOpen(false);
    const doc = api.getState().doc;
    const base = safeBase(env.mapBaseName());
    try {
      if (kind === "json") {
        await env.saveExport(`${base}.json`, exportJson(doc));
      } else if (kind === "svg") {
        // SVG exports with a transparent background.
        await env.saveExport(
          `${base}.svg`,
          renderSvgString(doc, { surnameFirst, transparent: true }),
        );
      } else {
        const blob = await renderPngBlob(doc, 2, { surnameFirst });
        await env.saveExport(`${base}.png`, blob);
      }
    } catch (e) {
      env.notify(t("export.failed", { msg: (e as Error).message }));
    }
  };

  return (
    <div className="nm-panel nm-toolbar" onPointerDown={(e) => e.stopPropagation()}>
      <button className="nm-tool" title={t("tool.zoomOut")} onClick={() => api.getState().zoomBy(1 / 1.2)}>
        −
      </button>
      <span className="nm-zoom-label">{Math.round(zoom * 100)}%</span>
      <button className="nm-tool" title={t("tool.zoomIn")} onClick={() => api.getState().zoomBy(1.2)}>
        +
      </button>
      <button className="nm-tool" title={t("tool.reset")} onClick={() => api.getState().resetView()}>
        ⤢
      </button>
      <div className="nm-tool-sep" />
      <button className="nm-tool" title={t("tool.undo")} onClick={() => api.getState().undo()}>
        ↶
      </button>
      <button className="nm-tool" title={t("tool.redo")} onClick={() => api.getState().redo()}>
        ↷
      </button>
      <div className="nm-tool-sep" />
      <div className="nm-export-wrap">
        <button className="nm-tool" title={t("tool.export")} onClick={() => setMenuOpen((v) => !v)}>
          ⤓
        </button>
        {menuOpen && (
          <div className="nm-export-menu">
            <button onClick={() => void doExport("png")}>{t("export.png")}</button>
            <button onClick={() => void doExport("svg")}>{t("export.svg")}</button>
            <button onClick={() => void doExport("json")}>{t("export.json")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
