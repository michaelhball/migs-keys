"""Original synthetic examples: grace timing, ties and pitch verification."""
from fractions import Fraction as F
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from score_timing import link_timed_notes


def note(id, pitch, length, attack=True):
    return dict(id=id, midi=pitch, length=length, attack=attack)


class ScoreTimingTests(unittest.TestCase):
    def test_grace_uses_midi_time_and_preserves_held_bass(self):
        # Written grace time is 1.5 quarters; LilyPond plays it at 1.875.
        source = {'right': [(F(0), F(0), 60, 'c'),
                            (F(1, 2), F(-1, 8), 63, 'grace'),
                            (F(1, 2), F(0), 64, 'e')],
                  'left': [(F(0), F(0), 48, 'bass')]}
        events = [dict(beats=1.875, bar=1, beat=0, right=[note(0, 60, 1.875)], left=[note(3, 48, 4)]),
                  dict(beats=.125, bar=1, beat=1.875, right=[note(1, 63, .125)], left=[note(3, 48, 4, False)]),
                  dict(beats=2, bar=1, beat=2, right=[note(2, 64, 2)], left=[note(3, 48, 4, False)])]
        linked = link_timed_notes(source, events, 4)
        self.assertEqual([e['right'][0]['scoreKey'] for e in linked], ['c', 'grace', 'e'])
        self.assertEqual([e['left'][0]['attack'] for e in linked], [True, False, False])
        self.assertEqual(sum(e['beats'] for e in linked), 4)

    def test_printed_tie_moves_marker_without_retriggering(self):
        source = {'right': [(F(0), F(0), 60, 'start'), (F(1, 4), F(0), 60, 'tie')], 'left': []}
        linked = link_timed_notes(source, [dict(beats=4, bar=1, beat=0, right=[note(0, 60, 4)], left=[])], 4)
        self.assertEqual([e['beats'] for e in linked], [1, 3])
        self.assertEqual([e['beat'] for e in linked], [0, 1])
        self.assertEqual([e['right'][0]['scoreKey'] for e in linked], ['start', 'tie'])
        self.assertEqual([e['right'][0]['attack'] for e in linked], [True, False])
        self.assertTrue(all(e['right'][0]['length'] == 4 for e in linked))

    def test_same_pitch_reattack_maps_to_new_head(self):
        source = {'right': [(F(0), F(0), 60, 'first'), (F(1, 4), F(0), 60, 'second')], 'left': []}
        events = [dict(beats=1, bar=1, beat=i, right=[note(i, 60, 1)], left=[]) for i in range(2)]
        linked = link_timed_notes(source, events, 4)
        self.assertEqual([e['right'][0]['scoreKey'] for e in linked], ['first', 'second'])

    def test_mismatched_pitch_is_rejected(self):
        source = {'right': [(F(0), F(0), 60, 'first')], 'left': []}
        with self.assertRaisesRegex(AssertionError, 'No unique MIDI note'):
            link_timed_notes(source, [dict(beats=1, bar=1, beat=0, right=[note(0, 61, 1)], left=[])], 4)


if __name__ == '__main__':
    unittest.main()
