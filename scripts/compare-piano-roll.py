"""Compare a two-hand draft with independent solo demonstrations.

Outputs only exactly matching pitch/onset/duration triples. Disagreements are
printed for visual review; this does not establish musical correctness alone.
"""
import argparse
from collections import Counter
import json
from pathlib import Path

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('both', type=Path)
p.add_argument('--right', type=Path, required=True)
p.add_argument('--left', type=Path, required=True)
p.add_argument('--right-offset', type=float, default=0)
p.add_argument('--left-offset', type=float, default=0)
p.add_argument('--output', type=Path, required=True)
a = p.parse_args()
data = json.loads(a.both.read_text())
matched = []
for hand in ('right', 'left'):
    solo = json.loads(getattr(a, hand).read_text())['notes']
    offset = getattr(a, hand + '_offset')
    key = lambda n: (n['start'], n['midi'], n['beats'])
    expected = Counter((n['start'] + offset, n['midi'], n['beats']) for n in solo if n['hand'] == hand)
    both = [n for n in data['notes'] if n['hand'] == hand]
    actual = Counter(map(key, both))
    print(hand, 'only in two-hand draft:', list((actual - expected).elements()))
    print(hand, 'only in solo draft:', list((expected - actual).elements()))
    for note in both:
        if expected[key(note)]:
            matched.append(note)
            expected[key(note)] -= 1
data['notes'] = sorted(matched, key=lambda n: (n['start'], n['hand'], n['midi']))
a.output.parent.mkdir(parents=True, exist_ok=True)
a.output.write_text(json.dumps(data, indent=2) + '\n')
print(len(matched), 'matching notes. Review before engraving.')
