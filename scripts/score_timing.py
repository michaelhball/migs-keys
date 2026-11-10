"""Match printed noteheads to MIDI timing, including ties and grace notes.

LilyPond compresses grace notes into a short interval before the main beat;
its engraving grace moments are not MIDI timestamps. Match those attacks by
ordered pitch within each ornament, keeping normal notes on the written beat.
"""
from collections import defaultdict


def link_timed_notes(source, events, denominator):
    played = {hand: [] for hand in source}
    time = 0
    for event in events:
        for hand in source:
            for note in event[hand]:
                if note['attack']:
                    played[hand].append((round(time, 6), note['midi'], note['id'], time + note['length']))
        time += event['beats']

    changes = defaultdict(list)
    boundaries = set()
    for hand, origins in source.items():
        normal = sorted(o for o in origins if not o[1])
        grace = defaultdict(list)
        mapped = set()
        for moment, offset, pitch, key in origins:
            if offset:
                grace[moment].append((offset, pitch, key))
        for moment, _, pitch, key in normal:
            beat = round(float(moment) * denominator, 6)
            matches = [n for n in played[hand] if n[1] == pitch and n[0] <= beat + 1e-6 and n[3] > beat + 1e-6]
            assert len(matches) == 1, f'No unique MIDI note at score beat {beat}: {hand}, pitch {pitch}'
            note = matches[0]
            mapped.add(note[2])
            changes[note[2]].append((beat, key))
            boundaries.add(beat)
        for moment, heads in sorted(grace.items()):
            beat = float(moment) * denominator
            previous = max((float(o[0]) * denominator for o in normal if o[0] < moment), default=0)
            notes = sorted(n for n in played[hand] if n[2] not in mapped and previous <= n[0] < beat)
            heads.sort()
            assert len(notes) == len(heads), f'Grace-note count mismatch before beat {beat}: {hand}'
            for note, (_, pitch, key) in zip(notes, heads):
                assert note[1] == pitch, f'Grace-note pitch mismatch: {hand}, {note[1]}, {pitch}'
                mapped.add(note[2])
                changes[note[2]].append((note[0], key))
        assert mapped == {n[2] for n in played[hand]}, f'Unmatched MIDI attacks: {hand}'

    # MIDI does not split held notes at every printed tie continuation.
    # Add those visual boundaries without introducing new audio attacks.
    result = []
    time = 0
    for event in events:
        end = time + event['beats']
        points = [time, *sorted(b for b in boundaries if time + 1e-6 < b < end - 1e-6), end]
        for a, b in zip(points, points[1:]):
            part = {**event, 'beats': b - a, 'beat': event['beat'] + a - time}
            for hand in source:
                part[hand] = []
                for note in event[hand]:
                    keys = sorted(changes[note['id']])
                    key = [key for at, key in keys if at <= a + 1e-6][-1]
                    part[hand].append({**note, 'attack': note['attack'] and a == time, 'scoreKey': key})
            result.append(part)
        time = end
    return result
