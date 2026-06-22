import { type App, PluginSettingTab, Setting } from "obsidian";
import type { InitialsOrder } from "../ui/PrefsContext";
import type NetworkingMapPlugin from "./main";

export type LanguageSetting = "auto" | "ru" | "en";

export interface NetworkingMapSettings {
  /** Folder where per-person notes are created. */
  peopleFolder: string;
  /** Mirror person color/coordinates into note frontmatter on promotion. */
  writeFrontmatter: boolean;
  /** UI language; "auto" follows Obsidian's interface language. */
  language: LanguageSetting;
  /** Order of node initials: "last-first" = Ф+И (default), else И+Ф. */
  initialsOrder: InitialsOrder;
  /** Optional Templater template (vault path) applied to new person notes. */
  noteTemplate: string;
}

export const DEFAULT_SETTINGS: NetworkingMapSettings = {
  peopleFolder: "Networking/People",
  writeFrontmatter: true,
  language: "auto",
  initialsOrder: "last-first",
  noteTemplate: "",
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
      .setName(ru ? "Порядок инициалов" : "Initials order")
      .setDesc(
        ru
          ? "Что отображать на кружке: Фамилия+Имя или Имя+Фамилия."
          : "What to show on a node: surname+given or given+surname.",
      )
      .addDropdown((d) =>
        d
          .addOption("last-first", ru ? "Фамилия + Имя (Ф+И)" : "Surname + given (Ф+И)")
          .addOption("first-last", ru ? "Имя + Фамилия (И+Ф)" : "Given + surname (И+Ф)")
          .setValue(this.plugin.settings.initialsOrder)
          .onChange(async (v) => {
            this.plugin.settings.initialsOrder = v as InitialsOrder;
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
      .setName(ru ? "Шаблон заметки (Templater)" : "Note template (Templater)")
      .setDesc(
        ru
          ? "Путь к файлу-шаблону. Применяется через Templater при создании заметки; если Templater не установлен — обычная заметка."
          : "Path to a template file. Applied via Templater when a note is created; falls back to a plain note if Templater is absent.",
      )
      .addText((t) =>
        t
          .setPlaceholder("Templates/Person.md")
          .setValue(this.plugin.settings.noteTemplate)
          .onChange(async (v) => {
            this.plugin.settings.noteTemplate = v.trim();
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
