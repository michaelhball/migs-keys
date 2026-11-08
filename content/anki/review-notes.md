# Content and notation review · 2026-11-09

Reviewed all 379 authored facts (578 generated cards), including reverse prompts/answers, plus the 86 notation image specifications and rendered diagrams. This is a content review, not a claim that automated tests can certify all musical teaching.

## Findings and changes

- The website's bass-clef font glyph was vertically misplaced. The Anki bass-clef images were engraved by LilyPond and were correctly positioned. The website now uses anchored LilyPond vector glyphs for both clefs and quarter rests. Chrome had also shown missing-glyph boxes for its quarter rests.
- Lesson notation now draws one stem per chord and supports the dotted-quarter rhythms in Lessons 11–12. Single-bar examples use the available staff width rather than leaving an apparent blank second bar.
- The first six lessons' 44 facts / 70 cards have correct staff positions, finger numbers, note/rest values, and definitions. Their factual content did not need correction. All 70 are present in the learner's desktop Anki.
- Reconciled Lessons 7–12 with their actual written content. Untaught accidentals, interval tables, scale-degree terminology, figured bass and cadence theory remain prepared for later instead of entering these lesson packages. A3 and B3 reading cards were added where those notes first appear.
- Clarified that sharps/flats modify the natural letter-name pitch, and distinguished synthesizer tremolo from piano tremolo notation. Added context for chord formulas and the harmony-textbook meaning of appoggiatura. Corrected article grammar in several future prompts.
- Chord identification images use half notes, a value already taught before the first chord cards.
- Lesson 10 distinguishes an inverted right-hand shape from the position of the combined harmony when a lower root is still present.
- Reviewed the written sequence through Lesson 12 against previously introduced skills: every new hand location, pitch range, rhythm and movement is explained. Lessons 13–24 are outlines, not completed lesson walkthroughs; their prepared card assignments remain provisional.

## References checked

- Musictheory.net: [staff and clefs](https://www.musictheory.net/lessons/10), [note duration](https://www.musictheory.net/lessons/11), [triads](https://www.musictheory.net/lessons/40), and [triad inversion](https://www.musictheory.net/lessons/42).
- Open Music Theory: [embellishing tones](https://viva.pressbooks.pub/openmusictheory/chapter/embellishing-tones/) and [Neapolitan sixth chords](https://viva.pressbooks.pub/openmusictheory/chapter/bii6/).
- Music Theory for the 21st-Century Classroom: [non-chord-tone classifications](https://musictheory.pugetsound.edu/mt21c/NonChordTonesIntroduction.html).

## Repeatable checks

`scripts/check-theory.py` verifies pitch identities in notation sources, core clef anchors, note/rest values, chord spellings, reverse-field completeness, image references and release boundaries. `scripts/check-anki.py` renders all 578 cards in temporary Anki collections and checks media, incremental imports, stable identities and preserved review scheduling.

The browser tests cover staff positions, clef anchors, chord stems, dotted rhythms, persistent fingering preferences, complete hymn durations and score mappings. Browser screenshots and the hymn PDFs were inspected. Re-run visual review whenever notation rendering changes; correct data alone does not prove a correctly displayed clef.
