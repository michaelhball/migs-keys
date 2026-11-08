import { recordingRoute } from './recordings.mjs';
import http from 'node:http';
import { readFile, writeFile, mkdir, rename, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA = process.env.MIGS_DATA_DIR || path.join(ROOT, 'data');
const PORT = Number(process.env.PORT ?? 4317);
const STATE = path.join(DATA, 'progress.json');
const emptyState = () => ({ version: 1, activeLesson: 1, completed: [], checkpoints: {}, drafts: {}, sessions: [], recordings: [], settings: { tempo: 60, melodyTempo: 60, songView: 'notes', soundPreset: 'piano', timer: { elapsed: 0, startedAt: null } } });
let writing = Promise.resolve();

async function jsonFile(file) { return JSON.parse(await readFile(file, 'utf8')); }
async function course() { return jsonFile(path.join(ROOT, 'content', 'course.json')); }
async function songs() { return jsonFile(path.join(ROOT, 'content', 'songs.json')); }
async function songContent(item) {
  const folder = path.join(ROOT, 'content', 'songs');
  return { ...item, ...(item.exerciseFile ? { exercise: await jsonFile(path.join(folder, item.exerciseFile)) } : {}), noteNames: await readFile(path.join(folder, item.notesFile), 'utf8'), practice: await readFile(path.join(folder, item.practiceFile), 'utf8') };
}
async function state() {
  try { const saved = await jsonFile(STATE); return { ...emptyState(), ...saved, settings: { ...emptyState().settings, ...saved.settings } }; }
  catch (error) { if (error.code === 'ENOENT') return emptyState(); throw error; }
}
async function update(change) {
  const job = writing.then(async () => {
    const current = await state();
    await change(current);
    await mkdir(DATA, { recursive: true });
    const temporary = path.join(DATA, `progress.${process.pid}.tmp`);
    await writeFile(temporary, JSON.stringify(current, null, 2) + '\n', { mode: 0o600 });
    try { await copyFile(STATE, path.join(DATA, 'progress.previous.json')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await rename(temporary, STATE);
    return current;
  });
  writing = job.catch(() => {});
  return job;
}
function fail(status, message) { const error = new Error(message); error.status = status; throw error; }
async function body(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'Please send JSON.');
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (Buffer.byteLength(text) > 32768) fail(413, 'This entry is too long.');
  }
  try { const data = JSON.parse(text); if (!data || Array.isArray(data) || typeof data !== 'object') throw Error(); return data; }
  catch { fail(400, 'Could not read this entry.'); }
}
function shortText(value, max = 4000) {
  if (typeof value !== 'string' || value.length > max) fail(400, 'Please shorten the text and try again.');
  return value.trim();
}
function sessionFields(data) {
  const minutes = Number(data.minutes);
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 600) fail(400, 'Minutes must be between 0 and 600.');
  if (!['good', 'mixed', 'challenging'].includes(data.feeling)) fail(400, 'Choose how practice felt.');
  return { minutes, feeling: data.feeling, worked: shortText(data.worked), sticky: shortText(data.sticky), next: shortText(data.next) };
}
async function lesson(id, ready = false) {
  const found = (await course()).lessons.find(x => x.id === Number(id));
  if (!found || (ready && !found.file)) fail(404, 'This lesson is not available yet.');
  return found;
}

