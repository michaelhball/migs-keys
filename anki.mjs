import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const folder=path.join(path.dirname(fileURLToPath(import.meta.url)),'content','anki');
const json=async file=>JSON.parse(await readFile(path.join(folder,file),'utf8'));
export function currentAnkiLesson(state,manifest) {
  const reached=Math.max(1,state.activeLesson||1,...(state.completed||[]));
  return manifest.lessons.filter(item=>item.lesson<=Math.min(reached,manifest.releasedThrough)).at(-1)||manifest.lessons[0];
}
export async function ankiRoute({req,res,url,state,reply,fail}) {
  if(!url.pathname.startsWith('/anki/')&&url.pathname!=='/api/anki')return false;
  if(!['GET','HEAD'].includes(req.method))fail(405,'Use GET to download flashcards.');
  const manifest=await json('manifest.json');
  const current=currentAnkiLesson(await state(),manifest);
  if(url.pathname==='/api/anki'){
    const notes=await json('notes.json');
    const sampleIds=['treble-c4','quarter-note-shape','find-c'];
    reply(200,{...manifest,current,samples:sampleIds.map(id=>notes.find(n=>n.id===id)).filter(n=>n&&n.lesson<=current.lesson)});return true;
  }
  const filename=url.pathname.slice('/anki/'.length);
  let file,type,attachment;
  if(filename==='current.apkg'){file=path.join('decks',current.file);type='application/octet-stream';attachment=current.file;}
  else if([...manifest.lessons,...manifest.optional,...manifest.library].some(item=>item.file===filename)){file=path.join('decks',filename);type='application/octet-stream';attachment=filename;}
  else if(filename.startsWith('media/')&&manifest.media.includes(filename.slice(6))){file=filename;type='image/png';}
  else fail(404,'Flashcard file not found.');
  const bytes=await readFile(path.join(folder,file));
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache',...(attachment?{'Content-Disposition':`attachment; filename="migs-keys-${attachment}"`}:{})});
  res.end(req.method==='HEAD'?undefined:bytes);return true;
}
