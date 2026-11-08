export class MelodyPlayer {
  constructor({ onNote, onStop, now = () => performance.now(), schedule = setTimeout, cancel = clearTimeout }) {
    Object.assign(this, { onNote, onStop, now, schedule, cancel });
    this.playing = false;
    this.timer = null;
    this.tempo = 60;
  }

  setTempo(tempo) {
    if (!Number.isInteger(tempo) || tempo < 30 || tempo > 180) throw new RangeError('Tempo must be between 30 and 180 BPM.');
    if (this.playing) {
      const now = this.now();
      const fraction = Math.max(0, Math.min(1, (now - this.beatStart) / (60000 / this.tempo)));
      this.cancel(this.timer);
      this.beatStart = now - fraction * (60000 / tempo);
      this.tempo = tempo;
      this.scheduleNext();
    } else this.tempo = tempo;
  }

  start(notes, tempo = 60) {
    this.stop();
    this.setTempo(tempo);
    if (!notes.length) return;
    this.notes = [...notes];
    this.index = 0;
    this.playing = true;
    this.beatStart = this.now();
    this.playCurrent();
  }

  playCurrent() {
    this.onNote(this.notes[this.index], this.index, 60 / this.tempo);
    this.scheduleNext();
  }

  scheduleNext() {
    const nextBeat = this.beatStart + 60000 / this.tempo;
    this.timer = this.schedule(() => {
      this.timer = null;
      if (!this.playing) return;
      this.index++;
      if (this.index === this.notes.length) { this.stop(); return; }
      this.beatStart = nextBeat;
      this.playCurrent();
    }, Math.max(0, nextBeat - this.now()));
  }

  stop() {
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
    this.playing = false;
    this.onStop();
  }
}
