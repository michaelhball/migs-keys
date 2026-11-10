// Headless Chrome verification against an isolated server and throwaway progress.
// Node 22+ and Chrome are required. Screenshots go to a temporary directory.
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm,cp,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=await mkdtemp(path.join(tmpdir(),'migs-song-ui-'));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chromePath=process.env.MIGS_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let server,chrome,ws;
async function poll(fn,label) { for(let i=0;i<100;i++){try{const value=await fn();if(value)return value;}catch{}await delay(100);}throw Error('Timed out: '+label); }
try {
  if (process.env.MIGS_QA_SONGS) {
    await mkdir(path.join(temp,'data'),{recursive:true});
    await cp(process.env.MIGS_QA_SONGS,path.join(temp,'data/songs'),{recursive:true});
  }
  let serverOutput='';
  server=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:'0',MIGS_DATA_DIR:path.join(temp,'data')},stdio:['ignore','pipe','pipe']});
  server.stdout.on('data',chunk=>serverOutput+=chunk);
  const base=await poll(()=>serverOutput.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0],'local server');
  await fetch(base+'/api/settings',{method:'PUT',headers:{'Content-Type':'application/json','X-Migs-Local':'1'},body:JSON.stringify({melodyTempo:37})});
  chrome=spawn(chromePath,['--headless','--disable-gpu','--no-first-run','--disable-background-networking','--mute-audio','--autoplay-policy=no-user-gesture-required','--remote-debugging-port=0',`--user-data-dir=${path.join(temp,'chrome')}`,'about:blank'],{stdio:'ignore'});
  const port=await poll(async()=>Number((await readFile(path.join(temp,'chrome/DevToolsActivePort'),'utf8')).split('\n')[0]),'Chrome');
  const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let serial=0;const pending=new Map();
  ws.onmessage=({data})=>{const message=JSON.parse(data);const request=pending.get(message.id);if(request){pending.delete(message.id);clearTimeout(request.timer);message.error?request.reject(Error(JSON.stringify(message.error))):request.resolve(message.result);}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},10000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1800,deviceScaleFactor:1,mobile:false});
  for (const slug of ['amazing-grace','lord-of-the-dance','fur-elise','dont-stop-believin']) {
    const song=(await (await fetch(base+'/api/songs/'+slug)).json());
    const expectedTitle=song.title;
    await send('Page.navigate',{url:base+'/#song/'+slug});
    await poll(()=>evaluate('document.querySelector("h1")?.textContent==='+JSON.stringify(expectedTitle)),'song title');
    await poll(()=>evaluate('!!document.querySelector("#song-score .melody-controls")'),'song load');
    assert.equal(await evaluate('Number(document.querySelector("#melody-tempo").value)'),Math.round(song.tempo.bpm*song.exercise.meter[1]/song.tempo.unit),'song starts at reference tempo, not lesson tempo');
    if(await evaluate('document.querySelector("[data-action=song-view][data-view=notation]").getAttribute("aria-pressed")!=="true"')) {
      await evaluate('document.querySelector("[data-action=song-view][data-view=notation]").click()');
    }
    await poll(()=>evaluate('!!document.querySelector(".full-score-page")'),'score view');
    await poll(()=>evaluate('[...document.querySelectorAll(".full-score-page")].every(x=>x.complete&&x.naturalWidth>0)'),'score images');
    assert.equal(await evaluate('document.querySelector(".player-keyboards")===null'),true);
    if (slug==='amazing-grace'||slug==='lord-of-the-dance') {
      assert.equal(await evaluate('document.querySelector("#song-passage").value'),'full');
      assert.equal(await evaluate('document.querySelector("[data-action=song-fingering]").getAttribute("aria-pressed")'),'false');
      assert.equal(await evaluate('document.querySelector(".full-score-page").src.includes("fingering-page")'),false);
      await evaluate('document.querySelector("[data-action=song-fingering]").click()');
      await poll(()=>evaluate('document.querySelector(".full-score-page").src.includes("fingering-page")'),'show fingering');
      await evaluate('window.__migsQAOldDocument=true');
      await send('Page.reload');
      await poll(()=>evaluate('!window.__migsQAOldDocument&&!!document.querySelector(".full-score-page")&&document.querySelector(".full-score-page").src.includes("fingering-page")'),'saved fingering');
      await evaluate('document.querySelector("[data-action=song-fingering]").click()');
      await poll(()=>evaluate('!document.querySelector(".full-score-page").src.includes("fingering-page")'),'hide fingering');
      await evaluate('document.querySelector("#follow-score").checked=false; document.querySelector("[data-action=melody]").click()');
      await poll(()=>evaluate('!!document.querySelector(".score-marker")'),'moving score marker');
      await evaluate('document.querySelector(".score-scroll").scrollIntoView({behavior:"instant",block:"start"})');
      await delay(300);
      const screenshot=await send('Page.captureScreenshot',{format:'png'});
      await writeFile(path.join(temp,slug+'.png'),Buffer.from(screenshot.data,'base64'));
      const pages=await evaluate('document.querySelectorAll(".engraved-page").length');
      for(let i=1;i<pages;i++) {
        await evaluate('document.querySelectorAll(".engraved-page")['+i+'].scrollIntoView({behavior:"instant",block:"start"})');
        const pageShot=await send('Page.captureScreenshot',{format:'png'});
        await writeFile(path.join(temp,slug+'-page-'+(i+1)+'.png'),Buffer.from(pageShot.data,'base64'));
      }
      await evaluate('document.querySelector("[data-action=melody]").click()');
      if (slug==='amazing-grace') {
        await evaluate('document.querySelector("[data-action=song-view][data-view=notes]").click()');
        await poll(()=>evaluate('!!document.querySelector("#piano-position")'),'piano navigation');
        assert.equal(await evaluate('document.querySelector("#lyric-verse").disabled'),true);
        const firstVerseEvents=song.exercise.events.length;
        await evaluate('{const s=document.querySelector("#piano-position");s.value='+firstVerseEvents+';s.dispatchEvent(new Event("input",{bubbles:true}));}');
        assert.equal(await evaluate('document.querySelector("#lyric-verse").value'),'1');
        assert.equal(await evaluate('document.querySelector(".current-lyric").textContent.startsWith("’Twas grace")'),true);
        assert.ok(await evaluate('document.querySelector("#piano-step-label").textContent.includes("Verse 2")'));
        await evaluate('document.querySelector("[data-action=melody]").click()');
        await delay(150);
        assert.equal(await evaluate('document.querySelector("#lyric-verse").value'),'1','playback resumes from the selected verse');
        await evaluate('document.querySelector("[data-action=melody]").click()');
        await evaluate('{const s=document.querySelector("#piano-position");s.value=0;s.dispatchEvent(new Event("input",{bubbles:true}));}');
        assert.equal(await evaluate('document.querySelector("#lyric-verse").value'),'0');
        await evaluate('const p=document.querySelector("#song-passage");p.value="tune";p.dispatchEvent(new Event("change",{bubbles:true}));');
        assert.equal(await evaluate('document.querySelector("#lyric-verse").disabled'),false);
        await evaluate('const v=document.querySelector("#lyric-verse");v.value="2";v.dispatchEvent(new Event("change",{bubbles:true}));');
        await poll(()=>evaluate('document.querySelector(".lyric-lines").textContent.includes("Through many dangers")'),'single verse selection');
      }
      if(slug==='lord-of-the-dance') {
        await evaluate('const p=document.querySelector("#song-passage");p.value='+JSON.stringify(song.localContent?'chorus':'b')+';p.dispatchEvent(new Event("change",{bubbles:true}));document.querySelector("[data-action=song-view][data-view=notes]").click()');
        await poll(()=>evaluate('!!document.querySelector(".player-keyboards")'),'piano view');
        if (song.lyrics) assert.equal(await evaluate('document.querySelector(".current-lyric").textContent.startsWith("When true")'),true);
        await evaluate('const hand=document.querySelector("#song-hands");hand.value="right";hand.dispatchEvent(new Event("change",{bubbles:true}));document.querySelectorAll("[data-action=piano-step]")[1].click()');
        assert.equal(await evaluate('document.querySelectorAll("[data-hand=left] .sounding").length'),0);
        assert.ok(await evaluate('document.querySelectorAll("[data-hand=right] .sounding").length')>0);
      }
    }
    console.log(slug+': browser checks passed');
  }
  await evaluate('{const t=document.querySelector("#melody-tempo");t.value=90;t.dispatchEvent(new Event("change",{bubbles:true}));}');
  await poll(async()=>(await(await fetch(base+'/api/state')).json()).settings.songTempos?.['dont-stop-believin']===90,'save song tempo');
  await send('Page.navigate',{url:base+'/#song/fur-elise'});
  await poll(()=>evaluate('document.querySelector("h1")?.textContent==="Für Elise"&&document.querySelector("#melody-tempo")?.value==="144"'),'independent second song tempo');
  await send('Page.navigate',{url:base+'/#song/dont-stop-believin'});
  await poll(()=>evaluate('document.querySelector("h1")?.textContent.includes("Believin")&&document.querySelector("#melody-tempo")?.value==="90"'),'saved song tempo after navigation');
  await evaluate('window.__migsTempoOldDocument=true');
  await send('Page.reload');
  await poll(()=>evaluate('!window.__migsTempoOldDocument&&document.querySelector("#melody-tempo")?.value==="90"'),'saved song tempo after reload');
  await evaluate('document.querySelector("[data-action=song-tempo-reset]").click()');
  await poll(()=>evaluate('document.querySelector("#melody-tempo")?.value==="119"'),'reset reference tempo');
  await poll(async()=>(await(await fetch(base+'/api/state')).json()).settings.songTempos?.['dont-stop-believin']===undefined,'persist tempo reset');
  await send('Page.navigate',{url:base+'/#lesson/1'});
  await poll(()=>evaluate('!!document.querySelector("#lesson-player")&&document.querySelector("#melody-tempo")?.value==="37"'),'lesson tempo preserved');
  await send('Page.navigate',{url:base+'/#song/roses'});
  await poll(()=>evaluate('document.querySelector("h1")?.textContent==="Roses · piano intro"'),'Roses source page');
  assert.equal(await evaluate('document.querySelector("#melody-tempo")'),null,'source-only song has no misleading playback control');
  assert.ok(await evaluate('!!document.querySelector("a[href$=\\"outkast_roses_piano_solo.pdf\\"]")'));
  await writeFile(path.join(temp,'roses.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  console.log('Per-song tempo persistence, reset, lesson isolation and Roses source page passed');
  console.log('Screenshots: '+temp);
} finally {
  ws?.close(); chrome?.kill('SIGTERM'); server?.kill('SIGTERM');
  await delay(400);
  await rm(path.join(temp,'chrome'),{recursive:true,force:true,maxRetries:3});
  await rm(path.join(temp,'data'),{recursive:true,force:true,maxRetries:3});
}
