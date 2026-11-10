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
| `content/lessons/01-first-notes.md` | First of twelve available lessons, in editable Markdown |
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

Lesson melodies keep their own tempo setting, from 30 to 180 BPM, initially 60. Each song starts at its reference tempo; changes are saved per song in `settings.songTempos`, independently of lessons and the metronome. **Reset tempo** removes that song's override. Changing tempo during playback adjusts the remaining notes without restarting. Song metadata records the reference's BPM, counted note value, basis and source; playback converts it to the meter's denominator unit. Thus Für Elise's score marking quarter = 72 becomes 144 eighth notes per minute. Hymns without a fixed recording use explicitly labelled arrangement tempos.

**Songs** appears below **Practice journal**. **Piano view** has one keyboard per hand, finger numbers, Previous/Next controls, a position slider, and a bar selector. It can be studied without playing audio. **Sheet music** shows notation separately. Für Elise includes the full public-domain edition, both hands, repeats, original 3/8 timing, selectable passages, looping, and a PDF/MIDI download. Journey includes a 116-bar tutorial-based piano accompaniment with both hands, walking bass, named sections, overlapping practice passages, synced notation and PDF/MIDI downloads. Repeated voicings are standardized for practice; the vocal/guitar melody is not included.

Use the **Sound** selector beside the tempo control for acoustic piano, electric piano, organ, or synth pad. Acoustic piano uses local Salamander samples; credits are in `content/audio-credits.md`. The chosen sound and song view persist. Für Elise's tempo counts eighth notes; lesson and Journey tempos count quarter notes. All piano-view notes have suggested fingerings; the later Für Elise fingerings are generated suggestions rather than a reviewed fingering edition.

**Record practice** below the page can capture microphone/USB-interface audio or a connected MIDI input. Grant the relevant browser permission when you choose that input. MIDI is supported in Chrome/Brave; microphone recording also works in other browsers with MediaRecorder. Stop and save each take (maximum ten minutes). Audio and MIDI event files are stored under `data/recordings/`; metadata is in `data/progress.json`. Saved takes can be replayed and downloaded, including standard `.mid` export. A failed save leaves the take available to retry/download while the page remains open. No recording is sent to an AI service; automated feedback is not connected. Hardware capture still needs checking with the learner's device.

Writes are serialized and use a temporary file followed by an atomic rename. A failed write leaves the previous progress file in place. Corrupt files produce an error instead of silently resetting progress. The server binds to `127.0.0.1` only; other devices cannot connect.

## Theory flashcards and lesson notation

The **Flashcards** page offers cumulative Anki packages matched to the current lesson. There are 70 cards through Lesson 6 and a larger prepared library released in stages. Packages contain their own notation images. Import into the same Anki profile with learning progress and deck presets disabled on updates. All three sibling-burying options separate forward and reverse cards across days. See `content/anki/README.md` for the build, review and import workflow.

From Lesson 7, score finger numbers are hidden by default. **Show fingering** toggles them, with a per-lesson preference saved to disk. Piano view keeps its finger guidance. Lesson clefs and quarter rests use LilyPond vector glyphs anchored to staff coordinates, avoiding font-dependent positioning and missing symbols.

The **Hymns** category contains complete 16-bar beginner arrangements of **Amazing Grace** (3/4) and **Simple Gifts**, the tune behind **Lord of the Dance** (4/4). Both include a pickup, a single-note bass part, aligned public-domain lyrics, short practice passages, synchronized score dots, and PDF/MIDI downloads. Printed scores hide finger numbers by default; Show fingering is available where the score contains suggestions, with the preference saved per song. Piano view retains finger guidance. Amazing Grace has six original lyric stanzas in the Words panel and its first stanza engraved in the score. The Simple Gifts study is not the complete Sydney Carter adaptation: the requested Lord of the Dance chorus remains pending a supplied score. Song pages identify sources and arrangement scope.

## Backup and restore

Copy this entire folder, including the normally Git-ignored `data/` directory, to back up the project. To restore it, stop the server, restore the folder, then run `npm start`. The **Export backup** link downloads a JSON snapshot of the course, available lessons, songs (including notation SVGs), and progress metadata; it excludes recording media files and there is currently no in-app importer. To recover just progress from that export, with the server stopped, save its `progress` object as `data/progress.json`.

The app works offline after starting the local server. Optional external teaching links need internet access. No analytics, external fonts, cloud sync, or AI API calls are used. Keep the existing ChatGPT Page as an older reference; local files are now the working course.

## Continue the course

Start by reading `content/learner-guide.md`, `content/course.json`, and `data/progress.json`. Use the learner's check-in to revise or add lessons. Add a Markdown file and reference it from a lesson's `file` field, set its status to `ready`, and add its checkpoints. Refresh the browser to load content edits. The roadmap contains 24 lessons; Lessons 1–12 have complete walkthroughs; Lessons 13–24 are planned.

The app does not send notes to an assistant automatically. **Copy check-in** prepares a summary to paste into the ongoing conversation. An assistant working in this project can also read the journal file directly when asked to continue.

To add a requested song, add its metadata to `content/songs.json` and put the referenced files in `content/songs/`. IDs and SVG filenames use lowercase letters, digits, and hyphens. Keep pitches and durations identical across both views. Finger guidance belongs in Piano view. Label simplified rhythm, excerpts, and original preparation exercises explicitly. Record the score source in the practice file. Full copyrighted arrangements should come from learner-provided material; do not commit private supplied scores to the public repository. Playback is shared by the lessons and song viewer.

