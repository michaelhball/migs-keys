"""Rebuild score, MIDI, playback and synchronisation data with LilyPond 2.26.
Run from the repository root. Requires lilypond and Python 3; no pip packages.
"""
from pathlib import Path
import subprocess,tempfile,shutil,re,sys
root=Path(__file__).resolve().parent.parent;folder=root/'content/songs';source=folder/'source/fur-elise.ly'
with tempfile.TemporaryDirectory(prefix='migs-score-') as temporary:
 work=Path(temporary)
 def run(*args):subprocess.run(args,cwd=root,check=True)
 run('lilypond','-o',str(work/'score'),str(source))
 shutil.copyfile(work/'score.pdf',folder/'fur-elise.pdf')
 run('lilypond','-dbackend=svg','-o',str(work/'score'),str(source))
 for page in range(1,4):
  text=(work/f'score-{page}.svg').read_text()
  # Preserve attribution links; strip only local editor links from public assets.
  text=re.sub(r'<a[^>]+xlink:href="textedit:[^"]*"[^>]*>(.*?)</a>',r'<g>\1</g>',text,flags=re.S)
  (folder/f'fur-elise-page-{page}.svg').write_text(text)
 unfolded=source.read_text().replace('\\new PianoStaff','\\unfoldRepeats \\new PianoStaff').replace('\\layout { }','\\layout { \\context { \\Voice \\consists #capture-notes } }')
 (work/'unfolded.ly').write_text(unfolded)
 (work/'capture.ly').write_text('\\include "'+str(root/'scripts/score-events.ily')+'"\n\\include "'+str(work/'unfolded.ly')+'"\n')
 run('lilypond','-dno-print-pages','-o',str(work/'performance'),str(work/'capture.ly'))
 shutil.copyfile(work/'performance.midi',folder/'fur-elise.midi')
 run(sys.executable,'scripts/import-midi.py',str(work/'performance.midi'),str(folder/'fur-elise-performance.json'))
 run(sys.executable,'scripts/suggest-fingerings.py')
 run(sys.executable,'scripts/link-score.py',str(work/'performance-events.tsv'),str(work/'score'))
