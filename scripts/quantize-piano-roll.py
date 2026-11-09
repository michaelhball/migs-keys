"""Combine sparse falling-note observations into a draft, beat-aligned note list.
Requires a visually confirmed MIDI keyboard calibration and a supplied tempo.
Review the resulting attacks and durations against the video before publishing.
"""
from pathlib import Path
import argparse,json
from collections import defaultdict
import numpy as np
p=argparse.ArgumentParser(description=__doc__);p.add_argument('observations',type=Path);p.add_argument('--output',type=Path,required=True);p.add_argument('--bpm',type=float,required=True);p.add_argument('--strike',type=float,default=475);p.add_argument('--until',type=float);p.add_argument('--speed',type=float)
p.add_argument('--min-speed',type=float,default=130);p.add_argument('--max-speed',type=float,default=160)
a=p.parse_args();data=json.loads(a.observations.read_text());observations=data['observations'];fps=data['fps']
if a.bpm<=0 or fps<=0 or (a.speed is not None and a.speed<=0):p.error('Tempo, frame rate and scroll speed must be positive.')
frames=defaultdict(list)
for o in observations:frames[round(o['time'],4)].append(o)
velocities=[];times=sorted(frames)
for before,after in zip(times,times[1:]):
 if after-before>1.1/fps:continue
 for o in frames[before]:
  if o['clippedBottom']:continue
  for n in frames[after]:
   if n['clippedBottom'] or n['hand']!=o['hand'] or n['midi']!=o['midi']:continue
   speed=(n['bottom']-o['bottom'])/(after-before)
   if a.min_speed<speed<a.max_speed:velocities.append(speed)
if not a.speed and not velocities:p.error('No scroll speed found. Check calibration or supply --speed.')
speed=a.speed or float(np.mean(velocities))
def clusters(values,tolerance=.07):
 result=[]
 for value in sorted(values):
  if not result or value-np.mean(result[-1])>tolerance:result.append([value])
  else:result[-1].append(value)
 return [(float(np.median(c)),len(c)) for c in result if len(c)>=2]
starts=defaultdict(list);ends=defaultdict(list)
for o in observations:
 key=(o['hand'],o['midi'])
 if not o['clippedBottom']:starts[key].append(o['time']+(a.strike-o['bottom'])/speed)
 if not o['clippedTop']:ends[key].append(o['time']+(a.strike-o['top'])/speed)
starts={k:clusters(v) for k,v in starts.items()};ends={k:clusters(v) for k,v in ends.items()}
if not any(starts.values()):p.error('No consistent note attacks found.')
first=min(t for values in starts.values() for t,_ in values);beat=60/a.bpm;notes=[]
for (hand,midi),values in starts.items():
 for start,observed in values:
  if a.until and start>=a.until:continue
  end=next((t for t,n in ends.get((hand,midi),[]) if t>start+.06),None)
  if end is None:continue
  onset=round((start-first)/beat*2)/2
  duration=max(.5,round((end-start)/beat*2)/2)
  error=(start-first)/beat-onset
  notes.append(dict(hand=hand,midi=midi,start=onset,beats=duration,videoStart=round(start,4),videoEnd=round(end,4),onsetError=round(error,4),observations=observed))
notes.sort(key=lambda n:(n['start'],n['hand'],n['midi']))
if not notes:p.error('No complete notes found in this interval.')
a.output.parent.mkdir(parents=True,exist_ok=True)
a.output.write_text(json.dumps(dict(bpm=a.bpm,scrollSpeed=speed,videoStart=first,notes=notes),indent=2)+'\n')
print(f'{len(notes)} notes; speed {speed:.3f} px/s; first onset {first:.3f}s; maximum grid error {max(abs(n["onsetError"]) for n in notes):.3f} beats')
