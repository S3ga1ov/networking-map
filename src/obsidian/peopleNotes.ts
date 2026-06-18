/**
 * Per-person Markdown notes. The map file owns geometry; rich «примечания» live
 * in real vault notes so they are linkable and queryable by Dataview/Bases.
 */

import { type App, normalizePath, Notice, TFile } from "obsidian";
import type { HostEnv, PersonNoteRef } from "../ui/env";

export interface PeopleNotesOptions {
  /** Folder (vault-relative) where person notes are created. */
  folder: string;
  /** When false, frontmatter passed by the UI is ignored on note creation. */
  writeFrontmatter: boolean;
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
      new Notice(`Сохранено: ${path}`);
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
  opts: { seedBody: string; frontmatter?: Record<string, string | number> },
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

  const content = buildNoteContent(opts.seedBody, opts.frontmatter);
  await app.vault.create(path, content);
  return { path };
}

function buildNoteContent(
  body: string,
  frontmatter?: Record<string, string | number>,
): string {
  if (!frontmatter || Object.keys(frontmatter).length === 0) return body;
  const lines = Object.entries(frontmatter).map(
    ([k, v]) => `${k}: ${typeof v === "string" ? JSON.stringify(v) : v}`,
  );
  return `---\n${lines.join("\n")}\n---\n\n${body}`;
}

async function revealNote(app: App, path: string): Promise<void> {
  const file = app.vault.getAbstractFileByPath(normalizePath(path));
  if (!(file instanceof TFile)) return;
  const leaf = app.workspace.getLeaf("split", "vertical");
  await leaf.openFile(file);
}
