"""Planned theory library. Called by anki-content.py with its authoring helpers.
Lesson numbers are provisional release targets, reviewed when each lesson is
written. Advanced cards (99) are held outside the 24-lesson beginner course.
"""
# Facts that can be met first in an optional song and later in the course keep
# their existing identities, preventing duplicate reviews.
for note in notes:
    later={'eighth-note-shape':7,'sixteenth-note-shape':15,'eighth-sixteenth-ratio':15,'quarter-eighth-ratio':7,'dot-value':7,'dotted-quarter-shape':15,'eighth-rest-shape':7,'time-not-speed':7,'38-capacity':20,'38-sixteenths':20,'38-flowing-pulse':20,'pickup':11,'poco-moto':20,'pp':11,'sharp':7,'dsharp5':20,'tie':7,'tie-vs-slur':11,'e-major-sharps':20,'eighth-count-44':7}
    if note['id'] in later:note['alsoLesson']=later[note['id']]

def fact(id,lesson,q,a,reverse='',answer='',topic='theory',ref='10',extra=''):
    add(id,lesson,q,a,reverse,answer,extra,topic,ref,'course' if lesson<=24 else 'advanced')
def pairs(topic,lesson,rows,ref):
    for id,q,a,r,ra in rows:fact(topic+'-'+id,lesson,q,a,r,ra,topic,ref)
# Staff expansion stays with later reading lessons; it does not flood Lesson 2.
for name,ly,loc in [('A4',"a'",'the second space'),('B4',"b'",'the middle line'),('C5',"c''",'the third space'),('D5',"d''",'the fourth line'),('E5',"e''",'the top space'),('F5',"f''",'the top line'),('G5',"g''",'the space just above the staff'),('A5',"a''",'the first ledger line above the staff')]:position(name,ly,'treble',loc,20)
for name,ly,loc in [('E2','e,','the first ledger line below the staff'),('F2','f,','the space below the staff'),('G2','g,','the bottom line'),('A2','a,','the bottom space'),('B2','b,','the second line'),('F3','f','the fourth line'),('G3','g','the top space'),('A3','a','the top line'),('B3','b','the space above the staff'),('C4',"c'",'the first ledger line above the staff')]:position(name,ly,'bass',loc,20)
for clef,label in [('alto','Alto clef: middle C is the middle line.'),('tenor','Tenor clef: middle C is the fourth line from the bottom.')]:
    diagram(clef+'-clef','s1',clef=clef)
    fact(clef+'-name',99,'Name this clef.'+img(clef+'-clef'),label,'Picture the '+clef+' clef.',img(clef+'-clef'),'clefs')
# Notes, rests and rhythm beyond the first block.
for key,music in [('whole-note',"e'1"),('whole-rest','r1'),('sixteenth-rest','r16')]:diagram(key,music)
fact('whole-shape',7,'Name this note value.'+img('whole-note'),'Whole note (semibreve).','Picture a whole note.',img('whole-note'),'duration','11')
fact('whole-duration',7,'How many quarter notes equal a whole note?','Four.','Which note value equals four quarter notes?','A whole note.','duration','11')
fact('whole-rest-shape',7,'Name this rest.'+img('whole-rest'),'Whole rest (semibreve rest).','Picture a whole rest.',img('whole-rest'),'rests','13',extra='It hangs below a staff line. A whole-bar rest uses this symbol even when the bar is not four quarter notes long.')
fact('whole-bar-rest',7,'Can a whole-rest symbol represent an entire 3/4 bar?','Yes, as a whole-bar rest it fills that bar. Its context determines the duration.',topic='rests',ref='13')
fact('sixteenth-rest-shape',15,'Name this rest.'+img('sixteenth-rest'),'Sixteenth rest (semiquaver rest).','Picture a sixteenth rest.',img('sixteenth-rest'),'rests','13')
fact('double-dot',20,'How does a double dot change a note’s duration?','Add half, then a quarter, of the original value: 1¾ times the original.',topic='duration',ref='14')
fact('beam-flags',7,'Do beams change the duration of the notes they join?','No. One beam corresponds to one flag, two beams to two flags.',topic='duration',ref='11')
for meter,units,value,lesson in [('2/4',2,'quarter',7),('3/4',3,'quarter',11),('2/2',2,'half',20),('6/8',6,'eighth',15),('9/8',9,'eighth',20),('12/8',12,'eighth',15)]:
    key='time-'+meter.replace('/','');diagram(key,'s1*'+meter,meter=meter)
    fact(key+'-capacity',lesson,'What total written note length fits in one complete bar?'+img(key),f'{units} {value} notes, or an equivalent total.',topic='meter',ref='15')
