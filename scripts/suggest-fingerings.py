"""Add provisional fingerings to a MIDI-derived performance.
Keeps held notes on the same finger, orders fingers within chords, and uses a
beam search to prefer modest hand shifts. These are practice suggestions,
not a published fingering edition. The opening melody is fixed explicitly.
"""
from pathlib import Path
from itertools import combinations
import json
p=Path('content/songs/fur-elise-performance.json'); d=json.loads(p.read_text())
# Fix the initial nine melody notes; find by note ID rather than event index.
attacks=[]
for e in d['events']:
 for n in e['right']:
  if n['attack'] and n['id'] not in [x['id'] for x in attacks]: attacks.append(n)
fixed={n['id']:f for n,f in zip(attacks,[5,4,5,4,5,2,4,3,1,1,2,4,5,1,2,4,5,1,5,4])}
for e in d['events']:
 if e['bar']<=8:
  for n in e['left']:
   if n['midi'] in (45,40,52,57,56): fixed[n['id']]={45:5,40:5,52:2,57:1,56:1}[n['midi']]
for hand in ('right','left'):
 direction=1 if hand=='right' else -1
 # state: total cost, held id->finger, previous attack (pitch,finger), hand position, assignment history
 beam=[(0,{},None,None,{})]
 for e in d['events']:
  notes=sorted(e[hand],key=lambda n:direction*n['midi'])
  if not notes:
   beam=[(cost,{},last,pos,hist) for cost,_,last,pos,hist in beam]
   continue
  candidates=[]
  for cost,held,last,pos,hist in beam:
   for fs in combinations(range(1,6),len(notes)):
    if any((n['id'] in held and held[n['id']]!=f) or (n['id'] in fixed and fixed[n['id']]!=f) for n,f in zip(notes,fs)):continue
    # A hand position measured from an approximate thumb location.
    offsets=[0,2,4,5.5,7]
    positions=[direction*n['midi']-offsets[f-1] for n,f in zip(notes,fs)]
    center=sum(positions)/len(positions)
    extra=sum((x-center)**2 for x in positions)*.4
    if pos is not None:extra+=abs(center-pos)*.18
    attacks_now=[(n,f) for n,f in zip(notes,fs) if n['id'] not in held]
    for n,f in attacks_now:
     pitch=direction*n['midi']
     if f==1 and n['midi']%12 in (1,3,6,8,10):extra+=1.2
     if last:
      oldpitch,oldf=last; delta=pitch-oldpitch; df=f-oldf
      if delta and not df:extra+=max(0,3-abs(delta)*.15)
      if delta*df<0:
       extra+=.6 if (delta>0 and f==1) or (delta<0 and oldf==1) else 7
      if not delta and df:extra+=.2
      if abs(delta)<=4 and abs(df)>2:extra+=1.4
     last_note=(pitch,f)
    newheld={n['id']:f for n,f in zip(notes,fs)}
    candidates.append((cost+extra,newheld,last_note if attacks_now else last,center,{**hist,**newheld}))
  if not candidates:raise ValueError('No fingering candidate')
  # Keep diverse current hand configurations, with the best past for each.
  unique={}
  for candidate in sorted(candidates,key=lambda x:x[0]):
   key=(tuple(candidate[1].items()),candidate[2])
   if key not in unique:unique[key]=candidate
  beam=list(unique.values())[:36]
 chosen=min(beam,key=lambda x:x[0])[4]
 for e in d['events']:
  for n in e[hand]:n['finger']=chosen[n['id']]
d['fingeringNote']='Finger numbers are suggestions. The opening melody is set explicitly; later fingerings are automatically suggested and may need adjustment for your hand.'
p.write_text(json.dumps(d,separators=(',',':'))+'\n')
print('Assigned fingers to both hands throughout; held-note and chord constraints enforced.')
