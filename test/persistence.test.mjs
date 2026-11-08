import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdown } from '../public/markdown.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function launch(directory) {
  const process = spawn(globalThis.process.execPath, ['server.mjs'], { cwd: root, env: { ...globalThis.process.env, PORT: '0', MIGS_DATA_DIR: directory }, stdio: ['ignore', 'pipe', 'pipe'] });
  const url = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => { process.kill(); reject(Error(`Server did not start: ${output}`)); }, 10000);
    process.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timeout); resolve(match[0]); } });
    process.stderr.on('data', chunk => output += chunk);
    process.once('exit', code => { clearTimeout(timeout); if (code) reject(Error(output)); });
  });
  return { url, stop: () => new Promise(resolve => { if (process.exitCode !== null) return resolve(); process.once('exit', resolve); process.kill('SIGTERM'); }) };
}

test('course, journal, drafts, checkpoints and settings survive a server restart', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'migs-keys-test-'));
  let server;
  t.after(async () => { await server?.stop(); await rm(directory, { recursive: true, force: true }); });
  server = await launch(directory);
  const request = async (endpoint, method = 'GET', data) => {
    const response = await fetch(server.url + endpoint, { method, headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', 'X-Migs-Local': '1' }, ...(data ? { body: JSON.stringify(data) } : {}) });
    return { status: response.status, data: await response.json() };
  };

  const manifest = await request('/api/course');
  assert.equal(manifest.data.lessons.length, 24);
  const flashcards = await request('/api/anki');
  assert.equal(flashcards.data.current.lesson, 1);
  assert.equal(flashcards.data.current.cards, 15);
  assert.equal(flashcards.data.releasedThrough, 12);
  const packageResponse = await fetch(server.url + '/anki/current.apkg');
  assert.equal(packageResponse.status, 200);
  assert.equal(Buffer.from(await packageResponse.arrayBuffer()).subarray(0,2).toString(), 'PK');
  assert.equal((await fetch(server.url + '/anki/not-listed.apkg')).status,404);
  const first = await request('/api/lessons/1');
  assert.equal(first.status, 200);
  assert.match(first.data.markdown, /Second session/);
  assert.match((await request('/api/lessons/2')).data.markdown, /ledger line/);
  assert.equal((await request('/api/lessons/13')).data.markdown, null);
  assert.equal((await fetch(server.url + '/')).status, 200);
  for (const resource of ['/app.js', '/styles.css', '/markdown.js', '/playback.js', '/music.js', '/lesson-guide.js', '/music-symbols.js', '/performance.js', '/sound.js', '/recording.js', '/piano-view.js', '/midi.js', '/favicon.svg']) assert.equal((await fetch(server.url + resource)).status, 200);
  assert.equal((await request('/api/state')).data.settings.melodyTempo, 60);
  assert.equal((await request('/api/state')).data.settings.songView, 'notes');
  assert.equal((await request('/api/settings', 'PUT', {lessonFingering:{lessonId:7,show:'yes'}})).status,400);
  await request('/api/settings', 'PUT', {lessonFingering:{lessonId:7,show:true}});
  const library = await request('/api/songs');
  assert.deepEqual(library.data.songs.map(song => song.id), ['dont-stop-believin', 'fur-elise', 'amazing-grace', 'lord-of-the-dance']);
  for (const song of library.data.songs) {
    const detail = await request(`/api/songs/${song.id}`);
    assert.equal(detail.status, 200);
    assert.ok(detail.data.noteNames.length > 0);
    assert.ok(detail.data.practice.length > 0);
    for (const file of song.notationFiles) {
      const score = await fetch(server.url + `/scores/${file}`);
      assert.equal(score.status, 200);
      assert.match(score.headers.get('content-type'), /image\/svg\+xml/);
      assert.match(await score.text(), /<svg/);
    }
  }
  assert.equal((await request('/api/songs/missing')).status, 404);
  assert.equal((await fetch(server.url + '/scores/unlisted.svg')).status, 404);
  const html = markdown(first.data.markdown);
  assert.match(html, /<h3>Your goal<\/h3>/);
  assert.equal((html.match(/<ol>/g) || []).length, 1);
  assert.equal((html.match(/<li>/g) || []).length, 6);
  assert.equal((html.match(/<table>/g) || []).length, 2);

  const draft = { minutes: 17, feeling: 'mixed', worked: 'Finding C is easier.', sticky: 'The join needs practice.', next: 'Read a few notes.' };
  assert.equal((await request('/api/drafts/1', 'PUT', draft)).status, 200);
  await Promise.all([
    request('/api/checkpoints/1', 'PUT', { checked: [0, 1] }),
    request('/api/completion/1', 'PUT', { completed: true }),
    request('/api/settings', 'PUT', { tempo: 72, melodyTempo: 105, songView: 'notation', soundPreset: 'electric', timer: { elapsed: 42, startedAt: null } })
  ]);
  const session = { ...draft, lessonId: 1, id: 'test-session-0001' };
  assert.equal((await request('/api/sessions', 'POST', session)).status, 201);
  await request('/api/sessions', 'POST', session);
  let saved = (await request('/api/state')).data;
  assert.equal(saved.sessions.length, 1, 'retry must not duplicate a journal entry');
  assert.equal(saved.drafts['1'], undefined);
  assert.deepEqual(saved.completed, [1]);
  assert.deepEqual(saved.checkpoints['1'], [0, 1]);
  assert.equal(saved.settings.tempo, 72);
  assert.equal(saved.settings.melodyTempo, 105);
  assert.equal(saved.settings.timer.elapsed, 42);
  await request('/api/drafts/1', 'PUT', { ...draft, worked: 'A new draft to resume.' });
  const exported = await request('/api/export');
  assert.equal(exported.data.lessons.length, 12);
  assert.equal(exported.data.songs.length, 4);
  assert.match(exported.data.songs[1].scores[0].svg, /<svg/);
  assert.match(exported.data.songs[1].noteNames, /D♯5/);
  assert.equal(exported.data.progress.sessions[0].sticky, draft.sticky);
  assert.equal(JSON.parse(await readFile(path.join(directory, 'progress.json'), 'utf8')).sessions.length, 1);
  assert.equal(JSON.parse(await readFile(path.join(directory, 'progress.previous.json'), 'utf8')).sessions.length, 1);

  const midiId='12345678-1234-4123-8123-123456789012', audioId='12345678-1234-4123-8123-123456789013';
  const take={duration:1000,events:[{at:0,data:[144,60,90]},{at:500,data:[128,60,0]}]};
  const upload=async(id,kind,bytes,mime='application/json')=>fetch(server.url+`/api/recordings?id=${id}&kind=${kind}&duration=1000&context=Test`,{method:'POST',headers:{'X-Migs-Local':'1','Content-Type':mime},body:bytes});
  assert.equal((await upload(midiId,'midi',JSON.stringify(take))).status,201);
  assert.equal((await upload(midiId,'midi',JSON.stringify(take))).status,201);
  assert.equal((await upload(audioId,'audio',new Uint8Array([1,2,3,4]),'audio/webm')).status,201);
  assert.equal((await request('/api/recordings')).data.length,2,'retries do not duplicate takes');
  assert.equal((await upload('bad','midi',JSON.stringify(take))).status,400);
  assert.equal((await upload(crypto.randomUUID(),'midi',JSON.stringify({...take,events:[{at:20,data:[240,1,247]}]}))).status,400);
  assert.equal((await request('/api/settings','PUT',{soundPreset:'invalid'})).status,400);
  for(const file of ['/scores/fur-elise.pdf','/scores/fur-elise.midi','/audio/piano/C4.mp3'])assert.equal((await fetch(server.url+file)).status,200);
  await server.stop();
  server = await launch(directory);
  assert.equal((await request('/api/recordings')).data.length,2);
  assert.deepEqual((await request(`/api/recordings/${midiId}`)).data,take);
  const mid=Buffer.from(await(await fetch(server.url+`/api/recordings/${midiId}/midi`)).arrayBuffer());assert.equal(mid.subarray(0,4).toString(),'MThd');
  assert.deepEqual(new Uint8Array(await(await fetch(server.url+`/api/recordings/${audioId}`)).arrayBuffer()),new Uint8Array([1,2,3,4]));
  saved = (await request('/api/state')).data;
  assert.equal(saved.sessions.length, 1);
  assert.equal(saved.drafts['1'].worked, 'A new draft to resume.');
  assert.deepEqual(saved.checkpoints['1'], [0, 1]);
  assert.equal(saved.settings.tempo, 72);
  assert.equal(saved.settings.melodyTempo, 105);
  assert.equal(saved.settings.timer.elapsed, 42);
  assert.equal(saved.settings.songView, 'notation');
  assert.equal(saved.settings.lessonFingerings['7'], true);
  assert.equal(saved.settings.soundPreset,'electric');

  assert.equal(saved.activeLesson, 2, 'completing the active lesson advances to the next available lesson');
  assert.equal((await request('/api/active', 'PUT', { lessonId: 13 })).status, 404, 'planned lessons cannot become the active assignment');
  assert.equal((await request('/api/sessions', 'POST', { ...session, id: 'invalid-entry-123', minutes: -1 })).status, 400);
  assert.equal((await request('/api/checkpoints/1', 'PUT', { checked: [100] })).status, 400);
  for (const melodyTempo of [0, 29, 181, 60.5, '90', null]) assert.equal((await request('/api/settings', 'PUT', { melodyTempo })).status, 400);
  assert.equal((await request('/api/settings', 'PUT', { songView: 'invalid' })).status, 400);
  assert.equal((await request('/api/state')).data.settings.songView, 'notation');
  assert.equal((await request('/api/state')).data.settings.melodyTempo, 105);
  const forbidden = await fetch(server.url + '/api/completion/1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: false }) });
  assert.equal(forbidden.status, 403);
  const foreignOrigin = await fetch(server.url + '/api/completion/1', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Migs-Local': '1', Origin: 'https://example.com' }, body: JSON.stringify({ completed: false }) });
  assert.equal(foreignOrigin.status, 403);
  assert.equal((await fetch(server.url + '/data/progress.json')).status, 404);
  assert.equal((await request('/api/state')).data.sessions.length, 1, 'invalid requests preserve saved history');
});

test('lesson rendering keeps links useful and escapes unsafe markup', () => {
  const rendered = markdown('<script>alert(1)</script>\n\n[Unsafe](javascript:alert(1))\n\n[Teacher](https://example.com/lesson)');
  assert.doesNotMatch(rendered, /<script>|href="javascript:/);
  assert.match(rendered, /&lt;script&gt;/);
  assert.match(rendered, /rel="noopener noreferrer"/);
  assert.match(rendered, /href="https:\/\/example.com\/lesson"/);
});
