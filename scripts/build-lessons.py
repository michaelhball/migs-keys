"""Build original lesson exercises 7–12 into course.json. Python standard library.
The Ode to Joy opening is Beethoven's public-domain melody, transposed to C/G.
All other exercises and accompaniments are original to this course.
"""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
p=root/'content/course.json';course=json.loads(p.read_text())
def event(right=(),left=(),beats=1,rf=None,lf=None):
 def notes(pitches,fingers):return [dict(midi=n,finger=f) for n,f in zip(pitches,fingers or [1]*len(pitches))]
 return dict(beats=beats,right=notes(right,rf),left=notes(left,lf))
def melody(values,fingers,durations=None):return [event([n],beats=d,rf=[f]) for n,f,d in zip(values,fingers,durations or [1]*len(values))]
# A one-octave scale followed by a shaped eight-bar melody using the full octave.
scale=melody([60,62,64,65,67,69,71,72,72,71,69,67,65,64,62,60],[1,2,3,1,2,3,4,5,5,4,3,2,1,3,2,1])
melody7=[]
for ns,fs,ds in [([60,62,64,65],[1,2,3,1],[1]*4),([67,69,71,72],[2,3,4,5],[1]*4),([72,71,69,67],[5,4,3,2],[1]*4),([65,64,62],[1,3,2],[1,1,2]),([60,64,67],[1,3,5],[1,1,2]),([65,69,72],[1,3,5],[1,1,2]),([71,69,67,65],[4,3,2,1],[1]*4),([64,62,60],[3,2,1],[1,1,2])]:melody7+=melody(ns,fs,ds)
chords={'C':([60,64,67],48),'Am':([57,60,64],45),'F':([60,65,69],41),'G':([59,62,67],43)}
root_chords={'C':[60,64,67],'Am':[57,60,64],'F':[65,69,72],'G':[67,71,74]}
# Lesson 8 introduces only C major and A minor before F/G are added in Lesson 9.
ex8=[]
for name in ['C','C','Am','Am','C','Am','Am','C']:
 ex8 += [event(root_chords[name],beats=2,rf=[1,3,5]),event(beats=2)]
# Root-position changes: one bass/chord attack per half bar, all notes release together.
ex9=[]
for name in ['C','Am','F','G']*2:
 for _ in range(2):ex9.append(event(root_chords[name],[chords[name][1]],2,[1,3,5],[5]))
# Compact inversions reduce RH travel. A 16-bar accompaniment has an ending on C.
ex10=[]
for name in ['C','Am','F','G']*3+['C','F','G','C']:
 for _ in range(2):ex10.append(event(chords[name][0],[chords[name][1]],2,[1,3,5],[5]))
ode=[([64,64,65,67],[1,1,1,1]),([67,65,64,62],[1,1,1,1]),([60,60,62,64],[1,1,1,1]),([64,62,62],[1.5,.5,2]),([64,64,65,67],[1,1,1,1]),([67,65,64,62],[1,1,1,1]),([60,60,62,64],[1,1,1,1]),([62,60,60],[1.5,.5,2])]
ex11=[]
for ns,ds in ode:ex11+=melody(ns,[{60:1,62:2,64:3,65:4,67:5}[n] for n in ns],ds)
ex12=[]
for shift in [0,7]:
 for ns,ds in ode[:4]:ex12+=melody([n+shift for n in ns],[{60:1,62:2,64:3,65:4,67:5}[n] for n in ns],ds)
data={
7:('07-c-major.md','C major: a full octave','Move beyond the five-note position and play an eight-bar melody.',dict(title='Scale, then an eight-bar melody',events=scale+melody7),['I can find A4, B4 and C5 on the staff and keyboard.','I can pass my thumb after E4 without twisting or rushing.','I can play the eight-bar melody in short sections.']),
8:('08-first-chords.md','C major and A minor chords','Play two three-note chords, hear the difference, and change between them.',dict(title='C major and A minor chord study',events=ex8),['I can play C–E–G together with fingers 1–3–5.','I can move the whole right hand to A3–C4–E4 for A minor.','I can release each chord for two beats and prepare the next one.']),
9:('09-pop-accompaniment.md','A four-chord pop accompaniment','Add F and G chords and play an eight-bar accompaniment with bass notes.',dict(title='C–Am–F–G accompaniment',events=ex9),['I can find the four root-position chords without guessing the keys.','I can match each chord with its left-hand bass note.','I can play the full eight-bar loop with a steady half-note rhythm.']),
10:('10-inversions.md','Chord inversions and a longer accompaniment','Keep the right hand in a smaller area while playing a 16-bar accompaniment.',dict(title='Sixteen-bar accompaniment with inversions',events=ex10),['I can explain a chord’s root separately from its lowest note.','I can play the written C, Am, F and G shapes near middle C.','I can join the four-bar groups and end on C.']),
11:('11-ode-to-joy.md','Ode to Joy: rhythm and phrasing','Play Beethoven’s eight-bar opening theme with its dotted rhythm.',dict(title='Ode to Joy · opening theme in C',events=ex11),['I can count a dotted quarter plus an eighth as 1 & 2 &.','I can play the eight-bar melody without shortening its half notes.','I can shape the two phrases while keeping the rhythm clear.']),
12:('12-by-ear.md','Play by ear and move a melody','Find a phrase by ear, then move Ode to Joy from C to G.',dict(title='Ode to Joy phrase · C, then G',events=ex12),['I can find a short phrase by listening before checking the score.','I can play the same finger pattern from C4 and from G4.','I can explain that transposing keeps the intervals and rhythm.'])}
for number,(file,title,desc,exercise,checks) in data.items():
 item=course['lessons'][number-1]
 exercise['description']='Four quarter-note beats per bar. Tempo counts quarter notes. Finger numbers are suggestions.'
 item.update(title=title,description=desc,focus=title,duration=25,status='ready',defaultView='notation',file=file,exercise=exercise,checkpoints=checks)
p.write_text(json.dumps(course,ensure_ascii=False,indent=2)+'\n')
print('Built lessons 7–12')
