/**
 * Host environment abstraction. The React UI talks to Obsidian (or, later, a
 * web host) only through this interface, so the `ui/` layer never imports
 * `obsidian` directly. The Obsidian view provides a concrete implementation.
 */

export interface PersonNoteRef {
  /** Vault-relative path of the created/opened note. */
  path: string;
}

export interface HostEnv {
  /**
   * Create (if needed) and open a Markdown note for a person, returning its
   * path. `seedBody` is written only when the note is first created.
   */
  openPersonNote: (args: {
    personId: string;
    displayName: string;
    seedBody: string;
    frontmatter?: Record<string, string | number>;
  }) => Promise<PersonNoteRef>;

  /** Reveal an existing note (by vault path) in a side pane. */
  revealNote: (path: string) => Promise<void>;

  /** Read a note's content (for inline preview), or null if missing. */
  readNote: (path: string) => Promise<string | null>;

  /** Save bytes as a file in the vault (used by image/JSON export). */
  saveExport: (fileName: string, data: Blob | string) => Promise<string>;

  /** Trigger a plain browser download (fallback / web parity). */
  download: (fileName: string, data: Blob | string) => void;

  /** Show a transient message to the user. */
  notify: (message: string) => void;
}

/** A no-op environment for tests / standalone rendering. */
export const noopEnv: HostEnv = {
  openPersonNote: async ({ personId }) => ({ path: `People/${personId}.md` }),
  revealNote: async () => {},
  readNote: async () => null,
  saveExport: async (fileName) => fileName,
  download: () => {},
  notify: () => {},
};
