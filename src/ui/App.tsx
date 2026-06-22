import { useEffect } from "react";
import { Canvas } from "./Canvas";
import { NotesPanel } from "./NotesPanel";
import { LayerFilter } from "./LayerFilter";
import { Legend } from "./Legend";
import { Toolbar } from "./Toolbar";
import { Help } from "./Help";
import { useMapStoreApi } from "./StoreContext";
import { removeLink } from "../core/commands";

/**
 * Root component: the canvas fills the view; overlay panels (layer filter,
 * legend, toolbar, notes) are layered on top.
 */
export function App() {
  const api = useMapStoreApi();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;

      const state = api.getState();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) state.redo();
        else state.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        state.redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const linkId = state.selectedLinkId;
        if (linkId) {
          e.preventDefault();
          state.apply((doc) => removeLink(doc, linkId));
          state.selectLink(null);
        }
      } else if (e.key === "Escape") {
        state.cancelLink();
        state.cancelCreate();
        state.selectPerson(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api]);

  return (
    <div className="nm-root">
      <Canvas />
      <LayerFilter />
      <Legend />
      <Help />
      <Toolbar />
      <NotesPanel />
    </div>
  );
}
