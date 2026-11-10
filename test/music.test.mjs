import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { musicPlayer, measures, notation } from '../public/music.js';

test('song defaults use their own reference tempo and convert the counted note value',async()=>{
  const {referenceTempo,songTempo,performancePlayer}=await import('../public/performance.js');
  const song={id:'example',tempo:{bpm:72,unit:4,label:'Score tempo'},exercise:{timeline:true,meter:[3,8],events:[{bar:1,beat:0,beats:3,right:[],left:[]}]}};
  assert.equal(referenceTempo(song),144,'quarter=72 equals eighth=144');
  assert.equal(songTempo(song,{melodyTempo:30}),144,'legacy shared tempo is not a song default');
  assert.equal(songTempo(song,{songTempos:{example:90,other:100}}),90);
  assert.equal(songTempo({...song,id:'other-song'},{songTempos:{example:90}}),144);
  const html=performancePlayer(song,song.exercise,144,'notes');
  assert.match(html,/Reset tempo/);assert.match(html,/144 eighth notes/);
  const library=JSON.parse(await readFile(new URL('../content/songs.json',import.meta.url),'utf8'));
  for (const song of library.songs) {
    assert.ok(song.tempo?.bpm>0);assert.ok([4,8].includes(song.tempo.unit));
    if (song.exerciseFile) {
      song.exercise=JSON.parse(await readFile(new URL('../content/songs/'+song.exerciseFile,import.meta.url),'utf8'));
      assert.ok(referenceTempo(song)>=30&&referenceTempo(song)<=180);
    }
  }
});

test('available lesson exercises have complete bars, matching hand keyboards, and notation', async () => {
  const course = JSON.parse(await readFile(new URL('../content/course.json', import.meta.url), 'utf8'));
  for (const lesson of course.lessons.filter(x => x.file)) {
    for (const bar of measures(lesson.exercise)) assert.equal(bar.reduce((sum, x) => sum + x.event.beats, 0), 4);
    const html = musicPlayer(lesson.exercise, 60, 'notation');
    assert.match(html, /notation-display/);
    assert.doesNotMatch(html, /piano-display/);
    const piano=musicPlayer(lesson.exercise,60,'notes'); assert.match(piano,/piano-display/);
    if ([5,6,9,10].includes(lesson.id)) { assert.match(piano, /data-hand="left"/); assert.match(piano, /data-hand="right"/); }
  }
});

