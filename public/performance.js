import { soundControl } from './sound.js';
import { keyboardView } from './music.js';

export function passages(exercise) {
  const last = exercise.events.at(-1).bar;
  const list = [{id:'opening',label:'Opening: pickup + bars 1–8',from:0,to:8}, {id:'full',label:'Whole piece, including repeats',from:0,to:last}];
  for (let from=8; from<=last; from+=7) list.push({id:String(from),label:`Bars ${from}–${Math.min(from+7,last)}`,from,to:Math.min(from+7,last)});
  return list;
}
export function selectPassage(exercise, id='opening') {
  const selected=passages(exercise).find(p=>p.id===id) || passages(exercise)[0];
  return {...exercise,events:exercise.events.filter(e=>e.bar>=selected.from && e.bar<=selected.to)};
}
export function performancePlayer(song, exercise, tempo, view, selected='opening', preset='piano') {
  return `<div class="performance-controls"><label>Passage<select id="song-passage">${passages(song.exercise).map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${p.label}</option>`).join('')}</select></label><label>Play<select id="song-hands"><option value="both">Both hands</option><option value="right">Right hand</option><option value="left">Left hand</option></select></label><label class="loop-control"><input type="checkbox" id="song-loop"> Repeat passage</label></div><div class="section-top"><h2>Für Elise · 3/8</h2><div class="melody-controls">${soundControl(preset)}<label for="melody-tempo">Eighth notes / minute</label><input id="melody-tempo" type="number" min="30" max="180" value="${tempo}"><button class="button outline small" data-action="melody">▷ Listen</button></div></div><p class="fine">Count 1 & 2 & 3 &. The first two notes are a pickup on 3 &. Playback uses a steady tempo; pedal and expressive timing are not simulated.</p><p id="playback-position" class="playback-position" aria-live="off">Ready</p>${view === 'notes' ? `<div class="player-keyboards">${['right','left'].map(hand=>keyboardView(exercise,hand)).join('')}</div><p class="fine">Fingers: 1 thumb · 2 index · 3 middle · 4 ring · 5 little finger. Fingering continues throughout. The opening melody is set explicitly; later fingers are automatic suggestions and may need adjustment for your hand.</p>` : ''}${view==='notation'?`<p class="fine">The dots follow the notes being played, above the staff lines.</p><label class="score-follow"><input id="follow-score" type="checkbox" checked> Follow playback down the score</label><p><a href="/scores/fur-elise.pdf" target="_blank" rel="noopener">Open / download full PDF</a> · <a href="/scores/fur-elise.midi" download>Download MIDI</a></p>${song.notationFiles.map((file,i)=>`<div class="score-scroll"><div class="engraved-page" data-score-page="${i+1}"><img class="full-score-page" src="/scores/${file}" alt="Für Elise, complete score page ${i+1} of ${song.notationFiles.length}"><svg class="score-overlay" viewBox="0 0 119.5016 169.0094" aria-hidden="true"></svg></div></div>`).join('')}`:''}`;
}