pairs('meter',15,[('simple','How is each beat normally divided in simple meter?','Into two equal parts.','What kind of meter divides a beat into two equal parts?','Simple meter.'),('compound','How is each beat normally divided in compound meter?','Into three equal parts.','What kind of meter divides a beat into three equal parts?','Compound meter.'),('68-beats','How many main beats are normally felt in 6/8?','Two dotted-quarter beats.','',''),('128-beats','How many main beats are normally felt in 12/8?','Four dotted-quarter beats.','',''),('34-vs-68','3/4 and 6/8 both fit six eighth notes. How does their usual grouping differ?','3/4: 2+2+2 eighths. 6/8: 3+3 eighths.','',''),('duple','What does duple meter mean?','Two main beats per bar.','What term describes two main beats per bar?','Duple.'),('triple','What does triple meter mean?','Three main beats per bar.','What term describes three main beats per bar?','Triple.'),('quadruple','What does quadruple meter mean?','Four main beats per bar.','What term describes four main beats per bar?','Quadruple.')],'15')
pairs('rhythm',22,[('syncopation','What is syncopation?','Emphasis on normally weak beats or subdivisions, sometimes sustained across a stronger beat.','',''),('offbeat','In the count 1 & 2 & 3 & 4 &, which syllables are offbeats?','The & syllables, halfway between numbered beats.','',''),('triplet','What does a quarter-note triplet fit into?','Three equal quarter-note-triplet notes fit into the time of two ordinary quarter notes.','',''),('odd-five','Give two common eighth-note groupings for 5/8.','2+3 or 3+2.','',''),('odd-seven','Give three common groupings for 7/8.','2+2+3, 2+3+2 or 3+2+2.','','')],'16')
# Accidentals and scales.
for key,music in [('flat',"bes'4"),('natural',"fis'4 f'!4"),('double-sharp',"fisis'4"),('double-flat',"beses'4")]:diagram(key,music)
fact('flat-sign',7,'What does ♭ do to a pitch?','Lowers it by one semitone.','Which accidental lowers a pitch by one semitone?','Flat (♭).','accidentals','20')
fact('natural-sign',7,'What does ♮ mean?','Use the unaltered letter-name pitch, cancelling a sharp or flat that would otherwise apply.','Which accidental restores a letter-name pitch to its natural form?','Natural (♮).','accidentals','20')
fact('accidental-bar',7,'In ordinary modern notation, how long does a written accidental normally apply?','Through the rest of that bar, for the same pitch and octave.',topic='accidentals',ref='20',extra='A tie across a bar line preserves the tied pitch. A key signature continues beyond the bar.')
fact('semitone',7,'What is a semitone (half step) on a piano?','The distance to the immediately neighbouring key, including black keys.',topic='intervals',ref='20')
fact('whole-tone',7,'How many semitones make a whole tone (whole step)?','Two.',topic='intervals',ref='20')
fact('white-semitones',7,'Which neighbouring white-key letter pairs are a semitone apart?','E–F and B–C.',topic='keyboard',ref='20')
fact('enharmonic',12,'What are enharmonic equivalents on an equal-tempered piano?','Different spellings for the same sounding key, such as C♯ and D♭.',topic='accidentals',ref='20')
fact('double-sharp-sign',20,'What does a double sharp do?'+img('double-sharp'),'Raises the natural letter-name pitch by two semitones.',topic='accidentals',ref='20')
fact('double-flat-sign',20,'What does a double flat do?'+img('double-flat'),'Lowers the natural letter-name pitch by two semitones.',topic='accidentals',ref='20')
fact('major-pattern',7,'What whole-step/half-step pattern builds a major scale?','W W H W W W H.',topic='scales',ref='21')
fact('c-major-scale',7,'Name the notes of C major in order, including the top C.','C D E F G A B C.',topic='scales',ref='21')
fact('major-distinct-letters',7,'How many different letter names does an ordinary seven-note major scale use?','Seven: each letter name once before the octave repeats.',topic='scales',ref='21')
fact('natural-minor-pattern',20,'What whole-step/half-step pattern builds a natural minor scale?','W H W W H W W.',topic='scales',ref='22')
fact('harmonic-minor-change',20,'How does harmonic minor differ from natural minor?','Its seventh degree is raised by one semitone.',topic='scales',ref='22')
fact('melodic-minor-classical',20,'In the usual classical teaching form, how does melodic minor change on the way up and down?','Raise degrees 6 and 7 ascending; use natural minor descending.',topic='scales',ref='22',extra='Actual compositions vary. Jazz commonly uses the ascending form in both directions.')
fact('a-minor-forms',20,'What are the altered notes in A harmonic minor?','G becomes G♯.',topic='scales',ref='22')
fact('relative-keys',20,'What do relative major and minor keys share?','A key signature; their tonic notes differ.',topic='keys',ref='22')
fact('parallel-keys',20,'What do parallel major and minor keys share?','The same tonic, such as C major and C minor.',topic='keys',ref='22')
for degree,name in [(1,'tonic'),(2,'supertonic'),(3,'mediant'),(4,'subdominant'),(5,'dominant'),(6,'submediant')]:
    fact(f'degree-{degree}',9,f'What is the traditional name for scale degree {degree}?',name.capitalize()+'.',f'Which scale degree is the {name}?',str(degree),'scale-degrees','23')
