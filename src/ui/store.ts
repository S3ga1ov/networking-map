/**
 * Per-view reactive store. Each open map (Obsidian leaf) gets its own store
 * instance via {@link createMapStore} so multiple maps can be open at once
 * without sharing state. The store wraps the immutable core document plus a
 * little ephemeral interaction state (selection, link-drawing, popups).
 */

import { createStore, type StoreApi } from "zustand/vanilla";
import { History } from "../core/history";
import {
  serialize,
  type LinkStyle,
  type NetMapDocument,
  type Viewport,
} from "../core/model";
import {
  addLink,
  addPerson as addPersonCmd,
  movePerson,
  resizeCircle,
  setViewport as setViewportCmd,
  type NewPersonInput,
} from "../core/commands";
import type { Point } from "../core/geometry";

export type InteractionMode = "idle" | "link";

export interface PendingCreate {
  /** Logical position where the new person will be placed. */
  at: Point;
}

export interface MapState {
  doc: NetMapDocument;
  /** Non-reactive undo/redo stack (mutated in place; not part of equality). */
  history: History;

  // ---- ephemeral interaction state ----
  selectedPersonId: string | null;
  selectedLinkId: string | null;
  mode: InteractionMode;
  /** While drawing a link: the chosen source person, or null. */
  pendingLinkSource: string | null;
  /** Style applied to newly drawn links. */
  linkStyle: LinkStyle;
  /** When set, the create-person popup is open at this logical point. */
  pendingCreate: PendingCreate | null;
  /**
   * Live viewport (pan/zoom). Kept separate from the document so dragging the
   * canvas does not spam undo history; committed back to the doc on gesture end.
   */
  viewport: Viewport;
  /** Live position of the person being dragged (not yet committed). */
  drag: { id: string; x: number; y: number } | null;
  /** Live radius of the ring being resized (not yet committed). */
  circleResize: { id: string; radius: number } | null;

  // ---- actions ----
  /** Apply a pure command, recording the previous doc for undo + persisting. */
  apply: (fn: (doc: NetMapDocument) => NetMapDocument) => void;
  /** Replace the document from an external source (file reload); no history. */
  loadDoc: (doc: NetMapDocument) => void;
  undo: () => void;
  redo: () => void;

  selectPerson: (id: string | null) => void;
  selectLink: (id: string | null) => void;
  beginCreate: (at: Point) => void;
  cancelCreate: () => void;
  /** Create a person, select it, and close the create popup. */
  createPerson: (input: NewPersonInput) => void;
  setLinkStyle: (style: LinkStyle) => void;
  startLink: (sourceId: string) => void;
  /** Finish a link from the pending source to `targetId` in the active layer. */
  completeLink: (targetId: string) => void;
  cancelLink: () => void;

  /** Update the live viewport without touching the document/history. */
  setViewport: (vp: Viewport) => void;
  /** Persist the live viewport into the document (no history entry). */
  commitViewport: () => void;
  /** Multiply zoom about the screen center and persist. */
  zoomBy: (factor: number) => void;
  /** Reset pan/zoom to the default view. */
  resetView: () => void;

  /** Set the live drag position of a person (ephemeral, no history). */
  dragPersonTo: (id: string, x: number, y: number) => void;
  /** Commit the in-progress drag to the document (one history entry). */
  commitDrag: () => void;

  /** Set the live radius of a ring being resized (ephemeral, no history). */
  resizeCircleTo: (id: string, radius: number) => void;
  /** Commit the in-progress ring resize (one history entry). */
  commitCircleResize: () => void;
}

/** Callback the Obsidian view installs to write serialized state to the file. */
export type PersistFn = (data: string) => void;

export function createMapStore(
  initialDoc: NetMapDocument,
  persist: PersistFn,
): StoreApi<MapState> {
  return createStore<MapState>((set, get) => ({
    doc: initialDoc,
    history: new History(),
    selectedPersonId: null,
    selectedLinkId: null,
    mode: "idle",
    pendingLinkSource: null,
    linkStyle: "thin-black",
    pendingCreate: null,
    viewport: { ...initialDoc.viewport },
    drag: null,
    circleResize: null,

    apply: (fn) => {
      const prev = get().doc;
      const next = fn(prev);
      if (next === prev) return; // no-op commands don't dirty the file
      get().history.push(prev);
      set({ doc: next });
      persist(serialize(next));
    },

    loadDoc: (doc) => {
      get().history.clear();
      set({
        doc,
        viewport: { ...doc.viewport },
        selectedPersonId: null,
        selectedLinkId: null,
        mode: "idle",
        pendingLinkSource: null,
        pendingCreate: null,
      });
    },

    undo: () => {
      const { history, doc } = get();
      const prev = history.undo(doc);
      if (!prev) return;
      set({ doc: prev });
      persist(serialize(prev));
    },

    redo: () => {
      const { history, doc } = get();
      const next = history.redo(doc);
      if (!next) return;
      set({ doc: next });
      persist(serialize(next));
    },

    selectPerson: (id) =>
      set({ selectedPersonId: id, selectedLinkId: null, pendingCreate: null }),
    selectLink: (id) =>
      set({ selectedLinkId: id, selectedPersonId: null, pendingCreate: null }),
    beginCreate: (at) =>
      set({ pendingCreate: { at }, selectedPersonId: null, selectedLinkId: null }),
    cancelCreate: () => set({ pendingCreate: null }),
    createPerson: (input) => {
      const prev = get().doc;
      const { doc, person } = addPersonCmd(prev, input);
      get().history.push(prev);
      set({ doc, selectedPersonId: person.id, pendingCreate: null });
      persist(serialize(doc));
    },
    setLinkStyle: (style) => set({ linkStyle: style }),
    startLink: (sourceId) =>
      set({ mode: "link", pendingLinkSource: sourceId }),
    completeLink: (targetId) => {
      const { pendingLinkSource, linkStyle } = get();
      if (pendingLinkSource && pendingLinkSource !== targetId) {
        get().apply((doc) =>
          addLink(doc, pendingLinkSource, targetId, linkStyle),
        );
      }
      set({ mode: "idle", pendingLinkSource: null });
    },
    cancelLink: () => set({ mode: "idle", pendingLinkSource: null }),

    setViewport: (vp) => set({ viewport: vp }),
    commitViewport: () => {
      const { doc, viewport } = get();
      const next = setViewportCmd(doc, viewport);
      if (next === doc) return;
      set({ doc: next });
      persist(serialize(next));
    },
    zoomBy: (factor) => {
      const { viewport } = get();
      // The screen center maps to logical (-panX, -panY) at any zoom, so simply
      // scaling zoom keeps the center fixed.
      const zoom = Math.min(4, Math.max(0.2, viewport.zoom * factor));
      set({ viewport: { ...viewport, zoom } });
      get().commitViewport();
    },
    resetView: () => {
      set({ viewport: { zoom: 1, panX: 0, panY: 0 } });
      get().commitViewport();
    },

    dragPersonTo: (id, x, y) => set({ drag: { id, x, y } }),
    commitDrag: () => {
      const { drag } = get();
      set({ drag: null });
      if (!drag) return;
      get().apply((doc) => movePerson(doc, drag.id, drag.x, drag.y));
    },

    resizeCircleTo: (id, radius) => set({ circleResize: { id, radius } }),
    commitCircleResize: () => {
      const { circleResize } = get();
      set({ circleResize: null });
      if (!circleResize) return;
      get().apply((doc) =>
        resizeCircle(doc, circleResize.id, circleResize.radius),
      );
    },
  }));
}
