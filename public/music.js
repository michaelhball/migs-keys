import { soundControl } from './sound.js';
import { escapeHtml as esc } from './markdown.js';

const pitches = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const noteName = midi => pitches[midi % 12] + (Math.floor(midi / 12) - 1);
export const handNotes = (event, hand) => typeof event === 'number' ? (hand === 'right' ? [{ midi: event }] : []) : (event[hand] || []);
export const eventBeats = event => typeof event === 'number' ? 1 : (event.beats || 1);
export function handsFor(exercise) { return ['right', 'left'].filter(hand => exercise.events.some(event => handNotes(event, hand).length)); }
export function measures(exercise) {
  const result = []; let bar = [], beat = 0;
  exercise.events.forEach((event, index) => {
    const beats = eventBeats(event);
    if (beat + beats > 4) throw new Error('A music event crosses a bar line.');
    bar.push({ event, index, beat }); beat += beats;
    if (beat === 4) { result.push(bar); bar = []; beat = 0; }
  });
  if (bar.length) result.push(bar);
  return result;
}

export function keyboardView(exercise, hand) {
  const notes = exercise.events.flatMap(event => handNotes(event, hand));
  const min = Math.min(...notes.map(n => n.midi)), max = Math.max(...notes.map(n => n.midi));
  const start = Math.floor(min / 12) * 12, end = Math.floor(max / 12) * 12 + 11;
  const whites = Array.from({ length: end - start + 1 }, (_, i) => start + i).filter(n => !pitches[n % 12].includes('♯'));
  const width = whites.length * 42;
  const key = (midi, x, black) => `<g class="piano-key ${black ? 'dark-key' : 'light-key'}" data-note="${midi}" role="button" tabindex="0" aria-label="Play ${esc(noteName(midi))}"><rect x="${x}" y="2" width="${black ? 26 : 40}" height="${black ? 72 : 122}" rx="3"/><text class="key-finger" x="${x + (black ? 13 : 20)}" y="${black ? 45 : 86}" text-anchor="middle"></text>${black ? '' : `<text class="key-name" x="${x + 20}" y="112" text-anchor="middle">${esc(noteName(midi))}</text>`}</g>`;
  const whiteKeys = whites.map((midi, i) => key(midi, i * 42, false)).join('');
  const blackKeys = whites.flatMap((midi, i) => pitches[(midi + 1) % 12].includes('♯') ? [key(midi + 1, (i + 1) * 42 - 14, true)] : []).join('');
  return `<div class="hand-keyboard" data-hand="${hand}"><h3>${hand === 'right' ? 'Right' : 'Left'} hand</h3><p class="hand-guide">1 thumb · 2 index · 3 middle · 4 ring · 5 little finger</p><svg class="piano-display" viewBox="0 0 ${width} 128" role="group" aria-label="${hand} hand keyboard">${whiteKeys}${blackKeys}</svg></div>`;
}