fact('leading-tone',9,'When is scale degree 7 called the leading tone?','When it is a semitone below the tonic.','What is the name for scale degree 7 a semitone below the tonic?','Leading tone.','scale-degrees','23')
fact('subtonic',20,'What is scale degree 7 called when it lies a whole tone below the tonic?','Subtonic.','What does “subtonic” name?','Degree 7 a whole tone below the tonic.','scale-degrees','23')
fact('sharp-order',20,'In what order are sharps added to key signatures?','F C G D A E B.',topic='keys',ref='24')
fact('flat-order',20,'In what order are flats added to key signatures?','B E A D G C F.',topic='keys',ref='24')
for name,count,kind,relative in [('C',0,'none','A'),('G',1,'sharp','E'),('D',2,'sharps','B'),('A',3,'sharps','F♯'),('E',4,'sharps','C♯'),('B',5,'sharps','G♯'),('F♯',6,'sharps','D♯'),('C♯',7,'sharps','A♯'),('F',1,'flat','D'),('B♭',2,'flats','G'),('E♭',3,'flats','C'),('A♭',4,'flats','F'),('D♭',5,'flats','B♭'),('G♭',6,'flats','E♭'),('C♭',7,'flats','A♭')]:
    slug=name.replace('♯','sharp').replace('♭','flat').lower()
    answer='No sharps or flats.' if count==0 else f'{count} {kind}.'
    fact('key-signature-'+slug,20,f'How many sharps or flats are in {name} major?',answer,f'Which major key has {answer.lower().rstrip(".")}?' if count else 'Which major key has no sharps or flats?',name+' major.','keys','24')
    fact('relative-minor-'+slug,20,f'What is the relative minor of {name} major?',relative+' minor.',f'What is the relative major of {relative} minor?',name+' major.','keys','24')
fact('sharp-key-calculation',20,'For a major sharp key, how do you find the tonic from the last sharp?','Go one semitone above the last sharp.',topic='keys',ref='25')
fact('flat-key-calculation',20,'For a major flat key with at least two flats, which flat names the tonic?','The second-to-last flat. F major, with one flat, is the exception to memorize.',topic='keys',ref='25')
# Intervals: distinguish spelling from distance.
fact('generic-interval-count',12,'When naming a generic interval, do you count both endpoint letter names?','Yes. C–E counts C, D, E: a third.',topic='intervals',ref='30')
for number,quality,semitones in [(1,'perfect',0),(2,'minor',1),(2,'major',2),(3,'minor',3),(3,'major',4),(4,'perfect',5),(5,'perfect',7),(6,'minor',8),(6,'major',9),(7,'minor',10),(7,'major',11),(8,'perfect',12)]:
    ordinal={1:'unison',2:'second',3:'third',4:'fourth',5:'fifth',6:'sixth',7:'seventh',8:'octave'}[number]
    fact(f'interval-{quality}-{number}',12,f'How many semitones span a {quality} {ordinal}?',str(semitones)+'.',topic='intervals',ref='31',extra='The letter-name spelling also matters: semitone distance alone does not determine every interval name.')
fact('tritone',12,'How many semitones span a tritone?','Six. It can be spelled as an augmented fourth or diminished fifth.',topic='intervals',ref='31')
fact('interval-invert-number',12,'What do the numbers of two inverted simple intervals add up to?','Nine: for example, a third inverts to a sixth.',topic='intervals',ref='33')
fact('interval-invert-quality',12,'What does a major interval become when inverted?','Minor. Minor becomes major; perfect remains perfect.',topic='intervals',ref='33')
fact('interval-invert-augmented',20,'What does an augmented interval become when inverted?','Diminished.',topic='intervals',ref='33')
fact('spell-third',12,'Why is C♯ to E♯ a third, while C♯ to F is not spelled as a third?','C to E spans three letter names; C to F spans four. The keyboard distance alone is not enough.',topic='intervals',ref='32')
fact('melodic-harmonic-interval',12,'What distinguishes a melodic interval from a harmonic interval?','Melodic: pitches sound successively. Harmonic: pitches sound together.',topic='intervals',ref='30')
# Triads and inversions.
for quality,formula,thirds,example in [('major','1–3–5','major third, then minor third','C–E–G'),('minor','1–♭3–5','minor third, then major third','C–E♭–G'),('diminished','1–♭3–♭5','two minor thirds','C–E♭–G♭'),('augmented','1–3–♯5','two major thirds','C–E–G♯')]:
    fact('triad-formula-'+quality,8,f'What is the formula for a {quality} triad, relative to a major scale?',formula+'.',f'Which triad quality has formula {formula}?',quality.capitalize()+'.','chords','40')
    fact('triad-thirds-'+quality,8,f'Which two thirds build a {quality} triad from the root upward?',thirds.capitalize()+'.',topic='chords',ref='40')
    fact('triad-c-'+quality,8,f'Spell a C {quality} triad.',example+'.',f'Name the triad spelled {example}.','C '+quality+'.','chords','40')
