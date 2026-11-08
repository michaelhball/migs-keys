"""Check semantic invariants in the authored theory library, not just packaging.
Manual review of explanations and rendered diagrams is still required.
"""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
notes=json.loads((root/'content/anki/notes.json').read_text());byid={n['id']:n for n in notes}
images=json.loads((root/'content/anki/images.json').read_text())
assert len(notes)==len(byid)
# Scientific pitch notation: LilyPond unmarked c is C3; c' is C4.
for id,n in byid.items():
 m=re.fullmatch(r'(treble|bass)-([a-g])([2-5])',id)
 if not m:continue
 clef,letter,octave=m.groups();music=images[id]['music']
 spelling=re.fullmatch(r"([a-g])([,']*)([1248])",music)
 assert spelling,(id,music)
 actual_octave=3+spelling[2].count("'")-spelling[2].count(',')
 assert (spelling[1],actual_octave)==(letter,int(octave)),(id,music)
 assert images[id]['clef']==clef
 assert letter.upper()+octave in n['back'] and letter.upper()+octave in n['reverseAnswer']
assert images['bass-clef']['clef']=='bass'
assert images['treble-clef']['clef']=='treble'
assert 'F3' in byid['bass-anchor']['back'] and 'fourth' in byid['bass-anchor']['back']
assert 'G4' in byid['treble-anchor']['back'] and 'second' in byid['treble-anchor']['back']
for key,music in {'quarter-note':"e'4",'half-note':"e'2",'whole-note':"e'1",'eighth-note':"e'8",'sixteenth-note':"e'16",'dotted-quarter':"e'4.",'quarter-rest':'r4','half-rest':'r2','whole-rest':'r1','eighth-rest':'r8','sixteenth-rest':'r16'}.items():
 assert images[key]['music']==music,(key,images[key])
for key,music in {'c-major':"<c' e' g'>2",'c-minor':"<c' ees' g'>2",'c-diminished':"<c' ees' ges'>2",'c-augmented':"<c' e' gis'>2",'c7':"<c' e' g' bes'>2",'cmaj7':"<c' e' g' b'>2",'cm7':"<c' ees' g' bes'>2",'cm7flat5':"<c' ees' ges' bes'>2",'cdim7':"<c' ees' ges' beses'>2"}.items():
 assert images['chord-'+key]['music']==music
for id,n in byid.items():
 assert n['front'] and n['back']
 assert bool(n['reverse'])==bool(n['reverseAnswer']),id
 for key in ('front','back','reverse','reverseAnswer','extra'):
  for file in re.findall(r'<img[^>]+src="([^"]+)"',n[key]):assert (root/'content/anki/media'/file).exists(),(id,file)
# These must not enter any beginner package through lesson 12.
for id in ['neapolitan','triad-formula-diminished','cadence-authentic','degree-2','enharmonic','triad-figure-first-inversion']:
 assert byid[id]['lesson']>12,(id,byid[id]['lesson'])
first6=[n for n in notes if n['pack']=='course' and n['lesson']<=6]
assert len(first6)==44 and sum(1+bool(n['reverse']) for n in first6)==70
course=json.loads((root/'content/course.json').read_text())
for lesson in course['lessons']:
 if lesson.get('file'):assert (root/'content/lessons'/lesson['file']).is_file()
print(f'Checked {len(notes)} facts, {len(images)} notation specifications, reverse fields and lesson-release boundaries.')
