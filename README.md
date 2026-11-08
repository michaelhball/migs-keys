# Migs Keys

A piano course and practice journal that runs on this computer. The server uses Node's built-in modules; no dependency installation, account, database service, or build step is needed.

## Start

Requires Node.js 20 or newer.

```sh
cd migs-keys
npm start
```

Open **http://127.0.0.1:4317**. Keep the server running while using the app. Stop it with Ctrl-C. To choose another port: `PORT=4318 npm start`.

## Files

| File | Purpose |
| --- | --- |
| `content/course.json` | Course roadmap, lesson metadata, checkpoints, and source links |
| `content/lessons/01-first-notes.md` | Complete first lesson, in editable Markdown |
| `content/practice-method.md` | Attentive slow practice and overlapping sections |
| `content/course-plan.md` | Course overview and practice schedule |
| `content/learner-guide.md` | Learner preferences and instructions for continuing the course |
| `data/progress.json` | Current lesson, completion, checkpoints, journal entries and drafts, tempo, and timer |
| `data/progress.previous.json` | Previous successfully saved state, replaced at each write |
| `public/` | Local browser interface, styles, audio tools, and Markdown rendering |
| `server.mjs` | Local server and file persistence |

Notes, progress, settings, and timer state are saved to disk. Journal drafts save after a short pause in typing and when closing the note dialog. Audio playback itself stops on navigation or page close. The timer can be resumed across a page reload because its start time is persisted. Pause it when leaving your practice session.

The melody player has its own tempo setting, from 30 to 180 BPM, starting at 60 BPM. Changing tempo during playback adjusts the remaining notes without restarting the melody. This setting is saved separately from the metronome tempo.

Writes are serialized and use a temporary file followed by an atomic rename. A failed write leaves the previous progress file in place. Corrupt files produce an error instead of silently resetting progress. The server binds to `127.0.0.1` only; other devices cannot connect.

## Backup and restore

Copy this entire folder, including the normally Git-ignored `data/` directory, to back up the project. To restore it, stop the server, restore the folder, then run `npm start`. The **Export backup** link downloads a JSON snapshot of the course, available lessons, and progress; there is currently no in-app importer. To recover just progress from that export, with the server stopped, save its `progress` object as `data/progress.json`.

The app works offline after starting the local server. Optional external teaching links need internet access. No analytics, external fonts, cloud sync, or AI API calls are used. Keep the existing ChatGPT Page as an older reference; local files are now the working course.

## Continue the course

Start by reading `content/learner-guide.md`, `content/course.json`, and `data/progress.json`. Use the learner's check-in to revise or add lessons. Add a Markdown file and reference it from a lesson's `file` field, set its status to `ready`, and add its checkpoints. Refresh the browser to load content edits. The roadmap contains 24 lessons; only Lesson 1 currently has a complete walkthrough.

The app does not send notes to an assistant automatically. **Copy check-in** prepares a summary to paste into the ongoing conversation. An assistant working in this project can also read the journal file directly when asked to continue.

## Validation

```sh
npm run check
npm test
```

Integration tests use an isolated temporary data directory, exercise real HTTP endpoints, restart the server, and verify saved data survives. They do not alter the learner's progress.
