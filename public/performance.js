import { soundControl } from './sound.js';
import { keyboardView } from './music.js';
import { escapeHtml as esc } from './markdown.js';

export function passages(exercise) {
  if (exercise.passages?.length) return exercise.passages;
  const last = exercise.events.at(-1).bar;
  const list = [{id:'opening',label:'Opening: pickup + bars 1–8',from:0,to:8}, {id:'full',label:'Whole piece, including repeats',from:0,to:last}];
  for (let from=8; from<=last; from+=7) list.push({id:String(from),label:`Bars ${from}–${Math.min(from+7,last)}`,from,to:Math.min(from+7,last)});
  return list;
}
export function selectPassage(exercise, id='opening') {
  const selected=passages(exercise).find(p=>p.id===id) || passages(exercise)[0];
  return {...exercise,events:exercise.events.filter(e=>e.bar>=selected.from && e.bar<=selected.to)};
}
export function lyricIndexAt(lyrics, event, beatsPerBar) {
  if (!lyrics || !event) return -1;
  const position = event.bar * beatsPerBar + event.beat;
  return lyrics.cues.findLastIndex(cue => cue.bar * beatsPerBar + cue.beat <= position);
}
export function lyricsPanel(lyrics, verse = 0) {
  if (!lyrics) return '';
  const selected = Math.max(0, Math.min(verse, lyrics.verses.length - 1));
  return `<section class="lyrics-panel" aria-label="Lyrics"><div class="section-top"><h3>Words · ${esc(lyrics.title)}</h3>${lyrics.verses.length > 1 ? `<label>Stanza<select id="lyric-verse">${lyrics.verses.map((_,i)=>`<option value="${i}" ${i === selected ? 'selected' : ''}>${i+1} of ${lyrics.verses.length}</option>`).join('')}</select></label>` : ''}</div><div class="lyric-lines">${lyrics.verses[selected].map((line,i)=>`<p data-lyric-line="${i}">${esc(line)}</p>`).join('')}</div><p class="fine">${esc(lyrics.credit)} · <a href="${esc(lyrics.source)}" target="_blank" rel="noopener">Source</a></p><p class="fine">${esc(lyrics.notice)}</p>${lyrics.authorisedLyricsUrl ? `<p class="fine"><a href="${esc(lyrics.authorisedLyricsUrl)}" target="_blank" rel="noopener">Lord of the Dance · authorised lyrics from the publisher ↗</a></p>` : ''}</section>`;
}
export function performancePlayer(song, exercise, tempo, view, selected='opening', preset='piano', verse=0) {
  const title=exercise.title || song.title || 'Practice player';
  const unit=exercise.meter?.[1]===8?'Eighth notes / minute':'Quarter notes / minute';
  const downloads=(song.downloadFiles||[]).map(file=>`<a href="/scores/${esc(file)}" target="_blank" rel="noopener">${file.endsWith('.pdf')?'Open / download PDF':'Download MIDI'}</a>`).join(' · ');
  const scorePages=(song.notationFiles||[]).map((file,i)=>`<div class="score-scroll"><div class="engraved-page" data-score-page="${i+1}"><img class="full-score-page" src="/scores/${esc(file)}" alt="${esc(song.title||title)}, page ${i+1} of ${song.notationFiles.length}"><svg class="score-overlay" viewBox="${esc(song.scoreViewBoxes?.[i]||'0 0 119.5016 169.0094')}" aria-hidden="true"></svg></div></div>`).join('');
  return `<div class="performance-controls"><label>Passage<select id="song-passage">${passages(song.exercise).map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.label)}</option>`).join('')}</select></label><label>Play<select id="song-hands"><option value="both">Both hands</option><option value="right">Right hand</option><option value="left">Left hand</option></select></label><label class="loop-control"><input type="checkbox" id="song-loop"> Repeat passage</label></div>
  <div class="section-top"><h2>${esc(title)}</h2><div class="melody-controls">${soundControl(preset)}<label for="melody-tempo">${unit}</label><input id="melody-tempo" type="number" min="30" max="180" value="${tempo}"><button class="button outline small" data-action="melody">▷ Listen</button></div></div>
  <p class="fine">${esc(exercise.description||'Playback uses a steady tempo.')}</p><p id="playback-position" class="playback-position" aria-live="off">Ready</p>
  ${lyricsPanel(song.lyrics,verse)}
  ${view==='notes'?`<div class="player-keyboards">${['right','left'].map(hand=>keyboardView(exercise,hand)).join('')}</div><p class="fine">Fingers: 1 thumb · 2 index · 3 middle · 4 ring · 5 little finger. ${esc(exercise.fingeringNote||'Finger numbers are suggestions.')}</p>`:''}
  ${view==='notation'?`<p class="fine">The dots follow the notes being played, above the staff lines.</p><label class="score-follow"><input id="follow-score" type="checkbox" checked> Follow playback down the score</label><p>${downloads}</p>${scorePages}`:''}`;
}
