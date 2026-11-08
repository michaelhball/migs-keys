import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { musicPlayer, measures, notation } from '../public/music.js';

test('available lesson exercises have complete bars, matching hand keyboards, and notation', async () => {
  const course = JSON.parse(await readFile(new URL('../content/course.json', import.meta.url), 'utf8'));
  for (const lesson of course.lessons.filter(x => x.file)) {
    for (const bar of measures(lesson.exercise)) assert.equal(bar.reduce((sum, x) => sum + x.event.beats, 0), 4);
    const html = musicPlayer(lesson.exercise, 60, 'notation');
    assert.match(html, /notation-display/);
    assert.doesNotMatch(html, /piano-display/);
    const piano=musicPlayer(lesson.exercise,60,'notes'); assert.match(piano,/piano-display/);
    if (lesson.id >= 5) { assert.match(piano, /data-hand="left"/); assert.match(piano, /data-hand="right"/); }
  }
});

test('treble and bass landmarks use the expected staff positions', () => {
  const svg = notation({ title: 'Landmarks', events: [{beats:1,right:[{midi:60}],left:[{midi:48}]},{beats:1,right:[{midi:62}],left:[{midi:50}]},{beats:2,right:[{midi:64}],left:[{midi:52}]}] });
  assert.match(svg, /cx="150" cy="115"/, 'middle C sits on the ledger line below treble staff');
  assert.match(svg, /cx="224" cy="110"/, 'D4 is below the bottom treble line');
  assert.match(svg, /cx="298" cy="105"/, 'E4 is the bottom treble line');
  assert.match(svg, /cx="150" cy="220"/, 'C3 is the second bass space');
  assert.match(svg, /cx="224" cy="215"/, 'D3 is the middle bass line');
});

test('score playhead is a dot; piano view avoids note-name grids and sheet music',async()=>{
  const {pianoNavigation,pianoPosition}=await import('../public/piano-view.js');
  const exercise={title:'Eighth notes',events:Array.from({length:8},()=>({beats:.5,right:[{midi:60,finger:1}]}))};
  assert.match(notation(exercise),/score-playhead/);assert.doesNotMatch(notation(exercise),/score-highlight/);
  const piano=musicPlayer(exercise,60,'notes');assert.match(piano,/hand-guide/);assert.doesNotMatch(piano,/music-measures|notation-display/);
  assert.match(pianoNavigation(exercise),/type="range"/);assert.match(pianoPosition(exercise,3),/Bar 1 · count 2 &/);
});

test('complete Für Elise uses 3/8, repeated passages, consistent fingering, and separate views',async()=>{
  const {performancePlayer,selectPassage}=await import('../public/performance.js');
  const exercise=JSON.parse(await readFile(new URL('../content/songs/fur-elise-performance.json',import.meta.url),'utf8'));
  const song={exercise,notationFiles:['fur-elise-page-1.svg','fur-elise-page-2.svg','fur-elise-page-3.svg']};
  assert.ok(Math.abs(exercise.events.reduce((sum,e)=>sum+e.beats,0)-375)<1e-8);
  assert.deepEqual(exercise.events.slice(0,9).map(e=>e.right[0]?.midi),[76,75,76,75,76,71,74,72,69]);
  const fingers=new Map();let attacks=0;
  for(const event of exercise.events)for(const hand of ['right','left']){
    assert.equal(new Set(event[hand].map(n=>n.finger)).size,event[hand].length,'one finger per simultaneous note');
    for(const note of event[hand]){
      assert.ok(note.finger>=1&&note.finger<=5);
      if(fingers.has(note.id))assert.equal(note.finger,fingers.get(note.id));
      fingers.set(note.id,note.finger);if(note.attack)attacks++;
    }
  }
  assert.equal(attacks,1041);assert.ok(selectPassage(exercise,'full').events.length>700);
  const opening=selectPassage(exercise);assert.equal(opening.events[0].bar,0);assert.equal(opening.events.at(-1).bar,8);
  const score=performancePlayer(song,opening,90,'notation');assert.equal((score.match(/class="full-score-page"/g)||[]).length,3);assert.doesNotMatch(score,/piano-display|notation-display/);
  const piano=performancePlayer(song,opening,90,'notes');assert.equal((piano.match(/class="piano-display"/g)||[]).length,2);assert.doesNotMatch(piano,/full-score-page|timeline-events/);
});


test('every Für Elise playback note has an in-page score position',async()=>{
  const score=JSON.parse(await readFile(new URL('../content/songs/fur-elise-score-map.json',import.meta.url),'utf8'));
  const exercise=JSON.parse(await readFile(new URL('../content/songs/fur-elise-performance.json',import.meta.url),'utf8'));
  for(const event of exercise.events)for(const hand of ['right','left'])for(const note of event[hand]){const point=score[note.scoreKey];assert.ok(point);assert.ok(point.page>=1&&point.page<=3);assert.ok(point.x>0&&point.x<119.5016);assert.ok(point.y>0&&point.y<169.0094);}
});
