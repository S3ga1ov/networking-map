# Networking Map — Obsidian plugin

[![CI](https://github.com/S3ga1ov/networking-map/actions/workflows/ci.yml/badge.svg)](https://github.com/S3ga1ov/networking-map/actions/workflows/ci.yml)

Build a **networking / connection map** inside Obsidian: you sit in the center,
surrounded by three drag-resizable trust rings (*Круг поддержки → продуктивности
→ развития*), two axes splitting the plane into four renameable sectors of life
(*Работа / Семья / Друзья / Услуги*), people placed as colored points, and
layered, directional connections between them.

It feels like an online whiteboard (drag, zoom, interactive panels), but the
data lives in your vault: each map is a `.netmap` file, and per-person
«примечания» can be promoted to real Markdown notes that Dataview/Bases can
query.

## How it works

The map is a method, not just a diagram (open the **`?`** button bottom-left for
the in-app guide):

- **You are the center.** Everything is drawn relative to you, so you don't
  "get lost" in your own relationships.
- **Three trust rings** show how close a connection is: **Круг поддержки**
  (innermost — family and closest friends, no material interest), **Круг
  продуктивности** (middle — your stable connections; the goal is to "pull"
  people inward and keep the bond stable), and **Круг развития** (outer — the
  horizon, new not-yet-established contacts). Drag a ring's edge to resize it.
- **Sectors (axes)** divide the plane into areas of life and can be of different
  sizes depending on how full of connections each area is.
- **Connection style encodes the relationship**, and **arrows encode who takes
  the initiative** — drawing links between your contacts (not just to you) is
  how you read **network density**.

## Features

- **Polar canvas** — center author point, 3 concentric trust rings, and any
  number of angular sectors; pan, zoom, and drag-to-resize each ring.
- **Movable, splittable sectors** — drag a sector boundary along the arc to make
  areas bigger/smaller; split a sector ("+") to add a "Новый сектор", or remove
  one ("×").
- **Double-click to rename** any sector, ring, or the center name in place.
- **Connections to the center** — click the central point to start/finish a link
  so arrows can attach to you.
- **People** — click empty space to drop a person (Фамилия / Имя / Отчество),
  choose a color (голубой / розовый / серый) and an importance size (обычный /
  важный / ключевой — larger = more important); the node shows ФИ initials.
  Drag to reposition.
- **Connections** — 5 semantic styles, each bound to a **layer**:
  intense (bold black), regular (thin black), irregular (dashed black),
  positive (thin green), and strained (thin red).
- **Direction / initiative** — per connection: no arrows, initiative from the
  first, from the second, or mutual (arrows both ways).
- **Notes panel** (right) — re-click a person to edit name/color/size, write
  inline notes, delete, or start a connection. **«Перенести в заметку»** creates
  a Markdown note (optionally via a **Templater** template); **«Привязать
  заметку»** links an existing note; a note matching the person's name is bound
  automatically when there's exactly one. Inline preview, «Открыть заметку» /
  «Отвязать».
- **Initials order** — node initials as Ф+И (default) or И+Ф, in settings.
- **Layers** — default «Общая схема связей» plus your own; toggle/filter
  top-left. Layers carry only connections; people positions are shared across
  all layers, so you can view the same network from different angles.
- **Localization** — interface in Russian or English; follows Obsidian's UI
  language by default, with a setting override. New maps get localized default
  labels.
- **Legend** bottom-left; **toolbar** top-right (zoom, undo/redo, export).
- **Export** — PNG, standalone SVG, or JSON (the `.netmap` content itself).
- **Undo/redo** (`Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`), `Esc` to cancel, `Delete`
  to remove a selected connection.

Storage is the vault file (`TextFileView`) — Obsidian owns save; there is no
separate database.

## Architecture

Three layers, deliberately separated so the rendering/model "brain" stays
portable (it could power a standalone web build later):

```
src/
  core/        framework-agnostic TS: model, geometry, commands, history, exporters
  ui/          React + SVG: canvas, scene, panels, popups, store (zustand)
  obsidian/    plugin glue: main.ts, NetMapView (TextFileView), peopleNotes, settings
```

The `.netmap` file is pretty-printed JSON and doubles as the human-readable
export format.

## Build

```bash
npm install
npm run build      # type-check + production bundle → main.js
npm run dev        # watch mode (rebuilds main.js on change)
npm test           # vitest: core geometry/commands/export unit tests
```

Outputs needed by Obsidian: `main.js`, `manifest.json`, `styles.css`.

## Install into a vault

1. In your vault, create the folder
   `<vault>/.obsidian/plugins/networking-map/`.
2. Copy `main.js`, `manifest.json`, and `styles.css` into it.
3. In Obsidian: **Settings → Community plugins**, enable *Networking Map*
   (turn off Restricted/Safe mode if needed).
4. Click the ribbon icon **«Новая карта связей»** (or run the command of the
   same name) to create a `.netmap` file and start.

For development you can symlink the repo folder in place of step 1–2 so
`npm run dev` updates the vault live.

## Settings

- **Язык интерфейса / Interface language** — auto / Русский / English.
- **Папка для заметок о людях** — where «Перенести в заметку» creates notes
  (default `Networking/People`).
- **Записывать свойства в frontmatter** — mirror a person's color and
  coordinates into note properties for Dataview/Bases queries.

## License

MIT.
