"""Build beginner public-domain hymn scores, lyrics and optional finger numbers.
Requires LilyPond 2.26 and Python's standard library. Sources and scope are
recorded in the practice pages; these are original teaching arrangements.
"""
from pathlib import Path
import json, re, shutil, subprocess, sys, tempfile
from score_output import FINGERING_LAYOUT, write_score_pages, plain_pdf
ROOT = Path(__file__).resolve().parent.parent
FOLDER = ROOT / 'content/songs'
SONGS=[dict(slug='amazing-grace',title='Amazing Grace',composer='Traditional · NEW BRITAIN',meter='3/4',
 pickup="g4-1",bars=[
 "c'2-2 e'8-4 c'8-2", "e'2-4 d'4-3", "c'2-3 a4-2", 'g2-1 g4-1',
 "c'2-2 e'8-4 c'8-2", "e'2-4 d'4-3", "g'2.-5~", "g'2-5 e'4-3",
 "g'2-5 e'8-3 c'8-1", "e'2-3 d'4-2", "c'2-3 a4-2", 'g2-1 g4-1',
 "c'2-2 e'8-4 c'8-2", "e'2-4 d'4-3", "c'2.-2~", "c'2-2"],
 bass=['c','c','f,','c','c','c','g,','g,','c','c','f,','c','c','g,','c','c'],
 summary='The complete tune in C, with all six original verses in full-song playback and a single-verse practice option.',
 material='Beginner arrangement of NEW BRITAIN in 3/4. Full song repeats the tune for all six original verses; the Words panel follows each verse.'),
 dict(slug='lord-of-the-dance',title='Lord of the Dance · Simple Gifts',composer='Joseph Brackett · traditional tune',meter='4/4',
 pickup='g8-1 g8-1',bars=[
 "c'4-1 c'8-1 d'8-2 e'8-3 c'8-1 e'8-3 f'8-4",
 "g'4-5 g'8-5 f'8-4 e'4-3 d'8-2 c'8-1",
 "d'4-2 d'4-2 d'4-2 c'4-1",
 "d'8-3 e'8-4 d'8-3 b8-2 g4-1 g4-1",
 "c'8-3 b8-2 c'8-3 d'8-4 e'8-5 d'8-4 e'8-3 f'8-4",
 "g'4-5 g'8-5 f'8-4 e'4-3 d'8-2 c'8-1",
 "d'4-2 d'4-2 e'4-3 e'8-3 d'8-2",
 "c'4-1 c'8-1 c'8-1 c'2-1",
 "g'2-5 e'4.-3 d'8-2",
 "e'8-3 f'8-4 e'8-3 d'8-2 c'4.-1 d'8-2",
 "e'4-3 e'8-3 f'8-4 g'4-5 f'8-4 e'8-3",
 "d'4-3 d'8-3 e'8-4 d'4-3 g4-1",
 "c'2-1 c'4.-1 d'8-2",
 "e'4-3 e'8-3 f'8-4 g'4-5 f'8-4 e'8-3",
 "d'4-2 d'4-2 e'4-3 e'8-3 d'8-2",
 "c'4-1 c'4-1 c'4-1"],
 bass=['c','c','g,','g,','c','c','g,','c','c','c','c','g,','c','c','g,','c'],
 summary='The complete 16-bar Simple Gifts tune behind Lord of the Dance, arranged in C with a simple bass part.',
 material='Complete traditional Simple Gifts tune with its original words and a beginner bass part. Sydney Carter’s Lord of the Dance adaptation and chorus are not included.')]