const server = http.createServer(async (req, res) => {
  const reply = (status, payload, extra = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra });
    res.end(JSON.stringify(payload));
  };
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try {
    const port = server.address().port;
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)) fail(403, 'Use the local address printed by the server.');
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (!['GET', 'HEAD'].includes(req.method)) {
      if (req.headers['x-migs-local'] !== '1') fail(403, 'This request must come from the local app.');
      if (req.headers.origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(req.headers.origin)) fail(403, 'This request must come from the local app.');
    }
    if (await recordingRoute({req,res,url,dataDirectory:DATA,state,update,fail,reply})) return;
    if (req.method === 'GET' && url.pathname === '/api/course') return reply(200, await course());
    if (req.method === 'GET' && url.pathname === '/api/songs') return reply(200, await songs());
    if (req.method === 'GET' && /^\/api\/songs\/[a-z0-9-]+$/.test(url.pathname)) {
      const item = (await songs()).songs.find(x => x.id === url.pathname.split('/').pop());
      if (!item) fail(404, 'Song not found.');
      return reply(200, await songContent(item));
    }
    if (['GET', 'HEAD'].includes(req.method) && /^\/scores\/[a-z0-9-]+\.(svg|pdf|midi)$/.test(url.pathname)) {
      const filename = url.pathname.split('/').pop();
      if (!(await songs()).songs.some(x => [...x.notationFiles, ...(x.downloadFiles || [])].includes(filename))) fail(404, 'Score not found.');
      const score = await readFile(path.join(ROOT, 'content', 'songs', filename));
      res.writeHead(200, { 'Content-Type': { '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.midi': 'audio/midi' }[path.extname(filename)], 'Cache-Control': 'no-cache' });
      return res.end(req.method === 'HEAD' ? undefined : score);
    }
    if (req.method === 'GET' && url.pathname === '/api/state') { await writing; return reply(200, await state()); }
    if (req.method === 'GET' && /^\/api\/lessons\/\d+$/.test(url.pathname)) {
      const item = await lesson(url.pathname.split('/').pop());
      const markdown = item.file ? await readFile(path.join(ROOT, 'content', 'lessons', item.file), 'utf8') : null;
      return reply(200, { ...item, markdown });
    }
    if (req.method === 'GET' && url.pathname === '/api/export') {
      await writing;
      const manifest = await course();
      const lessons = await Promise.all(manifest.lessons.filter(x => x.file).map(async x => ({ ...x, markdown: await readFile(path.join(ROOT, 'content', 'lessons', x.file), 'utf8') })));
      const songLibrary = await Promise.all((await songs()).songs.map(async item => ({ ...await songContent(item), scores: await Promise.all(item.notationFiles.map(async file => ({ file, svg: await readFile(path.join(ROOT, 'content', 'songs', file), 'utf8') }))) })));
      return reply(200, { exportedAt: new Date().toISOString(), course: manifest, lessons, songs: songLibrary, progress: await state() }, { 'Content-Disposition': 'attachment; filename="migs-keys-backup.json"' });
    }
    if (req.method === 'PUT' && url.pathname === '/api/active') {
      const data = await body(req); const item = await lesson(data.lessonId, true);
      return reply(200, await update(s => { s.activeLesson = item.id; }));
    }
    if (req.method === 'PUT' && url.pathname === '/api/settings') {
      const data = await body(req);
      if (data.tempo !== undefined && (!Number.isInteger(data.tempo) || data.tempo < 30 || data.tempo > 180)) fail(400, 'Tempo must be between 30 and 180.');
      if (data.melodyTempo !== undefined && (!Number.isInteger(data.melodyTempo) || data.melodyTempo < 30 || data.melodyTempo > 180)) fail(400, 'Melody tempo must be between 30 and 180.');
      if (data.soundPreset !== undefined && !['piano','electric','organ','pad'].includes(data.soundPreset)) fail(400, 'Choose a sound preset.');
      if (data.songView !== undefined && !['notes', 'notation'].includes(data.songView)) fail(400, 'Choose note names or sheet music.');
      if (data.timer !== undefined && (!data.timer || !Number.isFinite(data.timer.elapsed) || data.timer.elapsed < 0 || !(data.timer.startedAt === null || (Number.isFinite(data.timer.startedAt) && data.timer.startedAt > 0 && data.timer.startedAt <= Date.now() + 10000)))) fail(400, 'Invalid practice timer.');
      return reply(200, await update(s => { s.settings ??= emptyState().settings; if (data.tempo !== undefined) s.settings.tempo = data.tempo; if (data.melodyTempo !== undefined) s.settings.melodyTempo = data.melodyTempo; if (data.soundPreset !== undefined) s.settings.soundPreset = data.soundPreset; if (data.songView !== undefined) s.settings.songView = data.songView; if (data.timer !== undefined) s.settings.timer = { elapsed: data.timer.elapsed, startedAt: data.timer.startedAt }; }));
    }
    if (req.method === 'PUT' && /^\/api\/checkpoints\/\d+$/.test(url.pathname)) {
      const item = await lesson(url.pathname.split('/').pop(), true); const data = await body(req);
      if (!Array.isArray(data.checked) || data.checked.some(x => !Number.isInteger(x) || x < 0 || x >= item.checkpoints.length)) fail(400, 'Invalid checkpoint.');
      return reply(200, await update(s => { s.checkpoints[item.id] = [...new Set(data.checked)]; }));
    }
    if (req.method === 'PUT' && /^\/api\/completion\/\d+$/.test(url.pathname)) {
      const item = await lesson(url.pathname.split('/').pop(), true); const data = await body(req);
      if (typeof data.completed !== 'boolean') fail(400, 'Invalid completion status.');
      const lessons = (await course()).lessons;
      return reply(200, await update(s => {
        s.completed = s.completed.filter(x => x !== item.id);
        if (data.completed) {
          s.completed.push(item.id);
          const next = lessons.find(x => x.id > item.id && x.file && !s.completed.includes(x.id));
          if (next && s.activeLesson === item.id) s.activeLesson = next.id;
        }
      }));
    }
    if (req.method === 'PUT' && /^\/api\/drafts\/\d+$/.test(url.pathname)) {
      const item = await lesson(url.pathname.split('/').pop(), true); const data = sessionFields(await body(req));
      return reply(200, await update(s => { s.drafts[item.id] = data; }));
    }
    if (req.method === 'POST' && url.pathname === '/api/sessions') {
      const data = await body(req); const item = await lesson(data.lessonId, true); const fields = sessionFields(data);
      if (!/^[a-zA-Z0-9-]{10,80}$/.test(data.id)) fail(400, 'Invalid session identifier.');
      return reply(201, await update(s => {
        if (s.sessions.some(x => x.id === data.id)) return;
        s.sessions.unshift({ id: data.id, lessonId: item.id, createdAt: new Date().toISOString(), ...fields });
        delete s.drafts[item.id];
      }));
    }
    if (['GET','HEAD'].includes(req.method) && /^\/audio\/piano\/(?:A0|(?:C|Ds|Fs|A)[1-7]|C8)\.mp3$/.test(url.pathname)) {
      const bytes=await readFile(path.join(ROOT,'public',url.pathname));
      res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'public, max-age=86400'});
      return res.end(req.method==='HEAD'?undefined:bytes);
    }
    const staticFiles = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'], '/markdown.js': ['markdown.js', 'text/javascript'], '/playback.js': ['playback.js', 'text/javascript'], '/favicon.svg': ['favicon.svg', 'image/svg+xml'] };
    staticFiles['/music.js'] = ['music.js', 'text/javascript'];
    staticFiles['/recording.js'] = ['recording.js', 'text/javascript'];
    staticFiles['/piano-view.js'] = ['piano-view.js', 'text/javascript'];
    staticFiles['/midi.js'] = ['midi.js', 'text/javascript'];
    staticFiles['/sound.js'] = ['sound.js', 'text/javascript'];
    staticFiles['/performance.js'] = ['performance.js', 'text/javascript'];
    const file = staticFiles[url.pathname];
    if (file && ['GET', 'HEAD'].includes(req.method)) {
      const data = await readFile(path.join(ROOT, 'public', file[0]));
      res.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-cache' });
      return res.end(req.method === 'HEAD' ? undefined : data);
    }
    reply(404, { error: 'Not found.' });
  } catch (error) {
    if (!error.status) console.error(error);
    reply(error.status || 500, { error: error.status ? error.message : 'Could not save or load your files. Your previous progress has been kept.' });
  }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${PORT} is already in use. Try PORT=4318 npm start.` : error.message); process.exitCode = 1; });
await mkdir(DATA, { recursive: true });
try { await writeFile(STATE, JSON.stringify(emptyState(), null, 2) + '\n', { flag: 'wx', mode: 0o600 }); }
catch (error) { if (error.code !== 'EEXIST') throw error; }
server.listen(PORT, '127.0.0.1', () => console.log(`Migs Keys is ready at http://127.0.0.1:${server.address().port}\nProgress is saved in ${DATA}`));
