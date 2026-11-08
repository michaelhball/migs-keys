import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MelodyPlayer } from '../public/playback.js';

function setup() {
  let time = 0, nextId = 0;
  const jobs = new Map(), heard = [];
  const player = new MelodyPlayer({
    now: () => time,
    schedule(fn, delay) { const id = ++nextId; jobs.set(id, { fn, at: time + delay }); return id; },
    cancel(id) { jobs.delete(id); },
    onNote(note, index, duration) { heard.push({ note, index, duration, at: time }); },
    onStop() {}
  });
  function advance(ms) {
    const end = time + ms;
    while (jobs.size) {
      const [id, job] = [...jobs].sort((a, b) => a[1].at - b[1].at)[0];
      if (job.at > end) break;
      time = job.at; jobs.delete(id); job.fn();
    }
    time = end;
  }
  return { player, heard, advance };
}

test('tempo changes note spacing and duration without changing pitches', () => {
  for (const [tempo, spacing] of [[30, 2000], [60, 1000], [120, 500], [180, 60000 / 180]]) {
    const { player, heard, advance } = setup();
    player.start([60, 62, 64], tempo);
    advance(spacing * 3 + 1);
    assert.deepEqual(heard.map(x => x.note), [60, 62, 64]);
    assert.deepEqual(heard.map(x => x.at), [0, spacing, spacing * 2]);
    assert.ok(heard.every(x => x.duration === 60 / tempo));
    assert.equal(player.playing, false);
  }
});

test('changing tempo midway through a beat keeps the current position', () => {
  const { player, heard, advance } = setup();
  player.start([60, 62, 64], 60);
  advance(500);
  player.setTempo(120);
  advance(249);
  assert.equal(heard.length, 1);
  advance(1);
  assert.deepEqual(heard.map(x => [x.note, x.at]), [[60, 0], [62, 750]]);
  advance(250);
  player.setTempo(30);
  advance(999);
  assert.equal(heard.length, 2);
  advance(1);
  assert.deepEqual(heard.map(x => [x.note, x.at]), [[60, 0], [62, 750], [64, 2000]]);
  advance(2000);
  assert.equal(player.playing, false);
});

test('stopping cancels future notes and replay starts at the selected tempo', () => {
  const { player, heard, advance } = setup();
  player.start([60, 62, 64], 60);
  advance(200);
  player.stop();
  advance(5000);
  assert.deepEqual(heard.map(x => x.note), [60]);
  player.start([60, 62], 120);
  advance(1000);
  assert.deepEqual(heard.map(x => [x.note, x.at]), [[60, 0], [60, 5200], [62, 5700]]);
  assert.equal(player.playing, false);
});