for name,notes_ in [('F','F–A–C'),('G','G–B–D'),('A minor','A–C–E'),('D minor','D–F–A'),('E minor','E–G–B')]:
    fact('triad-spelling-'+name.lower().replace(' ','-'),8,f'Spell the {name} chord.',notes_+'.',f'Name the chord {notes_}.',name+'.','chords','40')
for inversion,bass,figure in [('root position','root','5/3'),('first inversion','third','6/3, usually abbreviated 6'),('second inversion','fifth','6/4')]:
    key=inversion.replace(' ','-')
    fact('triad-bass-'+key,10,f'Which chord member is in the bass of a triad in {inversion}?',bass.capitalize()+'.',f'What triad position has the {bass} in the bass?',inversion.capitalize()+'.','inversions','42')
    fact('triad-figure-'+key,10,f'What figured-bass numbers denote a triad in {inversion}?',figure+'.',topic='inversions',ref='42')
fact('slash-chord',10,'What does C/E mean?','A C-major chord with E in the bass.','How do you write a C-major chord with E in the bass as a slash chord?','C/E.','inversions','42')
fact('root-not-bass',10,'Are a chord’s root and bass note always the same?','No. In an inversion, a different chord member is the lowest note.',topic='inversions',ref='42')
# Diatonic harmony and pop progressions.
fact('diatonic',9,'What does diatonic mean in the context of a key?','Using notes belonging to its scale/key, rather than chromatic alterations.',topic='harmony',ref='43')
fact('major-triad-qualities',9,'What is the triad-quality pattern in a major key?','I ii iii IV V vi vii°: major, minor, minor, major, major, minor, diminished.',topic='harmony',ref='43')
for roman,chord_ in [('I','C'),('ii','D minor'),('iii','E minor'),('IV','F'),('V','G'),('vi','A minor'),('vii°','B diminished')]:
    fact('roman-c-'+roman.replace('°','dim').lower(),9,f'In C major, which chord is {roman}?',chord_+'.',topic='harmony',ref='44')
fact('roman-case',9,'What do uppercase and lowercase Roman numerals normally distinguish?','Uppercase: major chords. Lowercase: minor chords. A ° marks a diminished chord.',topic='harmony',ref='44')
fact('pop-1564-c',9,'What chords are I–V–vi–IV in C major?','C–G–A minor–F.',topic='progressions',ref='57')
fact('pop-1645-c',9,'What chords are I–vi–IV–V in C major?','C–A minor–F–G.',topic='progressions',ref='57')
fact('minor-triad-qualities',20,'What triads come from the natural minor scale?','i ii° III iv v VI VII.',topic='harmony',ref='43')
fact('minor-dominant',20,'Why is the dominant chord often major in a minor key?','Raising scale degree 7 creates a leading tone and a major V chord.',topic='harmony',ref='50')
fact('am-v',20,'What notes make the major V chord in A minor?','E–G♯–B.',topic='harmony',ref='50')
# Phrasing and notation vocabulary.
for term,meaning in [('p','Piano — soft'),('mp','Mezzo piano — moderately soft'),('mf','Mezzo forte — moderately loud'),('f','Forte — loud'),('ff','Fortissimo — very loud'),('cresc.','Crescendo — gradually louder'),('dim.','Diminuendo — gradually softer'),('rit.','Ritardando — gradually slower'),('a tempo','Return to the previous tempo'),('legato','Connected and smooth'),('staccato','Detached'),('cantabile','In a singing style'),('dolce','Sweetly'),('andante','At a walking pace'),('allegro','Fast and lively'),('adagio','Slowly')]:
    fact('term-'+term.replace('.','').replace(' ','-'),11,f'What does <i>{term}</i> mean?',meaning+'.',f'Which marking means “{meaning.split(" — ")[-1].lower()}”?',f'<i>{term}</i>.','expression','15')
