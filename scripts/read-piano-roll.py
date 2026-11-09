"""Read coloured falling-note rectangles from a user-supplied tutorial locally.

uv run python scripts/read-piano-roll.py VIDEO --output data/video-review/roll.json
Samples only the roll region (6 fps by default), not a full-frame image sequence.
The output is observations for review, not a claim of a verified transcription.
Keyboard coordinates are expressed after scaling to --width; green=right,
blue=left. Supply calibration explicitly for a different tutorial layout.
"""
from pathlib import Path
import argparse, json, subprocess
import numpy as np

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('video',type=Path)
parser.add_argument('--output',type=Path,required=True)
parser.add_argument('--start',type=float,default=8)
parser.add_argument('--end',type=float,default=40)
parser.add_argument('--fps',type=float,default=6)
parser.add_argument('--width',type=int,default=1280)
parser.add_argument('--top',type=int,default=233)
parser.add_argument('--height',type=int,default=242)
parser.add_argument('--first-midi',type=int,default=36)
parser.add_argument('--first-center',type=float,default=18.3)
parser.add_argument('--key-width',type=float,default=36.57)
a=parser.parse_args()
if a.end<=a.start or a.fps<=0:parser.error('Choose a positive interval and frame rate.')
# C through B, with black-key centres at boundaries between adjacent whites.
keys=[]
for octave in range(5):
 for offset,white in [(0,0),(2,1),(4,2),(5,3),(7,4),(9,5),(11,6)]:
  keys.append((a.first_midi+12*octave+offset,a.first_center+(7*octave+white)*a.key_width,10))
 for offset,white in [(1,.5),(3,1.5),(6,3.5),(8,4.5),(10,5.5)]:
  keys.append((a.first_midi+12*octave+offset,a.first_center+(7*octave+white)*a.key_width,5))
def components(mask):
 """Connected pixel runs retain rectangle outlines around white note letters."""
 parents=[];boxes=[];previous=[]
 def root(i):
  while parents[i]!=i: parents[i]=parents[parents[i]];i=parents[i]
  return i
 for y,row in enumerate(mask):
  edges=np.diff(np.r_[False,row,False].astype(np.int8))
  starts=np.flatnonzero(edges==1); ends=np.flatnonzero(edges==-1)
  current=[]
  for x0,x1 in zip(starts,ends):
   touching={root(i) for p0,p1,i in previous if p0<=x1 and p1>=x0}
   if touching:
    i=min(touching)
    for other in touching:
     if other!=i:
      parents[other]=i;b=boxes[other];a=boxes[i];boxes[i]=[min(a[0],b[0]),min(a[1],b[1]),max(a[2],b[2]),max(a[3],b[3])]
    box=boxes[i];boxes[i]=[min(box[0],int(x0)),box[1],max(box[2],int(x1)),y+1]
   else:
    i=len(parents);parents.append(i);boxes.append([int(x0),y,int(x1),y+1])
   current.append((x0,x1,i))
  previous=current
 return [box for i,box in enumerate(boxes) if root(i)==i]

command=['ffmpeg','-v','error','-ss',str(a.start),'-i',str(a.video),'-t',str(a.end-a.start),'-vf',f'scale={a.width}:-1,fps={a.fps},crop={a.width}:{a.height}:0:{a.top}', '-f','rawvideo','-pix_fmt','rgb24','-']
process=subprocess.Popen(command,stdout=subprocess.PIPE)
size=a.width*a.height*3;observations=[];index=0
while True:
 raw=process.stdout.read(size)
 if not raw:break
 if len(raw)!=size:raise RuntimeError('Incomplete video frame.')
 rgb=np.frombuffer(raw,np.uint8).reshape(a.height,a.width,3).astype(np.int16)
 red,green,blue=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
 masks={'right':(green>100)&(green>red*1.12)&(green>blue*1.35),
        'left':(blue>40)&(blue>red*1.15)&(green>red*1.08)&(blue<green*2.7)}
 for hand,mask in masks.items():
  for x0,y0,x1,y1 in components(mask):
   if x1-x0<12 or y1-y0<10:continue
   black=(x1-x0)<28
   candidates=[(m,x,e) for m,x,e in keys if (e==5)==black]
   midi,x,_=min(candidates,key=lambda k:abs(k[1]-(x0+x1)/2))
   if abs(x-(x0+x1)/2)>9:continue
   observations.append(dict(time=round(a.start+index/a.fps,5),hand=hand,midi=midi,top=y0+a.top,bottom=y1+a.top,width=x1-x0,clippedTop=y0<=2,clippedBottom=y1>=a.height-2))
 index+=1
if process.wait():raise RuntimeError('FFmpeg failed.')
a.output.parent.mkdir(parents=True,exist_ok=True)
a.output.write_text(json.dumps({'fps':a.fps,'start':a.start,'end':a.end,'width':a.width,'observations':observations},indent=2)+'\n')
print(f'{index} cropped samples; {len(observations)} rectangle observations. Review before use.')
