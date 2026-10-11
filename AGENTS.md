# AGENTS.md

## Project

Sunshine is a notes app for the Omarchy shell, built as a Quickshell plugin
(QML + plain JavaScript). It ships two ways: **Pages** (a Notion-style workspace
of pages made of blocks, see `Workspace.js`) and **Notebooks** (paper-styled
notebooks on a desk, see `Notebook.qml`).

It has no build step and no npm dependencies. Everything is QML and `.js` files
that the Quickshell runtime loads directly.

## Entry points (from `manifest.json`)

| Kind | Entry | What it is |
|------|-------|------------|
| service | `Service.qml` | Always-running daemon: settings, Hyprland shortcuts, IPC, profiles |
| panel | `Notebook.qml` | The notebook window (desk with notebooks) |
| barWidget | `BarWidget.qml` | Top-bar icon |
| app root | `app/App.qml` | The desk: shelf (notebooks) + Pages (`app/DocView.qml`) |

Business logic lives in `.js` files at the repo root — all plain JavaScript with
`.pragma library`, imported by QML via `.import`. There is no TypeScript, no
package manager, and no build system.

## Storage layout (per profile)

Each profile has its own folder of notes (default `~/Documents/Sunshine`).

```
<profile>/
  pages/
    index.json          # tree of pages (sidebar)
    <page uuid>.json    # one page: blocks tree
    assets/             # pictures, covers, copied files
  notebooks/<id>/       # one folder per notebook, its pages in JSON
  contacts.json         # People
  calendar.json         # calendar events
  templates.json        # user templates
  .trash/               # trashed notebooks (gettable back)
  backups/              # .tar.gz backups
```

The Pages data model is `Workspace.js`: pages are block trees, each block has an
UUID v4 id, a type (`KINDS` array), `content` (child ids), and `parent`. A page
is a block too (`type: "page"`), so pages nest inside pages. Max 12 levels
deep, 5 000 blocks per page, 20 000 pages per profile.

## Commands

Everything goes through the shell service. Don't edit note files directly —
commands ensure data stays consistent and links/reminders work.

```bash
omarchy-shell sunshine toggle        # open/close window
omarchy-shell sunshine pages         # switch to Pages view
omarchy-shell sunshine quick "text"  # quick note
omarchy-shell sunshine search "q"    # search all notebooks
omarchy-shell sunshine <command> …   # read/modify pages, calendar, People…
omarchy-shell sunshine-agent <command> …  # agent-panel version (same args)
```

The full command reference is `skills/sunshine/SKILL.md` (or `omarchy-shell
sunshine help`). **Trust that skill file over any AGENTS.md** — it's the
canonical API.

## Testing

Tests are CJS files in `tests/`, run with Node directly:

```bash
node tests/workspace.test.cjs        # single test
node tests/blocks.test.cjs           # single test
```

They use `tests/load.cjs` to simulate QML's `.import` system: it strips
`.pragma library` and `.import` directives, runs the code through `vm.runInContext`,
and returns the module context. Tests are plain Node — no test framework.

Run all tests by iterating the files:
```bash
for f in tests/*.test.cjs; do node "$f"; done
```

## Architecture notes

- `Service.qml` is the always-on service: holds settings, notebook metadata,
  profiles, and registers Hyprland shortcuts (`hypr/sunshine.lua`).
- `Store.qml` reads/writes notebook files (per-notebook JSON).
- `Workspace.js` is the Pages model: block tree operations, Markdown parsing,
  block types, columns, equations, diagrams, footnotes.
- `app/DocView.qml` is the Pages editor (sidebar, blocks, toolbar).
- `app/DocSidebar.qml` is the Pages sidebar (pages tree, favorites, projects,
  tags, calendar, library).
- `Notebook.qml` is the notebook window (desk, shelf, paper rendering).
- `app/NotebookView.qml` is the open notebook (pages, turning, drawing).
- Profiles: notes kept apart. `Profiles.qml` + `Profiles.js` manage them.
  `service.profiles` in the UI injects the current profile's store.
- The Sunshine skill (`skills/sunshine/SKILL.md`) is auto-linked into agent
  skill folders when enabled (Settings → AI → Enable Sunshine skill).

## Quirks and gotchas

- **QtQuick imports**: `.js` files are modules, not ES modules. Use
  `.import "Other.js" as Other` (QML-style). Never use `import/require` inside
  those files.
- **UUIDs are lowercase**: `isUuid` regex expects `[0-9a-f]` only.
- **Block types are single-letter codes**: `p, h1, h2, h3, bullet, number,
  check, toggle, quote, callout, code, divider, image, page, link, toc,
  columns, column, habit, calendar, mindmap, table, sketch, audio, meeting,
  agenda, event, button, file, video, bookmark, board, synced, contact, email,
  gallery` (see `Workspace.js` `KINDS`).
- **Columns use special markers in Markdown**: `::columns`, `::next`, `::end`
  as standalone lines.
- **Pages never truly deletes**: everything goes to trash or page history
  (kept every 10 min while writing, and before agent/command changes).
- **Profiles**: when switching, the store is replaced. Commands operating on the
  wrong profile's store will silently fail or affect the wrong data.
- **Audio notes**: Opus files in `Pages/assets`. Transcripts are plain text from
  voxtype. Don't `replace` an audio block unless asked to remove it.
- **Sketches**: can't be read or modified via commands. Don't `replace` sketch
  blocks unless asked.
- **Tests run in Node, not QML**: they load `.js` files through `vm.runInContext`.
  They cannot test QML UI logic directly.
