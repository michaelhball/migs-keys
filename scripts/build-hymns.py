"""Build two public-domain hymn tunes with original beginner bass parts.
Sources and arrangement scope are recorded in each song's practice page.
Requires LilyPond 2.26 and Python's standard library.
"""
from pathlib import Path
import json,re,shutil,subprocess,sys,tempfile,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
FOLDER=ROOT/'content/songs'
# Absolute LilyPond pitches. Fingerings belong to this beginner arrangement.
SONGS=[dict(slug='amazing-grace',title='Amazing Grace',composer='Traditional · NEW BRITAIN',meter='3/4',
 pickup="g4-1",bars=[
 "c'2-2 e'8-4 c'8-2", "e'2-4 d'4-3", "c'2-3 a4-2", 'g2-1 g4-1',
 "c'2-2 e'8-4 c'8-2", "e'2-4 d'4-3", "g'2.-5~", "g'2-5 e'4-3",
 "g'2-5 e'8-3 c'8-1", "e'2-3 d'4-2", "c'2-3 a4-2", 'g2-1 g4-1',
 "c'2-2 e'8-4 c'8-2", "e'2-4 d'4-3", "c'2.-2~", "c'2-2"],
 bass=['c','c','f,','c','c','c','g,','g,','c','c','f,','c','c','g,','c','c'],
 summary='A complete 16-bar tune in C, with a one-beat pickup and a simple left-hand bass part.',
 material='Beginner arrangement of NEW BRITAIN. One complete verse of the tune, in 3/4.'),
 dict(slug='lord-of-the-dance',title='Lord of the Dance · Simple Gifts',composer='Joseph Brackett · traditional tune',meter='4/4',
 pickup='g8-1 g8-1',bars=[
 "c'4-1 c'8-1 d'8-2 e'8-3 c'8-1 e'8-3 f'8-4",
 "g'4-5 g'8-5 f'8-4 e'4-3 d'8-2 c'8-1",
 "d'4-2 d'4-2 d'4-2 c'4-1",
 "d'8-3 e'8-4 d'8-3 b8-2 g4-1 g4-1",
 "c'8-3 b8-2 c'8-3 d'8-4 e'8-5 d'8-4 e'8-3 f'8-4",
 "g'4-5 g'8-5 f'8-4 e'4-3 d'8-2 c'8-1",
 "d'4-2 d'4-2 e'4-3 e'8-3 d'8-2",
 "c'4-1 c'8-1 c'8-1 c'2-1",
 "g'2-5 e'4.-3 d'8-2",
 "e'8-3 f'8-4 e'8-3 d'8-2 c'4.-1 d'8-2",
 "e'4-3 e'8-3 f'8-4 g'4-5 f'8-4 e'8-3",
 "d'4-3 d'8-3 e'8-4 d'4-3 g4-1",
 "c'2-1 c'4.-1 d'8-2",
 "e'4-3 e'8-3 f'8-4 g'4-5 f'8-4 e'8-3",
 "d'4-2 d'4-2 e'4-3 e'8-3 d'8-2",
 "c'4-1 c'4-1 c'4-1"],
 bass=['c','c','g,','g,','c','c','g,','c','c','c','c','g,','c','c','g,','c'],
 summary='The complete 16-bar Simple Gifts tune behind Lord of the Dance, arranged in C with a simple bass part.',
 material='Original beginner arrangement of the traditional Simple Gifts tune used for Lord of the Dance. Includes both sections of the tune; no lyrics.')]

