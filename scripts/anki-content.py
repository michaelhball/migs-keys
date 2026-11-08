"""Original, lesson-scoped flashcard content and LilyPond image specifications.
Stable IDs must survive wording changes. Add future material at its lesson;
do not move existing IDs to a new fact or auto-reverse ambiguous questions.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
notes=[];images={}
S='https://www.musictheory.net/lessons/'
def img(key):return f'<img class="notation" src="migs-{key}.png" alt="Music notation to identify">'
def add(id,lesson,front,back,reverse='',reverse_answer='',extra='',topic='basics',reference='10',pack='course'):
    notes.append(dict(id=id,lesson=lesson,front=front,back=back,reverse=reverse,reverseAnswer=reverse_answer,extra=extra,topic=topic,source=S+reference,pack=pack))
def diagram(key,music,clef='treble',meter=None):images[key]=dict(music=music,clef=clef,meter=meter)
def position(name,ly,clef,location,lesson):
    key=f'{clef}-{name.lower()}'
    diagram(key,ly+'4',clef)
    add(key,lesson,'Name this note (include the octave if you know it).'+img(key),f'<b>{name}</b> — {location}.',f'Picture or draw <b>{name}</b> on a <b>{clef}</b> staff.',img(key)+f'{name} — {location}.','Count staff lines and spaces from the bottom. The notehead determines pitch.','staff')
# Lesson 1: keyboard and finger conventions, not a theory survey.
for number,name in enumerate(['thumb','index finger','middle finger','ring finger','little finger'],1):
    add(f'finger-{number}',1,f'Which finger is numbered {number} on the piano?',name.capitalize()+'.',f'What number is the {name} on either hand?',str(number),'The numbering is the same on both hands.','fingers')
add('find-c',1,'Where is C in relation to a group of two black keys?','The white key immediately to the left of the pair.','What note is the white key immediately left of a pair of black keys?','C.','The pattern repeats across the keyboard.','keyboard')
add('keyboard-higher',1,'Which direction on the keyboard gives higher pitches?','To the right.',extra='Higher pitch means a higher-sounding note, not a louder note.',topic='keyboard')
add('alphabet-cycle',1,'In English note names, what comes after G?','A. The letters cycle A B C D E F G.',extra='This course uses English note names. In German naming, H corresponds to English B natural.',topic='keyboard')
add('bpm',1,'What does BPM stand for?','Beats per minute.',extra='Check which note value the tempo is counting. In the early lessons, each click is a quarter-note beat.',topic='rhythm',reference='12')
# Lesson 2: the actual reading range, plus the clef landmark.
diagram('staff','s1',clef='none');diagram('treble-clef','s1')
add('staff-lines',2,'How many horizontal lines are in one standard staff?'+img('staff'),'Five.',topic='staff')
add('staff-spaces',2,'How many spaces lie <b>between</b> the five staff lines?'+img('staff'),'Four.',topic='staff')
add('staff-count-direction',2,'When naming a staff line or space by number, where do you start?','At the bottom.',topic='staff')
add('treble-clef-name',2,'Name this clef.'+img('treble-clef'),'Treble clef, also called the G clef.','What does the treble (G) clef look like?',img('treble-clef'),'Its curl identifies G4 on the second line from the bottom.','clefs')
add('treble-anchor',2,'Which pitch does the treble clef curl identify?','G4, on the second line from the bottom.',topic='clefs')
add('ledger-line',2,'What is a ledger line?','A short extra staff line for notes above or below the staff.','What is the short extra line through middle C below the treble staff called?','A ledger line.',topic='staff')
for name,ly,loc in [('C4',"c'",'the first ledger line below the staff'),('D4',"d'",'the space just below the bottom staff line'),('E4',"e'",'the bottom staff line')]:position(name,ly,'treble',loc,2)
add('notehead-pitch',2,'Do you read a note’s pitch from its notehead or the tip of its stem?','The notehead.',topic='staff')
diagram('quarter-note',"e'4");diagram('time-44','s1',meter='4/4')
add('quarter-note-shape',2,'What kind of note is this?'+img('quarter-note'),'Quarter note (crotchet).','Picture or draw a quarter note.',img('quarter-note')+'A filled notehead and a stem.','In our 4/4 exercises it lasts one beat.','duration','11')
add('quarter-duration',2,'In 4/4, with quarter-note beats, how long is one quarter note?','One beat.',topic='duration',reference='11')
add('44-bar',2,'What total note length fits in one complete 4/4 bar?'+img('time-44'),'Four quarter notes, or any combination with the same total duration.',topic='meter',reference='12')
add('44-lower-number',2,'What does the lower 4 in 4/4 identify?','Quarter-note units.','Which lower time-signature number identifies quarter-note units?','4.',topic='meter',reference='12')
add('barline',2,'What does a bar line separate?','One bar (measure) from the next.',topic='meter',reference='12')
# Lesson 3: holding and silence.
for key,music in [('half-note',"e'2"),('half-rest','r2')]:diagram(key,music)
add('half-note-shape',3,'What kind of note is this?'+img('half-note'),'Half note (minim).','Picture or draw a half note.',img('half-note')+'An open notehead with a stem.','In 4/4 with quarter-note beats, hold it for two beats.','duration','11')
add('half-note-duration',3,'In 4/4 with quarter-note beats, how long is a half note?','Two beats.','Which note value lasts two quarter-note beats?','A half note (minim).',topic='duration',reference='11')
add('half-rest-shape',3,'What kind of rest is this?'+img('half-rest'),'Half rest — two quarter-note beats of silence.','Picture or draw a half rest.',img('half-rest')+'The rectangle sits on the middle line.','Keep counting during the silence.','rests','13')
add('held-note',3,'A half note begins on beat 3 in 4/4. Do you strike it again on beat 4?','No. Hold it through beat 4, then release as the next bar begins.',topic='duration',reference='11')
# Lesson 4: bass clef, in the range actually played.
diagram('bass-clef','s1',clef='bass')
add('bass-clef-name',4,'Name this clef.'+img('bass-clef'),'Bass clef, also called the F clef.','What does the bass (F) clef look like?',img('bass-clef'),'The dots surround F3 on the fourth line from the bottom.','clefs')
add('bass-anchor',4,'Which pitch lies on the bass-staff line between the two clef dots?','F3, on the fourth line from the bottom (second from the top).',topic='clefs')
for name,ly,loc in [('C3','c','the second space from the bottom'),('D3','d','the middle line'),('E3','e','the third space from the bottom')]:position(name,ly,'bass',loc,4)
add('c3-c4',4,'How is C3 related to middle C (C4)?','C3 is one octave lower, to the left on the keyboard.',topic='keyboard')
# Lesson 5: both hands and quarter rests.
diagram('quarter-rest','r4')
add('quarter-rest-shape',5,'What kind of rest is this?'+img('quarter-rest'),'Quarter rest (crotchet rest).','Picture or draw a quarter rest.',img('quarter-rest'),'In our 4/4 exercises it lasts one beat.','rests','13')
add('grand-staff',5,'What is the usual piano grand staff?','A treble staff above a bass staff, joined by a brace.',extra='Middle C can be written on a ledger line between them. The two staves are not eleven continuously printed lines.',topic='clefs')
add('vertical-alignment',5,'In these two-hand scores, what does it mean when RH and LH noteheads are vertically aligned?','Start those notes together.',topic='coordination')
add('independent-rest',5,'If the left-hand staff shows a rest while the right has a note, should both hands stop?','No. Keep the left hand silent while the right hand plays its note.',topic='coordination',reference='13')
# Lesson 6: F and G, steps/skips and broken triad.
for name,ly,loc in [('F4',"f'",'the bottom space'),('G4',"g'",'the second line from the bottom')]:position(name,ly,'treble',loc,6)
diagram('step',"c'4 d'4");diagram('skip',"c'4 e'4");diagram('broken-c',"c'4 e'4 g'4")
add('step-shape',6,'Does this move by step or by skip?'+img('step'),'By step: from a line to the neighbouring space.','Picture a step from middle C up to D.',img('step'),topic='intervals')
add('skip-shape',6,'Does this move by step or by skip?'+img('skip'),'By skip: C to E passes over D.','Picture the skip from middle C up to E.',img('skip'),topic='intervals')
add('c-major-broken',6,'Which three notes make the broken C-major chord in Lesson 6?','C, E and G.','Which chord is outlined by C–E–G?', 'C major.',topic='chords',reference='40')
add('broken-chord',6,'What makes a chord “broken”?','Its notes are played one after another instead of all together.',extra=img('broken-c'),topic='chords',reference='40')
# Optional song pack: concepts already explained alongside Für Elise.
def song(id,front,back,reverse='',reverse_answer='',extra='',topic='song-theory',reference='15',pack='fur-elise'):
    add(id,0,front,back,reverse,reverse_answer,extra,topic,reference,pack)
diagram('time-38','s4.',meter='3/8')
for key,music in [('eighth-note',"e'8"),('sixteenth-note',"e'16"),('eighth-rest','r8'),('dotted-quarter',"e'4."),('sharp-note',"dis''4")]:diagram(key,music)
song('38-capacity','What total note length fits in one complete 3/8 bar?'+img('time-38'),'Three eighth notes, or their equivalent.','Which simple time signature fits three eighth-note units in each bar?','3/8.')
song('38-sixteenths','How many sixteenth notes fit in one complete 3/8 bar?','Six. Count 1 &amp; 2 &amp; 3 &amp; when the eighth note is your practice pulse.')
song('time-not-speed','Does 3/8 specify how fast to play?','No. The time signature groups note values into bars; tempo determines their speed.')
song('38-flowing-pulse','At a flowing tempo, a 3/8 bar can feel like one larger pulse. Which note value is that?','A dotted quarter note: three eighth notes.')
for key,title,shape in [('eighth-note','Eighth note (quaver)','A filled head, stem and one flag; notes may be joined with one beam.'),('sixteenth-note','Sixteenth note (semiquaver)','A filled head, stem and two flags; notes may be joined with two beams.')]:
    song(key+'-shape','What kind of note is this?'+img(key),title+'.',f'Picture or draw a {title.split(" (")[0].lower()}.',img(key)+shape,reference='11')
song('eighth-sixteenth-ratio','How many sixteenth notes last as long as one eighth note?','Two.',reference='11')
song('quarter-eighth-ratio','How many eighth notes last as long as one quarter note?','Two.',reference='11')
song('dot-value','What does a dot after a note do to its duration?','It adds half of the note’s original duration.','How do you increase a note’s written duration by half?','Add a dot after the notehead.',reference='14')
song('pickup','What is a pickup (anacrusis)?','An incomplete bar before the first full bar.','What is the name for an incomplete opening bar?','A pickup, also called an anacrusis.')
song('elise-pickup','On which counts do the first E–D♯ sixteenths enter in our slow Für Elise count?','3 &amp;, then continue 1 &amp; 2 &amp; 3 &amp;.')
song('poco-moto','In Für Elise, what does <i>Poco moto</i> mean?','With a little motion: a gently moving character.','Which marking in the opening of Für Elise asks for a little motion?','<i>Poco moto</i>.','This describes character and movement; it does not assign an exact BPM.',reference='15')
song('pp','What does <b>pp</b> mean in the score?','Pianissimo — very soft.','What abbreviation means pianissimo (very soft)?','<b>pp</b>.','Volume is relative to the musical context.',reference='15')
song('sharp','What does a sharp (♯) do to a pitch?','Raises it by one semitone.','Which accidental raises a note by one semitone?','A sharp (♯).','A semitone is the distance to the next piano key, including black keys.',reference='20')
song('dsharp5','Name this note.'+img('sharp-note'),'D♯5.','Picture D♯5 on the treble staff.',img('sharp-note'),reference='20')
# Journey adds a small, separate set, so song exploration does not flood reviews.
diagram('tie',"e'4~ e'4");diagram('slur',"e'4( g'4)")
song('tie','What is the curved mark joining these same-pitch notes?'+img('tie'),'A tie. Hold one continuous sound for their combined duration.','Picture a tie joining two quarter notes on E4.',img('tie'),'Do not reattack the second note.',reference='14',pack='journey')
song('tie-vs-slur','Is this a tie or a slur?'+img('slur'),'A slur: it groups different pitches into a connected phrase.','Picture a slur from E4 to G4.',img('slur'),reference='14',pack='journey')
song('e-major-sharps','Which four notes are sharp in E major?','F♯, C♯, G♯ and D♯.',reference='24',pack='journey')
song('eighth-count-44','In 4/4 with quarter-note beats, how do you count eight even eighth notes?','1 &amp; 2 &amp; 3 &amp; 4 &amp;.',reference='12',pack='journey')
song('bass-anticipation','In the Journey intro, a bass note begins on the &amp; after 4 and is tied into the next bar. Do you play it again on 1?','No. Keep holding through the tie.',reference='14',pack='journey')
song('strangers-rhythm','On which counts do the first two RH chords in the “Strangers” section start?','Beat 1 and the &amp; after beat 2.',pack='journey')
song('eighth-rest-shape','What kind of rest is this?'+img('eighth-rest'),'Eighth rest (quaver rest).','Picture or draw an eighth rest.',img('eighth-rest'),'In our slow 3/8 count it occupies one numbered pulse.',reference='13')
song('dotted-quarter-shape','How many eighth notes equal this dotted quarter note?'+img('dotted-quarter'),'Three eighth notes.','Which single dotted note equals three eighth notes?',img('dotted-quarter')+'A dotted quarter note.',reference='14')
for note in notes:
    if note['id']=='poco-moto':
        note['source']='https://dictionary.onmusic.org/terms/2256-moto'
        note['extra']+=' Poco means a little; moto means motion. <a href="https://dictionary.onmusic.org/terms/2652-poco">Poco definition</a>.'
    elif note['id']=='pp':note['source']='https://dictionary.onmusic.org/terms/2589-pianissimo'
    elif note['pack']=='journey' and note['id']=='strangers-rhythm':note['source']='https://www.youtube.com/watch?v=amRtNe2uVwE'
    elif note['topic']=='fingers':note['source']='https://billspianopages.com/beginners'
import runpy
runpy.run_path(str(ROOT/'scripts/anki-future.py'),init_globals={'notes':notes,'images':images,'add':add,'img':img,'diagram':diagram,'position':position})
assert len({n['id'] for n in notes})==len(notes)
(ROOT/'content/anki/notes.json').write_text(json.dumps(notes,ensure_ascii=False,indent=2)+'\n')
(ROOT/'content/anki/images.json').write_text(json.dumps(images,ensure_ascii=False,indent=2)+'\n')
print(f'{len(notes)} facts; {len(images)} image specifications')
