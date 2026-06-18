import { type App, PluginSettingTab, Setting } from "obsidian";
import type NetworkingMapPlugin from "./main";

export type LanguageSetting = "auto" | "ru" | "en";

export interface NetworkingMapSettings {
  /** Folder where per-person notes are created. */
  peopleFolder: string;
  /** Mirror person color/coordinates into note frontmatter on promotion. */
  writeFrontmatter: boolean;
  /** UI language; "auto" follows Obsidian's interface language. */
  language: LanguageSetting;
}

export const DEFAULT_SETTINGS: NetworkingMapSettings = {
  peopleFolder: "Networking/People",
  writeFrontmatter: true,
  language: "auto",
};

export class NetworkingMapSettingTab extends PluginSettingTab {
  plugin: NetworkingMapPlugin;

  constructor(app: App, plugin: NetworkingMapPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const ru = this.plugin.resolveLang() === "ru";

    new Setting(containerEl)
      .setName(ru ? "Язык интерфейса" : "Interface language")
      .setDesc(
        ru
          ? "«Авто» следует языку интерфейса Obsidian."
          : "“Auto” follows Obsidian's interface language.",
      )
      .addDropdown((d) =>
        d
          .addOption("auto", ru ? "Авто" : "Auto")
          .addOption("ru", "Русский")
          .addOption("en", "English")
          .setValue(this.plugin.settings.language)
          .onChange(async (v) => {
            this.plugin.settings.language = v as NetworkingMapSettings["language"];
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(ru ? "Папка для заметок о людях" : "Folder for people notes")
      .setDesc(
        ru
          ? "Куда создавать Markdown-заметки при «Перенести в заметку»."
          : "Where to create Markdown notes on “Move to a note”.",
      )
      .addText((t) =>
        t
          .setPlaceholder("Networking/People")
          .setValue(this.plugin.settings.peopleFolder)
          .onChange(async (v) => {
            this.plugin.settings.peopleFolder = v.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(ru ? "Записывать свойства в frontmatter" : "Write frontmatter properties")
      .setDesc(
        ru
          ? "Дублировать цвет и координаты человека в свойства заметки для Dataview/Bases."
          : "Mirror a person's color and coordinates into note properties for Dataview/Bases.",
      )
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.writeFrontmatter)
          .onChange(async (v) => {
            this.plugin.settings.writeFrontmatter = v;
            await this.plugin.saveSettings();
          }),
      );
  }
}