# Each row follows a bar of the melody. Underscores continue a sung syllable;
# tied continuations consume no new syllable. Only public-domain words appear.
LYRICS = {
 'amazing-grace': [
  'A --', 'maz -- ing __ _', 'grace! How', 'sweet the', 'sound That',
  'saved a __ _', 'wretch like', 'me!', 'I',
  'once was __ _', 'lost, but', 'now am', 'found; Was',
  'blind, but __ _', 'now I', 'see.', ''
 ],
 'lord-of-the-dance': [
  '"’Tis" the', 'gift to be sim -- ple, "’tis" the',
  'gift to be free, "’Tis" the', 'gift to come down',
  'where we ought to be, And', 'when we find our -- selves in the place',
  'just right, "’Twill" be in the', 'val -- ley of love and',
  'delight. When true sim --', 'pli -- ci -- ty',
  'is __ _ gained, __ _ _ To', 'bow and to bend we "shan’t"',
  'be a -- _ shamed, To', 'turn, turn will',
  'be our de -- light, Till by', 'turn -- ing, turn -- ing we', 'come round right.'
 ]
}
# At bar 8 the traditional source has one note for "delight"; sing the two
# syllables together on that note rather than inventing an extra attack.

def run(*args):
 subprocess.run(args, cwd=ROOT, check=True)

def note_fingers(bars):
 """Read written fingerings, including simultaneous chords and tied notes."""
 result = []
 tied = False
 for token in re.findall(r'<[^>]+>\d+\.?~?|\b[a-gr][,\x27]*\d+\.?-[1-5]~?|r\d+\.?', ' '.join(bars)):
  if not token.startswith('r') and not tied:
   result.extend(int(n) for n in re.findall(r'-([1-5])', token))
  tied = token.endswith('~')
 return result

def octave_melody(bars):
 def expand(match):
  pitch, duration = match.group(1), match.group(2)
  return f"<{pitch}-1 {pitch}'-5>{duration}"
 return [re.sub(r"([a-g][,']*)(\d+\.?)-[1-5]", expand, bar) for bar in bars]

def variants(song):
 beats = int(song['meter'][0])
 right = [song['pickup']] + song['bars']
 left = ['r4'] + [n + ('2.' if beats == 3 else '1') + '-5' for n in song['bass']]
 left[-1] = song['bass'][-1] + ('2' if beats == 3 else '2.') + '-5'
 result = [dict(id='beginner', label='Beginner · melody and bass', right=right, left=left,
  description='One melody note at a time, with a held bass note in each bar.',
  fingering='Finger numbers are suggestions throughout. Move the right hand when its position changes. Left-hand finger 5 moves to each bass note; release the previous note before moving.')]
 if song['slug'] != 'lord-of-the-dance': return result
 harmonies = ['C','C','G','G','C','C','G','C','C','F','C','G','C','F','G','C']
 roots = {'C':'c,','F':'f,','G':'g,'}
 chords = {'C':'<e,-5 g,-3 c-1>', 'F':'<f,-5 a,-3 c-1>', 'G':'<g,-5 b,-3 d-1>'}
 accompaniment = ['r4'] + [f'{roots[h]}4-5 {chords[h]}4 {roots[h]}4-5 {chords[h]}4' for h in harmonies]
 accompaniment[-1] = 'c,4-5 <e,-5 g,-3 c-1>2'
 result.append(dict(id='intermediate', label='Intermediate · bass and chords', right=right, left=accompaniment,
  description='The same melody with alternating left-hand bass notes and three-note chords. Learn the left-hand movements separately before combining the hands.',
  fingering='Right-hand melody fingering matches the beginner version. Left hand: bass with 5; chord low to high with 5–3–1. Release each bass before moving to the chord. These are movements, not a stretch to hold.'))
 arpeggios = {'C':'c,8-5 e,8-3 g,8-2 c8-1 g,8-2 e,8-3 c,8-5 g,8-2',
  'F':'f,8-5 a,8-3 c8-2 f8-1 c8-2 a,8-3 f,8-5 c8-2',
  'G':'g,8-5 b,8-3 d8-2 g8-1 d8-2 b,8-3 g,8-5 d8-2'}
 accompaniment = ['r4'] + [arpeggios[h] for h in harmonies]
 accompaniment[-1] = 'c,4-5 e,8-3 g,8-2 c4-1'
 result.append(dict(id='advanced', label='Advanced study · octaves and flowing bass', right=octave_melody(right), left=accompaniment,
  description='The melody in right-hand octaves above a continuous eighth-note bass pattern. This study requires comfortable octave reach and independent hands; use the intermediate version if octaves feel strained.',
  fingering='Right-hand octaves use thumb 1 on the lower note and little finger 5 on the upper. Release and move together. Left-hand fingers follow the broken chord; move the arm rather than holding an octave stretch.'))
 return result

