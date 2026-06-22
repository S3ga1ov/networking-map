import { TextFileView, type WorkspaceLeaf } from "obsidian";
import type { Root } from "react-dom/client";
import { createMapStore } from "../ui/store";
import { mountApp } from "../ui/mount";
import { createObsidianEnv } from "./peopleNotes";
import {
  deserialize,
  serialize,
  createEmptyDocument,
  defaultSectors,
} from "../core/model";
import { makeT, type Lang } from "../ui/i18n";
import type { StoreApi } from "zustand/vanilla";
import type { MapState } from "../ui/store";
import type NetworkingMapPlugin from "./main";

export const VIEW_TYPE_NETMAP = "networking-map-view";

/**
 * A file-backed view for `.netmap` documents. Extending {@link TextFileView}
 * means Obsidian owns the dirty/save lifecycle: `getViewData`/`setViewData`
 * bridge the file text and our document, and `requestSave()` persists. This is
 * the project's "storage is the vault file" decision in practice.
 */
export class NetMapView extends TextFileView {
  private plugin: NetworkingMapPlugin;
  private store: StoreApi<MapState> | null = null;
  private root: Root | null = null;
  /** Last data we serialized ourselves, to ignore self-induced reloads. */
  private lastSelfData = "";

  constructor(leaf: WorkspaceLeaf, plugin: NetworkingMapPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_NETMAP;
  }

  getIcon(): string {
    return "git-fork";
  }

  getDisplayText(): string {
    return this.file?.basename ?? "Карта связей";
  }

  /** Obsidian reads this when saving the file. */
  getViewData(): string {
    return this.data;
  }

  /** Obsidian calls this with the file's text on open and on external change. */
  setViewData(data: string, _clear: boolean): void {
    this.data = data;
    // Ignore the echo of a save we just triggered.
    if (data === this.lastSelfData && this.store) return;

    const doc = data.trim().length > 0 ? deserialize(data) : createEmptyDocument();
    if (this.store) {
      this.store.getState().loadDoc(doc);
    } else {
      this.mount(doc);
    }
  }

  /** Required by TextFileView; called when the view is cleared/closed. */
  clear(): void {
    this.data = "";
  }

  private mount(doc: ReturnType<typeof deserialize>): void {
    const env = createObsidianEnv(this.app, {
      folder: this.plugin.settings.peopleFolder,
      writeFrontmatter: this.plugin.settings.writeFrontmatter,
      templatePath: this.plugin.settings.noteTemplate,
    });

    this.store = createMapStore(doc, (serialized) => {
      this.lastSelfData = serialized;
      this.data = serialized;
      this.requestSave();
    });

    this.contentEl.empty();
    this.contentEl.addClass("networking-map-view");
    this.root = mountApp(this.contentEl, this.store, env, this.plugin.resolveLang(), {
      initialsOrder: this.plugin.settings.initialsOrder,
    });
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    this.root = null;
    this.store = null;
    this.contentEl.empty();
  }
}

/** Serialize a fresh, language-localized document for a new `.netmap` file. */
export function freshNetMapData(lang: Lang): string {
  const t = makeT(lang);
  const doc = createEmptyDocument(t("doc.title"), t("doc.author"));
  for (const c of doc.circles) {
    if (c.id === "trust") c.label = t("circle.trust");
    else if (c.id === "productivity") c.label = t("circle.productivity");
    else if (c.id === "development") c.label = t("circle.development");
  }
  doc.axes.sectors = defaultSectors([
    t("sector.work"),
    t("sector.family"),
    t("sector.friends"),
    t("sector.services"),
  ]);
  doc.layers[0].name = t("layer.default");
  return serialize(doc);
}
