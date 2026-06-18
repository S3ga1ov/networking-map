/**
 * A minimal undo/redo stack over whole-document snapshots. Because every
 * command in {@link ./commands} returns a new immutable document, we can simply
 * remember past and future snapshots.
 */

import type { NetMapDocument } from "./model";

export class History {
  private past: NetMapDocument[] = [];
  private future: NetMapDocument[] = [];
  private limit: number;

  constructor(limit = 100) {
    this.limit = limit;
  }

  /** Record that `prev` was replaced by a newer document (clears redo). */
  push(prev: NetMapDocument): void {
    this.past.push(prev);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /** Returns the previous document, given the current one, or null. */
  undo(current: NetMapDocument): NetMapDocument | null {
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push(current);
    return prev;
  }

  /** Returns the next (redone) document, given the current one, or null. */
  redo(current: NetMapDocument): NetMapDocument | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(current);
    return next;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}