def build(song, variant):
 base = song['slug']
 slug = base + ('' if variant['id'] == 'beginner' else '-' + variant['id'])
 beats = int(song['meter'][0])
 title = 'Simple Gifts' if base == 'lord-of-the-dance' else song['title']
 source = FOLDER / 'source' / f'{slug}.ly'
 right, left = variant['right'], variant['left']
 lines = ['\\version "2.26.0"',
  f'\\header {{ title = "{title}" subtitle = "{variant["label"]} · C major" composer = "{song["composer"]}" poet = "'+('John Newton · stanza 1 (1779)' if base == 'amazing-grace' else 'Joseph Brackett · original words (1848)')+'" tagline = ##f }',
  '#(set-global-staff-size 18)', '\\paper { top-margin = 10\\mm bottom-margin = 10\\mm ragged-last-bottom = ##t }',
  FINGERING_LAYOUT, '\\score {', '\\new PianoStaff <<']
 for hand, bars in [('up', right), ('down', left)]:
  lines += ['\\new Staff = "' + hand + '" {']
  if hand == 'up': lines += ['\\new Voice = "melody" {']
  lines += ['\\clef ' + ('treble' if hand == 'up' else 'bass') + f' \\key c \\major \\numericTimeSignature \\time {song["meter"]} \\tempo 4 = 60 \\partial 4']
  for i, bar in enumerate(bars):
   marker = ''
   if base == 'lord-of-the-dance' and hand == 'up' and i == 1: marker = '\\mark \\markup "A" '
   if base == 'lord-of-the-dance' and hand == 'up' and i == 8: marker = '\\mark \\markup "B begins on beat 2" '
   line_end = (' \\pageBreak' if base == 'lord-of-the-dance' and i == 8 else ' \\break' if i and i % (2 if base == 'lord-of-the-dance' else 4) == 0 else '')
   lines.append(marker + bar + (' |' if i < 16 else '') + line_end + ' % ' + str(i))
  lines += ['\\bar "|."', '}']
  if hand == 'up':
   lines += ['}', '\\new Lyrics \\lyricsto "melody" {'] + LYRICS[base] + ['}']
 lines += ['>>', '\\layout { }', '\\midi { }', '}']
 source.write_text('\n'.join(lines) + '\n')
 with tempfile.TemporaryDirectory(prefix='migs-hymns-') as temporary:
  work = Path(temporary)
  run('lilypond', '-o', str(work/'score'), str(source))
  for ext in ['pdf', 'midi']: shutil.copyfile(work/f'score.{ext}', FOLDER/f'{slug}.{ext}')
  run('lilypond', '-dbackend=svg', '-o', str(work/'score'), str(source))
  pages = sorted(work.glob('score-*.svg')) or [work/'score.svg']
  viewboxes = write_score_pages(pages, FOLDER, slug)
  plain_pdf(source, work, FOLDER, slug)
  (work/'capture-source.ly').write_text(source.read_text().replace('\\layout { }', '\\layout { \\context { \\Voice \\consists #capture-notes } }'))
  (work/'capture.ly').write_text('\\version "2.26.0"\n\\include "' + str(ROOT/'scripts/score-events.ily') + '"\n\\include "' + str(work/'capture-source.ly') + '"\n')
  run('lilypond', '-dno-print-pages', '-o', str(work/'capture'), str(work/'capture.ly'))
  performance = FOLDER/f'{slug}-performance.json'
  description = f'Count {"1 2 3" if beats == 3 else "1 & 2 & 3 & 4 &"}. Start the pickup on {beats}. Tempo counts quarter notes. ' + variant['description']
  run(sys.executable, 'scripts/import-midi.py', str(work/'score.midi'), str(performance), '--meter', song['meter'], '--pickup', '1', '--title', title + ' · ' + variant['label'], '--description', description)
  data = json.loads(performance.read_text())
  sequences = {'right': iter(note_fingers(right)), 'left': iter(note_fingers(left))}
  fingers = {}
  for event in data['events']:
   for hand in ('right', 'left'):
    for note in sorted(event[hand], key=lambda n: n['midi']):
     if note['attack']: fingers[note['id']] = next(sequences[hand])
     note['finger'] = fingers[note['id']]
  for sequence in sequences.values(): assert next(sequence, None) is None
  data['fingeringNote'] = variant['fingering']
  data['passages'] = [{'id':'opening','label':'Opening · pickup + bars 1–4','from':0,'to':4}, {'id':'full','label':'Complete tune · 16 bars','from':0,'to':16}]
  if base == 'amazing-grace':
   data['passages'][1].update(label='Full song · six original verses', repetitions=6)
   data['passages'].insert(2, dict(id='tune',label='Single verse · complete 16-bar tune', **{'from':0,'to':16}))
  if base == 'lord-of-the-dance':
   data['passages'] += [{'id':'a','label':'Section A · opening through bar 8, beat 1','from':0,'to':8,'toBeat':1}, {'id':'b','label':'Section B · bar 8, beat 2 through ending','from':8,'fromBeat':1,'to':16}]
  data['passages'] += [{'id':str(a),'label':f'Bars {a}–{b}','from':a,'to':b} for a,b in [(1,4),(4,8),(8,12),(12,16),(9,16)]]
  performance.write_text(json.dumps(data,separators=(',',':'))+'\n')
  run(sys.executable, 'scripts/link-score.py', str(work/'capture-events.tsv'), str(work/'score'), '--performance', str(performance), '--output', str(FOLDER/f'{slug}-score-map.json'), '--timed')
  return dict(id=variant['id'], label=variant['label'], description=variant['description'], exerciseFile=f'{slug}-performance.json', scoreMapFile=f'{slug}-score-map.json', notationFiles=[f'{slug}-page-{i}.svg' for i in range(1,len(pages)+1)], scoreViewBoxes=viewboxes, fingeredNotationFiles=[f'{slug}-fingering-page-{i}.svg' for i in range(1,len(pages)+1)], downloadFiles=[f'{slug}.pdf', f'{slug}.midi'])

