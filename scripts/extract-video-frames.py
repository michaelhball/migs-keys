"""Extract a small, timestamped set of frames with FFmpeg, seeking per image.
Examples:
  python3 scripts/extract-video-frames.py VIDEO --every 60 --out data/video-review/journey
  python3 scripts/extract-video-frames.py VIDEO --times 30,90,330,810,870,930 --width 1920 --out data/video-review/journey/detail
Only the requested images are decoded/extracted. No AI service is called.
"""
from pathlib import Path
import argparse,json,re,shutil,subprocess
parser=argparse.ArgumentParser();parser.add_argument('video',type=Path);parser.add_argument('--every',type=float,default=60);parser.add_argument('--times');parser.add_argument('--width',type=int,default=640);parser.add_argument('--crop',help='Optional width:height:x:y crop after scaling');parser.add_argument('--out',type=Path,required=True)
a=parser.parse_args();ffmpeg=shutil.which('ffmpeg');ffprobe=shutil.which('ffprobe')
if not ffmpeg or not ffprobe:parser.error('FFmpeg and ffprobe are required.')
if a.every<=0 or a.width<100:parser.error('Use a positive interval and a width of at least 100.')
if a.crop and not re.fullmatch(r'\d+:\d+:\d+:\d+',a.crop):parser.error('Crop must be width:height:x:y in pixels.')
info=json.loads(subprocess.check_output([ffprobe,'-v','error','-show_entries','format=duration','-of','json',str(a.video)]));duration=float(info['format']['duration'])
times=[float(t) for t in a.times.split(',')] if a.times else [min(duration-.1,30+i*a.every) for i in range(max(1,int(duration/a.every)))];a.out.mkdir(parents=True,exist_ok=True)
manifest=a.out/'frames.json'
previous=json.loads(manifest.read_text()) if manifest.exists() else {}
if previous and previous.get('source')!=a.video.name:parser.error('This output folder contains frames from another video.')
records={record['image']:record for record in previous.get('frames',[])}
for second in times:
 if not 0<=second<duration:parser.error(f'Timestamp out of range: {second}')
 name=f'{second:08.2f}s.jpg';output=a.out/name
 filters=f'scale={a.width}:-1'+(f',crop={a.crop}' if a.crop else '')
 subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-ss',str(second),'-i',str(a.video),'-frames:v','1','-vf',filters,'-q:v','3','-y',str(output)],check=True)
 records[name]={'seconds':second,'image':name,'width':a.width,'crop':a.crop}
manifest.write_text(json.dumps({'source':a.video.name,'duration':duration,'frames':sorted(records.values(),key=lambda r:r['seconds'])},indent=2)+'\n')
print(f'Extracted {len(times)} frames to {a.out}')
