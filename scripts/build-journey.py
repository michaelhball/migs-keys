"""Build the tutorial-based Journey piano accompaniment and player assets.
Source/inspection notes: content/songs/journey-source-review.md.
Requires LilyPond 2.26; Python standard library only. No source video needed.
"""
from pathlib import Path
import json,re,shutil,subprocess,sys,tempfile,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent
folder=root/'content/songs'; slug='dont-stop-believin'
# E-major spelling, absolute LilyPond pitches (c' = middle C).
def pitch(n):
    names=['c','cis','d','dis','e','f','fis','g','gis','a','ais','b']
    octave=n//12-4
    return names[n%12]+("'"*octave if octave>=0 else ','*(-octave))
def chord(notes):return pitch(notes[0]) if len(notes)==1 else '<'+' '.join(map(pitch,notes))+'>'
def riff(pair,low):return ' '.join(chord(pair)+'8 '+pitch(low)+'8' for _ in range(4))
E=riff([64,71],59);B=riff([66,71],59);C=E;A=riff([61,69],57);G=riff([63,71],59)
# These fixed, repeatable voicings are the practice arrangement, rather than
# every omitted chord tone or ornamental variation in the performance.
right=[];left=[]
def put(r,l):right.append(r);left.append(l)
def walk(first,run):return pitch(first)+'2~ '+pitch(first)+'8 '+' '.join(pitch(n)+'8' for n in run)
def four(second='c',end_low=False):
    put(E,walk(40,[42,44,47])+'~')
    if second=='c':
        put(B,walk(47,[49,51,49])+'~')
        put(C,walk(49,[51,52,45])+'~')
    else:
        put(B,walk(47,[49,51,44])+'~')
        put(G,walk(44,[56,44,45])+'~')
    put(A,walk(45,[51,52,40])+'~' if end_low else pitch(45)+'2~ '+pitch(45)+'8 '+pitch(51)+'8 '+pitch(52)+'4')
def eight(end_low=False):four('c');four('g',end_low)
# 1–8 intro; final A bars anticipate the next E on the last eighth.
four('c',True);four('g',True)
# 9–24 verses; 25–32 instrumental continuation.
eight();eight(True);eight(True)
# At the end of bar 32 the tutorial anticipates the E chord into bar 33.
right[31]=' '.join((chord([61,69])+'8 '+pitch(57)+'8') for _ in range(2))+' '+chord([61,69])+'4 '+chord([59,64,71])+'8 '+chord([59,64,71])+'8~'
left[31]=pitch(45)+'2. '+pitch(40)+'8 '+pitch(40)+'8~'
# 33–40 verse and transition into the sustained-chord section.
def transition_verse():
    eight()
    right[-2]=chord([59,63,71])+'4 '+' '.join(chord([59,63,71])+'8' for _ in range(6))
    left[-2]=pitch(44)+'4 '+' '.join(pitch(44)+'8' for _ in range(6))
    right[-1]=' '.join(chord([57,61,69])+'8' for _ in range(8))
    left[-1]=' '.join(pitch(45)+'8' for _ in range(8))
transition_verse()
right[32]=chord([59,64,71])+'4 '+chord([64,71])+'8 '+pitch(59)+'8 '+' '.join(chord([64,71])+'8 '+pitch(59)+'8' for _ in range(2))
# "Strangers" section: short RH chords at 1 and 2&, LH eighth-note octaves.
triad_b=[66,71,75];triad_a=[64,69,73];a_maj7=[68,73,76];e_low=[64,68,71];e_high=[68,71,76];a_high=[69,73,76]
def stab(second):return chord(triad_b)+'8 r8 r8 '+chord(second)+'8 r2'
def octaves(root_note):return ' '.join(chord([root_note,root_note+12])+'8' for _ in range(8))
def strangers():
    for _ in range(3):
        for rh,bass in [(triad_a,33),(a_maj7,33),(e_low,40),(e_high,40)]:put(stab(rh),octaves(bass))
    put(stab(triad_a),octaves(33));put(stab(a_maj7),octaves(33))
    put(chord(triad_b)+'4. '+chord(e_high)+'8~ '+chord(e_high)+'2',chord([35,47])+'4. '+chord([40,52])+'8~ '+chord([40,52])+'2')
    put(chord(triad_b)+'4 '+chord(e_high)+'8 '+chord(a_high)+'8~ '+chord(a_high)+'2',chord([35,47])+'4 '+chord([40,52])+'8 '+chord([33,45])+'8~ '+chord([33,45])+'2')
strangers() # 41–56
four('c',True) # 57–60
# 61–76 verses, with transition in the second eight-bar phrase.
eight(True);transition_verse()
strangers() # 77–92
# 93–100 solo accompaniment, 101–108 chorus, 109–116 ending loop.
eight();eight(True);eight()
assert len(right)==len(left)==116
# Mark the anticipation in each eighth bar of the intro.
for index in (3,7):right[index]=right[index].rsplit(' ',1)[0]+' b8'
sections={1:'Intro',9:'Verse 1',17:'Verse 2',25:'Instrumental',33:'Verse 3',41:'Strangers',57:'Turnaround',61:'Verse 4',69:'Verse 5',77:'Strangers (return)',93:'Solo accompaniment',101:'Chorus',109:'Ending loop (once)'}
source=folder/'source'/f'{slug}.ly'
lines=['\\version "2.26.0"','\\header { title = "Don’t Stop Believin’" subtitle = "Piano accompaniment · tutorial-based practice arrangement" composer = "Journey" tagline = ##f }', '#(set-global-staff-size 18)', '\\paper { top-margin = 10\\mm bottom-margin = 10\\mm ragged-last-bottom = ##t }', '\\score {', '\\new PianoStaff <<']
for hand,bars in [('up',right),('down',left)]:
    lines+=['\\new Staff = "'+hand+'" {','\\clef '+('treble' if hand=='up' else 'bass')+' \\key e \\major \\numericTimeSignature \\time 4/4 \\tempo 4 = 119']
    for number,bar in enumerate(bars,1):
        if hand=='up' and number in sections:lines.append('\\mark \\markup \\small "'+sections[number]+'"')
        lines.append(bar+' |'+(' \\break' if number%4==0 else '')+' % bar '+str(number))
    lines+=['\\bar "|."','}']
