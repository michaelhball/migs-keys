import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { validMidiEvent, encodeMidi } from './public/midi.js';

const audioTypes={'audio/webm':'webm','audio/mp4':'m4a','audio/ogg':'ogg','audio/wav':'wav'};
const validId=id=>/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id);
export async function recordingRoute({req,res,url,dataDirectory,state,update,fail,reply}) {
  const match=url.pathname.match(/^\/api\/recordings(?:\/([^/]+)(\/midi)?)?$/);
  if(!match)return false;
  const id=match[1];
  if(req.method==='GET') {
    const items=(await state()).recordings||[];
    if(!id) {reply(200,items);return true;}
    const item=items.find(x=>x.id===id);
    if(!item)fail(404,'Recording not found.');
    let bytes=await readFile(path.join(dataDirectory,'recordings',item.filename)), type=item.mime, filename=item.filename;
    if(match[2]) {if(item.kind!=='midi')fail(400,'This recording contains audio.');const take=JSON.parse(bytes);bytes=encodeMidi(take.events,take.duration);type='audio/midi';filename=`${id}.mid`;}
    res.writeHead(200,{'Content-Type':type,'Content-Length':bytes.length,'Cache-Control':'no-store','Content-Disposition':`inline; filename="${filename}"`});res.end(bytes);return true;
  }
  if(req.method!=='POST'||id)fail(405,'Recording method not supported.');
  const recordingId=url.searchParams.get('id'), kind=url.searchParams.get('kind'), duration=Number(url.searchParams.get('duration'));
  const context=url.searchParams.get('context')||'Practice';
  if(!validId(recordingId||'')||!['audio','midi'].includes(kind)||!Number.isFinite(duration)||duration<0||duration>600000||context.length>200)fail(400,'Invalid recording details.');
  const mime=req.headers['content-type']?.split(';')[0];
  if(kind==='audio'&&!audioTypes[mime])fail(415,'Audio format is not supported.');
  if(kind==='midi'&&mime!=='application/json')fail(415,'MIDI events must use JSON.');
  const chunks=[];let size=0;
  for await(const chunk of req) {size+=chunk.length;if(size>(kind==='midi'?8:64)*1024*1024)fail(413,'Recording is too large. Keep each take under ten minutes.');chunks.push(chunk);}
  if(!size)fail(400,'Recording is empty.');
  const bytes=Buffer.concat(chunks);
  if(kind==='midi') {
    let take;try{take=JSON.parse(bytes);}catch{fail(400,'Could not read MIDI events.');}
    if(!take||!Array.isArray(take.events)||!take.events.length||take.events.length>100000||take.duration!==duration||take.events.some((e,i)=>!validMidiEvent(e,duration)||(i&&e.at<take.events[i-1].at)))fail(400,'Invalid MIDI recording.');
  }
  const filename=`${recordingId}.${kind==='audio'?audioTypes[mime]:'json'}`;
  let result;
  await update(async s=>{
    s.recordings??=[];
    result=s.recordings.find(x=>x.id===recordingId);if(result)return;
    await mkdir(path.join(dataDirectory,'recordings'),{recursive:true});
    // Retrying the same take is safe after a file write succeeds but metadata fails.
    await writeFile(path.join(dataDirectory,'recordings',filename),bytes,{mode:0o600});
    result={id:recordingId,kind,duration,context,filename,mime,size,createdAt:new Date().toISOString()};
    s.recordings.unshift(result);
  });
  reply(201,result);return true;
}
