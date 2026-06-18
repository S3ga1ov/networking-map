import { Plugin, TFile, normalizePath } from "obsidian";
import {
  NetMapView,
  VIEW_TYPE_NETMAP,
  freshNetMapData,
} from "./NetMapView";
import {
  DEFAULT_SETTINGS,
  NetworkingMapSettingTab,
  type NetworkingMapSettings,
} from "./settings";
import { makeT, normalizeLang, type Lang } from "../ui/i18n";

export const NETMAP_EXT = "netmap";

export default class NetworkingMapPlugin extends Plugin {
  settings: NetworkingMapSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(
      VIEW_TYPE_NETMAP,
      (leaf) => new NetMapView(leaf, this),
    );

    // Bind the `.netmap` extension to our custom view.
    try {
      this.registerExtensions([NETMAP_EXT], VIEW_TYPE_NETMAP);
    } catch (e) {
      // Another plugin may have claimed the extension; warn but keep loading.
      console.warn("[networking-map] could not register .netmap extension", e);
    }

    const t = makeT(this.resolveLang());
    this.addRibbonIcon("git-fork", t("ribbon.newMap"), () => {
      void this.createNewMap();
    });

    this.addCommand({
      id: "create-networking-map",
      name: t("ribbon.newMap"),
      callback: () => void this.createNewMap(),
    });

    this.addSettingTab(new NetworkingMapSettingTab(this.app, this));
  }

  /** Resolve the effective UI language from the setting + Obsidian's locale. */
  resolveLang(): Lang {
    const pref = this.settings.language;
    if (pref === "ru" || pref === "en") return pref;
    return normalizeLang(window.localStorage.getItem("language"));
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /** Create a fresh, localized `.netmap` file in the vault root and open it. */
  private async createNewMap(): Promise<void> {
    const lang = this.resolveLang();
    const t = makeT(lang);
    const path = await this.uniquePath(t("doc.title"));
    const data = freshNetMapData(lang);
    const file = await this.app.vault.create(path, data);
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
  }

  /** Find a non-colliding `<base> N.netmap` path in the vault root. */
  private async uniquePath(base: string): Promise<string> {
    const root = this.app.vault.getRoot();
    const taken = new Set(
      root.children
        .filter((c): c is TFile => c instanceof TFile)
        .map((f) => f.name),
    );
    let name = `${base}.${NETMAP_EXT}`;
    let i = 2;
    while (taken.has(name)) {
      name = `${base} ${i}.${NETMAP_EXT}`;
      i++;
    }
    return normalizePath(name);
  }
}