fact('fermata',11,'What does a fermata ask the player to do?','Hold the note or rest longer than its written duration; the exact length depends on context.',topic='expression',ref='15')
fact('phrase',11,'What is a musical phrase?','A connected musical idea, often shaped toward an arrival or a pause.',topic='phrasing',ref='55')
for name,pattern in [('authentic','V–I (or V–i in minor)'),('half','A phrase ending on V'),('plagal','IV–I'),('deceptive','V moving to a chord other than the tonic, commonly vi in major')]:
    fact('cadence-'+name,11,f'What is the basic idea of a {name} cadence?',pattern+'.',topic='cadences',ref='55')
fact('perfect-authentic',20,'What makes an authentic cadence “perfect” in common-practice theory?','V and I are in root position, and the soprano ends on scale degree 1.',topic='cadences',ref='55')
# Dominant sevenths, blues and improvisation.
fact('dominant7-formula',13,'What is the formula for a dominant seventh chord?','1–3–5–♭7.','Which seventh-chord type uses 1–3–5–♭7?','Dominant seventh.','sevenths','45')
for name,pitches in [('C7','C–E–G–B♭'),('F7','F–A–C–E♭'),('G7','G–B–D–F')]:fact('spell-'+name.lower(),13,'Spell '+name+'.',pitches+'.',f'Name the seventh chord {pitches}.',name+'.','sevenths','45')
fact('dominant7-resolution',13,'In a conventional V7–I cadence, where do the leading tone and chordal seventh tend to move?','The leading tone rises to the tonic; the chordal seventh resolves down by step.',topic='voice-leading',ref='47')
fact('blues-form',14,'What is a basic 12-bar blues chord layout in C?','C7 C7 C7 C7 | F7 F7 C7 C7 | G7 F7 C7 G7.',topic='blues',ref='57',extra='This is one common beginner form, not the only 12-bar blues progression.')
fact('blues-three-chords',14,'Which scale degrees provide the three main chords of a basic blues?','I, IV and V.',topic='blues',ref='57')
fact('blues-vs-functional',14,'Does a I7 chord in blues have to resolve as a classical dominant seventh would?','No. In blues, a dominant-seventh sonority can function as the tonic.',topic='blues',ref='45')
fact('swing-eighths',15,'What changes when eighth notes are swung?','Paired eighths are unequal, usually longer then shorter. The amount varies with style and tempo.',topic='swing',ref='15')
fact('swing-not-fixed',15,'Is swing always an exact 2:1 long-short ratio?','No. A triplet-based approximation is useful initially, but real swing varies.',topic='swing',ref='15')
fact('minor-pentatonic-formula',16,'What is the minor pentatonic formula?','1–♭3–4–5–♭7.',topic='improvisation',ref='22')
fact('c-minor-pentatonic',16,'Spell C minor pentatonic.','C–E♭–F–G–B♭.',topic='improvisation',ref='22')
fact('c-blues-scale',16,'What added note turns C minor pentatonic into the common six-note minor blues scale?','G♭, the lowered fifth.',topic='improvisation',ref='22')
fact('motif',16,'What is a motif?','A short musical idea that can be repeated or developed.',topic='improvisation',ref='55')
fact('call-response',16,'What is call and response?','One musical phrase is answered by another.',topic='improvisation',ref='55')
# Seventh-chord qualities and jazz vocabulary.
for quality,formula,symbol,pitches in [('major seventh','1–3–5–7','Cmaj7','C–E–G–B'),('minor seventh','1–♭3–5–♭7','Cm7','C–E♭–G–B♭'),('half-diminished seventh','1–♭3–♭5–♭7','Cm7♭5 / Cø7','C–E♭–G♭–B♭'),('diminished seventh','1–♭3–♭5–𝄫7','Cdim7 / C°7','C–E♭–G♭–B𝄫'),('minor-major seventh','1–♭3–5–7','Cm(maj7)','C–E♭–G–B'),('augmented-major seventh','1–3–♯5–7','Cmaj7♯5','C–E–G♯–B'),('augmented seventh','1–3–♯5–♭7','C7♯5','C–E–G♯–B♭')]:
    slug=quality.replace(' ','-')
    fact('seventh-formula-'+slug,17,f'What is the formula for a {quality} chord?',formula+'.',f'Name the seventh-chord type with formula {formula}.',quality.capitalize()+'.','sevenths','48' if 'augmented' in quality or quality=='minor-major seventh' else '45')
    fact('seventh-spell-'+slug,17,f'Spell {symbol}.',pitches+'.',f'Give a chord symbol for {pitches}.',symbol+'.','sevenths','45')
