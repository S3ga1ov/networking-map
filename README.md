# Networking Map — Obsidian plugin

Build a **networking / connection map** inside Obsidian: an author point in the
center, three drag-resizable trust rings (*Круг поддержки → продуктивности →
развития*), two axes splitting the plane into four renameable quadrants
(*Работа / Семья / Друзья / Услуги*), people placed as colored circles, and
layered connections between them.

It feels like an online whiteboard (drag, zoom, interactive panels), but the
data lives in your vault: each map is a `.netmap` file, and per-person
«примечания» can be promoted to real Markdown notes that Dataview/Bases can
query.

## Features

- **Polar canvas** — center author point, 3 concentric trust rings, 4 quadrant
  sectors; pan, zoom, and drag-to-resize each ring.
- **People** — click anywhere to drop a person (Фамилия / Имя / Отчество),
  choose a color (голубой / розовый / серый) and an importance size (обычный /
  важный / ключевой — larger = more important); the node shows ФИ initials.
  Drag to reposition.
- **Localization** — interface in Russian or English; follows Obsidian's UI
  language by default, with a setting override. New maps get localized default
  labels.
- **Notes panel** (right) — re-click a person to edit name/color, write inline
  notes (md/json), delete, or start a connection. «Открыть как заметку» creates
  a Markdown note in the vault and links it.
- **Connections** — 4 styles (чёрная полужирная / тонкая / пунктирная /
  красная тонкая), each bound to a **layer**.
- **Layers** — default «Общая схема связей» plus your own; filter top-left.
  Layers carry only links; people positions are universal.
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
export format. See [the approved plan](#) for the full design.

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

- **Папка для заметок о людях** — where «Открыть как заметку» creates notes
  (default `Networking/People`).
- **Имя в центре по умолчанию** — center label for new maps.
- **Записывать свойства в frontmatter** — mirror color/coordinates into note
  frontmatter (`nm-color`, `nm-x`, `nm-y`) for Dataview/Bases queries.
- **Язык интерфейса / Interface language** — auto / Русский / English.

## License

MIT.
