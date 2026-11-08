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
  return '';
}
