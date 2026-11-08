# Music theory cards

Original questions and LilyPond diagrams for Migs Keys. The library currently contains 379 facts and 578 cards. Some facts have a separate reverse card; others deliberately use one clear question. Lessons 1–6 contain 44 facts / 70 cards.

## Study and updates

Use the cumulative package for the lesson you have reached. The Flashcards page selects it from local course progress. Import into the same Anki profile, with **learning progress** and **deck presets** disabled on updates. Existing notes use stable GUIDs, so later packages add material without resetting reviews. Keep all three sibling-burying options enabled and use random-card gathering and ordering to mix directions. The learner's current desktop preset has 10 new cards/day; do not overwrite it with the package's starter suggestion of 5.

The website does not automatically write into Anki. `scripts/anki-import-in-app.py` is an optional maintenance helper run inside Anki's debug console, through its own API. It preserves review fields and the current preset. Never open a live collection with a separate Anki backend.

Optional song packs are independent of the core lesson release. A full library and an advanced pack are available for inspection, not the default beginner download. Planned lesson numbers beyond 12 remain provisional and must be reconciled with the actual lesson before release.

## Authoring and rebuilding

- `scripts/anki-content.py`: first six lessons and optional song facts.
- `scripts/anki-future.py`: larger theory library and the reviewed release map for lessons 7–12.
- `notes.json`: generated questions, answers, stable identities, and references.
- `images.json`, `source/`, `media/`: notation specifications, LilyPond sources, and PNGs.
- `decks/`, `manifest.json`: generated import packages and download metadata.

Install the pinned dependencies from `scripts/anki-requirements.txt` in a virtual environment. With LilyPond installed, run:

```sh
python scripts/anki-content.py
python scripts/build-anki.py --images
python scripts/check-theory.py
python scripts/check-anki.py
```

The build only needs `--images` when image specifications change. `check-anki.py` imports packages into temporary collections, renders both card directions, verifies media, checks duplicate-free updates and confirms that scheduled reviews survive. It never opens the learner's collection. `check-theory.py` checks notation source pitches and release boundaries independently of package import.

All diagrams are original engravings; source websites are references, not copied screenshots or lesson text. The packages are small enough for regular Git (the complete package is below 1 MB); Git LFS is unnecessary. Never put unrelated Anki decks or private collection databases in this repository.
