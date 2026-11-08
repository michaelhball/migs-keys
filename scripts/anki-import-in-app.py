"""Import a course stage through Anki's own API while its desktop app is open.

Run with runpy.run_path from Anki's debug console, passing `mw` and
`through_lesson` in init_globals. Never opens or edits a collection database
directly. The website itself does not run this script.
"""
from pathlib import Path
import json
from anki.import_export_pb2 import ImportAnkiPackageRequest, ImportAnkiPackageOptions

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'content/anki/manifest.json').read_text())
stage = next(item for item in manifest['lessons'] if item['lesson'] == through_lesson)
assert through_lesson <= manifest['releasedThrough'], 'Only import released lessons'
col = mw.col
before = {cid: (c.type, c.queue, c.ivl, c.due, c.reps, c.lapses)
          for cid in col.find_cards('deck:"Migs Keys"') for c in [col.get_card(cid)]}
result = col.import_anki_package(ImportAnkiPackageRequest(
    package_path=str(root / 'content/anki/decks' / stage['file']),
    options=ImportAnkiPackageOptions(with_scheduling=False, with_deck_configs=False)))
for cid, expected in before.items():
    c = col.get_card(cid)
    assert (c.type, c.queue, c.ivl, c.due, c.reps, c.lapses) == expected, 'Review progress changed'
deck = col.decks.by_name('Migs Keys::Music theory')
config = col.decks.config_dict_for_deck_id(deck['id'])
users = [d.name for d in col.decks.all_names_and_ids()
         if col.decks.get(d.id).get('conf') == config['id']]
# Do not modify a shared Default preset when imported without deck settings.
if any(not name.startswith('Migs Keys') for name in users):
    config['id'] = 0
    config['name'] = 'Migs Keys'
    col.decks.update_config(config)
    deck['conf'] = config['id']
    col.decks.save(deck)
config['new']['bury'] = config['rev']['bury'] = True
config['buryInterdayLearning'] = True
config['newGatherPriority'] = config['newSortOrder'] = 4
col.decks.update_config(config)
total = len(col.find_cards('deck:"Migs Keys::Music theory"'))
assert total >= stage['cards']
mw.reset()
report = dict(throughLesson=through_lesson, cards=total,
              previousCards=len(before), reviewProgressPreserved=True,
              dailyNew=config['new']['perDay'], siblingBurying=True,
              randomCardOrder=True)
(root / 'data/anki-import-last.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