for inv,bass,figure in [('root position','root','7'),('first inversion','third','6/5'),('second inversion','fifth','4/3'),('third inversion','seventh','4/2 (or 2)')]:
    fact('seventh-inversion-'+inv.replace(' ','-'),17,f'Which member is in the bass of a seventh chord in {inv}?',bass.capitalize()+'.',f'What seventh-chord inversion has its {bass} in the bass?',inv.capitalize()+'.','inversions','49')
    fact('seventh-figure-'+inv.replace(' ','-'),17,f'What figured-bass label represents a seventh chord in {inv}?',figure+'.',topic='inversions',ref='49')
fact('major-diatonic-sevenths',17,'What seventh-chord types occur on degrees 1–7 of a major scale?','maj7, m7, m7, maj7, dominant 7, m7, half-diminished 7.',topic='harmony',ref='46')
fact('ii-v-i-c',18,'What is ii7–V7–Imaj7 in C major?','Dm7–G7–Cmaj7.',topic='jazz',ref='47')
fact('ii-v-i-g',18,'What is ii7–V7–Imaj7 in G major?','Am7–D7–Gmaj7.',topic='jazz',ref='47')
fact('guide-tones',18,'Which two chord tones are commonly called guide tones in seventh-chord jazz voicings?','The third and seventh.',topic='jazz',ref='51')
fact('dm-g-guide',18,'Which guide tones can you use for Dm7, G7 and Cmaj7?','Dm7: F–C. G7: F–B. Cmaj7: E–B.',topic='jazz',ref='51')
fact('voice-leading',10,'What is voice leading?','How individual chord tones move from one harmony to the next.',topic='harmony',ref='51')
fact('voicing-inversion',10,'Does a different chord voicing necessarily mean a different inversion?','No. Inversion depends on the lowest chord member; voicing also concerns spacing and ordering above it.',topic='harmony',ref='51')
# Lead sheets and navigation.
fact('lead-sheet',19,'What does a typical lead sheet provide?','Melody, chord symbols and the song’s form, rather than a fully written piano accompaniment.',topic='lead-sheets',ref='51')
fact('sus4',19,'What does C sus4 normally contain?','C–F–G: the fourth replaces the third.',topic='chords',ref='40')
fact('add9',19,'How does Cadd9 differ from C9?','Cadd9 adds D to C–E–G without implying a seventh. C9 normally includes B♭ as its seventh.',topic='chords',ref='48')
fact('dc',19,'What does D.C. mean in a score?','Da capo: go back to the beginning.','Which abbreviation tells you to go back to the beginning?','D.C.','navigation','10')
fact('ds',19,'What does D.S. mean in a score?','Dal segno: go back to the sign.','Which abbreviation tells you to go back to the segno sign?','D.S.','navigation','10')
fact('fine',19,'What does Fine mean when following a D.C. or D.S. instruction?','Finish there on the return pass.',topic='navigation',ref='10')
fact('repeat-endings',19,'How do first and second endings work with a repeat?','Play the first ending on the first pass; skip it and take the second ending on the second pass.',topic='navigation',ref='10')
# Accompaniment and tonal analysis, including advanced material for later.
fact('alberti-bass',21,'What is the usual four-note pattern of an Alberti bass?','Low–high–middle–high chord tones.',topic='accompaniment',ref='51')
fact('arpeggio',21,'What is an arpeggio?','The notes of a chord played successively, often across a wider range.',topic='accompaniment',ref='40')
for name,definition in [('passing tone','A non-chord tone approached and left by step in the same direction'),('neighbor tone','A non-chord tone that steps away from a chord tone and returns to it'),('suspension','A prepared note held into a new harmony, becoming dissonant before resolving down by step'),('retardation','A prepared dissonance that resolves upward by step'),('anticipation','A note of the next harmony sounded early'),('appoggiatura','An accented non-chord tone approached by leap and resolved by step'),('escape tone','A non-chord tone approached by step and left by a leap in the opposite direction'),('pedal point','A sustained or repeated note over changing harmonies')]:
    fact('nonchord-'+name.replace(' ','-'),99,'What is a '+name+'?',definition+'.',f'Name this device: {definition.lower()}.',name.capitalize()+'.','nonchord-tones','53')
