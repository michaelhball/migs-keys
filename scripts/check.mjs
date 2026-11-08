import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const files=['server.mjs','recordings.mjs',...(await readdir('public')).filter(f=>f.endsWith('.js')).map(f=>`public/${f}`)];
for(const file of files){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status)process.exit(result.status);}
console.log(`Syntax checked ${files.length} modules.`);