def main():
 library = json.loads((ROOT/'content/songs.json').read_text())
 for song in SONGS:
  arrangements = [build(song, variants(song)[0])] # Other levels are deferred while the complete requested hymn is sourced.
  slug = song['slug']; base = arrangements[0]
  item = dict(id=slug, title=song['title'], artist=song['composer'], category='Hymns', defaultPassage='full', lyricsFile=f'{slug}-lyrics.json', status='Complete beginner arrangement' if slug == 'amazing-grace' else 'Traditional tune study', summary=song['summary'] if slug == 'amazing-grace' else 'The complete Simple Gifts tune. The separate Lord of the Dance adaptation, including its chorus, is not yet in the player.', materialTitle='Melody and bass · score and practice player', materialDescription=song['material'], notesFile=f'{slug}-notes.md', practiceFile=f'{slug}-practice.md', notationAlt=song['title'] + ' in C major, both hands with lyrics.', scoreLyricsNote='The printed score shows John Newton’s first stanza. The Words panel contains all six original stanzas.' if slug == 'amazing-grace' else 'The printed words are the original Simple Gifts lyrics.')
  item.update({key:value for key,value in base.items() if key not in ('id','label','description')})
  if len(arrangements) > 1:
   item.update(arrangements=arrangements, status='Simple Gifts · 3 difficulty levels', summary='The complete traditional Simple Gifts tune at three levels. The separate Lord of the Dance adaptation and chorus are not yet in the player.', materialTitle='Simple Gifts · three arrangements')
  existing = next((s for s in library['songs'] if s['id'] == slug), None)
  if existing is None: library['songs'].append(item)
  else:
   existing.pop('arrangements', None)
   existing.update(item)
 (ROOT/'content/songs.json').write_text(json.dumps(library,ensure_ascii=False,indent=2)+'\n')
 print('Built both beginner hymn tunes with aligned lyrics and optional score fingering.')

if __name__ == '__main__': main()