fact('descending-fifths',99,'Give a descending-fifths root sequence starting on C.','C–F–B♭–E♭–A♭–D♭–G♭…',topic='progressions',ref='56')
fact('diatonic-circle',99,'Give a diatonic descending-fifths chord sequence in C major, starting on C.','C–F–Bdim–Em–Am–Dm–G–C.',topic='progressions',ref='56')
fact('functional-order',99,'What is a common functional ordering of tonal harmony?','Tonic → predominant → dominant → tonic.',topic='progressions',ref='57')
fact('predominants',99,'Which diatonic chords commonly act as predominant chords in a major key?','ii and IV, often in inversions.',topic='progressions',ref='57')
fact('first-inversion-purpose',99,'How can first-inversion triads help a bass line?','They allow stepwise bass motion and passing connections without changing the chord root.',topic='inversions',ref='60')
fact('cadential64',99,'In a common-practice cadential 6/4, which bass note is usually present?','The dominant scale degree (5).',topic='cadences',ref='61')
fact('cadential64-resolution',99,'How do the 6th and 4th above the bass usually resolve in a cadential 6/4?','Down to the 5th and 3rd above the same dominant bass.',topic='cadences',ref='61')
fact('passing64',99,'What is the bass-line role of a passing 6/4 chord?','It connects nearby bass notes by step.',topic='inversions',ref='61')
fact('pedal64',99,'What stays fixed in a pedal 6/4 progression?','The bass, while upper voices move away and back.',topic='inversions',ref='61')
fact('neapolitan',99,'What is a Neapolitan chord?','A major triad built on lowered scale degree 2 (♭II).',topic='neapolitan',ref='120')
fact('neapolitan-c',99,'Spell the Neapolitan triad in C minor.','D♭–F–A♭.',topic='neapolitan',ref='120')
fact('neapolitan6',99,'Which note is normally in the bass of a Neapolitan sixth chord?','Scale degree 4: the third of the ♭II triad.',topic='neapolitan',ref='121')
fact('neapolitan-function',99,'What is the usual tonal function of a Neapolitan sixth?','Predominant, usually moving toward V, sometimes through a cadential 6/4.',topic='neapolitan',ref='121')
fact('neapolitan-major',99,'In a major key, which scale degrees must be lowered to build the Neapolitan triad?','Degrees 2 and 6. Degree 4 stays unchanged.',topic='neapolitan',ref='120')
# Synth concepts serve the keyboard course but are not attributed to music-theory.net.
for id,q,a in [('oscillator','What does a synthesizer oscillator generate?','A repeating audio waveform.'),('filter','What does a low-pass filter mainly reduce?','Frequencies above its cutoff, making the sound less bright.'),('resonance','What does filter resonance emphasize?','Frequencies near the cutoff.'),('attack','In an amplitude ADSR envelope, what is attack?','The time taken to rise from silence to the initial peak after a note starts.'),('decay','In an amplitude ADSR envelope, what is decay?','The time taken to fall from the peak to the sustain level.'),('sustain','In an amplitude ADSR envelope, is sustain a time or a level?','A level, maintained while the note is held.'),('release','In an amplitude ADSR envelope, what is release?','The time taken to fade after the note is released.'),('lfo','What is an LFO commonly used for?','Slow modulation, such as vibrato, tremolo or filter movement.'),('vibrato','What changes in vibrato?','Pitch varies periodically.'),('tremolo','What changes in tremolo?','Loudness varies periodically.'),('velocity','What does MIDI note velocity commonly represent on a keyboard?','How quickly the key is struck; an instrument often maps it to loudness and tone.'),('midi-audio','Is a MIDI note message recorded sound?','No. It is performance data used to control a sound source.'),('sine','What is special about a pure sine wave?','It contains one frequency, without harmonics.'),('polyphony','What does polyphony mean on a synthesizer?','The ability to sound multiple notes at once.')]:
    fact('synth-'+id,23,q,a,topic='synth')
    notes[-1]['source']='https://learningsynths.ableton.com/'
# Basic practical reading facts for transposition/review.
fact('transpose',12,'What does it mean to transpose a melody?','Move all its pitches by the same interval while preserving their relationships.',topic='transposition',ref='32')
fact('transpose-c-d',12,'Transpose C–D–E up a major second.','D–E–F♯.',topic='transposition',ref='32')
fact('key-not-first-note',24,'Must the first note of a piece be its tonic?','No. Key is established by the wider melodic and harmonic context.',topic='analysis',ref='52')
fact('analysis-bass',24,'When analysing an inverted chord, which should you identify separately: root or bass?','Both. The bass identifies inversion; it may differ from the root.',topic='analysis',ref='44')
fact('analysis-nonchord',99,'Why can a melody note fall outside the current chord without changing the harmony?','It may be a non-chord tone, such as a passing or neighbor tone.',topic='analysis',ref='62')
fact('analysis-neapolitan',99,'In C♯ minor, what notes form a Neapolitan sixth?','F♯ in the bass, with A and D above: D major in first inversion.',topic='analysis',ref='122')
# Links for notation/terms/jazz/blues beyond the site’s own topic coverage.
for n in notes:
    if n['topic'] in ('expression','navigation'):
        n['source']='https://dictionary.onmusic.org/'
    elif n['topic'] in ('blues','swing','improvisation','jazz'):
        n['source']='https://viva.pressbooks.pub/openmusictheory/'

