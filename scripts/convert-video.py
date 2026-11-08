"""Create a compatible H.264/AAC MP4 without replacing the source.
Usage: python3 scripts/convert-video.py INPUT --output OUTPUT.mp4
Defaults to a sibling .mp4. Uses macOS hardware encoding where available.
"""
from pathlib import Path
import argparse,json,platform,shutil,subprocess
parser=argparse.ArgumentParser();parser.add_argument('input',type=Path);parser.add_argument('--output',type=Path);parser.add_argument('--bitrate',default='8M');a=parser.parse_args()
output=a.output or a.input.with_suffix('.mp4')
if output.resolve()==a.input.resolve() or output.exists():parser.error('Choose a new output path; existing files are never overwritten.')
ffmpeg=shutil.which('ffmpeg');ffprobe=shutil.which('ffprobe')
if not ffmpeg or not ffprobe:parser.error('Install FFmpeg first.')
encoders=subprocess.check_output([ffmpeg,'-hide_banner','-encoders'],text=True)
codec=['-c:v','h264_videotoolbox','-b:v',a.bitrate] if platform.system()=='Darwin' and 'h264_videotoolbox' in encoders else ['-c:v','libx264','-crf','20','-preset','fast']
subprocess.run([ffmpeg,'-hide_banner','-loglevel','warning','-stats','-n','-i',str(a.input),'-map','0:v:0','-map','0:a:0?',*codec,'-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',str(output)],check=True)
info=json.loads(subprocess.check_output([ffprobe,'-v','error','-show_entries','stream=codec_name,width,height:format=duration,size','-of','json',str(output)]))
print(json.dumps(info,indent=2))
