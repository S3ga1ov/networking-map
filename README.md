# Networking Map

[![CI](https://github.com/S3ga1ov/networking-map/actions/workflows/ci.yml/badge.svg)](https://github.com/S3ga1ov/networking-map/actions/workflows/ci.yml)

An Obsidian plugin for mapping your personal network — who is around you, how
close they are, and how you are connected.

**English** · [Русский](#networking-map--на-русском)

---

## English

### What it is

Networking Map turns your relationships into an interactive map inside Obsidian.
You sit at the center; the people around you are placed on a circular canvas,
grouped by closeness and by area of life, and joined with connections that
describe the kind of relationship. It feels like a lightweight whiteboard, but
every map is a plain file in your vault, and any person can link to real
Markdown notes.

It is meant for thinking about a network in the moment — not getting lost in
your own contacts, and seeing where the gaps and the dense spots are.

### The idea

- **You are the center.** Everything is drawn relative to you.
- **Rings = closeness.** Three concentric circles, from your inner circle of
  support out to the “horizon” of new, not-yet-established contacts.
- **Sectors = areas of life.** Axes split the canvas into named sectors (work,
  family, friends, services…) that you can rename, resize, and split.
- **People are points.** A connection's style encodes the kind of relationship,
  and arrows show who takes the initiative. Linking contacts to each other — not
  just to you — is how you read the density of your network.
- **Layers** let you look at the same people through different lenses: links
  belong to a layer, while a person's position is shared across all of them.

### Main capabilities

- Place, move, color, size, and label people.
- Typed connections with optional direction arrows, organized into layers.
- Link any number of Obsidian notes to a person and open them in a click.
- Zoom, undo/redo, and export to PNG, SVG, or JSON.
- Interface in English or Russian.

A built-in guide (the **?** button, bottom-left) explains everything in context.

### Storage

Each map is a single `.netmap` file — human-readable JSON — opened in a custom
view. Per-person notes are ordinary Markdown files in your vault. There is no
external database: Obsidian owns saving, so your data stays portable and yours.

### Install

1. Create `<vault>/.obsidian/plugins/networking-map/`.
2. Copy `main.js`, `manifest.json`, and `styles.css` into it.
3. In Obsidian → **Settings → Community plugins**, enable *Networking Map*.
4. Use the ribbon icon (or the command) **“New connection map”** to create a
   `.netmap` file and start.

### Development

```bash
npm install
npm run build   # type-check + production bundle → main.js
npm run dev     # watch mode
npm test        # unit tests (core model, geometry, export)
```

Source layout: `src/core` (framework-agnostic model/geometry/commands/export),
`src/ui` (React + SVG), `src/obsidian` (plugin glue).

### License

MIT.

---

## Networking Map — на русском

[English](#english) · **Русский**

### Что это

Networking Map превращает ваши отношения в интерактивную карту прямо в Obsidian.
В центре — вы; люди вокруг размещаются на круговом поле, сгруппированы по
близости и по сферам жизни и соединены связями, которые описывают характер
отношений. Ощущается как лёгкая онлайн-доска, но каждая карта — это обычный файл
в вашем хранилище, а к любому человеку можно привязать настоящие заметки
Markdown.

Инструмент — чтобы думать о своей сети «в моменте»: не теряться в собственных
контактах и видеть, где пробелы, а где плотные связи.

### Идея

- **Центр — вы.** Всё строится относительно вас.
- **Круги — близость.** Три концентрические окружности: от внутреннего круга
  поддержки до «горизонта» — новых, ещё не закрепившихся контактов.
- **Секторы — сферы жизни.** Оси делят поле на именованные секторы (работа,
  семья, друзья, услуги…), которые можно переименовывать, менять по размеру и
  делить.
- **Люди — точки.** Стиль связи кодирует характер отношений, а стрелки
  показывают, кто проявляет инициативу. Соединяя контакты между собой, а не
  только с вами, вы видите плотность сети.
- **Слои** позволяют смотреть на одних и тех же людей под разными углами: связи
  привязаны к слою, а положение человека общее для всех слоёв.

### Основные возможности

- Размещать, двигать, красить, масштабировать и подписывать людей.
- Типизированные связи со стрелками направления, сгруппированные по слоям.
- Привязывать к человеку любое число заметок Obsidian и открывать их по клику.
- Зум, отмена/повтор, экспорт в PNG, SVG или JSON.
- Интерфейс на русском или английском.

Встроенная инструкция (кнопка **?** слева снизу) поясняет всё по контексту.

### Хранение

Каждая карта — один файл `.netmap` (читаемый JSON), открываемый в собственном
представлении. Заметки о людях — обычные Markdown-файлы в хранилище. Никакой
внешней базы: сохранением управляет Obsidian, данные остаются переносимыми и
вашими.

### Установка

1. Создайте папку `<хранилище>/.obsidian/plugins/networking-map/`.
2. Скопируйте туда `main.js`, `manifest.json` и `styles.css`.
3. В Obsidian → **Настройки → Сторонние плагины** включите *Networking Map*.
4. Кнопкой на ленте (или командой) **«Новая карта связей»** создайте файл
   `.netmap` и начните.

### Разработка

```bash
npm install
npm run build   # проверка типов + продакшен-сборка → main.js
npm run dev     # режим watch
npm test        # юнит-тесты (ядро, геометрия, экспорт)
```

Структура: `src/core` (независимые от фреймворка модель/геометрия/команды/экспорт),
`src/ui` (React + SVG), `src/obsidian` (склейка с плагином).

### Лицензия

MIT.