# Visual harmony and key-signature recall use independently engraved examples.
for name,ly in [('C major',"<c' e' g'>"),('C minor',"<c' ees' g'>"),('C diminished',"<c' ees' ges'>"),('C augmented',"<c' e' gis'>"),('C7',"<c' e' g' bes'>"),('Cmaj7',"<c' e' g' b'>"),('Cm7',"<c' ees' g' bes'>"),('Cm7♭5',"<c' ees' ges' bes'>"),('Cdim7',"<c' ees' ges' beses'>")]:
    key='chord-'+name.lower().replace(' ','-').replace('♭','flat');diagram(key,ly+'2')
    level=8 if ' ' in name else 13 if name=='C7' else 17
    fact('visual-'+key,level,'Identify this chord.'+img(key),name+'.',f'Picture or draw {name} in root position, starting on middle C.',img(key),'chords','40' if level==8 else '45')
for keyname,ly in [('C','c'),('G','g'),('D','d'),('A','a'),('E','e'),('B','b'),('F♯','fis'),('C♯','cis'),('F','f'),('B♭','bes'),('E♭','ees'),('A♭','aes'),('D♭','des'),('G♭','ges'),('C♭','ces')]:
    key='keysig-'+ly;diagram(key,'\\key '+ly+' \\major s1')
    fact('visual-'+key,20,'Which <b>major</b> key has this key signature?'+img(key),keyname+' major.',f'Picture or draw the key signature of {keyname} major.',img(key),'keys','24',extra='The same signature can also belong to its relative minor; the prompt specifies major.')

# Reviewed release map: lessons 7–12 now have written exercises. Keep everything
# else prepared, but do not assign an untaught concept to an available lesson.
reviewed={
 7: 'treble-a4 treble-b4 treble-c5 semitone whole-tone white-semitones major-pattern c-major-scale major-distinct-letters',
 8: 'triad-c-major triad-spelling-a-minor visual-chord-c-major',
 9: 'triad-spelling-f triad-spelling-g treble-d5 bass-f2 bass-g2 bass-a2',
 10:'triad-bass-root-position triad-bass-first-inversion triad-bass-second-inversion root-not-bass voice-leading voicing-inversion',
 11:'phrase beam-flags eighth-note-shape quarter-eighth-ratio dot-value dotted-quarter-shape eighth-count-44',
 12:'generic-interval-count interval-perfect-5 transpose'
}
release={id:lesson for lesson,ids in reviewed.items() for id in ids.split()}
for n in notes:
 if n['id'] in release:
  if n['pack']=='course':n['lesson']=release[n['id']]
  else:n['alsoLesson']=release[n['id']]
 elif n['pack']=='course' and 7<=n['lesson']<=12:
  n['plannedLesson']=n['lesson'];n['lesson']=99;n['pack']='advanced'
 elif 7<=n.get('alsoLesson',999)<=12:n['alsoLesson']=99
position('A3','a','treble','the second ledger line below the staff',8)
position('B3','b','treble','the space just below middle C’s ledger line',10)
fact('triad-definition',8,'What is a triad?','A three-note chord built by stacking two thirds.',topic='chords',ref='40')
fact('chord-root',8,'What is the root of A minor?','A, the note from which its stacked thirds are built. It remains the root when the notes are rearranged.',topic='chords',ref='40')
fact('transpose-c-g',12,'Transpose C–D–E up a perfect fifth.','G–A–B.',topic='transposition',ref='30')
for n in notes:
 for field in ('front','reverse'):
  for phrase in ('augmented','authentic','anticipation','appoggiatura','escape','eighth'):
   n[field]=n[field].replace('a '+phrase,'an '+phrase)
 if n['id']=='sharp':n['back']='Raises the natural letter-name pitch by one semitone.'
 if n['id']=='flat-sign':n['back']='Lowers the natural letter-name pitch by one semitone.'
 if n['id']=='synth-tremolo':n['front']='In a synthesizer tremolo effect, what varies periodically?';n['extra']='In piano notation, tremolo can instead mean rapidly repeated notes or alternating notes/chords.'
 if n['id']=='synth-sine':n['back']='It contains one frequency, with no higher harmonics.'
 if n['id']=='nonchord-appoggiatura':n['extra']='This is the common harmony-textbook definition; ornamental appoggiaturas can be described more broadly.'
 if n['id']=='dominant7-formula':n['front']='What is the formula for a dominant seventh chord, relative to a major scale?'
 if n['id'].startswith('seventh-formula-'):n['front']=n['front'].replace('chord?','chord, relative to a major scale?')
 if n['id']=='minor-pentatonic-formula':n['front']='What is the minor pentatonic formula, relative to a major scale?'
 if n['id'] in ('transpose','transpose-c-d'):n['source']='https://viva.pressbooks.pub/openmusictheory/chapter/intervals/'
