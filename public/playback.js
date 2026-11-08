export class MelodyPlayer {
  constructor({
    onNote, onStop, now = () => performance.now(),
    schedule = (fn, delay) => globalThis.setTimeout(fn, delay),
    cancel = id => globalThis.clearTimeout(id)
  }) {
    Object.assign(this, { onNote, onStop, now, schedule, cancel });
    this.playing = false;
    this.timer = null;
    this.tempo = 60;
  }

  setTempo(tempo) {
    if (!Number.isInteger(tempo) || tempo < 30 || tempo > 180) throw new RangeError('Tempo must be between 30 and 180 BPM.');
    if (this.playing) {
      const now = this.now();
      const fraction = Math.max(0, Math.min(1, (now - this.beatStart) / (60000 / this.tempo * this.currentBeats())));
      this.cancel(this.timer);
      this.beatStart = now - fraction * (60000 / tempo * this.currentBeats());
      this.tempo = tempo;
      this.scheduleNext();
    } else this.tempo = tempo;
  }

  start(notes, tempo = 60, index = 0) {
    this.stop();
    this.setTempo(tempo);
    if (!notes.length) return;
    this.notes = [...notes];
    if (!Number.isInteger(index) || index<0 || index>=notes.length) throw new RangeError('Invalid playback position.');
    this.index = index;
    this.playing = true;
    this.beatStart = this.now();
    this.playCurrent();
  }

  playCurrent() {
    this.onNote(this.notes[this.index], this.index, 60 / this.tempo * this.currentBeats());
    this.scheduleNext();
  }

  scheduleNext() {
    const nextBeat = this.beatStart + 60000 / this.tempo * this.currentBeats();
    this.timer = this.schedule(() => {
      this.timer = null;
      if (!this.playing) return;
      this.index++;
      if (this.index === this.notes.length) { this.stop(true); return; }
      this.beatStart = nextBeat;
      this.playCurrent();
    }, Math.max(0, nextBeat - this.now()));
  }

  currentBeats() { const event = this.notes[this.index]; return typeof event === 'number' ? 1 : event.beats || 1; }

  stop(finished = false) {
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
    this.playing = false;
    this.onStop(finished);
  }
}
