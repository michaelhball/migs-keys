import { markdown, escapeHtml as esc } from './markdown.js';

const $ = selector => document.querySelector(selector);
let course, state, currentLesson, routeVersion = 0;
let audio, metronome = null, beat = 0, melodyTimers = [];
let elapsed = 0, timerStarted = null, practiceTimer = null;
let draftTimeout, draftQueue = Promise.resolve(), sessionId, formLesson;
const main = $('#main');
const dialog = $('#journal-dialog');

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
  main.innerHTML = `${intro(today ? new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase() : `LESSON ${item.id}`, item.title, item.description)}
    <section class="lesson-hero"><div class="hero-copy"><div class="hero-tags">${badge(`Lesson ${item.id} / ${course.lessons.length}`)}${badge('Foundations')}${badge('20 minutes')}</div><div class="hero-actions"><a class="button light" href="#lesson-steps" data-action="begin">Begin practice <span>↓</span></a><button class="text-button" data-action="log" data-id="${item.id}">Log a session ↗</button></div></div><div class="hero-visual"><span class="eyebrow">C, D, AND E</span>${keyboard()}<span class="keyboard-caption">Tap a key to hear a reference tone</span></div></section>
    <div class="lesson-layout"><div class="lesson-column"><section class="card melody-card"><div class="section-top"><div><h2>Eight-note melody</h2></div><button class="button outline small" data-action="melody">▷ Listen</button></div><div class="note-sequence" aria-label="C D E D, E D C C, one note per beat">${['C', 'D', 'E', 'D', 'E', 'D', 'C', 'C'].map((n, i) => `<div class="note-cell ${i === 4 ? 'measure-start' : ''}" data-sequence="${i}"><small>${i % 4 + 1}</small><strong>${n}</strong><span>${{ C: 1, D: 2, E: 3 }[n]}</span></div>`).join('')}</div><div class="sequence-legend"><span>Count · note · right-hand finger</span><span>One note per beat</span></div></section>
    <article class="card lesson-body" id="lesson-steps">${markdown(item.markdown)}</article>
    </div>
    <aside class="lesson-aside">${toolsCard()}${checkpoints(item)}<section class="card checkin-card"><h2>Record your session</h2><p>Record what improved, where you hesitated, and what you want to practise next.</p><button class="button outline full" data-action="log" data-id="${item.id}">Write a practice note</button>${!isActive ? `<button class="text-button dark" data-action="set-active" data-id="${item.id}">Make this my current lesson</button>` : ''}</section></aside></div>`;
  updateTimer();
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
function stopSounds() {
  clearInterval(metronome); metronome = null; beat = 0;
  melodyTimers.forEach(clearTimeout); melodyTimers = [];
  document.querySelectorAll('.sounding, .beat-active').forEach(x => x.classList.remove('sounding', 'beat-active'));
  if ($('#metro-button')) $('#metro-button').textContent = 'Start';
  if ($('[data-action="melody"]')) $('[data-action="melody"]').textContent = '▷ Listen';
}
async function route() {
  routeVersion++; stopSounds();
  const hash = location.hash.slice(1) || 'today';
  const section = ['course', 'journal', 'resources'].includes(hash) ? hash : 'today';
  document.querySelectorAll('[data-nav]').forEach(a => { a.classList.toggle('active', a.dataset.nav === section); if (a.dataset.nav === section) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#breadcrumb').textContent = { today: 'Your piano practice', course: 'Your course', journal: 'Practice journal', resources: 'Resources' }[section];
  try {
    if (section === 'course') showCourse();
    else if (section === 'journal') showJournal();
    else if (section === 'resources') showResources();
    else await showLesson(/^lesson\/\d+$/.test(hash) ? Number(hash.split('/')[1]) : state.activeLesson, !hash.startsWith('lesson/'));
    window.scrollTo({ top: 0, behavior: 'instant' });
  } catch (error) { main.innerHTML = `<section class="card empty-state"><h1>Couldn’t open this lesson.</h1><p>${esc(error.message)}</p><a class="button primary" href="#today">Return to today’s practice</a></section>`; }
}

async function audioReady() {
  audio ??= new AudioContext();
  if (audio.state === 'suspended') await audio.resume();
}
function tone(midi, duration = .7, quiet = false) {
  const now = audio.currentTime;
  const oscillator = audio.createOscillator(); const gain = audio.createGain();
  oscillator.type = quiet ? 'sine' : 'triangle';
  oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(quiet ? .07 : .13, now + .012); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
  oscillator.connect(gain).connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration + .02);
}
function flashKey(midi) {
  const key = document.querySelector(`[data-note="${midi}"]`); if (!key) return;
  key.classList.add('sounding'); setTimeout(() => key.classList.remove('sounding'), 350);
}
async function playMelody() {
  if (melodyTimers.length) { stopSounds(); return; }
  await audioReady(); stopSounds();
  const button = $('[data-action="melody"]'); button.textContent = '■ Stop';
  [60, 62, 64, 62, 64, 62, 60, 60].forEach((n, i) => melodyTimers.push(setTimeout(() => {
    tone(n, .8); flashKey(n); document.querySelectorAll('.note-cell').forEach(x => x.classList.toggle('sounding', Number(x.dataset.sequence) === i));
  }, i * 1000)));
  melodyTimers.push(setTimeout(stopSounds, 8000));
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
    else if (action === 'melody') await playMelody();
    else if (action === 'metronome') await toggleMetronome();
    else if (action === 'timer') { button.disabled = true; await toggleTimer(); button.disabled = false; }
    else if (action === 'complete') {
      button.disabled = true; const id = Number(button.dataset.id); const completed = !state.completed.includes(id);
      state = await api(`completion/${id}`, 'PUT', { completed });
      button.textContent = completed ? 'Reopen this lesson' : 'Mark lesson complete'; button.classList.toggle('primary', !completed); button.classList.toggle('outline', completed);
      $('#completion-note').textContent = completed ? 'Lesson marked complete.' : 'Mark complete when you can repeat these tasks reliably.';
      updateStats(); toast(completed ? 'Lesson complete. Bring your notes to our next check-in.' : 'Lesson reopened.'); button.disabled = false;
    } else if (action === 'set-active') { state = await api('active', 'PUT', { lessonId: Number(button.dataset.id) }); location.hash = '#today'; }
  } catch (error) { button.disabled = false; toast(error.message, true); }
});
document.addEventListener('change', async event => {
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
window.addEventListener('hashchange', () => { if (course && state) route(); });
window.addEventListener('pagehide', () => {
  stopSounds(); clearTimeout(draftTimeout);
  const draft = formData();
  if (dialog.open && draft) fetch(`/api/drafts/${formLesson}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Migs-Local': '1' }, body: JSON.stringify(draft), keepalive: true }).catch(() => {});
});
async function init() {
  try {
    [course, state] = await Promise.all([api('course'), api('state')]);
    elapsed = state.settings?.timer?.elapsed || 0; timerStarted = state.settings?.timer?.startedAt || null;
    clearInterval(practiceTimer); if (timerStarted) practiceTimer = setInterval(updateTimer, 1000);
    updateStats(); await route();
  }
  catch (error) { main.innerHTML = `<section class="card empty-state"><h1>Cannot connect to the server</h1><p>${esc(error.message)}</p><p>Start the local server, then reload this page.</p><button class="button primary" id="reload">Try again</button></section>`; $('#reload').addEventListener('click', init); }
}
init();
