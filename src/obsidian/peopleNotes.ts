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
  /** Optional Templater template (vault path) applied to new notes. */
  templatePath: string;
}

/** Build a HostEnv backed by an Obsidian App. */
export function createObsidianEnv(
  app: App,
  options: PeopleNotesOptions,
): HostEnv {
  return {
    async openPersonNote({ displayName, seedBody }) {
      const ref = await ensurePersonNote(app, options.folder, displayName, {
        seedBody,
        templatePath: options.templatePath,
      });
      await revealNote(app, ref.path);
      return ref;
    },
    async revealNote(path) {
      await revealNote(app, path);
    },
    async pickNote() {
      return pickNote(app);
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
  opts: { seedBody: string; templatePath?: string },
): Promise<PersonNoteRef> {
  const dir = normalizePath(folder);
  if (dir && !app.vault.getAbstractFileByPath(dir)) {
    await app.vault.createFolder(dir).catch(() => {
      /* folder may already exist (race) — ignore */
    });
  }
  // Always create a fresh note; append a number when the name is taken.
  const path = uniqueNotePath(app, dir, sanitizeFileName(displayName));

  // Body: a Templater template (if configured + available) or the seed text.
  const templated = await readTemplateRaw(app, opts.templatePath);
  const file = await app.vault.create(path, templated ?? opts.seedBody);
  if (templated) await runTemplater(app, file);
  return { path };
}

/** A non-colliding `<dir>/<base>.md` path (appends a number if taken). */
function uniqueNotePath(app: App, dir: string, base: string): string {
  const make = (name: string) =>
    normalizePath(dir ? `${dir}/${name}.md` : `${name}.md`);
  let name = base;
  let i = 2;
  while (app.vault.getAbstractFileByPath(make(name))) {
    name = `${base} ${i}`;
    i++;
  }
  return make(name);
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

function pickNote(app: App): Promise<string | null> {
  return new Promise((resolve) => {
    const files = app.vault.getMarkdownFiles();
    new NotePickerModal(app, files, resolve).open();
  });
}

class NotePickerModal extends FuzzySuggestModal<TFile> {
  private files: TFile[];
  private resolve: (path: string | null) => void;
  private done = false;

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
    this.finish(file.path);
  }

  onClose(): void {
    super.onClose();
    // close() and onChooseItem() fire in the same synchronous stack and their
    // order isn't guaranteed, so defer the "dismissed" resolution: a real
    // selection sets `done` first and wins.
    window.setTimeout(() => this.finish(null), 0);
  }

  /** Resolve the picker exactly once. */
  private finish(path: string | null): void {
    if (this.done) return;
    this.done = true;
    this.resolve(path);
  }
}

async function revealNote(app: App, path: string): Promise<void> {
  const file = app.vault.getAbstractFileByPath(normalizePath(path));
  if (!(file instanceof TFile)) return;
  const leaf = app.workspace.getLeaf("split", "vertical");
  await leaf.openFile(file);
}