def run(*args):subprocess.run(args,cwd=ROOT,check=True)
library=json.loads((ROOT/'content/songs.json').read_text())
for song in SONGS:
 slug=song['slug']; beats=int(song['meter'][0]); source=FOLDER/'source'/f'{slug}.ly'
 right=[song['pickup']]+song['bars']; left=['r4']+[n+('2.' if beats==3 else '1')+'-5' for n in song['bass']]
 left[-1]=song['bass'][-1]+('2' if beats==3 else '2.')+'-5'
 lines=['\\version "2.26.0"',f'\\header {{ title = "{song["title"]}" subtitle = "Beginner piano arrangement · C major" composer = "{song["composer"]}" tagline = ##f }}', '#(set-global-staff-size 18)', '\\paper { top-margin = 10\\mm bottom-margin = 10\\mm ragged-last-bottom = ##t }','\\score {','\\new PianoStaff <<']
 for hand,bars in [('up',right),('down',left)]:
  lines+=['\\new Staff = "'+hand+'" {', '\\clef '+('treble' if hand=='up' else 'bass')+f' \\key c \\major \\numericTimeSignature \\time {song["meter"]} \\tempo 4 = 60 \\partial 4']
  for i,bar in enumerate(bars):lines.append(bar+(' |' if i<16 else '')+(' \\break' if i and i%4==0 else '')+' % '+str(i))
  lines+=['\\bar "|."','}']
 lines+=['>>','\\layout { }','\\midi { }','}'];source.write_text('\n'.join(lines)+'\n')
 with tempfile.TemporaryDirectory(prefix='migs-hymns-') as temporary:
  work=Path(temporary)
  run('lilypond','-o',str(work/'score'),str(source))
  for ext in ['pdf','midi']:shutil.copyfile(work/f'score.{ext}',FOLDER/f'{slug}.{ext}')
  run('lilypond','-dbackend=svg','-o',str(work/'score'),str(source))
  pages=sorted(work.glob('score-*.svg')) or [work/'score.svg'];viewboxes=[]
  for i,page in enumerate(pages,1):
   text=page.read_text();viewboxes.append(ET.fromstring(text).get('viewBox'))
   text=re.sub(r'<a[^>]+xlink:href="textedit:[^"]*"[^>]*>(.*?)</a>',r'<g>\1</g>',text,flags=re.S)
   (FOLDER/f'{slug}-page-{i}.svg').write_text(text)
  (work/'capture-source.ly').write_text(source.read_text().replace('\\layout { }','\\layout { \\context { \\Voice \\consists #capture-notes } }'))
  (work/'capture.ly').write_text('\\include "'+str(ROOT/'scripts/score-events.ily')+'"\n\\include "'+str(work/'capture-source.ly')+'"\n')
  run('lilypond','-dno-print-pages','-o',str(work/'capture'),str(work/'capture.ly'))
  performance=FOLDER/f'{slug}-performance.json'
  run(sys.executable,'scripts/import-midi.py',str(work/'score.midi'),str(performance),'--meter',song['meter'],'--pickup','1','--title',song['title']+' · '+song['meter'],'--description',f'Count {"1 2 3" if beats==3 else "1 & 2 & 3 & 4 &"}. Start the pickup on {beats}. Tempo counts quarter notes. Hold the left bass note until the next bar.')
  data=json.loads(performance.read_text()); finger_sequences={}
  # Omit the written continuation of a tie from the MIDI attack fingering list.
  for hand,bars in [('right',right),('left',left)]:
   fs=[];tied=False
   for token in ' '.join(bars).split():
    if token.startswith('r'):continue
    match=re.search(r'-([1-5])',token)
    if match and not tied:fs.append(int(match[1]))
    tied='~' in token
   finger_sequences[hand]=iter(fs)
  fingers={}
  for e in data['events']:
   for hand in ('right','left'):
    for n in e[hand]:
     if n['attack']:fingers[n['id']]=next(finger_sequences[hand])
     n['finger']=fingers[n['id']]
  for seq in finger_sequences.values():assert next(seq,None) is None
  data['fingeringNote']='Finger numbers are suggestions throughout. Move the right hand when its position changes. Left-hand finger 5 moves to each bass note; release the previous note before moving.'
  data['passages']=[{'id':'opening','label':'Opening · pickup + bars 1–4','from':0,'to':4},{'id':'full','label':'Complete tune · 16 bars','from':0,'to':16}]+[{'id':str(a),'label':f'Bars {a}–{b}','from':a,'to':b} for a,b in [(1,4),(4,8),(8,12),(12,16),(9,16)]]
  performance.write_text(json.dumps(data,separators=(',',':'))+'\n')
  run(sys.executable,'scripts/link-score.py',str(work/'capture-events.tsv'),str(work/'score'),'--performance',str(performance),'--output',str(FOLDER/f'{slug}-score-map.json'),'--timed')
  item=dict(id=slug,title=song['title'],artist=song['composer'],category='Hymns',defaultPassage='full',status='Complete beginner arrangement',summary=song['summary'],materialTitle='Melody and bass · score and practice player',materialDescription=song['material'],notesFile=f'{slug}-notes.md',practiceFile=f'{slug}-practice.md',exerciseFile=f'{slug}-performance.json',scoreMapFile=f'{slug}-score-map.json',notationFiles=[f'{slug}-page-{i}.svg' for i in range(1,len(pages)+1)],notationAlt=song['title']+' in C major, melody and single-note bass.',scoreViewBoxes=viewboxes,downloadFiles=[f'{slug}.pdf',f'{slug}.midi'])
  existing=next((s for s in library['songs'] if s['id']==slug),None)
  if existing is None:library['songs'].append(item)
  else:existing.update(item)
  for s in library['songs']:
   if s['id']=='fur-elise':s['category']='Classical'
   if s['id']=='dont-stop-believin':s['category']='Pop / rock'
(ROOT/'content/songs.json').write_text(json.dumps(library,ensure_ascii=False,indent=2)+'\n')
print('Built both hymns.')
