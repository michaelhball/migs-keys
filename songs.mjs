import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Local arrangements replace a catalogue entry in full, so old lyrics or score
// pages cannot accidentally leak into a different arrangement of the same song.
export function songLibrary(root, dataDirectory) {
  const json = async file => JSON.parse(await readFile(file, 'utf8'));
  const folder = item => item.localContent
    ? path.join(dataDirectory, 'songs', item.id)
    : path.join(root, 'content', 'songs');
  const filePath = (item, filename) => {
    if (!/^[a-z0-9-]+$/.test(item.id) || typeof filename !== 'string' || !/^[a-z0-9-]+\.[a-z0-9]+$/.test(filename)) throw Error('Invalid song asset name.');
    return path.join(folder(item), filename);
  };
  async function catalogue() {
    const base = await json(path.join(root, 'content', 'songs.json'));
    let local;
    try { local = await json(path.join(dataDirectory, 'songs', 'index.json')); }
    catch (error) { if (error.code === 'ENOENT') return base; throw error; }
    for (const entry of local.songs) {
      if (!/^[a-z0-9-]+$/.test(entry.id)) throw Error('Invalid local song ID.');
      const item = {...entry, localContent: true};
      const index = base.songs.findIndex(song => song.id === item.id);
      if (index < 0) base.songs.push(item); else base.songs[index] = item;
    }
    return base;
  }
  async function content(item) {
    const result = {...item};
    for (const [field, key] of [['lyricsFile','lyrics'], ['exerciseFile','exercise'], ['scoreMapFile','scoreMap']]) {
      if (item[field]) result[key] = await json(filePath(item, item[field]));
    }
    result.noteNames = await readFile(filePath(item, item.notesFile), 'utf8');
    result.practice = await readFile(filePath(item, item.practiceFile), 'utf8');
    return result;
  }
  return {catalogue, content, filePath};
}
