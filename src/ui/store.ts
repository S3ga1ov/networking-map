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
  addMapNote,
  addPerson as addPersonCmd,
  clampCircleRadius,
  clampSectorStart,
  moveMapNote,
  movePerson,
  removeMapNote as removeMapNoteCmd,
  resizeCircle,
  resizeMapNote,
  setMapNoteText as setMapNoteTextCmd,
  setSectorStart,
  setViewport as setViewportCmd,
  type NewPersonInput,
} from "../core/commands";
import type { Point } from "../core/geometry";

export type InteractionMode = "idle" | "link";

export interface PendingCreate {
  /** Logical position where the new element will be placed. */
  at: Point;
  /** "choose" shows the person/note chooser; "person" shows the person form. */
  stage: "choose" | "person";
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
  /** Live boundary angle of the sector being dragged (not yet committed). */
  sectorDrag: { id: string; start: number } | null;
  /** Currently selected map note (shows its controls), or null. */
  selectedMapNoteId: string | null;
  /** A just-created map note that should grab focus, or null. */
  editingMapNoteId: string | null;
  /** Live position of a map note being dragged (not yet committed). */
  mapNoteDrag: { id: string; x: number; y: number } | null;
  /** Live size of a map note being resized (not yet committed). */
  mapNoteResize: { id: string; width: number; height: number } | null;

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
  /** Advance the create chooser to the person form. */
  choosePerson: () => void;
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

  /** Set the live boundary angle of a sector being dragged (ephemeral). */
  dragSectorTo: (id: string, start: number) => void;
  /** Commit the in-progress sector drag (one history entry). */
  commitSectorDrag: () => void;

  // ---- map notes ----
  /** Create a map note at the chooser point, select it for editing. */
  createMapNote: (at: Point) => void;
  selectMapNote: (id: string | null) => void;
  /** Persist a map note's text (one history entry). */
  setMapNoteText: (id: string, text: string) => void;
  /** Delete a map note. */
  removeMapNote: (id: string) => void;
  dragMapNoteTo: (id: string, x: number, y: number) => void;
  commitMapNoteDrag: () => void;
  resizeMapNoteTo: (id: string, width: number, height: number) => void;
  commitMapNoteResize: () => void;
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
    sectorDrag: null,
    selectedMapNoteId: null,
    editingMapNoteId: null,
    mapNoteDrag: null,
    mapNoteResize: null,

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
        selectedMapNoteId: null,
        editingMapNoteId: null,
        mapNoteDrag: null,
        mapNoteResize: null,
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
      set({
        selectedPersonId: id,
        selectedLinkId: null,
        selectedMapNoteId: null,
        pendingCreate: null,
      }),
    selectLink: (id) =>
      set({
        selectedLinkId: id,
        selectedPersonId: null,
        selectedMapNoteId: null,
        pendingCreate: null,
      }),
    beginCreate: (at) =>
      set({
        pendingCreate: { at, stage: "choose" },
        selectedPersonId: null,
        selectedLinkId: null,
        selectedMapNoteId: null,
      }),
    cancelCreate: () => set({ pendingCreate: null }),
    choosePerson: () => {
      const pc = get().pendingCreate;
      if (pc) set({ pendingCreate: { ...pc, stage: "person" } });
    },
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

    resizeCircleTo: (id, radius) =>
      set({
        circleResize: {
          id,
          radius: clampCircleRadius(get().doc.circles, id, radius),
        },
      }),
    commitCircleResize: () => {
      const { circleResize } = get();
      set({ circleResize: null });
      if (!circleResize) return;
      get().apply((doc) =>
        resizeCircle(doc, circleResize.id, circleResize.radius),
      );
    },

    dragSectorTo: (id, start) =>
      set({
        sectorDrag: {
          id,
          start: clampSectorStart(get().doc.axes.sectors, id, start),
        },
      }),
    commitSectorDrag: () => {
      const { sectorDrag } = get();
      set({ sectorDrag: null });
      if (!sectorDrag) return;
      get().apply((doc) => setSectorStart(doc, sectorDrag.id, sectorDrag.start));
    },

    createMapNote: (at) => {
      const prev = get().doc;
      const { doc, note } = addMapNote(prev, at.x, at.y);
      get().history.push(prev);
      set({
        doc,
        pendingCreate: null,
        selectedMapNoteId: note.id,
        editingMapNoteId: note.id,
      });
      persist(serialize(doc));
    },
    selectMapNote: (id) =>
      set({
        selectedMapNoteId: id,
        editingMapNoteId: null,
        selectedPersonId: null,
        selectedLinkId: null,
      }),
    setMapNoteText: (id, text) =>
      get().apply((doc) => setMapNoteTextCmd(doc, id, text)),
    removeMapNote: (id) => {
      get().apply((doc) => removeMapNoteCmd(doc, id));
      set({ selectedMapNoteId: null, editingMapNoteId: null });
    },
    dragMapNoteTo: (id, x, y) => set({ mapNoteDrag: { id, x, y } }),
    commitMapNoteDrag: () => {
      const { mapNoteDrag } = get();
      set({ mapNoteDrag: null });
      if (!mapNoteDrag) return;
      get().apply((doc) => moveMapNote(doc, mapNoteDrag.id, mapNoteDrag.x, mapNoteDrag.y));
    },
    resizeMapNoteTo: (id, width, height) =>
      set({ mapNoteResize: { id, width, height } }),
    commitMapNoteResize: () => {
      const { mapNoteResize } = get();
      set({ mapNoteResize: null });
      if (!mapNoteResize) return;
      get().apply((doc) =>
        resizeMapNote(doc, mapNoteResize.id, mapNoteResize.width, mapNoteResize.height),
      );
    },
  }));
}