Local arrangements live in ignored `data/songs/`. Its `index.json` has the same `{ "songs": [...] }` catalogue shape, and each entry's assets live in `data/songs/SONG-ID/`. A local entry replaces the corresponding public entry in full, including its words and exercise. This prevents old lyrics being attached to a different version. The API, score downloads and JSON backup all use the selected local arrangement. Back up the whole `data/` directory as well to retain the source inputs and MIDI/PDF files.

`uv run --locked python scripts/build-local-song.py INPUT.json` engraves a reviewed note list, writes both score variants, MIDI, playback events and moving-dot positions, then installs the catalogue entry. Its input schema is documented in the script. Note times are quarter-note units; supplied fingerings and section labels are editorial decisions. The builder verifies every rendered MIDI pitch, onset and duration against the input before publishing. Keep private inputs and outputs in `data/`; the reusable builder is committed. For isolated Chrome verification with local arrangements, run `MIGS_QA_SONGS="$PWD/data/songs" node scripts/check-song-ui.mjs`; it copies only song content into throwaway test data, never your progress or recordings.

## Validation

```sh
npm run check
npm test
```

`node scripts/check-song-ui.mjs` checks the four playable songs and the Roses source page in headless Chrome, including saved fingering, score playback dots, hand-filtered stepping, per-song tempo persistence/reset and isolation from lessons. It uses a temporary server and profile and leaves screenshots in the printed temporary directory. It requires Node 22+ and Chrome; set `MIGS_CHROME` if Chrome is installed elsewhere.

Integration tests use an isolated temporary data directory, exercise real HTTP endpoints, restart the server, and verify saved data survives. They do not alter the learner's progress.

## Python tools

Python tooling uses **uv**, `pyproject.toml`, `.python-version` and the committed `uv.lock`. Run commands from this repository. `uv` creates the local `.venv/`; the environment is ignored by Git and can be recreated from the lockfile. Python 3.13 matches the validated Anki tooling.

```sh
brew install uv ffmpeg lilypond poppler
uv sync --locked --all-groups
uv run python scripts/check-theory.py
uv run --group flashcards python scripts/check-anki.py
```

The base environment provides NumPy for local audio/video analysis and Pillow for image processing. The `flashcards` dependency group adds genanki and Anki's collection/import library. FFmpeg/ffprobe inspect and convert media, LilyPond engraves scores and produces MIDI, and Poppler renders PDFs for visual review. These system programs are not Python packages. The Node server does not need the Python environment to serve already-built content.

Use `uv run python scripts/NAME.py ...` for media and score tools, and `uv run --group flashcards python scripts/NAME.py ...` for Anki tools. The Anki in-app import helper is the exception: it runs inside Anki's own console. Keep reusable scripts and documentation committed; put local media inputs, extracted frames and private transcriptions under ignored `data/` or outside the repository. Never embed a downloaded video's path in committed code.

## Rebuilding music and inspecting source video

Run `uv run python scripts/build-fur-elise.py` from the repository root with LilyPond 2.26 installed. It rebuilds the score, unfolded MIDI, player events, suggested fingerings, and the map from playback notes to engraved noteheads. The green dots are drawn above the staff; the printed SVG remains unchanged beneath them. Generated assets are committed, so LilyPond and Python are not needed to run the app.

`scripts/extract-video-frames.py` extracts sparse, timestamped frames using FFmpeg's input seeking. Start with `--every 60`, then use `--times 30,90,330` for chosen details. Store source videos and extracted frames under ignored `data/video-review/`. The extraction script and inspection decisions belong in Git; personal video files do not. No video-analysis API is called.

For a tutorial with coloured falling notes, `uv run --locked python scripts/read-piano-roll.py INPUT --start 8 --end 38 --output data/video-review/roll.json` streams cropped samples at 6 fps. Check its keyboard coordinates, crop and green/right–blue/left colour assumptions against the source; they are configurable layout calibration, not universal video recognition. `scripts/quantize-piano-roll.py OBSERVATIONS --bpm TEMPO --output DRAFT` estimates note attacks and lengths on an eighth-note grid. Set the strike line and scroll-speed range for other layouts. `scripts/compare-piano-roll.py BOTH --right RIGHT --left LEFT --left-offset PICKUP --output CHECKED` compares independently sampled hand demonstrations and reports discrepancies. Inspect mismatches, verify octaves against the audio and review the score before using it. These tools run locally, make no AI API calls, and never store the source filename in their output.

Run `uv run python scripts/build-journey.py` to rebuild the Journey accompaniment from the committed arrangement code. Source review timestamps and adaptation decisions are in `content/songs/journey-source-review.md`; no downloaded-video paths are stored in the repository. Both score builders share the meter-aware MIDI importer and score-linking code.

`scripts/convert-video.py INPUT --output OUTPUT.mp4` creates H.264/AAC MP4 using FFmpeg and reports the output codecs/duration. It refuses to overwrite an existing file or the original. Frame extraction supports `--crop width:height:x:y` after scaling and merges its inspection manifest when adding timestamps.

Run `uv run python scripts/build-hymns.py` to regenerate the two beginner hymn tunes. `scripts/score_output.py` removes only tagged fingering groups from the default SVGs, preserving score coordinates, and builds plain PDF scores. Higher-level Simple Gifts arrangement helpers are retained in the builder but not published or built by default. Run `uv run python scripts/build-lessons.py` to rebuild the original lesson 7–12 exercises (plus Beethoven’s public-domain Ode to Joy opening). `uv run python scripts/build-music-symbols.py` regenerates the lesson renderer’s vector glyphs. After any content or code change, run the relevant checks and commit and push the completed change to `main`; see `content/learner-guide.md`.
