import { notation } from './music.js';

function positionDiagram(hand) {
  const left = hand === 'left', octave = left ? 3 : 4;
  const names = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
  const fingers = left ? [5, 4, 3, 2, 1] : [1, 2, 3, 4, 5];
  return `<svg class="hand-position-diagram" viewBox="0 0 400 170" role="img" aria-label="${left ? 'Left hand: little finger 5 on C3, ring 4 on D3, middle 3 on E3, index 2 on F3, thumb 1 on G3. Middle C is one octave to the right.' : 'Right hand: thumb 1 on middle C4, index 2 on D4, middle 3 on E4, ring 4 on F4, little finger 5 on G4.'}">
    ${names.map((name, i) => `<rect x="${i * 50 + 1}" y="1" width="48" height="133" rx="3" fill="${i < 5 ? '#edf3e5' : '#fff'}" stroke="#9da899"/><text x="${i * 50 + 25}" y="97" text-anchor="middle" font-size="22" font-weight="600">${fingers[i] || ''}</text><text x="${i * 50 + 25}" y="121" text-anchor="middle" font-size="13">${name}${octave + (i === 7 ? 1 : 0)}</text>`).join('')}
    ${[1, 2, 4, 5, 6].map(i => `<rect x="${i * 50 - 14}" y="1" width="28" height="70" rx="2" fill="#26352d"/>`).join('')}
    <text x="${left ? 375 : 25}" y="158" text-anchor="${left ? 'end' : 'start'}" font-size="12">${left ? 'C4 = middle C →' : '↑ C4 = middle C'}</text>
  </svg>`;
}

export function lessonGuide(id) {
  if (id === 4) {
    const example = { title: 'C3, D3, E3, C3 in the bass clef', events: [48, 50, 52, 48].map((midi, i) => ({ beats: 1, left: [{ midi, finger: [5, 4, 3, 5][i] }] })) };
    return `<section class="staff-guide"><h2>Place your left hand first</h2><p>Find <strong>middle C (C4)</strong>. Move to the <strong>next C to its left (C3)</strong> and place your <strong>little finger (5)</strong> there. Both Cs are white keys immediately to the left of a pair of black keys. The distance from one C to the next is an <strong>octave</strong>.</p>${positionDiagram('left')}<p><strong>5 = little finger on C3 · 4 = ring on D3 · 3 = middle on E3 · 2 = index on F3 · 1 = thumb on G3.</strong> Rest the fingers near these keys; do not press them all down. This exercise only uses 5, 4 and 3. Your right hand can rest.</p><h3>Read the bass clef</h3><p>This is a different clef from Lesson 2. Its two dots surround <strong>F3</strong>, the fourth line from the bottom. It is also called the <strong>F clef</strong>. The same staff position can name a different note when the clef changes.</p>${notation(example)}<div class="staff-landmarks"><p><strong>C3</strong><br>Second space from the bottom.</p><p><strong>D3</strong><br>Middle line.</p><p><strong>E3</strong><br>Third space from the bottom.</p></div><p class="fine">The four notes above are C3, D3, E3, C3. Your middle finger (3) plays E3 in a space; F3 is the next line above it, between the clef’s dots. Small numbers are left-hand fingers. All are quarter notes: one beat each, as before.</p></section>`;
  }
  if (id === 5) return `<section class="staff-guide"><h2>Set up both hands</h2><p><strong>Right thumb (1): middle C, C4.</strong> Rest fingers 2 and 3 over D4 and E4. <strong>Left little finger (5): C3</strong>, the next C to the left of middle C, as in Lesson 4.</p><p>The brace joins the treble and bass staves into a <strong>grand staff</strong>. In this exercise, the top staff is your right hand and the bottom staff is your left. Notes aligned vertically start together.</p><div class="rest-guide"><img src="/anki/media/migs-quarter-rest.png" alt="A quarter rest on a staff"><p>This is a <strong>quarter rest</strong>: one beat of silence in our 4/4 exercise. When it appears only on the lower staff, release the left-hand note and let the right hand continue.</p></div><p>First practise the two Cs together on count 1. Release both. Then try counts 1–2: both Cs on 1; right D alone on 2.</p></section>`;
  if (id === 6) return `<section class="staff-guide"><h2>Add F and G to the right hand</h2><p>Keep your right thumb (1) on <strong>middle C, C4</strong>. Rest 2 on D4, 3 on E4, <strong>4 on F4 and 5 on G4</strong>. The left little finger stays on C3, as in Lesson 5.</p>${positionDiagram('right')}<p>On the treble staff, <strong>F4 is in the bottom space</strong> and <strong>G4 is on the second line from the bottom</strong>. Play E–F–G slowly before starting the piece.</p><p>Learn bars 1–2 first, with the right hand alone. Then add the left C on count 1 of each bar, releasing it on count 2.</p></section>`;
  const setup = {
    7: ['Right hand: start on middle C', 'Start with thumb 1 on C4. The scale uses 1–2–3, then thumb 1 on F4 and 2–3–4–5 up to C5. Move the hand with the thumb crossing. Bars 1–4 are the scale; bars 5–12 are the melody.', [67,69,71,72], 'G4, A4, B4, C5: second line, second space, middle line, third space.'],
    8: ['Prepare the two chord shapes', 'Right hand only. C major: fingers 1–3–5 on C4–E4–G4. Move the whole hand left for A minor: 1–3–5 on A3–C4–E4. Each chord lasts two beats, followed by two beats of silence.', [57,60,64,67], 'A3 is on the second ledger line below treble; the other notes are C4, E4 and G4.'],
    9: ['Find the bass notes before starting', 'Right hand uses 1–3–5 for C4–E4–G4, A3–C4–E4, F4–A4–C5 and G4–B4–D5. Left little finger 5 moves between C3, A2, F2 and G2. Play both hands together on beats 1 and 3.', [41,43,45,48], 'Bass clef: F2 below the staff, G2 on the bottom line, A2 in the bottom space, C3 in the second space.'],
    10: ['Use the compact right-hand shapes', 'Use 1–3–5 for C4–E4–G4, C4–E4–A4, C4–F4–A4, and B3–D4–G4. Move the hand rather than holding a stretch. The left hand keeps the root bass notes from Lesson 9. The instructions below explain why the complete harmony is still in root position.', [59,60,62,67], 'B3 is just below middle C’s ledger line; then C4, D4 and G4.'],
    11: ['Return to the five-note position', 'Right thumb on C4; fingers 2–5 over D4–G4. Begin on E4 with finger 3. The left hand rests. In bars 4 and 8, count eighth-note subdivisions to place the dotted quarter and short eighth correctly.', [60,62,64,67], 'C4, D4, E4 and G4, with finger numbers hidden by default.'],
    12: ['Play the phrase from C, then from G', 'Bars 1–4: right thumb on C4, starting on E4 with finger 3. Bars 5–8: move thumb to G4 and fingers 2–5 to A4–D5, starting on B4 with finger 3. The left hand rests. Listen before reading when trying the ear exercise.', [67,71,72,74], 'G4, B4, C5 and D5. D5 is on the fourth treble line.' ]
  }[id];
  if (setup) {
    const hand = id === 9 ? 'left' : 'right';
    const sample = {title: setup[3], events: setup[2].map(midi => ({beats:1,[hand]:[{midi}]}))};
    return `<section class="staff-guide"><h2>${setup[0]}</h2><p>${setup[1]}</p>${notation(sample, false)}<p>${setup[3]}</p><p class="fine">Read the noteheads first. Show fingering adds suggested fingers to the exercise; piano view keeps finger guidance.</p></section>`;
  }
  return '';
}