test('treble and bass landmarks use the expected staff positions', () => {
  const svg = notation({ title: 'Landmarks', events: [{beats:1,right:[{midi:60}],left:[{midi:48}]},{beats:1,right:[{midi:62}],left:[{midi:50}]},{beats:2,right:[{midi:64}],left:[{midi:52}]}] });
  assert.match(svg, /cx="150" cy="115"/, 'middle C sits on the ledger line below treble staff');
  assert.match(svg, /cx="304" cy="110"/, 'D4 is below the bottom treble line');
  assert.match(svg, /cx="458" cy="105"/, 'E4 is the bottom treble line');
  assert.match(svg, /cx="150" cy="220"/, 'C3 is the second bass space');
  assert.match(svg, /cx="304" cy="215"/, 'D3 is the middle bass line');
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

test('Journey accompaniment has full 4/4 form, tied bass, score positions and selectable sections',async()=>{
  const {passages,selectPassage,performancePlayer}=await import('../public/performance.js');
  const exercise=JSON.parse(await readFile(new URL('../content/songs/dont-stop-believin-performance.json',import.meta.url),'utf8'));
  const score=JSON.parse(await readFile(new URL('../content/songs/dont-stop-believin-score-map.json',import.meta.url),'utf8'));
  const song=JSON.parse(await readFile(new URL('../content/songs.json',import.meta.url),'utf8')).songs[0];song.exercise=exercise;
  assert.equal(exercise.events.reduce((sum,e)=>sum+e.beats,0),116*4);
  assert.deepEqual(exercise.meter,[4,4]);
  const bars=new Map();const fingers=new Map();
  for(const e of exercise.events){
    bars.set(e.bar,(bars.get(e.bar)||0)+e.beats);
    for(const hand of ['right','left']){
      assert.equal(new Set(e[hand].map(n=>n.finger)).size,e[hand].length);
      for(const n of e[hand]){assert.ok(score[n.scoreKey]);assert.ok(n.finger>=1&&n.finger<=5);if(fingers.has(n.id))assert.equal(n.finger,fingers.get(n.id));fingers.set(n.id,n.finger);}
    }
  }
  assert.equal(bars.size,116);for(const beats of bars.values())assert.equal(beats,4);
  const before=exercise.events.find(e=>e.bar===1&&e.beat===3.5).left[0];
  const after=exercise.events.find(e=>e.bar===2&&e.beat===0).left[0];
  assert.equal(before.midi,47);assert.equal(before.id,after.id);assert.equal(after.attack,false);assert.notEqual(before.scoreKey,after.scoreKey,'marker advances across a tied bar line');
  assert.equal(selectPassage(exercise,'opening').events.at(-1).bar,8);
  assert.equal(selectPassage(exercise,'41').events[0].bar,41);
  assert.equal(passages(exercise).find(p=>p.id==='109').to,116);
  const html=performancePlayer(song,selectPassage(exercise),60,'notation');
  assert.match(html,/Quarter notes \/ minute/);assert.doesNotMatch(html,/Für Elise|piano-display/);
});


test('bass clef dots straddle F3, the fourth line, independently of fonts', () => {
  const svg = notation({title:'Bass clef',events:[{beats:4,left:[{midi:53}]}]});
  assert.match(svg, /class="bass-clef" data-anchor-y="75"/);
  assert.match(svg, /M557 -125/, 'LilyPond bass dots are symmetric around its F-line origin');
  assert.match(svg, /cx="150" cy="75"/, 'F3 is on the line halfway between the dots');
});


test('score fingering can be hidden without removing piano-view guidance', () => {
  const exercise={title:'Reading', events:[{beats:4,right:[{midi:60,finger:1}]}]};
  assert.match(notation(exercise,true), /class="score-fingering"/);
  assert.doesNotMatch(notation(exercise,false), /class="score-fingering"/);
  assert.match(musicPlayer(exercise,60,'notes','piano',false), /key-finger/);
});


test('hymns have complete tunes, valid fingerings and a score location for every note', async () => {
  const {selectPassage}=await import('../public/performance.js');
  for(const [slug,beats] of [['amazing-grace',3],['lord-of-the-dance',4]]) {
    const piece=JSON.parse(await readFile(new URL(`../content/songs/${slug}-performance.json`,import.meta.url),'utf8'));
    const map=JSON.parse(await readFile(new URL(`../content/songs/${slug}-score-map.json`,import.meta.url),'utf8'));
    assert.deepEqual(piece.meter,[beats,4]);
    assert.equal(piece.events.reduce((sum,e)=>sum+e.beats,0),16*beats);
    const barTotals=new Map(), fingers=new Map();
    for(const event of piece.events) {
      barTotals.set(event.bar,(barTotals.get(event.bar)||0)+event.beats);
      for(const hand of ['right','left']) for(const note of event[hand]) {
        assert.ok(map[note.scoreKey]); assert.ok(note.finger>=1&&note.finger<=5);
        if(fingers.has(note.id)) assert.equal(note.finger,fingers.get(note.id));
        fingers.set(note.id,note.finger);
      }
    }
    assert.equal(barTotals.get(0),1); assert.equal(barTotals.get(16),beats-1);
    for(let bar=1;bar<16;bar++) assert.equal(barTotals.get(bar),beats);
    assert.equal(selectPassage(piece,'full').events.at(-1).bar,slug==='amazing-grace'?96:16);
  }
});

test('dotted rhythms and chords render their durations without duplicate stems', () => {
  const svg=notation({title:'Dotted rhythm',events:[{beats:1.5,right:[{midi:64}]},{beats:.5,right:[{midi:62}]},{beats:2,right:[{midi:60,midiLabel:'C'},{midi:64},{midi:67}]}]},false);
  assert.equal((svg.match(/class="augmentation-dot"/g)||[]).length,1);
  assert.equal((svg.match(/class="note-stem"/g)||[]).length,4, 'three stems plus one eighth-note flag');
  assert.doesNotMatch(svg,/𝄞|𝄢|𝄽/, 'font-dependent clefs and rests must not return');
});


test('hymn lyric phrases follow absolute score positions when stepping or changing passages', async () => {
  const {lyricIndexAt,lyricsPanel}=await import('../public/performance.js');
  const lyrics=JSON.parse(await readFile(new URL('../content/songs/amazing-grace-lyrics.json',import.meta.url),'utf8'));
  assert.equal(lyricIndexAt(lyrics,{bar:0,beat:2},3),0);
  assert.equal(lyricIndexAt(lyrics,{bar:4,beat:1.5},3),0);
  assert.equal(lyricIndexAt(lyrics,{bar:4,beat:2},3),1);
  assert.equal(lyricIndexAt(lyrics,{bar:12,beat:2},3),3);
  assert.match(lyricsPanel(lyrics,5),/earth shall soon/);
  assert.equal(lyricsPanel(null),'');
});

test('Amazing Grace full playback joins six verses and resets words and score positions', async () => {
  const {selectPassage,lyricIndexAt,performancePlayer}=await import('../public/performance.js');
  const read=async name=>JSON.parse(await readFile(new URL('../content/songs/amazing-grace-'+name+'.json',import.meta.url),'utf8'));
  const piece=await read('performance'),lyrics=await read('lyrics');
  const full=selectPassage(piece,'full'),single=selectPassage(piece,'tune');
  assert.equal(full.events.reduce((n,e)=>n+e.beats,0),288);
  assert.equal(single.events.reduce((n,e)=>n+e.beats,0),48);
  assert.equal(single.automaticVerses,undefined);
  const ids=new Set();
  for(let verse=0;verse<6;verse++) {
    const events=full.events.filter(e=>e.verse===verse);
    assert.equal(events.length,single.events.length);
    assert.equal(events[0].bar,16*verse); assert.equal(events[0].beat,2);
    assert.equal(lyricIndexAt(lyrics,events[0],3),0);
    for(let i=0;i<events.length;i++) for(const hand of ['right','left']) {
      assert.deepEqual(events[i][hand].map(n=>[n.midi,n.length,n.scoreKey,n.attack]),single.events[i][hand].map(n=>[n.midi,n.length,n.scoreKey,n.attack]));
      for(const n of events[i][hand].filter(n=>n.attack)) {assert.ok(!ids.has(n.id)); ids.add(n.id);}
    }
  }
  assert.match(performancePlayer({exercise:piece,lyrics},full,60,'notes','full'),/follows playback/);
  assert.match(performancePlayer({exercise:piece,lyrics},single,60,'notes','tune','piano',2),/Through many dangers/);
});

test('song fingering is opt-in and removing it preserves score geometry and lyrics', async () => {
  execFileSync('uv',['run','--locked','python',fileURLToPath(new URL('./score-assets.py',import.meta.url))]);
  const {performancePlayer}=await import('../public/performance.js');
  const library=JSON.parse(await readFile(new URL('../content/songs.json',import.meta.url),'utf8'));
  for (const song of library.songs.filter(s=>s.fingeredNotationFiles)) {
    const exercise=JSON.parse(await readFile(new URL('../content/songs/'+song.exerciseFile,import.meta.url),'utf8'));
    const model={...song,exercise};
    assert.match(performancePlayer(model,exercise,60,'notation'),/Show fingering/);
    assert.doesNotMatch(performancePlayer(model,exercise,60,'notation'),/src="[^"]*fingering-page/);
    assert.match(performancePlayer(model,exercise,60,'notation','full','piano',0,true),/src="[^"]*fingering-page/);
    assert.match(performancePlayer(model,exercise,60,'notes'),/key-finger/);
    for(let i=0;i<song.notationFiles.length;i++) {
      const plain=await readFile(new URL('../content/songs/'+song.notationFiles[i],import.meta.url),'utf8');
      const fingered=await readFile(new URL('../content/songs/'+song.fingeredNotationFiles[i],import.meta.url),'utf8');
      assert.doesNotMatch(plain,/class="score-fingering"/); assert.match(fingered,/class="score-fingering"/);
      assert.equal(plain.match(/viewBox="[^"]+"/)[0],fingered.match(/viewBox="[^"]+"/)[0]);
      if(i===0) assert.match(plain,song.id==='amazing-grace'?/>grace!</:/>gift</);
    }
  }
});

test('Simple Gifts section B starts at its sung pickup within bar 8', async () => {
  const {selectPassage,lyricIndexAt}=await import('../public/performance.js');
  const read=async name=>JSON.parse(await readFile(new URL('../content/songs/lord-of-the-dance-'+name+'.json',import.meta.url),'utf8'));
  const piece=await read('performance'),lyrics=await read('lyrics');
  const a=selectPassage(piece,'a'),b=selectPassage(piece,'b');
  assert.equal(b.events[0].bar,8); assert.equal(b.events[0].beat,1);
  assert.equal(a.events.reduce((sum,e)=>sum+e.beats,0)+b.events.reduce((sum,e)=>sum+e.beats,0),64);
  assert.equal(lyricIndexAt(lyrics,{bar:6,beat:1.5},4),3);
  assert.equal(lyricIndexAt(lyrics,b.events[0],4),4);
});
