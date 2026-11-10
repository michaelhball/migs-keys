"""Engrave a reviewed local note list and install it in the local song catalogue.

uv run --locked python scripts/build-local-song.py data/songs/arrangement.json

Input: metadata (id/title/etc.), meter [numerator,4], pickup, key, tempo,
notes [{hand,midi,start,beats,finger}], passages, optional marks {bar:label},
practice and notesText. Times are quarter-note units. Supply reviewed fingerings.
For ornaments, notation {right:[LilyPond bars],left:[LilyPond bars]} replaces
notes. Supply expectedPitches and fingerings arrays for each hand, in attack
order (chords low to high, tied continuations omitted). These independently
check the engraved MIDI. Inline fingering in the notation is optional.
mode is major (default) or minor. LilyPond notation inputs must be trusted.
All generated content stays under ignored data/songs/ by default.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from score_output import FINGERING_LAYOUT, write_score_pages, plain_pdf

ROOT = Path(__file__).resolve().parent.parent
DURATIONS = {4: '1', 3: '2.', 2: '2', 1.5: '4.', 1: '4', .75: '8.', .5: '8', .375: '16.', .25: '16', .125: '32'}
PITCHES = ('c', 'cis', 'd', 'dis', 'e', 'f', 'fis', 'g', 'gis', 'a', 'ais', 'b')

def quoted(text):
    return '"' + str(text).replace('\\', '\\\\').replace('"', '\\"').replace('\n', ' ') + '"'

def pitch(midi):
    octave = midi // 12 - 4
    return PITCHES[midi % 12] + ("'" * octave if octave > 0 else ',' * -octave)

def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)

def validate(spec):
    assert re.fullmatch(r'[a-z0-9-]+', spec['metadata']['id']), 'Invalid song ID'
    assert spec['meter'][1] == 4 and spec['meter'][0] > 0, 'Quarter-note meters only'
    assert 0 <= spec['pickup'] < spec['meter'][0]
    assert re.fullmatch(r'[a-g](?:is|es)?', spec['key']), 'Invalid key'
    assert spec.get('mode', 'major') in ('major', 'minor'), 'Invalid key mode'
    if 'notation' in spec:
        assert not spec['pickup'], 'Explicit bars currently require no pickup'
        assert len(spec['notation']['right']) == len(spec['notation']['left']) > 0
        for hand in ('right', 'left'):
            assert all(isinstance(bar, str) and bar for bar in spec['notation'][hand])
            pitches, fingers = spec['expectedPitches'][hand], spec['fingerings'][hand]
            assert len(pitches) == len(fingers) > 0
            assert all(isinstance(p, int) and 21 <= p <= 108 for p in pitches)
            assert all(isinstance(f, int) and 1 <= f <= 5 for f in fingers)
        return
    assert spec['notes'], 'No notes supplied'
    for n in spec['notes']:
        assert n['hand'] in ('right', 'left') and 21 <= n['midi'] <= 108
        assert n['start'] >= 0 and n['beats'] > 0 and 1 <= n['finger'] <= 5
        assert n['start'] * 8 == int(n['start'] * 8) and n['beats'] * 8 == int(n['beats'] * 8), 'Use thirty-second-note grid'
    for hand in ('right', 'left'):
        ends = {}
        for n in sorted((n for n in spec['notes'] if n['hand'] == hand), key=lambda n:n['start']):
            assert ends.get(n['midi'], 0) <= n['start'], 'Overlapping notes of the same pitch'
            ends[n['midi']] = n['start'] + n['beats']
        for time in {n['start'] for n in spec['notes'] if n['hand'] == hand}:
            held = [n for n in spec['notes'] if n['hand'] == hand and n['start'] <= time < n['start'] + n['beats']]
            assert len({n['finger'] for n in held}) == len(held), f'Finger used for simultaneous notes: {hand} at {time}'

def staff_lines(spec, hand, total):
    meter, pickup = spec['meter'][0], spec['pickup']
    notes = [n for n in spec['notes'] if n['hand'] == hand]
    bars = [0] + ([pickup] if pickup else [])
    while bars[-1] < total: bars.append(min(total, bars[-1] + meter))
    lines = []
    for index, (start, end) in enumerate(zip(bars, bars[1:])):
        bar = index if pickup else index + 1
        boundaries = sorted({start, end, *(n['start'] for n in notes if start < n['start'] < end), *(n['start'] + n['beats'] for n in notes if start < n['start'] + n['beats'] < end)})
        tokens = []
        for a, b in zip(boundaries, boundaries[1:]):
            while a < b:
                duration = max(d for d in DURATIONS if d <= b - a)
                sounding = sorted((n for n in notes if n['start'] <= a < n['start'] + n['beats']), key=lambda n:n['midi'])
                heads = []
                for n in sounding:
                    head = pitch(n['midi'])
                    if n['start'] == a: head += '-' + str(n['finger'])
                    if n['start'] + n['beats'] > a + duration: head += '~'
                    heads.append(head)
                if not heads: token = 'r' + DURATIONS[duration]
                elif len(heads) > 1: token = '<' + ' '.join(heads) + '>' + DURATIONS[duration]
                else:
                    n = sounding[0]
                    token = pitch(n['midi']) + DURATIONS[duration]
                    if n['start'] == a: token += '-' + str(n['finger'])
                    if n['start'] + n['beats'] > a + duration: token += '~'
                tokens.append(token)
                a += duration
        mark = spec.get('marks', {}).get(str(bar)) if hand == 'right' else None
        prefix = '\\mark \\markup ' + quoted(mark) + ' ' if mark else ''
        ending = ' \\break' if bar and bar % spec.get('barsPerLine', 4) == 0 else ''
        lines.append(prefix + ' '.join(tokens) + ' |' + ending + ' % bar ' + str(bar))
    return lines

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--directory', type=Path, default=ROOT/'data/songs')
    a = parser.parse_args()
    spec = json.loads(a.input.read_text()); validate(spec)
    meta = spec['metadata']; slug = meta['id']
    folder = a.directory / slug; folder.mkdir(parents=True, exist_ok=True)
    explicit = 'notation' in spec
    total = len(spec['notation']['right']) * spec['meter'][0] if explicit else max(n['start'] + n['beats'] for n in spec['notes'])
    source = folder / (slug + '.ly')
    lines = ['\\version "2.26.0"', '\\header { title = ' + quoted(meta['title']) + ' subtitle = ' + quoted(spec.get('subtitle', 'Beginner arrangement')) + ' composer = ' + quoted(meta.get('artist', '')) + ' tagline = ##f }',
             '#(set-global-staff-size 18)', '\\paper { top-margin = 10\\mm bottom-margin = 10\\mm ragged-last-bottom = ##t }', FINGERING_LAYOUT, '\\score { \\new PianoStaff <<']
    for hand, staff, clef in [('right','up','treble'), ('left','down','bass')]:
        lines.append('\\new Staff = "' + staff + '" { \\clef ' + clef + ' \\key ' + spec['key'] + ' \\' + spec.get('mode','major') + ' \\numericTimeSignature \\time ' + '/'.join(map(str,spec['meter'])) + ' \\tempo 4 = ' + str(spec.get('tempo',60)))
        if spec['pickup']: lines.append('\\partial ' + DURATIONS[spec['pickup']])
        if explicit:
            for bar, music in enumerate(spec['notation'][hand], 1):
                mark = spec.get('marks', {}).get(str(bar)) if hand == 'right' else None
                prefix = '\\mark \\markup ' + quoted(mark) + ' ' if mark else ''
                # A second break on the bass staff falls after a treble grace
                # pickup and can strand the ornament on an empty system.
                ending = ' \\break' if hand == 'right' and bar % spec.get('barsPerLine', 4) == 0 else ''
                lines.append(prefix + music + f' | \\barNumberCheck #{bar+1}' + ending)
        else:
            lines += staff_lines(spec, hand, total)
        lines.append('\\bar "|." }')
    lines += ['>> \\layout { } \\midi { } }']
    source.write_text('\n'.join(lines) + '\n')
    with tempfile.TemporaryDirectory(prefix='migs-local-score-') as tmp:
        work = Path(tmp)
        run('lilypond', '-dwarning-as-error', '-o', str(work/'score'), str(source))
        shutil.copyfile(work/'score.midi', folder/f'{slug}.midi')
        run('lilypond', '-dbackend=svg', '-o', str(work/'score'), str(source))
        pages = sorted(work.glob('score-*.svg'), key=lambda p:int(p.stem.rsplit('-',1)[1])) or [work/'score.svg']
        viewboxes = write_score_pages(pages, folder, slug)
        plain_pdf(source, work, folder, slug)
        (work/'capture-source.ly').write_text(source.read_text().replace('\\layout { }', '\\layout { \\context { \\Voice \\consists #capture-notes } }'))
        (work/'capture.ly').write_text('\\version "2.26.0"\n\\include "' + str(ROOT/'scripts/score-events.ily') + '"\n\\include "' + str(work/'capture-source.ly') + '"\n')
        run('lilypond', '-dno-print-pages', '-o', str(work/'capture'), str(work/'capture.ly'))
        performance = folder/f'{slug}-performance.json'
        run(sys.executable, 'scripts/import-midi.py', str(work/'score.midi'), str(performance), '--meter', '/'.join(map(str,spec['meter'])), '--pickup', str(spec['pickup']), '--title', meta['title'], '--description', spec['description'])
        data = json.loads(performance.read_text())
        expected = {(n['hand'], n['start'], n['midi']):n for n in spec.get('notes', [])}
        actual = Counter(); fingers = {}; time = 0
        attack_index = {'right': 0, 'left': 0}
        for e in data['events']:
            for hand in ('right','left'):
                for n in sorted(e[hand], key=lambda n:n['midi']):
                    if n['attack']:
                        if explicit:
                            i = attack_index[hand]
                            assert i < len(spec['expectedPitches'][hand]), f'Unexpected extra attack: {hand} at {time}'
                            assert n['midi'] == spec['expectedPitches'][hand][i], (hand, i, n)
                            fingers[n['id']] = spec['fingerings'][hand][i]
                            attack_index[hand] += 1
                        else:
                            original = expected[(hand, time, n['midi'])]
                            assert n['length'] == original['beats'], (hand, time, n, original)
                            fingers[n['id']] = original['finger']
                        actual[(hand,time,n['midi'],n['length'])] += 1
                    n['finger'] = fingers[n['id']]
                assert len({n['finger'] for n in e[hand]}) == len(e[hand]), f'Finger collision: {hand} at {time}'
            time += e['beats']
        if explicit:
            assert all(attack_index[h] == len(spec['expectedPitches'][h]) for h in attack_index), 'Missing MIDI attacks'
        else:
            assert actual == Counter((n['hand'],n['start'],n['midi'],n['beats']) for n in spec['notes']), 'Engraved MIDI differs from reviewed input'
        assert abs(time - total) < 1e-6, (time, total)
        data['passages'] = spec['passages']; data['fingeringNote'] = spec['fingeringNote']
        performance.write_text(json.dumps(data,separators=(',',':'))+'\n')
        run(sys.executable, 'scripts/link-score.py', str(work/'capture-events.tsv'), str(work/'score'), '--performance', str(performance), '--output', str(folder/f'{slug}-score-map.json'), '--timed')
    for key, text in [('notes',spec['notesText']),('practice',spec['practice'])]: (folder/f'{slug}-{key}.md').write_text(text+'\n')
    meta.update(notesFile=f'{slug}-notes.md', practiceFile=f'{slug}-practice.md', exerciseFile=f'{slug}-performance.json', scoreMapFile=f'{slug}-score-map.json', notationFiles=[f'{slug}-page-{i+1}.svg' for i in range(len(pages))], fingeredNotationFiles=[f'{slug}-fingering-page-{i+1}.svg' for i in range(len(pages))], scoreViewBoxes=viewboxes, downloadFiles=[f'{slug}.pdf',f'{slug}.midi'])
    index = a.directory/'index.json'
    catalogue = json.loads(index.read_text()) if index.exists() else {'songs':[]}
    catalogue['songs'] = [s for s in catalogue['songs'] if s['id'] != slug] + [meta]
    temporary = index.with_suffix('.tmp'); temporary.write_text(json.dumps(catalogue,ensure_ascii=False,indent=2)+'\n'); temporary.replace(index)
    print(f'Installed {slug}: {sum(actual.values())} verified notes, {len(pages)} pages, {total} quarter-note beats.')

if __name__ == '__main__': main()
