"""Import the LilyPond MIDI into the local player; no third-party dependencies.
Usage: python3 scripts/import-midi.py INPUT.midi OUTPUT.json
The supplied MIDI must have named up/down tracks and unfolded repeats.
"""
from pathlib import Path
import json, sys
b = Path(sys.argv[1]).read_bytes()
assert b[:4] == b'MThd'
tpq = int.from_bytes(b[12:14], 'big')
assert tpq < 32768
pos = 8 + int.from_bytes(b[4:8], 'big')
notes, total = [], 0

def var():
    global pos
    n = 0
    while True:
        v = b[pos]; pos += 1; n = (n << 7) | (v & 127)
        if v < 128: return n

while pos < len(b):
    assert b[pos:pos+4] == b'MTrk'
    size = int.from_bytes(b[pos+4:pos+8], 'big'); pos += 8
    end = pos + size; tick = 0; running = None; name = ''; active = {}
    while pos < end:
        tick += var(); status = b[pos]
        if status >= 128: pos += 1
        else: status = running
        if status == 255:
            kind = b[pos]; pos += 1; length = var()
            data = b[pos:pos+length]; pos += length
            if kind == 3: name = data.decode('utf8')
        elif status in (240,247):
            length = var(); pos += length
        else:
            running = status; a = b[pos]; pos += 1; c = None
            if status & 240 not in (192,208): c = b[pos]; pos += 1
            key = (status & 15, a)
            if status & 240 == 144 and c:
                assert key not in active
                active[key] = (tick,c)
            elif status & 240 == 128 or (status & 240 == 144 and not c):
                start, velocity = active.pop(key)
                if name.startswith(('up:', 'down:')):
                    notes.append(dict(id=len(notes), midi=a, start=start, end=tick, hand='right' if name.startswith('up:') else 'left'))
    assert not active
    total = max(total, tick)

unit = tpq / 2 # one eighth note per player beat
pickup = int(unit)
bar_ticks = int(3 * unit)
boundaries = {0, total, *range(pickup,total,bar_ticks)}
for note in notes: boundaries.update((note['start'],note['end']))
times = sorted(boundaries)
# Suggested fingering only for the familiar opening; later passages are unannotated.
rh = sorted((n for n in notes if n['hand']=='right'), key=lambda n:n['start'])
for note,finger in zip(rh,[5,4,5,4,5,2,4,3,1,1,2,4,5,1,3,5,5]): note['finger']=finger
for note in notes:
    if note['hand']=='left' and note['start'] < 9*bar_ticks:
        if note['midi'] in (45,40): note['finger']=5
        elif note['midi']==52: note['finger']=2
        elif note['midi'] in (57,56): note['finger']=1

events = []
for t,end in zip(times,times[1:]):
    bar = 0 if t<pickup else 1+(t-pickup)//bar_ticks
    beat = (t / unit + 2) if bar==0 else ((t-pickup)%bar_ticks)/unit
    event = dict(beats=(end-t)/unit,bar=bar,beat=beat,right=[],left=[])
    for n in notes:
        if n['start']<=t<n['end']:
            value={k:n[k] for k in ('id','midi','finger') if k in n}
            value['attack'] = n['start']==t
            value['length'] = (n['end']-n['start'])/unit
            event[n['hand']].append(value)
    events.append(event)
result=dict(title='Für Elise — original 3/8',description='Tempo counts eighth notes: 1 & 2 & 3 &. Repeats are played in full. Playback follows the written note lengths without pedal or expressive timing.',timeline=True,meter=[3,8],pickupBeats=1,events=events)
Path(sys.argv[2]).write_text(json.dumps(result,separators=(',',':'))+'\n')
print(f'{len(notes)} notes, {len(events)} events, {total/unit} eighth-note units, {events[-1]["bar"]} playthrough bars after pickup')
