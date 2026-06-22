/**
 * Per-person Markdown notes. The map file owns geometry; rich «примечания» live
 * in real vault notes so they are linkable and queryable by Dataview/Bases.
 */

import {
  type App,
  FuzzySuggestModal,
  normalizePath,
  Notice,
  TFile,
} from "obsidian";
import type { HostEnv, PersonNoteRef } from "../ui/env";

export interface PeopleNotesOptions {
  /** Folder (vault-relative) where person notes are created. */
  folder: string;
  /** When false, frontmatter passed by the UI is ignored on note creation. */
  writeFrontmatter: boolean;
  /** Optional Templater template (vault path) applied to new notes. */
  templatePath: string;
}

/** Build a HostEnv backed by an Obsidian App. */
export function createObsidianEnv(
  app: App,
  options: PeopleNotesOptions,
): HostEnv {
  return {
    async openPersonNote({ displayName, seedBody, frontmatter }) {
      const ref = await ensurePersonNote(app, options.folder, displayName, {
        seedBody,
        frontmatter: options.writeFrontmatter ? frontmatter : undefined,
        templatePath: options.templatePath,
      });
      await revealNote(app, ref.path);
      return ref;
    },
    async revealNote(path) {
      await revealNote(app, path);
    },
    async readNote(path) {
      const file = app.vault.getAbstractFileByPath(normalizePath(path));
      if (!(file instanceof TFile)) return null;
      return app.vault.cachedRead(file);
    },
    async pickNote() {
      return pickNote(app);
    },
    async findPersonNote(displayName) {
      return findPersonNote(app, options.folder, displayName);
    },
    async saveExport(fileName, data) {
      const path = normalizePath(fileName);
      const bytes =
        typeof data === "string" ? data : await data.arrayBuffer();
      const existing = app.vault.getAbstractFileByPath(path);
      if (existing instanceof TFile) {
        if (typeof bytes === "string") await app.vault.modify(existing, bytes);
        else await app.vault.modifyBinary(existing, bytes);
      } else if (typeof bytes === "string") {
        await app.vault.create(path, bytes);
      } else {
        await app.vault.createBinary(path, bytes);
      }
      new Notice(`Networking Map: ${path}`);
      return path;
    },
    download(fileName, data) {
      const blob = typeof data === "string" ? new Blob([data]) : data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    },
    notify(message) {
      new Notice(message);
    },
  };
}

function sanitizeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|#^[\]]/g, " ").trim();
  return cleaned.length > 0 ? cleaned.replace(/\s+/g, " ") : "Без имени";
}

async function ensurePersonNote(
  app: App,
  folder: string,
  displayName: string,
  opts: {
    seedBody: string;
    frontmatter?: Record<string, string | number>;
    templatePath?: string;
  },
): Promise<PersonNoteRef> {
  const dir = normalizePath(folder);
  if (dir && !app.vault.getAbstractFileByPath(dir)) {
    await app.vault.createFolder(dir).catch(() => {
      /* folder may already exist (race) — ignore */
    });
  }
  const base = sanitizeFileName(displayName);
  const path = normalizePath(dir ? `${dir}/${base}.md` : `${base}.md`);

  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof TFile) return { path };

  // Body: a Templater template (if configured + available) or the seed text.
  const templated = await readTemplateRaw(app, opts.templatePath);
  const file = await app.vault.create(path, templated ?? opts.seedBody);
  if (templated) await runTemplater(app, file);

  // Frontmatter merged on top of whatever the body/template produced.
  if (opts.frontmatter && Object.keys(opts.frontmatter).length > 0) {
    await app.fileManager.processFrontMatter(file, (fm) => {
      Object.assign(fm, opts.frontmatter);
    });
  }
  return { path };
}

/** Read a template file's raw content, or null when unavailable. */
async function readTemplateRaw(
  app: App,
  templatePath?: string,
): Promise<string | null> {
  if (!templatePath || !getTemplater(app)) return null;
  const file = app.vault.getAbstractFileByPath(normalizePath(templatePath));
  if (!(file instanceof TFile)) return null;
  return app.vault.read(file);
}

/** The Templater instance, or null if the plugin is not installed/enabled. */
function getTemplater(app: App): { overwrite_file_commands?: unknown } | null {
  const plugin = (app as unknown as {
    plugins?: { plugins?: Record<string, { templater?: unknown }> };
  }).plugins?.plugins?.["templater-obsidian"];
  const templater = plugin?.templater as
    | { overwrite_file_commands?: (file: TFile) => Promise<void> }
    | undefined;
  return templater ?? null;
}

/** Expand Templater <% %> commands inside an existing file, best-effort. */
async function runTemplater(app: App, file: TFile): Promise<void> {
  const templater = getTemplater(app) as
    | { overwrite_file_commands?: (file: TFile) => Promise<void> }
    | null;
  try {
    await templater?.overwrite_file_commands?.(file);
  } catch (e) {
    console.warn("[networking-map] Templater expansion failed", e);
  }
}

async function findPersonNote(
  app: App,
  folder: string,
  displayName: string,
): Promise<{ kind: "one" | "many" | "none"; path?: string }> {
  const base = sanitizeFileName(displayName).toLowerCase();
  const dir = normalizePath(folder);
  const matches = app.vault
    .getMarkdownFiles()
    .filter((f) => (dir ? f.path.startsWith(`${dir}/`) : true))
    .filter((f) => f.basename.toLowerCase() === base);
  if (matches.length === 1) return { kind: "one", path: matches[0].path };
  if (matches.length > 1) return { kind: "many" };
  return { kind: "none" };
}

function pickNote(app: App): Promise<string | null> {
  return new Promise((resolve) => {
    const files = app.vault.getMarkdownFiles();
    new NotePickerModal(app, files, resolve).open();
  });
}

class NotePickerModal extends FuzzySuggestModal<TFile> {
  private files: TFile[];
  private resolve: (path: string | null) => void;
  private picked = false;

  constructor(app: App, files: TFile[], resolve: (path: string | null) => void) {
    super(app);
    this.files = files;
    this.resolve = resolve;
    this.setPlaceholder("Выберите заметку для привязки…");
  }

  getItems(): TFile[] {
    return this.files;
  }

  getItemText(file: TFile): string {
    return file.path;
  }

  onChooseItem(file: TFile): void {
    this.picked = true;
    this.resolve(file.path);
  }

  onClose(): void {
    super.onClose();
    if (!this.picked) this.resolve(null);
  }
}

async function revealNote(app: App, path: string): Promise<void> {
  const file = app.vault.getAbstractFileByPath(normalizePath(path));
  if (!(file instanceof TFile)) return;
  const leaf = app.workspace.getLeaf("split", "vertical");
  await leaf.openFile(file);
}
