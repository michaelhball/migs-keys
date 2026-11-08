import { escapeHtml as esc } from './markdown.js';
import { validMidiEvent } from './midi.js';

export class PracticeRecorder {
  constructor(root,{sound,prepareSound,stopPlayback,context,notify}) {
    Object.assign(this,{root,sound,prepareSound,stopPlayback,context,notify});
    this.inputs=[];this.pending=null;this.active=false;this.busy=false;this.playTimers=[];this.replayVoices=new Map();
    root.innerHTML=`<details class="card recording-panel"><summary>Record practice</summary><p class="fine">Record audio from a microphone or audio input, or connect a MIDI keyboard. Takes are saved on this computer. Stop and save before closing the page. Up to ten minutes per take.</p><div class="recording-controls"><label>Source<select id="record-source"><option value="audio">Microphone / audio input</option></select></label><button class="button outline small" data-record="midi">Connect MIDI</button><button class="button outline small" data-record="inputs">Audio inputs</button><label id="audio-input-label">Audio input<select id="audio-input"><option value="">System default</option></select></label><button class="button primary small" data-record="start">Record</button><button class="button outline small" data-record="stop" disabled>Stop and save</button></div><p id="record-status" role="status">No recording in progress. Feedback analysis is not connected.</p><div id="unsaved-recording"></div><h3>Saved recordings</h3><div id="saved-recordings"></div></details>`;
    root.addEventListener('click',event=>{const button=event.target.closest('[data-record]');if(button)this.action(button).catch(error=>this.error(error));});
    window.addEventListener('beforeunload',event=>{if(this.active||this.busy||this.pending){event.preventDefault();event.returnValue='';}});
    this.refresh().catch(error=>this.error(error));
  }
  find(selector){return this.root.querySelector(selector);}
  status(text){this.find('#record-status').textContent=text;}
  error(error){this.status(error.message||String(error));this.notify(error.message||String(error),true);}
  controls(){for(const el of this.root.querySelectorAll('.recording-controls button,.recording-controls select'))el.disabled=this.active||this.busy||!!this.pending;this.find('[data-record="stop"]').disabled=!this.active;}
  async action(button){
    const action=button.dataset.record;
    if(action==='midi')await this.connectMidi();
    if(action==='inputs')await this.audioInputs();
    if(action==='start')await this.start();
    if(action==='stop')await this.stop();
    if(action==='retry')await this.save();
    if(action==='play')await this.playMidi(button.dataset.id);
    if(action==='stop-play')this.stopReplay();
  }
  async connectMidi(){
    if(!navigator.requestMIDIAccess)throw new Error('MIDI access is unavailable in this browser. Use Chrome or Brave, or record audio.');
    this.midi??=await navigator.requestMIDIAccess({sysex:false});
    this.midi.onstatechange=()=>{
      if(this.active&&this.input?.state==='disconnected'){this.stop().catch(e=>this.error(e));this.status('MIDI device disconnected. Saving the captured notes.');}
      if(!this.active)this.updateInputs();
    };
    this.updateInputs(true);
  }
  updateInputs(selectMidi=false){
    const select=this.find('#record-source'),previous=select.value;
    this.inputs=[...this.midi.inputs.values()].filter(input=>input.state==='connected');
    select.innerHTML='<option value="audio">Microphone / audio input</option>'+this.inputs.map(input=>`<option value="${esc(input.id)}">MIDI: ${esc(input.name||'Keyboard')}</option>`).join('');
    select.value=this.inputs.some(x=>x.id===previous)?previous:(selectMidi&&this.inputs.length?this.inputs[0].id:'audio');
    this.status(this.inputs.length?'MIDI connected. Choose MIDI or audio as the source.':'No MIDI input found. Audio recording remains available.');
  }
  async audioInputs(){
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(track=>track.stop());
    const devices=(await navigator.mediaDevices.enumerateDevices()).filter(x=>x.kind==='audioinput');
    this.find('#audio-input').innerHTML='<option value="">System default</option>'+devices.map(x=>`<option value="${esc(x.deviceId)}">${esc(x.label||'Audio input')}</option>`).join('');
    this.status('Choose your microphone or USB audio input, then Record.');
  }
  async start(){
    if(this.active||this.busy||this.pending)return;
    this.stopPlayback();this.stopReplay();this.busy=true;this.controls();
    const source=this.find('#record-source').value;
    try{
      this.kind=source==='audio'?'audio':'midi';this.takeContext=this.context();this.id=crypto.randomUUID();this.events=[];
      if(this.kind==='audio'){
        if(!navigator.mediaDevices?.getUserMedia||!globalThis.MediaRecorder)throw new Error('Audio recording is unavailable in this browser.');
        const device=this.find('#audio-input').value;
        this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,...(device?{deviceId:{exact:device}}:{})}});
        const mimeType=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type=>MediaRecorder.isTypeSupported(type));
        if(!mimeType)throw new Error('No supported recording format was found. Try Chrome or Brave.');
        this.recorder=new MediaRecorder(this.stream,{mimeType});this.chunks=[];
        this.recorder.ondataavailable=event=>{if(event.data.size)this.chunks.push(event.data);};
        this.recorder.onerror=event=>{this.error(event.error||new Error('Audio capture stopped unexpectedly.'));this.stop().catch(error=>this.error(error));};
      }else{
        this.input=this.inputs.find(x=>x.id===source&&x.state==='connected');
        if(!this.input)throw new Error('Connect a MIDI input before recording.');
        await this.input.open();
      }
      this.started=performance.now();this.active=true;
      if(this.kind==='audio')this.recorder.start(1000);
      else this.input.onmidimessage=event=>{
        const message={at:Math.min(600000,Math.round(performance.now()-this.started)),data:[...event.data]};
        if(validMidiEvent(message,600000))this.events.push(message);
      };
      this.clock=globalThis.setInterval(()=>this.status(`Recording ${this.takeContext} · ${Math.floor((performance.now()-this.started)/1000)} seconds${this.kind==='midi'?` · ${this.events.length} MIDI events`:''}`),500);
      this.limit=globalThis.setTimeout(()=>this.stop().catch(error=>this.error(error)),600000);
    }catch(error){this.stream?.getTracks().forEach(track=>track.stop());throw error;}
    finally{this.busy=false;this.controls();}
  }
  async stop(){
    if(!this.active)return;
    this.active=false;this.busy=true;this.controls();clearInterval(this.clock);clearTimeout(this.limit);
    const duration=Math.min(600000,Math.round(performance.now()-this.started));
    this.status('Saving recording…');
    try{
      let blob;
      if(this.kind==='audio'){
        if(this.recorder.state!=='inactive')await new Promise(resolve=>{this.recorder.addEventListener('stop',resolve,{once:true});this.recorder.stop();});
        this.stream.getTracks().forEach(track=>track.stop());
        blob=new Blob(this.chunks,{type:this.recorder.mimeType});
      }else{
        this.input.onmidimessage=null;
        if(!this.events.length){this.status('No MIDI notes received. Check the keyboard MIDI OUT connection and try again.');return;}
        blob=new Blob([JSON.stringify({duration,events:this.events})],{type:'application/json'});
      }
      if(!blob.size)throw new Error('The recording was empty. Check the selected input.');
      this.pending={blob,duration,kind:this.kind,id:this.id,context:this.takeContext};
      await this.save();
    }finally{this.stream?.getTracks().forEach(track=>track.stop());this.busy=false;this.controls();}
  }
  async save(){
    if(!this.pending)return;
    const take=this.pending;
    this.busy=true;this.controls();
    try{
      const query=new URLSearchParams({id:take.id,kind:take.kind,duration:take.duration,context:take.context});
      const response=await fetch(`/api/recordings?${query}`,{method:'POST',headers:{'X-Migs-Local':'1','Content-Type':take.blob.type},body:take.blob});
      if(!response.ok)throw new Error((await response.json()).error||'Could not save recording.');
      this.pending=null;this.find('#unsaved-recording').innerHTML='';if(this.fallbackUrl)URL.revokeObjectURL(this.fallbackUrl);
      this.status('Recording saved on this computer.');await this.refresh();
    }catch(error){
      if(this.fallbackUrl)URL.revokeObjectURL(this.fallbackUrl);this.fallbackUrl=URL.createObjectURL(take.blob);
      this.find('#unsaved-recording').innerHTML=`<p>Not saved yet. Keep this page open.</p><button class="button small outline" data-record="retry">Retry save</button> <a href="${this.fallbackUrl}" download="practice.${take.kind==='midi'?'json':take.blob.type.includes('mp4')?'m4a':'webm'}">Download a copy</a>`;
      throw error;
    }finally{this.busy=false;this.controls();}
  }
  async refresh(){
    const response=await fetch('/api/recordings');if(!response.ok)throw new Error('Could not load recordings.');
    const items=await response.json();
    this.find('#saved-recordings').innerHTML=items.length?items.map(item=>`<article class="recording-item"><p><strong>${esc(item.context)}</strong> · ${new Date(item.createdAt).toLocaleString()} · ${Math.round(item.duration/1000)} sec · ${item.kind==='midi'?'MIDI':'Audio'}</p>${item.kind==='audio'?`<audio controls preload="none" src="/api/recordings/${item.id}"></audio>`:`<button class="button outline small" data-record="play" data-id="${item.id}">Play MIDI</button> <button class="button outline small" data-record="stop-play">Stop</button>`} <a href="/api/recordings/${item.id}${item.kind==='midi'?'/midi':''}" download="${esc(item.filename.replace('.json','.mid'))}">Download</a></article>`).join(''):'<p class="fine">No saved recordings.</p>';
  }
  stopReplay(){this.playTimers.forEach(clearTimeout);this.playTimers=[];this.replayVoices.forEach(x=>x.release());this.replayVoices.clear();}
  async playMidi(id){
    if(this.active||this.busy)throw new Error('Stop recording before playing a saved take.');
    this.stopPlayback();this.stopReplay();await this.prepareSound();
    const response=await fetch(`/api/recordings/${id}`);if(!response.ok)throw new Error('Could not load MIDI recording.');
    const take=await response.json(),pedal=new Set();
    for(const event of take.events)this.playTimers.push(globalThis.setTimeout(()=>{
      const [status,note,velocity]=event.data,channel=status&15,kind=status>>4,key=`${channel}:${note}`;
      if(kind===9&&velocity){this.replayVoices.get(key)?.release();this.replayVoices.set(key,{release:this.sound.start(note,{velocity:velocity/127}),channel,held:true});}
      if(kind===8||(kind===9&&!velocity)){const voice=this.replayVoices.get(key);if(voice){voice.held=false;if(!pedal.has(channel)){voice.release();this.replayVoices.delete(key);}}}
      if(kind===11&&note===64){if(velocity>=64)pedal.add(channel);else{pedal.delete(channel);for(const [id,voice] of this.replayVoices)if(voice.channel===channel&&!voice.held){voice.release();this.replayVoices.delete(id);}}}
    },event.at));
    this.playTimers.push(globalThis.setTimeout(()=>this.stopReplay(),take.duration+100));
  }
}
