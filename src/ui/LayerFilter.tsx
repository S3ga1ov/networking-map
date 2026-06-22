import { useState } from "react";
import { useMapStore, useMapStoreApi } from "./StoreContext";
import { useT } from "./LangContext";
import { useConfirm } from "./ConfirmContext";
import {
  addLayer,
  deleteLayer,
  renameLayer,
  setActiveLayer,
  setLayerVisible,
} from "../core/commands";

/** Top-left panel: switch the active layer, toggle visibility, add/rename/remove. */
export function LayerFilter() {
  const api = useMapStoreApi();
  const t = useT();
  const confirm = useConfirm();
  const layers = useMapStore((s) => s.doc.layers);
  const activeLayerId = useMapStore((s) => s.doc.activeLayerId);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addNew = () => {
    const name = t("layers.newName", { n: layers.length + 1 });
    let newId = "";
    api.getState().apply((doc) => {
      const res = addLayer(doc, name);
      newId = res.layer.id;
      return res.doc;
    });
    setEditingId(newId);
  };

  return (
    <div className="nm-panel nm-layer-filter" onPointerDown={(e) => e.stopPropagation()}>
      <div className="nm-panel-title">{t("layers.title")}</div>
      <div className="nm-layer-list">
        {layers.map((layer) => {
          const active = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              className={"nm-layer-row" + (active ? " is-active" : "")}
            >
              <input
                type="checkbox"
                checked={layer.visible}
                title={t("layers.visibility")}
                onChange={(e) =>
                  api
                    .getState()
                    .apply((doc) =>
                      setLayerVisible(doc, layer.id, e.target.checked),
                    )
                }
              />
              {editingId === layer.id ? (
                <input
                  className="nm-input nm-layer-name-input"
                  autoFocus
                  defaultValue={layer.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim() || layer.name;
                    api.getState().apply((doc) => renameLayer(doc, layer.id, v));
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              ) : (
                <button
                  className="nm-layer-name"
                  title={t("layers.makeActive")}
                  onClick={() =>
                    api.getState().apply((doc) => setActiveLayer(doc, layer.id))
                  }
                  onDoubleClick={() => setEditingId(layer.id)}
                >
                  {layer.name}
                </button>
              )}
              {layers.length > 1 && (
                <button
                  className="nm-icon-btn nm-layer-del"
                  title={t("layers.delete")}
                  onClick={() => {
                    void confirm({ message: t("confirm.layer") }).then((ok) => {
                      if (ok) api.getState().apply((doc) => deleteLayer(doc, layer.id));
                    });
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button className="nm-btn nm-add-layer" onClick={addNew}>
        {t("layers.add")}
      </button>
    </div>
  );
}
