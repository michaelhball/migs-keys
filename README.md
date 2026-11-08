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
| `content/lessons/01-first-notes.md` | First of six available lessons, in editable Markdown |
| `content/songs.json` | Requested songs and the files for each study or arrangement |
| `content/songs/` | Scores, MIDI-derived playback, source files, and practice instructions |
| `content/practice-method.md` | Attentive slow practice and overlapping sections |
| `content/course-plan.md` | Course overview and practice schedule |
| `content/learner-guide.md` | Learner preferences and instructions for continuing the course |
| `data/progress.json` | Current lesson, completion, checkpoints, journal entries and drafts, tempo, and timer |
| `data/progress.previous.json` | Previous successfully saved state, replaced at each write |
| `public/` | Local browser interface, styles, audio tools, and Markdown rendering |
| `server.mjs` | Local server and file persistence |

Notes, progress, settings, and timer state are saved to disk. Journal drafts save after a short pause in typing and when closing the note dialog. Audio playback itself stops on navigation or page close. The timer can be resumed across a page reload because its start time is persisted. Pause it when leaving your practice session.

The melody player has its own tempo setting, from 30 to 180 BPM, starting at 60 BPM. Changing tempo during playback adjusts the remaining notes without restarting the melody. This setting is saved separately from the metronome tempo.

**Songs** appears below **Practice journal**. **Piano view** has one keyboard per hand, finger numbers, Previous/Next controls, a position slider, and a bar selector. It can be studied without playing audio. **Sheet music** shows notation separately. Für Elise includes the full public-domain edition, both hands, repeats, original 3/8 timing, selectable passages, looping, and a PDF/MIDI download. The Journey player contains a short actual accompaniment excerpt and links to the requested full Pianote lesson, not a complete arrangement.

Use the **Sound** selector beside the tempo control for acoustic piano, electric piano, organ, or synth pad. Acoustic piano uses local Salamander samples; credits are in `content/audio-credits.md`. The chosen sound and song view persist. Für Elise's tempo counts eighth notes; lesson and Journey tempos count quarter notes. All piano-view notes have suggested fingerings; the later Für Elise fingerings are generated suggestions rather than a reviewed fingering edition.

**Record practice** below the page can capture microphone/USB-interface audio or a connected MIDI input. Grant the relevant browser permission when you choose that input. MIDI is supported in Chrome/Brave; microphone recording also works in other browsers with MediaRecorder. Stop and save each take (maximum ten minutes). Audio and MIDI event files are stored under `data/recordings/`; metadata is in `data/progress.json`. Saved takes can be replayed and downloaded, including standard `.mid` export. A failed save leaves the take available to retry/download while the page remains open. No recording is sent to an AI service; automated feedback is not connected. Hardware capture still needs checking with the learner's device.

Writes are serialized and use a temporary file followed by an atomic rename. A failed write leaves the previous progress file in place. Corrupt files produce an error instead of silently resetting progress. The server binds to `127.0.0.1` only; other devices cannot connect.

## Backup and restore

Copy this entire folder, including the normally Git-ignored `data/` directory, to back up the project. To restore it, stop the server, restore the folder, then run `npm start`. The **Export backup** link downloads a JSON snapshot of the course, available lessons, songs (including notation SVGs), and progress metadata; it excludes recording media files and there is currently no in-app importer. To recover just progress from that export, with the server stopped, save its `progress` object as `data/progress.json`.

The app works offline after starting the local server. Optional external teaching links need internet access. No analytics, external fonts, cloud sync, or AI API calls are used. Keep the existing ChatGPT Page as an older reference; local files are now the working course.

## Continue the course

Start by reading `content/learner-guide.md`, `content/course.json`, and `data/progress.json`. Use the learner's check-in to revise or add lessons. Add a Markdown file and reference it from a lesson's `file` field, set its status to `ready`, and add its checkpoints. Refresh the browser to load content edits. The roadmap contains 24 lessons; Lessons 1–6 have complete walkthroughs; Lessons 7–24 are planned.

The app does not send notes to an assistant automatically. **Copy check-in** prepares a summary to paste into the ongoing conversation. An assistant working in this project can also read the journal file directly when asked to continue.

To add a requested song, add its metadata to `content/songs.json` and put the referenced files in `content/songs/`. IDs and SVG filenames use lowercase letters, digits, and hyphens. Keep pitches and durations identical across both views. Finger guidance belongs in Piano view. Label simplified rhythm, excerpts, and original preparation exercises explicitly. Record the score source in the practice file. Full copyrighted arrangements should come from learner-provided material; do not commit private supplied scores to the public repository. Playback is shared by the lessons and song viewer.

## Validation

```sh
npm run check
npm test
```

Integration tests use an isolated temporary data directory, exercise real HTTP endpoints, restart the server, and verify saved data survives. They do not alter the learner's progress.

## Rebuilding music and inspecting source video

Run `python3 scripts/build-fur-elise.py` from the repository root with LilyPond 2.26 installed. It rebuilds the score, unfolded MIDI, player events, suggested fingerings, and the map from playback notes to engraved noteheads. The green dots are drawn above the staff; the printed SVG remains unchanged beneath them. Generated assets are committed, so LilyPond and Python are not needed to run the app.

`scripts/extract-video-frames.py` extracts sparse, timestamped frames using FFmpeg's input seeking. Start with `--every 60`, then use `--times 30,90,330` for chosen details. Store source videos and extracted frames under ignored `data/video-review/`. The extraction script and inspection decisions belong in Git; personal video files do not. No video-analysis API is called.
