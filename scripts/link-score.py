"""Link playback attacks to notehead positions in the original LilyPond SVGs.
Usage: python3 scripts/link-score.py EVENT_LOG SVG_PREFIX
The source event log comes from an unfolded layout with score-events.ily.
"""
from pathlib import Path
from fractions import Fraction
import argparse,json,re,xml.etree.ElementTree as ET
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('event_log',type=Path);parser.add_argument('svg_prefix')
parser.add_argument('--performance',type=Path,default=Path('content/songs/fur-elise-performance.json'))
parser.add_argument('--output',type=Path,default=Path('content/songs/fur-elise-score-map.json'))
parser.add_argument('--timed',action='store_true',help='Match by score time; supports tied continuations (no grace notes)')
args=parser.parse_args();p=args.performance;d=json.loads(p.read_text())
source={'right':[],'left':[]}
for line in args.event_log.read_text().splitlines():
 staff,moment,grace,pitch,row,col=line.split('\t')
 source['right' if staff=='up' else 'left'].append((Fraction(moment),Fraction(grace),int(pitch),f's{row}-{col}'))
played={'right':[],'left':[]};time=0
for event in d['events']:
 for hand in played:
  for note in event[hand]:
   if note['attack']:played[hand].append((round(time,6),note['midi'],note['id']))
 time+=event['beats']
ids={};all_keys=set()
if args.timed:
 # A tied note has one MIDI attack but several printed heads. Move the marker
 # to each continuation without retriggering the sound.
 at={hand:{} for hand in source}
 for hand,origins in source.items():
  for moment,grace,pitch,key in origins:
   assert not grace, 'Timed matching does not support grace notes.'
   at[hand].setdefault(round(float(moment)*d['meter'][1],6),{})[pitch]=key
 current={hand:{} for hand in source};time=0
 for event in d['events']:
  for hand in source:
   current[hand].update(at[hand].get(round(time,6),{}))
   for note in event[hand]:
    note['scoreKey']=current[hand][note['midi']]
    all_keys.add(note['scoreKey']);ids[note['id']]=note['scoreKey']
  time+=event['beats']
else:
 for hand in source:
  src=sorted(source[hand],key=lambda x:(x[0],x[1],x[2]));notes=sorted(played[hand])
  assert len(src)==len(notes)
  for origin,note in zip(src,notes):
   assert origin[2]==note[1],(hand,origin,note)
   ids[note[2]]=origin[3]
 for event in d['events']:
  for hand in played:
   for note in event[hand]:note['scoreKey']=ids[note['id']]
 all_keys=set(ids.values())
p.write_text(json.dumps(d,separators=(',',':'))+'\n')
ns='{http://www.w3.org/2000/svg}';xlink='{http://www.w3.org/1999/xlink}'
positions={}
prefix=Path(args.svg_prefix)
files=sorted(prefix.parent.glob(prefix.name+'-*.svg'),key=lambda f:int(f.stem.rsplit('-',1)[1]))
if not files:files=[prefix.with_suffix('.svg')]
for page,file in enumerate(files,1):
 svg=ET.parse(file).getroot()
 staff_ys=[]
 for group in svg.iter(ns+'g'):
  match=re.fullmatch(r'translate\(([\d.-]+), ([\d.-]+)\)',group.get('transform',''))
  if match and group.find(ns+'line') is not None:staff_ys.append(float(match[2]))
 # Each set of five lines yields a top line; deduplicate identical line positions.
 ys=sorted(set(staff_ys));tops=[];i=0
 while i<len(ys):
  if i+4<len(ys) and abs(ys[i+4]-ys[i]-4)<.01:tops.append(ys[i]);i+=5
  else:i+=1
 for anchor in svg.iter(ns+'a'):
  href=anchor.get(xlink+'href','');match=re.search(r':(\d+):(\d+):\d+$',href)
  if not match:continue
  key=f's{match[1]}-{match[2]}'
  if key not in all_keys:continue
  # Noteheads have a compact scaled outline. Beams/slurs and text are excluded.
  for group in anchor.findall(ns+'g'):
   path=group.find(ns+'path');transform=re.fullmatch(r'translate\(([\d.-]+), ([\d.-]+)\)',group.get('transform',''))
   if path is None or not transform:continue
   shape=path.get('d','')
   # Emmentaler noteheads at the 18/20-point staff sizes used by our scores.
   if not shape.startswith(('M0 -46','M0 -45','M0 -42','M0 -34','M0 -40','M74 -105','M343 -25')):continue
   x,y=map(float,transform.groups())
   staff=min(tops,key=lambda top:abs(y-(top+2)))
   # Marker is always above the staff and above high ledger notes.
   positions[key]={'page':page,'x':x+.65,'y':min(staff-2.0,y-2.0)}
missing=all_keys-positions.keys()
print('Linked',len(ids),'playback notes;',len(positions),'printed positions; missing',len(missing))
if missing:print(sorted(missing)[:30]);raise SystemExit(1)
args.output.write_text(json.dumps(positions,separators=(',',':'))+'\n')
