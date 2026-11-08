import { PracticeRecorder } from './recording.js';
import { pianoNavigation, pianoPosition } from './piano-view.js';
import { SoundEngine } from './sound.js';
import { markdown, escapeHtml as esc } from './markdown.js';
import { MelodyPlayer } from './playback.js';
import { musicPlayer, handNotes, notation } from './music.js';
import { performancePlayer, selectPassage } from './performance.js';

const $ = selector => document.querySelector(selector);
let course, state, currentLesson, currentSong, currentExercise, recorder, routeVersion = 0;
const sound = new SoundEngine();
let metronome = null, beat = 0;
let melodyTempo = 60, tempoWrites = Promise.resolve();
let currentStep = 0, songPassage = 'opening', playingHand = 'both', repeatPassage = false;
const heldVoices = new Map();

let elapsed = 0, timerStarted = null, practiceTimer = null;
let draftTimeout, draftQueue = Promise.resolve(), sessionId, formLesson;
const main = $('#main');
const dialog = $('#journal-dialog');
const melodyPlayer = new MelodyPlayer({
  onNote(event, index, duration) {
    currentStep=index;
    if (currentExercise?.timeline) {
      const notes = ['right','left'].filter(hand=>playingHand==='both'||hand===playingHand).flatMap(hand=>handNotes(event,hand));
      for (const [id,voice] of heldVoices) if (!notes.some(n=>n.id===id)) { voice(); heldVoices.delete(id); }
      for (const note of notes) if (!heldVoices.has(note.id)) heldVoices.set(note.id, sustainedTone(note.midi));
      if ($('#playback-position')) $('#playback-position').textContent = `${event.bar===0?'Pickup':`Playthrough bar ${event.bar}`} · count ${Number((event.beat+1).toFixed(2))}`;
    } else silenceTones();
    document.querySelectorAll('.piano-key.sounding').forEach(key => { key.classList.remove('sounding'); key.querySelector('.key-finger').textContent = ''; });
    for (const hand of ['right', 'left']) for (const note of handNotes(event, hand)) {
      if (currentExercise?.timeline && playingHand!=='both' && playingHand!==hand) continue;
      if (!currentExercise?.timeline) tone(note.midi, duration * .85);
      const key = document.querySelector(`[data-hand="${hand}"] [data-note="${note.midi}"]`);
      if (key) { key.classList.add('sounding'); key.querySelector('.key-finger').textContent = note.finger || ''; }
    }
    updatePianoPosition();
    document.querySelectorAll('#lesson-player [data-sequence], #song-score [data-sequence]').forEach(x => x.classList.toggle('sounding', Number(x.dataset.sequence) === index));
  },
  onStop(finished) {
    silenceTones();
    if (finished) currentStep=0;
    document.querySelectorAll('[data-sequence].sounding, .piano-key.sounding').forEach(x => x.classList.remove('sounding'));
    document.querySelectorAll('.key-finger').forEach(x => x.textContent = '');
    if ($('[data-action="melody"]')) $('[data-action="melody"]').textContent = '▷ Listen';
    previewPiano();
    if (finished && repeatPassage && currentExercise?.timeline) { melodyPlayer.start(currentExercise.events,melodyTempo); if ($('[data-action="melody"]')) $('[data-action="melody"]').textContent='■ Stop'; }
  }
});

async function api(path, method = 'GET', body) {
  const response = await fetch(`/api/${path}`, { method, headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', 'X-Migs-Local': '1' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
function toast(message, error = false) {
  const el = $('#toast'); el.textContent = message; el.className = `visible${error ? ' error' : ''}`;
  clearTimeout(toast.timeout); toast.timeout = setTimeout(() => el.className = '', 5000);
}
function totalMinutes() { return state.sessions.reduce((sum, x) => sum + x.minutes, 0); }
function updateStats() { $('#practice-total').textContent = state.sessions.length ? `${totalMinutes()} minutes practised · ${state.sessions.length} session${state.sessions.length === 1 ? '' : 's'}` : 'No sessions logged'; }
function badge(text, kind = '') { return `<span class="badge ${kind}">${esc(text)}</span>`; }
function intro(kicker, title, description, action = '') { return `<div class="page-intro"><div><p class="eyebrow">${esc(kicker)}</p><h1>${esc(title)}</h1><p class="lede">${esc(description)}</p></div>${action}</div>`; }
function lessonName(id) { return course.lessons.find(x => x.id === id)?.title || `Lesson ${id}`; }
function date(value) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)); }