function noteY(midi, bottom, hand) {
  const name = noteName(midi);
  const step = Number(name.slice(-1)) * 7 + 'CDEFGAB'.indexOf(name[0]);
  return bottom - (step - (hand === 'right' ? 30 : 18)) * 5;
}
export function notation(exercise) {
  const bars = measures(exercise), hands = handsFor(exercise), height = hands.length === 2 ? 300 : 175;
  let html = '';
  for (let row = 0; row < bars.length; row += 2) {
    let drawing = '';
    hands.forEach((hand, handIndex) => {
      const bottom = 105 + handIndex * 130, top = bottom - 40;
      drawing += `<text x="12" y="${top - 18}" font-size="12">${hand === 'right' ? 'Right hand' : 'Left hand'}</text>`;
      for (let y = top; y <= bottom; y += 10) drawing += `<path d="M20 ${y}H775" class="staff-line"/>`;
      drawing += `<text x="27" y="${bottom + (hand === 'right' ? 2 : -3)}" class="music-symbol" font-size="${hand === 'right' ? 62 : 46}">${hand === 'right' ? '𝄞' : '𝄢'}</text><text x="87" y="${top + 17}" font-size="24" font-family="serif">4</text><text x="87" y="${bottom - 2}" font-size="24" font-family="serif">4</text>`;
      for (let b = 0; b < 2 && bars[row + b]; b++) {
        const accidentals = new Map();
        drawing += `<text x="${130 + b * 320}" y="${bottom + 35}" font-size="11">Bar ${row + b + 1}</text>`;
        for (const { event, index, beat } of bars[row + b]) {
          const x = 150 + b * 320 + beat * 74, beats = eventBeats(event), notes = handNotes(event, hand);
          drawing += `<g class="score-event" data-sequence="${index}"><circle class="score-playhead" cx="${x}" cy="${top - 35}" r="4"/>`;
          if (!notes.length) {
            if (beats === 1) drawing += `<text x="${x - 9}" y="${top + 36}" class="music-symbol" font-size="36">𝄽</text>`;
            else drawing += `<rect x="${x - 8}" y="${top + (beats === 4 ? 10 : 15)}" width="16" height="5" class="note-ink"/>`;
          }
          notes.forEach(n => {
            const y = noteY(n.midi, bottom, hand), name = noteName(n.midi), pitchId = name[0] + name.slice(-1), sharp = name.includes('♯');
            const previous = accidentals.get(pitchId) || false;
            if (sharp !== previous) drawing += `<text x="${x - 24}" y="${y + 7}" font-size="24" class="music-symbol">${sharp ? '♯' : '♮'}</text>`;
            accidentals.set(pitchId, sharp);
            for (let ly = bottom + 10; ly <= y; ly += 10) drawing += `<path d="M${x - 12} ${ly}h24" class="staff-line"/>`;
            for (let ly = top - 10; ly >= y; ly -= 10) drawing += `<path d="M${x - 12} ${ly}h24" class="staff-line"/>`;
            drawing += `<ellipse cx="${x}" cy="${y}" rx="${beats === 4 ? 9 : 7}" ry="5" transform="rotate(-20 ${x} ${y})" class="${beats >= 2 ? 'open-note' : 'note-ink'}"/>`;
            if (beats !== 4) {
              const down = y < bottom - 20, stemX = x + (down ? -6 : 6), stemEnd = y + (down ? 30 : -30);
              drawing += `<path d="M${stemX} ${y}V${stemEnd}" class="note-stem"/>`;
              if (beats === .5) drawing += `<path d="M${stemX} ${stemEnd}q14 ${down ? -8 : 8} 4 ${down ? -19 : 19}" class="note-stem"/>`;
            }
            if (n.finger) drawing += `<text x="${x + (notes.length > 1 ? (notes.indexOf(n) * 14 - 7) : 0)}" y="${top - 18}" text-anchor="middle" font-size="12">${n.finger}</text>`;
          });
          drawing += '</g>';
        }
        drawing += `<path d="M${450 + b * 320} ${top}V${bottom}" class="staff-line"/>`;
      }
    });
    html += `<div class="score-scroll"><svg class="notation-display" viewBox="0 0 800 ${height}" role="img" aria-label="${esc(exercise.title)}. Bars ${row + 1} to ${Math.min(row + 2, bars.length)}. Four beats per bar.">${drawing}</svg></div>`;
  }
  return html;
}

export function musicPlayer(exercise, tempo, view = 'notes', preset = 'piano') {
  return `<div class="section-top"><h2>${esc(exercise.title)}</h2><div class="melody-controls">${soundControl(preset)}<label for="melody-tempo">Tempo</label><input id="melody-tempo" type="number" min="30" max="180" step="1" value="${tempo}" aria-label="Playback tempo in beats per minute"><span>BPM</span><button class="button outline small" data-action="melody">▷ Listen</button></div></div><p class="fine">${esc(exercise.description || 'Four beats per bar. Finger numbers appear on the keys during playback.')}</p>${view === 'notation' ? notation(exercise) : ''}${view === 'notes' ? `<div class="player-keyboards">${handsFor(exercise).map(hand => keyboardView(exercise, hand)).join('')}</div><p class="fine">Finger 1 = thumb · 2 = index · 3 = middle · 4 = ring · 5 = little finger</p>` : ''}`;
}
