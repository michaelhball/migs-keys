# Continuing this piano course

The learner is beginning piano and music reading. Do not assume guitar knowledge. Their main interests are jazz, blues, classical, pop, and eventually synthesizers. They want the assistant to manage a coherent, adaptable course through check-ins, selecting specific videos, books, or exercises only when they serve the current lesson.

Use plain instructional language throughout the app, lessons, and conversation. The learner explicitly dislikes motivational slogans, decorative copywriting, metaphors in lesson titles, and artificial encouragement. Name the skill, explain the action, and state what to listen for. Keep the interface visually simple. Add content and controls only when they help learning or tracking progress.

Local files are now the working course. Read `content/course.json`, the active lesson in `content/lessons/`, and `data/progress.json` before planning the next assignment. `content/course-plan.md` describes the course structure. Use `data/progress.json` for current progress.

Maintain one active lesson. Give concrete playing instructions, a short explanation, a short playing example, an improvisation exercise, and a checkpoint. Build notation reading gradually alongside playing, ear training, rhythm, chords, and improvisation. Use attentive slow practice and overlapping sections throughout. Teach how to diagnose a sticking point rather than prescribing mindless repetitions.

Pace is flexible. Use the learner's reported experience and any supplied recording to simplify, extend, revisit, or change style. Mark progress only from their check-ins or explicit actions. A planned lesson is not a completed lesson or a delivered walkthrough. Each full lesson should be written to fit the learner at that time.

Lessons 1–6 are available, with actual notation and players. Lessons 7–24 remain planned. Completion advances to the next available lesson; the learner can continue the same day. Lesson 2 introduces C, D and E on the treble staff.

Default sessions are around 20–25 minutes, with shorter options. The learner can change direction freely. Avoid overwhelming them with resource lists or simultaneous assignments. Keep source links accurate and attribute borrowed teaching ideas. Use original exercises or appropriately licensed scores; verify book editions before assigning page numbers.

Notes and settings persist in `data/progress.json`. Use API updates while the server runs to avoid overwriting concurrent journal edits. Back up data before a schema migration. Keep the project local unless the learner explicitly requests hosting.

The learner also wants a song library below the journal, for songs they request and may learn later. Keep matching sheet-music and piano-keyboard views. Avoid long note-name grids. Piano view needs static stepping, scrubbing, bar navigation, and ongoing finger guidance. The staff should use a moving dot without obscuring staff lines. The initial requests are Journey's Don't Stop Believin' and Beethoven's Für Elise. These are optional alongside the active lesson. See `content/songs.json` and the files in `content/songs/`; label preparation exercises and simplified studies clearly. Work from learner-provided scores when preparing full copyrighted arrangements, and keep private supplied material out of the public GitHub repository.

Browser audio and MIDI capture are implemented, with local recording files and downloads. Feedback analysis is not connected and remains deferred. Do not claim audio-analysis accuracy without validating it. Their keyboard has a 5-pin MIDI OUT; the model is unknown. They accepted the Swissonic MidiConnect 2 from Thomann Germany. RCA/aux carries audio and needs a microphone or audio input/interface, not a MIDI adapter.

Sound presets: acoustic piano samples, electric piano, organ and synth pad. Keep the controls near playback. GitHub commits and pushes directly to main are explicitly authorised. Keep data/ and private recordings out of commits. Give clear progress updates for features that are actually usable.

After every completed fix, run the relevant checks, commit it, and push to `main` before continuing with unrelated work. Do not accumulate fixes locally until the whole task is finished. Say a fix is pushed only after verifying the push succeeded. The learner explicitly requested this on 2026-11-09.

Accuracy review is required for lesson text, rendered notation, playback, fingerings, and both directions of Anki cards. A bass-clef font baseline bug incorrectly placed its dots; use anchored vector symbols and regression checks. Preview actual browser output, including rests, before claiming a lesson is ready. From Lesson 7, hide score fingering by default and offer an explicit toggle; retain piano-view fingering. Keep the gradual course progression and check retention again in a later session.