function keyboard() {
  const white = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  return `<div class="keyboard" role="group" aria-label="Playable octave starting at middle C">${white.map((note, i) => `<button class="white-key ${i < 3 ? 'focus-key' : ''}" data-note="${[60, 62, 64, 65, 67, 69, 71][i]}" aria-label="Play ${note}4"><span>${note}</span></button>`).join('')}${[[61, 1, 'C sharp'], [63, 2, 'D sharp'], [66, 4, 'F sharp'], [68, 5, 'G sharp'], [70, 6, 'A sharp']].map(([midi, pos, name]) => `<button class="black-key black-${pos}" data-note="${midi}" aria-label="Play ${name}4"></button>`).join('')}</div>`;
}
function toolsCard() {
  return `<section class="card tools-card"><h2>Timer and metronome</h2>
    <div class="tool-row"><div><span class="tool-label">Practice timer</span><strong id="timer-display">${timerText()}</strong></div><button class="button small outline" data-action="timer" id="timer-button">${timerStarted ? 'Pause' : 'Start'}</button></div>
    <div class="tool-row"><div><label class="tool-label" for="tempo">Metronome</label><div class="tempo-control"><input id="tempo" type="number" min="30" max="180" value="${state.settings?.tempo || 60}" aria-label="Metronome beats per minute"><span>bpm</span></div></div><button class="button small outline" data-action="metronome" id="metro-button">Start</button></div>
    <div class="beats" aria-hidden="true"><i></i><i></i><i></i><i></i></div><p class="fine">Choose a pace that gives you time to hear and prepare the next note.</p>
  </section>`;
}
function checkpoints(item) {
  const checked = state.checkpoints[item.id] || [];
  const done = state.completed.includes(item.id);
  return `<section class="card checkpoint-card"><h2>Check your progress</h2><p class="muted">Check each skill again in a later practice session.</p>
    <div class="checkpoint-list">${item.checkpoints.map((text, i) => `<label><input type="checkbox" data-checkpoint="${i}" ${checked.includes(i) ? 'checked' : ''}><span>${esc(text)}</span></label>`).join('')}</div>
    <button class="button ${done ? 'outline' : 'primary'} full" data-action="complete" data-id="${item.id}">${done ? 'Reopen this lesson' : 'Mark lesson complete'}</button>
    <p class="fine" id="completion-note">${done ? 'Lesson marked complete.' : 'Mark complete when you can repeat these tasks reliably.'}</p></section>`;
}
function lessonNavigation(item) {
  const previous = course.lessons.filter(x => x.id < item.id && x.file).at(-1);
  const next = course.lessons.find(x => x.id > item.id && x.file);
  return `<section class="card lesson-navigation"><h2>Lessons</h2>${previous ? `<a class="button outline full" href="#lesson/${previous.id}">← Lesson ${previous.id}</a>` : ''}${next ? `<a class="button primary full" href="#lesson/${next.id}">Next: Lesson ${next.id} →</a><p class="fine">You can continue in the same session.</p>` : '<p class="fine">You have reached the end of the available lessons. Review a piece or try a song while the next block is prepared.</p>'}</section>`;
}
function lessonPlayer(item) {
  const view = item.defaultView || 'notes';
  return `<section class="card melody-card">${item.id === 2 ? staffGuide() : ''}<div class="song-view-controls" role="group" aria-label="Music display">${[['notes','Piano view'],['notation','Sheet music']].map(([v,label]) => `<button class="button small outline ${view === v ? 'selected' : ''}" data-action="lesson-view" data-view="${v}" aria-pressed="${view === v}">${label}</button>`).join('')}</div><div id="lesson-player">${musicPlayer(item.exercise, melodyTempo, view, state.settings.soundPreset)}</div></section>`;
}
function staffGuide() {
  const exercise = { title: 'Middle C, D, and E on the treble staff', events: [{beats:1,right:[{midi:60,finger:1}]},{beats:1,right:[{midi:62,finger:2}]},{beats:2,right:[{midi:64,finger:3}]}] };
  return `<section class="staff-guide"><h2>Reading the treble staff</h2><p>Five lines show pitch. Count lines from the bottom. The clef at the left identifies this as the treble staff.</p>${notation(exercise)}<div class="staff-landmarks"><p><strong>C4 · middle C</strong><br>On the short extra line below the staff.</p><p><strong>D4</strong><br>In the space just below the bottom line.</p><p><strong>E4</strong><br>On the bottom line.</p></div><p class="fine">The numbers above the notes are right-hand fingers: thumb 1, index 2, middle 3. In the exercise below, read the note's vertical position.</p></section>`;
}
async function showLesson(id, today) {
  const version = routeVersion;
  const item = await api(`lessons/${id}`);
  if (version !== routeVersion) return;
  currentLesson = item;
  if (!item.markdown) {
    main.innerHTML = `${intro(`LESSON ${item.id} · PLANNED`, item.title, item.description)}<div class="planned-card card"><h2>Lesson not written yet</h2><p>This topic is planned. The exercises will be added based on your progress.</p><p>To work on this topic sooner, mention it at your next check-in.</p><a href="#today" class="button primary">Back to your current lesson →</a></div>`;
    return;
  }
  const isActive = state.activeLesson === item.id;
  currentExercise = item.exercise;
  main.innerHTML = `${intro(today ? new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase() : `LESSON ${item.id}`, item.title, item.description)}
    <section class="lesson-hero"><div class="hero-copy"><div class="hero-tags">${badge(`Lesson ${item.id} / ${course.lessons.length}`)}${badge('Foundations')}${badge('20 minutes')}</div><div class="hero-actions"><a class="button light" href="#lesson-steps" data-action="begin">Begin practice <span>↓</span></a><button class="text-button" data-action="log" data-id="${item.id}">Log a session ↗</button></div></div><div class="hero-visual"><span class="eyebrow">C, D, AND E</span>${keyboard()}<span class="keyboard-caption">Tap a key to hear a reference tone</span></div></section>
    <div class="lesson-layout"><div class="lesson-column">${lessonPlayer(item)}
    <article class="card lesson-body" id="lesson-steps">${markdown(item.markdown)}</article>
    </div>
    <aside class="lesson-aside">${toolsCard()}${checkpoints(item)}${lessonNavigation(item)}<section class="card checkin-card"><h2>Record your session</h2><p>Record what improved, where you hesitated, and what you want to practise next.</p><button class="button outline full" data-action="log" data-id="${item.id}">Write a practice note</button>${!isActive ? `<button class="text-button dark" data-action="set-active" data-id="${item.id}">Make this my current lesson</button>` : ''}</section></aside></div>`;
  updateTimer(); installPianoNavigation();
}
function showCourse() {
  currentLesson = null;
  main.innerHTML = `${intro('LESSON PLAN', 'Piano course', 'Lessons are added and adjusted based on your progress. Reading, rhythm, and ear training continue throughout.')}<div class="course-summary"><span><strong>${state.completed.length}</strong> lessons completed</span><span><strong>${course.lessons.filter(x => x.file).length}</strong> lesson available</span><span>Reading and improvisation throughout</span></div><div class="modules">${course.modules.map(mod => `<section class="course-module"><div class="module-heading"><span class="module-number">0${mod.id}</span><div><h2>${esc(mod.title)}</h2><p>${esc(mod.subtitle)}</p></div><span class="range">${String(mod.from).padStart(2, '0')}—${mod.to}</span></div><div class="lesson-list">${course.lessons.filter(x => x.id >= mod.from && x.id <= mod.to).map(x => `<a class="lesson-row ${x.id === state.activeLesson ? 'current' : ''}" href="#lesson/${x.id}"><span class="lesson-number">${state.completed.includes(x.id) ? '✓' : String(x.id).padStart(2, '0')}</span><div><strong>${esc(x.title)}</strong><small>${esc(x.focus)}</small></div>${badge(state.completed.includes(x.id) ? 'Completed' : x.id === state.activeLesson ? 'Current lesson' : x.file ? 'Ready' : 'Planned', x.file ? 'green' : 'subtle')}<span class="row-arrow">↗</span></a>`).join('')}</div></section>`).join('')}</div>`;
}
function checkinText(session) {
  return `Piano check-in · Lesson ${session.lessonId}: ${lessonName(session.lessonId)}\nDate: ${date(session.createdAt)} · ${session.minutes} minutes\nPractice felt: ${session.feeling}\nWhat went well: ${session.worked || 'Not noted'}\nWhat needs attention: ${session.sticky || 'Not noted'}\nWhat I want to explore next: ${session.next || 'Continue the course'}\nCheckpoints marked: ${(state.checkpoints[session.lessonId] || []).length}\nPlease use this to adjust my next piano assignment.`;
}
function showJournal() {
  currentLesson = null;
  main.innerHTML = `${intro('PRACTICE RECORD', 'Practice journal', 'Record your practice time, progress, and questions for the next lesson.', '<button class="button primary" data-action="log">+ Log a session</button>')}<div class="journal-stats"><div><strong>${state.sessions.length}</strong><span>practice sessions</span></div><div><strong>${totalMinutes()}</strong><span>minutes practised</span></div><div><strong>${state.completed.length}</strong><span>lessons completed</span></div></div>${state.sessions.length ? `<div class="journal-entries">${state.sessions.map(s => `<article class="card journal-entry"><div class="entry-heading"><div><span class="eyebrow">${esc(date(s.createdAt))} · ${s.minutes} MINUTES</span><h2>${esc(lessonName(s.lessonId))}</h2></div>${badge({ good: 'Good', mixed: 'Mixed', challenging: 'Difficult' }[s.feeling], 'subtle')}</div>${[['What went well', s.worked], ['What needs attention', s.sticky], ['Next time', s.next]].filter(([, v]) => v).map(([label, value]) => `<div class="journal-thought"><h3>${label}</h3><p>${esc(value)}</p></div>`).join('')}<button class="text-button dark" data-action="copy-checkin" data-id="${esc(s.id)}">Copy check-in for our conversation ↗</button></article>`).join('')}</div>` : `<section class="card empty-state"><h2>No sessions logged</h2><p>After practising, record what improved and what needs more work.</p><button class="button primary" data-action="log">Log your first session</button></section>`}`;
}
function showResources() {
  currentLesson = null;
  main.innerHTML = `${intro('SUPPLEMENTARY MATERIAL', 'Resources', 'Demonstrations, exercises, and reference material used in the course. Follow the links assigned in each lesson.')}<div class="resource-grid">${course.resources.map((r, i) => `<article class="card resource-card"><div class="resource-top">${badge(r.type, 'subtle')}</div><p class="eyebrow">${esc(r.role)}</p><h2>${esc(r.name)}</h2><p>${esc(r.description)}</p><a class="text-link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Visit resource ↗</a></article>`).join('')}</div>`;
}
async function showSongs(id) {
  currentLesson = null;
  const version = routeVersion;
  if (!id) {
    const library = await api('songs');
    if (version !== routeVersion) return;
    main.innerHTML = `${intro('SONG LIBRARY', 'Songs', 'Songs you want to learn, with note names, sheet music, and practice instructions.')}<p class="muted song-request-note">To add a song, tell me its title and artist in our conversation.</p><div class="song-list">${library.songs.map(song => `<a class="card song-card" href="#song/${esc(song.id)}"><div>${badge(song.status, 'subtle')}<h2>${esc(song.title)}</h2><p>${esc(song.artist)}</p><p class="muted">${esc(song.summary)}</p></div><span class="text-link">Open song →</span></a>`).join('')}</div>`;
    return;
  }
  const song = await api(`songs/${encodeURIComponent(id)}`);
  if (version !== routeVersion) return;
  currentSong = song; songPassage = 'opening'; currentExercise = song.exercise.timeline ? selectPassage(song.exercise) : song.exercise;
  main.innerHTML = `<a class="text-link" href="#songs">← All songs</a>${intro(song.artist, song.title, song.summary)}<section class="card song-material"><div class="section-top"><div><h2>${esc(song.materialTitle)}</h2><p class="muted">${esc(song.materialDescription)}</p></div></div><div class="song-view-controls" role="group" aria-label="Music display"><button class="button small outline" data-action="song-view" data-view="notes" aria-controls="song-score">Piano view</button><button class="button small outline" data-action="song-view" data-view="notation" aria-controls="song-score">Sheet music</button></div><div id="song-score"></div></section><article class="card lesson-body song-practice">${markdown(song.practice)}</article>`;
  renderSongView();
}
function renderSongView() {
  const view = state.settings.songView || 'notes';
  document.querySelectorAll('[data-action="song-view"]').forEach(button => { const selected = button.dataset.view === view; button.setAttribute('aria-pressed', String(selected)); button.classList.toggle('selected', selected); });
  $('#song-score').innerHTML = (currentSong.exercise.timeline ? performancePlayer(currentSong,currentExercise,melodyTempo,view,songPassage,state.settings.soundPreset) : musicPlayer(currentExercise, melodyTempo, view, state.settings.soundPreset));
  installPianoNavigation();
  if ($('#song-hands')) $('#song-hands').value = playingHand;
  if ($('#song-loop')) $('#song-loop').checked = repeatPassage;
}
function stopSounds() {
  clearInterval(metronome); metronome = null; beat = 0;
  melodyPlayer.stop();
  recorder?.stopReplay();
  document.querySelectorAll('.sounding, .beat-active').forEach(x => x.classList.remove('sounding', 'beat-active'));
  if ($('#metro-button')) $('#metro-button').textContent = 'Start';
  if ($('[data-action="melody"]')) $('[data-action="melody"]').textContent = '▷ Listen';
}
async function route() {
  routeVersion++; stopSounds(); currentSong = null; currentExercise = null; currentStep=0;
  const hash = location.hash.slice(1) || 'today';
  const section = hash.startsWith('song/') ? 'songs' : ['course', 'journal', 'songs', 'resources'].includes(hash) ? hash : 'today';
  document.querySelectorAll('[data-nav]').forEach(a => { a.classList.toggle('active', a.dataset.nav === section); if (a.dataset.nav === section) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#breadcrumb').textContent = { today: 'Your piano practice', course: 'Your course', journal: 'Practice journal', songs: 'Songs', resources: 'Resources' }[section];
  try {
    if (section === 'course') showCourse();
    else if (section === 'journal') showJournal();
    else if (section === 'songs') await showSongs(hash.startsWith('song/') ? hash.slice(5) : null);
    else if (section === 'resources') showResources();
    else await showLesson(/^lesson\/\d+$/.test(hash) ? Number(hash.split('/')[1]) : state.activeLesson, !hash.startsWith('lesson/'));
    window.scrollTo({ top: 0, behavior: 'instant' });
  } catch (error) { main.innerHTML = `<section class="card empty-state"><h1>Couldn’t open this page.</h1><p>${esc(error.message)}</p><a class="button primary" href="#today">Return to today’s practice</a></section>`; }
}

async function audioReady() { await sound.ready(state.settings.soundPreset || 'piano'); }
function tone(midi, duration=.7, quiet=false) { return sound.start(midi,{duration,quiet}); }
function sustainedTone(midi) { return sound.start(midi); }
function silenceTones() { heldVoices.clear(); sound.stopAll(); }
function installPianoNavigation() {
  const keyboards=document.querySelector('.player-keyboards');
  if (!keyboards || !currentExercise) return;
  keyboards.insertAdjacentHTML('beforebegin',pianoNavigation(currentExercise,currentStep));
  previewPiano();
}
function updatePianoPosition() {
  if (!currentExercise) return;
  const event=currentExercise.events[currentStep]; if (!event) return;
  if ($('#piano-position')) $('#piano-position').value=currentStep;
  if ($('#piano-step-label')) $('#piano-step-label').textContent=pianoPosition(currentExercise,currentStep);
  if ($('#piano-bar')) $('#piano-bar').value=event.bar;
  document.querySelectorAll('[data-action="piano-step"]').forEach(button=>button.disabled=Number(button.dataset.delta)<0?currentStep===0:currentStep===currentExercise.events.length-1);
}
function previewPiano() {
  updatePianoPosition();
  if (!document.querySelector('.player-keyboards') || !currentExercise?.events[currentStep]) return;
  const event=currentExercise.events[currentStep];
  document.querySelectorAll('.piano-key').forEach(key=>{key.classList.remove('sounding');key.querySelector('.key-finger').textContent='';});
  for (const hand of ['right','left']) for (const note of handNotes(event,hand)) {
    const key=document.querySelector(`[data-hand="${hand}"] [data-note="${note.midi}"]`);
    if (key) {key.classList.add('sounding');key.querySelector('.key-finger').textContent=note.finger||'';}
  }
}
document.addEventListener('input',event=>{if(event.target.id==='piano-position'){const next=Number(event.target.value);stopSounds();currentStep=next;previewPiano();}});
function flashKey(midi) {
  const key = document.querySelector(`[data-note="${midi}"]`); if (!key) return;
  key.classList.add('sounding'); setTimeout(() => key.classList.remove('sounding'), 350);
}
async function playMelody() {
  if (melodyPlayer.playing) { stopSounds(); return; }
  const version = routeVersion;
  await audioReady(); stopSounds();
  if (version !== routeVersion) return;
  if (!currentExercise) return;
  melodyPlayer.start(currentExercise.events, melodyTempo, currentStep);
  const button = $('[data-action="melody"]'); button.textContent = '■ Stop';
}
function changeMelodyTempo(input) {
  const tempo = Math.min(180, Math.max(30, Math.round(Number(input.value) || 60)));
  input.value = tempo;
  melodyTempo = tempo;
  melodyPlayer.setTempo(tempo);
  state.settings.melodyTempo = tempo;
  tempoWrites = tempoWrites.catch(() => {}).then(() => api('settings', 'PUT', { melodyTempo: tempo }));
  return tempoWrites;
}
async function toggleMetronome() {
  if (metronome) { stopSounds(); return; }
  await audioReady(); stopSounds();
  const tempo = Math.min(180, Math.max(30, Number($('#tempo').value) || 60)); $('#tempo').value = tempo;
  state = await api('settings', 'PUT', { tempo });
  const tick = () => { tone(beat === 0 ? 86 : 79, .07, true); document.querySelectorAll('.beats i').forEach((x, i) => x.classList.toggle('beat-active', i === beat)); beat = (beat + 1) % 4; };
  tick(); metronome = setInterval(tick, 60000 / tempo); $('#metro-button').textContent = 'Stop';
}
function seconds() { return elapsed + (timerStarted ? (Date.now() - timerStarted) / 1000 : 0); }
function timerText() { const n = Math.floor(seconds()); return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; }
function updateTimer() { if ($('#timer-display')) $('#timer-display').textContent = timerText(); }
async function toggleTimer() {
  const next = timerStarted ? { elapsed: seconds(), startedAt: null } : { elapsed, startedAt: Date.now() };
  state = await api('settings', 'PUT', { timer: next });
  elapsed = next.elapsed; timerStarted = next.startedAt; clearInterval(practiceTimer);
  if (timerStarted) practiceTimer = setInterval(updateTimer, 1000);
  if ($('#timer-button')) $('#timer-button').textContent = timerStarted ? 'Pause' : 'Start'; updateTimer();
}
function formData() {
  const form = $('#session-form'); if (!form) return null;
  return Object.fromEntries(new FormData(form));
}
async function queueDraft() {
  clearTimeout(draftTimeout);
  const data = formData(); if (!data) return;
  const id = formLesson;
  $('#draft-status').textContent = 'Saving draft…';
  const job = draftQueue.catch(() => {}).then(() => api(`drafts/${id}`, 'PUT', data));
  draftQueue = job;
  try { const result = await job; state = result; if ($('#draft-status')) $('#draft-status').textContent = 'Draft saved on this computer'; }
  catch (error) { if ($('#draft-status')) $('#draft-status').textContent = 'Draft not saved. Keep this window open and try again.'; throw error; }
}
function openLog(id) {
  formLesson = Number(id || state.activeLesson); sessionId = crypto.randomUUID();
  const draft = state.drafts[formLesson] || { minutes: Math.floor(seconds() / 60) || 20, feeling: 'mixed', worked: '', sticky: '', next: '' };
  dialog.innerHTML = `<form id="session-form"><div class="dialog-heading"><div><p class="eyebrow">LESSON ${formLesson} · PRACTICE NOTE</p><h2 id="dialog-title">Practice session</h2></div><button type="button" class="icon-button" data-action="close-dialog" aria-label="Close practice note">×</button></div><p class="muted">Record your progress and any difficulties to review at the next check-in.</p><div class="form-pair"><label>Minutes at the keyboard<input type="number" name="minutes" min="0" max="600" required value="${Number(draft.minutes)}"></label><label>Practice felt<select name="feeling">${[['good', 'Good'], ['mixed', 'Mixed'], ['challenging', 'Difficult']].map(([v, t]) => `<option value="${v}" ${draft.feeling === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div><label>What went well?<textarea name="worked" maxlength="4000" rows="3" placeholder="Finding C felt easier today…">${esc(draft.worked)}</textarea></label><label>What needs attention?<textarea name="sticky" maxlength="4000" rows="3" placeholder="I pause between the two groups…">${esc(draft.sticky)}</textarea></label><label>What would you like to try next?<textarea name="next" maxlength="4000" rows="2" placeholder="For example: repeat the melody or start reading notes.">${esc(draft.next)}</textarea></label><div class="dialog-bottom"><span class="fine" id="draft-status">${state.drafts[formLesson] ? 'Draft restored from your files' : 'Your notes stay on this computer'}</span><button class="button primary" type="submit">Save session →</button></div></form>`;
  dialog.showModal();
  $('#session-form').addEventListener('input', () => { clearTimeout(draftTimeout); $('#draft-status').textContent = 'Unsaved changes…'; draftTimeout = setTimeout(() => queueDraft().catch(error => toast(error.message, true)), 700); });
  $('#session-form').addEventListener('submit', saveSession);
}
async function closeDialog() {
  if ($('#session-form')) await queueDraft();
  dialog.close();
}
async function saveSession(event) {
  event.preventDefault(); clearTimeout(draftTimeout);
  const form = event.target, button = form.querySelector('[type="submit"]'); button.disabled = true; button.textContent = 'Saving…';
  const data = formData();
  try {
    await draftQueue.catch(() => {});
    state = await api('sessions', 'POST', { ...data, lessonId: formLesson, id: sessionId });
    elapsed = 0; timerStarted = null; clearInterval(practiceTimer); updateTimer();
    if ($('#timer-button')) $('#timer-button').textContent = 'Start';
    dialog.close(); updateStats(); toast('Session saved to your practice journal.');
    if (location.hash === '#journal') showJournal();
    try { state = await api('settings', 'PUT', { timer: { elapsed: 0, startedAt: null } }); }
    catch { toast('Session saved. The timer could not be reset on disk; try pausing it.', true); }
  } catch (error) { toast(error.message, true); button.disabled = false; button.textContent = 'Save session →'; }
}
async function copyCheckin(id) {
  const text = checkinText(state.sessions.find(x => x.id === id));
  try { await navigator.clipboard.writeText(text); toast('Check-in copied. Paste it into our conversation.'); }
  catch {
    dialog.innerHTML = `<div class="dialog-heading"><h2 id="dialog-title">Your check-in</h2><button class="icon-button" data-action="close-dialog" aria-label="Close">×</button></div><p>Select and copy this text into our conversation.</p><textarea readonly rows="12">${esc(text)}</textarea>`; dialog.showModal(); dialog.querySelector('textarea').select();
  }
}

document.addEventListener('click', async event => {
  const key = event.target.closest('[data-note]');
  if (key) { try { await audioReady(); tone(Number(key.dataset.note)); flashKey(Number(key.dataset.note)); } catch { toast('Audio is unavailable in this browser.', true); } return; }
  const button = event.target.closest('[data-action]'); if (!button) return;
  const action = button.dataset.action;
  try {
    if (action === 'begin') { event.preventDefault(); $('#lesson-steps').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else if (action === 'log') openLog(button.dataset.id);
    else if (action === 'close-dialog') await closeDialog();
    else if (action === 'copy-checkin') await copyCheckin(button.dataset.id);
    else if (action === 'score-page') { stopSounds(); scorePage=Number(button.dataset.page); $('#timeline-notes').innerHTML=timelineNotes(currentExercise); }
    else if (action === 'piano-step') { stopSounds(); currentStep=Math.max(0,Math.min(currentExercise.events.length-1,currentStep+Number(button.dataset.delta))); previewPiano(); }
    else if (action === 'lesson-view') {
      stopSounds();
      $('#lesson-player').innerHTML = musicPlayer(currentExercise, melodyTempo, button.dataset.view, state.settings.soundPreset); installPianoNavigation();
      document.querySelectorAll('[data-action="lesson-view"]').forEach(x => { x.setAttribute('aria-pressed', String(x === button)); x.classList.toggle('selected', x === button); });
    }
    else if (action === 'song-view') {
      stopSounds();
      document.querySelectorAll('[data-action="song-view"]').forEach(x => x.disabled = true);
      const version = routeVersion;
      try {
        const result = await api('settings', 'PUT', { songView: button.dataset.view });
        state.settings.songView = result.settings.songView;
        if (version === routeVersion && currentSong) renderSongView();
      } finally {
        if (version === routeVersion) document.querySelectorAll('[data-action="song-view"]').forEach(x => x.disabled = false);
      }
    }
    else if (action === 'melody') { button.disabled = true; await playMelody(); button.disabled = false; }
    else if (action === 'metronome') await toggleMetronome();
    else if (action === 'timer') { button.disabled = true; await toggleTimer(); button.disabled = false; }
    else if (action === 'complete') {
      button.disabled = true; const id = Number(button.dataset.id); const completed = !state.completed.includes(id);
      state = await api(`completion/${id}`, 'PUT', { completed });
      button.textContent = completed ? 'Reopen this lesson' : 'Mark lesson complete'; button.classList.toggle('primary', !completed); button.classList.toggle('outline', completed);
      $('#completion-note').textContent = completed ? 'Lesson marked complete.' : 'Mark complete when you can repeat these tasks reliably.';
      updateStats(); button.disabled = false;
      if (completed) {
        const next = course.lessons.find(x => x.id > id && x.file && !state.completed.includes(x.id));
        if (next) { toast(`Lesson ${id} complete. Opening Lesson ${next.id}.`); location.hash = `#lesson/${next.id}`; }
        else { toast('Lesson complete. You have finished the available lesson block.'); await route(); }
      } else toast('Lesson reopened.');
    } else if (action === 'set-active') { state = await api('active', 'PUT', { lessonId: Number(button.dataset.id) }); location.hash = '#today'; }
  } catch (error) { button.disabled = false; toast(error.message, true); }
});
document.addEventListener('change', async event => {
  if (event.target.id==='piano-bar') { stopSounds(); currentStep=currentExercise.events.findIndex(e=>e.bar===Number(event.target.value)); previewPiano(); }
  if (event.target.id === 'sound-preset') {
    const select=event.target, previous=state.settings.soundPreset || 'piano';
    stopSounds(); select.disabled=true;
    try { await sound.ready(select.value); const result=await api('settings','PUT',{soundPreset:select.value}); state.settings.soundPreset=result.settings.soundPreset; }
    catch(error) { select.value=previous; toast(error.message,true); }
    finally { select.disabled=false; }
  }

  if (event.target.id === 'song-passage') { stopSounds(); songPassage=event.target.value; currentStep=0; currentExercise=selectPassage(currentSong.exercise,songPassage); renderSongView(); }
  if (event.target.id === 'song-hands') { stopSounds(); playingHand=event.target.value; }
  if (event.target.id === 'song-loop') repeatPassage=event.target.checked;
  if (event.target.id === 'melody-tempo') {
    try { await changeMelodyTempo(event.target); }
    catch { toast('Tempo changed, but it could not be saved. Change it again to retry.', true); }
  }
  if (event.target.matches('[data-checkpoint]')) {
    const checked = [...document.querySelectorAll('[data-checkpoint]:checked')].map(x => Number(x.dataset.checkpoint));
    const checkbox = event.target; checkbox.disabled = true;
    try { state = await api(`checkpoints/${currentLesson.id}`, 'PUT', { checked }); }
    catch (error) { checkbox.checked = !checkbox.checked; toast(error.message, true); }
    finally { checkbox.disabled = false; }
  }
  if (event.target.id === 'tempo') {
    try {
      const tempo = Math.min(180, Math.max(30, Math.round(Number(event.target.value) || 60))); event.target.value = tempo;
      if (metronome) { stopSounds(); await toggleMetronome(); }
      else state = await api('settings', 'PUT', { tempo });
    } catch (error) { toast(error.message, true); }
  }
});
dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog().catch(error => toast(error.message, true)); });
document.addEventListener('keydown', event => { if (event.target.matches('.piano-key') && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
window.addEventListener('hashchange', () => { if (course && state) route(); });
window.addEventListener('pagehide', () => {
  stopSounds(); clearTimeout(draftTimeout);
  const draft = formData();
  if (dialog.open && draft) fetch(`/api/drafts/${formLesson}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Migs-Local': '1' }, body: JSON.stringify(draft), keepalive: true }).catch(() => {});
});
async function init() {
  try {
    [course, state] = await Promise.all([api('course'), api('state')]);
    melodyTempo = state.settings?.melodyTempo || 60;
    elapsed = state.settings?.timer?.elapsed || 0; timerStarted = state.settings?.timer?.startedAt || null;
    clearInterval(practiceTimer); if (timerStarted) practiceTimer = setInterval(updateTimer, 1000);
    updateStats(); await route();
    if (!recorder) {
      const panel=document.createElement('section');panel.id='practice-recordings';main.after(panel);
      recorder=new PracticeRecorder(panel,{sound,prepareSound:audioReady,stopPlayback:stopSounds,context:()=>currentSong?.title||(currentLesson?`Lesson ${currentLesson.id}: ${currentLesson.title}`:'Practice'),notify:toast});
    }
  }
  catch (error) { main.innerHTML = `<section class="card empty-state"><h1>Cannot connect to the server</h1><p>${esc(error.message)}</p><p>Start the local server, then reload this page.</p><button class="button primary" id="reload">Try again</button></section>`; $('#reload').addEventListener('click', init); }
}
init();