lines+=['>>','\\layout { }','\\midi { }','}']
source.write_text('\n'.join(lines)+'\n')
with tempfile.TemporaryDirectory(prefix='migs-journey-') as temporary:
    work=Path(temporary)
    def run(*args):subprocess.run(args,cwd=root,check=True)
    run('lilypond','-o',str(work/'score'),str(source))
    shutil.copyfile(work/'score.pdf',folder/f'{slug}.pdf')
    shutil.copyfile(work/'score.midi',folder/f'{slug}.midi')
    run('lilypond','-dbackend=svg','-o',str(work/'score'),str(source))
    pages=sorted(work.glob('score-*.svg'),key=lambda f:int(f.stem.rsplit('-',1)[1]))
    viewboxes=[]
    for i,page in enumerate(pages,1):
        text=page.read_text();viewboxes.append(ET.fromstring(text).get('viewBox'))
        text=re.sub(r'<a[^>]+xlink:href="textedit:[^"]*"[^>]*>(.*?)</a>',r'<g>\1</g>',text,flags=re.S)
        (folder/f'{slug}-page-{i}.svg').write_text(text)
    capture=source.read_text().replace('\\layout { }','\\layout { \\context { \\Voice \\consists #capture-notes } }')
    # Include the original text at identical line numbers: score keys stay stable.
    (work/'capture-source.ly').write_text(capture)
    (work/'capture.ly').write_text('\\include "'+str(root/'scripts/score-events.ily')+'"\n\\include "'+str(work/'capture-source.ly')+'"\n')
    run('lilypond','-dno-print-pages','-o',str(work/'capture'),str(work/'capture.ly'))
    performance=folder/f'{slug}-performance.json'
    run(sys.executable,'scripts/import-midi.py',str(work/'score.midi'),str(performance),'--meter','4/4','--pickup','0','--title',"Don't Stop Believin’ · 4/4",'--description','Count 1 & 2 & 3 & 4 &. Tempo counts quarter notes. Learn one hand at a time, then combine a short section.')
    data=json.loads(performance.read_text());fingers={}
    for event in data['events']:
        for hand in ('right','left'):
            notes=sorted(event[hand],key=lambda n:n['midi']);pitches=[n['midi'] for n in notes]
            if hand=='right':
                if len(notes)==1:fs=[1]
                elif len(notes)==2:fs=[3 if pitches[0]==66 else 2,5]
                else:fs=[1,2 if pitches in (e_low,e_high,[59,63,71],[57,61,69]) else 3,5]
            elif len(notes)==2:fs=[5,1]
            else:fs=[{40:5,42:4,44:3,47:1,49:3,51:2,52:1,45:5,56:1}.get(n['midi'],1) for n in notes]
            for note,finger in zip(notes,fs):
                fingers.setdefault(note['id'],finger);note['finger']=fingers[note['id']]
    data['fingeringNote']='Finger numbers are practice suggestions. Allow the hand to move between positions; do not hold a stretched shape. For repeated left-hand octaves, use a single bass note if the reach is uncomfortable.'
    data['passages']=[dict(id='opening',label='Intro · bars 1–8',from_=1,to=8),dict(id='full',label='Full accompaniment · 116 bars',from_=1,to=116)]
    points=list(sections)
    for index,start in enumerate(points[1:],1):
        end=points[index+1]-1 if index+1<len(points) else 116
        data['passages'].append(dict(id=str(start),label=f'{sections[start]} · bars {start}–{end}',from_=start,to=end))
    for start in range(1,116,3):data['passages'].append(dict(id=f'practice-{start}',label=f'Practice bars {start}–{min(start+3,116)}',from_=start,to=min(start+3,116)))
    for passage in data['passages']:passage['from']=passage.pop('from_')
    performance.write_text(json.dumps(data,separators=(',',':'))+'\n')
    run(sys.executable,'scripts/link-score.py',str(work/'capture-events.tsv'),str(work/'score'),'--performance',str(performance),'--output',str(folder/f'{slug}-score-map.json'),'--timed')
    library=json.loads((root/'content/songs.json').read_text());song=library['songs'][0]
    song.pop('exercise',None)
    song.update(status='Full piano accompaniment',summary='116 bars of tutorial-based piano accompaniment, including the walking bass, verses, Strangers section and chorus.',materialTitle='Piano accompaniment and practice player',materialDescription='Start with the eight-bar intro. Choose a section, practise each hand, or step through the keys without audio. Repeated riffs use consistent voicings for practice.',exerciseFile=f'{slug}-performance.json',scoreMapFile=f'{slug}-score-map.json',notationFiles=[f'{slug}-page-{i}.svg' for i in range(1,len(pages)+1)],notationAlt='Tutorial-based piano accompaniment in E major, both hands.',scoreViewBoxes=viewboxes,downloadFiles=[f'{slug}.pdf',f'{slug}.midi'])
    (root/'content/songs.json').write_text(json.dumps(library,ensure_ascii=False,indent=2)+'\n')
