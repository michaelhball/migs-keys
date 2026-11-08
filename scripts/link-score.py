"""Link playback attacks to notehead positions in the original LilyPond SVGs.
Usage: python3 scripts/link-score.py EVENT_LOG SVG_PREFIX
The source event log comes from an unfolded layout with score-events.ily.
"""
from pathlib import Path
from fractions import Fraction
import json,re,sys,xml.etree.ElementTree as ET
p=Path('content/songs/fur-elise-performance.json');d=json.loads(p.read_text())
source={'right':[],'left':[]}
for line in Path(sys.argv[1]).read_text().splitlines():
 staff,moment,grace,pitch,row,col=line.split('\t')
 source['right' if staff=='up' else 'left'].append((Fraction(moment),Fraction(grace),int(pitch),f's{row}-{col}'))
played={'right':[],'left':[]};time=0
for event in d['events']:
 for hand in played:
  for note in event[hand]:
   if note['attack']:played[hand].append((round(time,6),note['midi'],note['id']))
 time+=event['beats']
ids={}
for hand in source:
 src=sorted(source[hand],key=lambda x:(x[0],x[1],x[2]));notes=sorted(played[hand])
 assert len(src)==len(notes)
 for origin,note in zip(src,notes):
  assert origin[2]==note[1],(hand,origin,note)
  ids[note[2]]=origin[3]
for event in d['events']:
 for hand in played:
  for note in event[hand]:note['scoreKey']=ids[note['id']]
p.write_text(json.dumps(d,separators=(',',':'))+'\n')
ns='{http://www.w3.org/2000/svg}';xlink='{http://www.w3.org/1999/xlink}'
positions={};all_keys=set(ids.values())
for page in range(1,4):
 svg=ET.parse(f'{sys.argv[2]}-{page}.svg').getroot()
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
   if not (shape.startswith('M0 -46') or shape.startswith('M0 -42') or shape.startswith('M0 -34') or shape.startswith('M0 -40')):continue
   x,y=map(float,transform.groups())
   staff=min(tops,key=lambda top:abs(y-(top+2)))
   # Marker is always above the staff and above high ledger notes.
   positions[key]={'page':page,'x':x+.65,'y':min(staff-2.0,y-2.0)}
missing=all_keys-positions.keys()
print('Linked',len(ids),'playback notes;',len(positions),'printed positions; missing',len(missing))
if missing:print(sorted(missing)[:30]);raise SystemExit(1)
Path('content/songs/fur-elise-score-map.json').write_text(json.dumps(positions,separators=(',',':'))+'\n')
