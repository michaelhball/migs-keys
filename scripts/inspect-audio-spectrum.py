"""Inspect pitched spectral peaks in local audio at selected timestamps.

This is a review aid, not an automatic transcription: peaks can be overtones,
and sustained/pedalled notes can remain audible after their written duration.
FFmpeg decodes to mono; NumPy does the FFT. No audio leaves this computer.
"""
import argparse
import json
from pathlib import Path
import subprocess
import numpy as np

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('audio',type=Path)
    p.add_argument('--times',required=True,help='Comma-separated seconds at window starts')
    p.add_argument('--window',type=float,default=.12)
    p.add_argument('--min-midi',type=int,default=36)
    p.add_argument('--max-midi',type=int,default=88)
    p.add_argument('--output',type=Path,required=True)
    a=p.parse_args()
    if a.window<=0:p.error('Window must be positive.')
    rate=22050
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(a.audio),'-vn','-ac','1','-ar',str(rate),'-f','f32le','-'])
    samples=np.frombuffer(raw,dtype='<f4'); rows=[]
    for second in map(float,a.times.split(',')):
        start=round(second*rate);size=round(a.window*rate)
        if start<0 or start+size>len(samples):p.error('Timestamp outside the recording.')
        segment=samples[start:start+size];nfft=2**int(np.ceil(np.log2(size*4)))
        spectrum=np.abs(np.fft.rfft(segment*np.hanning(size),n=nfft))
        peaks=np.flatnonzero((spectrum[1:-1]>spectrum[:-2])&(spectrum[1:-1]>spectrum[2:]))+1
        reference=max(float(spectrum.max()),1e-12);notes=[]
        for i in peaks:
            frequency=i*rate/nfft
            if frequency<=0:continue
            value=69+12*np.log2(frequency/440);midi=round(value)
            if not a.min_midi<=midi<=a.max_midi:continue
            db=20*np.log10(max(float(spectrum[i]),1e-12)/reference)
            if db < -30:continue
            name=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][midi%12]+str(midi//12-1)
            notes.append(dict(midi=midi,note=name,cents=round((value-midi)*100),db=round(db,1),hz=round(frequency,1)))
        notes.sort(key=lambda n:n['db'],reverse=True)
        rows.append(dict(seconds=second,window=a.window,peaks=notes))
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(rows,indent=2)+'\n')
    for row in rows:print(row['seconds'], ' '.join(f'{n["note"]}:{n["db"]}' for n in row['peaks'][:10]))

if __name__=='__main__':main()
