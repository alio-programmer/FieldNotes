# Fieldnotes

A local-first project log: a quiet graph-paper workspace for keeping track of
what you are building, with targets, notes, and a little insight into your own
momentum. Everything is stored in your browser. There is no account and no server.

## Run it (React + Vite + Tailwind)

Requires Node.js 18 or newer. From this folder, run:

```powershell
npm install
npm run dev
```

Then open [http://localhost:4173](http://localhost:4173). Press Ctrl+C to stop.

```powershell
npm run build     # production build into dist/
npm run preview   # serve the production build
npm test          # run the test suite once
npm run test:watch
```

## What it does

- **Projects** with a name, the problem, a proposed approach, and free-form notes
  (a small Markdown subset: headings, lists, bold, italic, inline and fenced code).
- **Targets** as a checklist per project, with stable ids, completion timestamps
  and a percentage. Renaming a target never resets its checkbox.
- **Detail drawer** for any project: full notes, a progress sparkline, an
  add-target box, and a history of what happened and when.
- **Organise** with tags, priorities, due dates, pin-to-top, and
  active / paused / archived states. Filter, search and sort, or select several
  projects at once for bulk archive and delete.
- **Insight** into your own pace: a 12-week activity heatmap, a current streak,
  targets completed this week, and average time-to-complete.
- **Own your data**: export to JSON or Markdown, import a JSON backup (merge or
  replace), or print the log. Deleting a project offers an undo.
- **Light and dark themes**, a reduced-motion mode, a command palette and a
  full keyboard layer.

## Keyboard shortcuts

Shortcuts stand down while you are typing in a field. Press `?` in the app for
this list.

| Key | Action |
| --- | --- |
| `N` | New project |
| `/` | Focus the search box |
| `Ctrl`/`Cmd` + `K` | Command palette |
| `E` | Edit the first visible project |
| `Esc` | Close the open dialog or drawer |
| `?` | Show the shortcut list |
| `Ctrl`/`Cmd` + `Enter` | Save from the project form |

## Your data

Projects live in this browser's local storage under `fieldnotes.projects.v2`.
Older data saved by the first version (`fieldnotes.projects.v1`) is upgraded
automatically on first load, and the old key is left alone as a backup.

Because this is local storage:

- Clearing site data, or using private browsing, will remove your projects.
- **Export a JSON backup occasionally** — it is the only copy.
- The app shows a clear warning if storage is full or blocked, rather than
  silently dropping your changes.

## How it is put together

```
src/
  App.jsx                 state and wiring
  components/             presentational pieces (Modal, cards, drawer, palette…)
  hooks/
    useProjects.js        the project collection + persistence
    useLocalStorage.js    generic persisted state, synced across tabs
    useSettings.js        theme and layout preferences
    useHotkeys.js         global shortcuts
  lib/
    schema.js             data shape, defaults, v1 -> v2 migration
    storage.js            safe read/write, quota and blocked detection
    filter.js             search, filter, sort, tag and status selectors
    insights.js           streaks, heatmap, progress series
    markdown.js           the small Markdown renderer
    transfer.js           export, import, print
    sample.js             optional sample projects
```

There are no runtime dependencies beyond React. Tests use Vitest and Testing
Library, both dev-only.

