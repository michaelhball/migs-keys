export const presets = { piano:'Acoustic piano', electric:'Electric piano', organ:'Organ', pad:'Synth pad' };
export function soundControl(selected='piano') {
  return `<label class="sound-control">Sound<select id="sound-preset">${Object.entries(presets).map(([id,label])=>`<option value="${id}" ${id===selected?'selected':''}>${label}</option>`).join('')}</select></label>`;
}
export class SoundEngine {
  constructor() { this.preset='piano'; this.samples=new Map(); this.voices=new Set(); }
  async ready(preset=this.preset) {
    if (!this.context) {
      this.context=new AudioContext();
      this.master=this.context.createGain(); this.master.gain.value=.7;
      const compressor=this.context.createDynamicsCompressor(); compressor.threshold.value=-12; compressor.ratio.value=5;
      this.master.connect(compressor).connect(this.context.destination);
    }
    if (this.context.state==='suspended') await this.context.resume();
    if (!presets[preset]) throw new Error('Unknown sound.');
    if (preset==='piano' && !this.samples.size) {
      this.loading ??= this.loadPiano().catch(error=>{this.loading=null;throw error;});
      await this.loading;
    }
    this.preset=preset;
  }
  async loadPiano() {
    const names=[[21,'A0'],[108,'C8']];
    for(let octave=1;octave<=7;octave++) for(const [step,name] of [[0,'C'],[3,'Ds'],[6,'Fs'],[9,'A']]) names.push([12*(octave+1)+step,`${name}${octave}`]);
    const samples=await Promise.all(names.map(async([midi,name])=>{
      const response=await fetch(`/audio/piano/${name}.mp3`);
      if(!response.ok) throw new Error('Could not load the piano sound. Try another sound or reload.');
      return [midi,await this.context.decodeAudioData(await response.arrayBuffer())];
    }));
    this.samples=new Map(samples);
  }
  start(midi,{duration,quiet=false,velocity=1}={}) {
    const ctx=this.context, now=ctx.currentTime, frequency=440*2**((midi-69)/12);
    const gain=ctx.createGain(), nodes=[gain], sources=[];
    gain.connect(this.master);
    const oscillator=(ratio,type='sine',detune=0)=>{
      const source=ctx.createOscillator();source.type=type;source.frequency.value=frequency*ratio;source.detune.value=detune;
      sources.push(source);nodes.push(source);return source;
    };
    const preset=quiet?'click':this.preset;
    if(preset==='piano') {
      const pitch=[...this.samples.keys()].reduce((best,n)=>Math.abs(n-midi)<Math.abs(best-midi)?n:best);
      const source=ctx.createBufferSource();source.buffer=this.samples.get(pitch);source.playbackRate.value=2**((midi-pitch)/12);source.connect(gain);sources.push(source);nodes.push(source);
      gain.gain.setValueAtTime(.65*velocity,now);
    } else if(preset==='electric') {
      const carrier=oscillator(1), modulator=oscillator(3), modulation=ctx.createGain(); nodes.push(modulation);
      modulation.gain.setValueAtTime(frequency*1.7,now);modulation.gain.exponentialRampToValueAtTime(frequency*.025,now+1.4);
      modulator.connect(modulation).connect(carrier.frequency);carrier.connect(gain);
      gain.gain.setValueAtTime(.18*velocity,now);gain.gain.exponentialRampToValueAtTime(.012,now+3);
    } else if(preset==='pad') {
      const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=Math.min(4200,frequency*5);nodes.push(filter);filter.connect(gain);
      oscillator(1,'sawtooth',-7).connect(filter);oscillator(1,'sawtooth',7).connect(filter);oscillator(.5,'sine').connect(filter);
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.05*velocity,now+.14);
    } else if(preset==='organ') {
      for(const [ratio,level] of [[1,.12],[2,.055],[3,.025],[4,.015]]) { const partial=ctx.createGain();partial.gain.value=level;nodes.push(partial);oscillator(ratio).connect(partial).connect(gain); }
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(velocity,now+.01);
    } else {
      oscillator(1).connect(gain);gain.gain.setValueAtTime(.1,now);gain.gain.exponentialRampToValueAtTime(.001,now+.06);
    }
    sources.forEach(source=>source.start(now));
    let released=false,timer;
    const release=(tail=preset==='pad'?.4:preset==='piano'?.18:.05)=>{
      if(released)return;released=true;clearTimeout(timer);this.voices.delete(release);
      const at=ctx.currentTime;gain.gain.cancelAndHoldAtTime(at);gain.gain.linearRampToValueAtTime(0,at+tail);
      sources.forEach(source=>source.stop(at+tail+.01));
      globalThis.setTimeout(()=>nodes.forEach(node=>node.disconnect()),(tail+.05)*1000);
    };
    this.voices.add(release);
    if(duration!==undefined) timer=globalThis.setTimeout(()=>release(),duration*1000);
    return release;
  }
  stopAll() { for(const release of this.voices)release(.015); }
}
