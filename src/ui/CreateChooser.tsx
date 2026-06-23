import { useMapStore, useMapStoreApi } from "./StoreContext";
import { useT } from "./LangContext";
import type { Point } from "../core/geometry";

interface Props {
  /** Screen position (px, relative to the canvas wrap) to anchor the popup. */
  screen: Point;
}

/**
 * Small popup shown at the click point: choose to create a person or a map
 * note. Picking "person" advances to the person form; "note" drops a sticky.
 */
export function CreateChooser({ screen }: Props) {
  const api = useMapStoreApi();
  const t = useT();
  const at = useMapStore((s) => s.pendingCreate?.at ?? null);
  if (!at) return null;

  return (
    <div
      className="nm-popup nm-create-chooser"
      style={{ left: screen.x, top: screen.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        className="nm-chooser-btn"
        title={t("create.choosePerson")}
        aria-label={t("create.choosePerson")}
        onClick={() => api.getState().choosePerson()}
      >
        <PersonIcon />
      </button>
      <button
        className="nm-chooser-btn"
        title={t("create.chooseNote")}
        aria-label={t("create.chooseNote")}
        onClick={() => api.getState().createMapNote(at)}
      >
        <NoteIcon />
      </button>
    </div>
  );
}

function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </svg>
  );
}
