"""Validate packages and real Anki imports in a temporary collection.
Requires the pinned Anki build dependency; never opens a learner collection.
"""
from pathlib import Path
import json,re,tempfile,zipfile
from anki.collection import Collection
from anki.import_export_pb2 import ImportAnkiPackageRequest
root=Path(__file__).resolve().parent.parent;folder=root/'content/anki';manifest=json.loads((folder/'manifest.json').read_text())
packages=manifest['lessons']+manifest['optional']+manifest.get('library',[])
for item in packages:
    with zipfile.ZipFile(folder/'decks'/item['file']) as package:
        media=json.loads(package.read('media'))
        assert all(k in package.namelist() for k in media)
        assert len(media)==len(set(media.values()))
with tempfile.TemporaryDirectory(prefix='migs-anki-test-') as temporary:
    collection=Collection(str(Path(temporary)/'collection.anki2'))
    def load(item):return collection.import_anki_package(ImportAnkiPackageRequest(package_path=str(folder/'decks'/item['file'])))
    second=manifest['lessons'][1];load(second)
    assert collection.note_count()==second['facts'];assert collection.card_count()==second['cards']
    ids=collection.find_cards('');card=collection.get_card(ids[0]);card.type=2;card.queue=2;card.ivl=17;card.due=42;card.reps=4;collection.update_card(card)
    before={id:(collection.get_card(id).ivl,collection.get_card(id).due,collection.get_card(id).reps) for id in ids}
    load(second);assert collection.card_count()==second['cards']
    third=manifest['lessons'][2];load(third);assert collection.card_count()==third['cards']
    for id,expected in before.items():
        card=collection.get_card(id);assert (card.ivl,card.due,card.reps)==expected
    # Corrections to a fact preserve GUID and progress, even when text changes.
    from anki.import_export_pb2 import ImportAnkiPackageOptions
    old=collection.get_note(collection.get_card(ids[0]).nid);original=old['Answer'];old['Answer']='Temporary test edit';collection.update_note(old)
    options=ImportAnkiPackageOptions(update_notes=1)
    collection.import_anki_package(ImportAnkiPackageRequest(package_path=str(folder/'decks'/second['file']),options=options))
    assert collection.get_note(old.id)['Answer']==original
    # Import the full ready block, then optional packs, checking all rendered cards.
    load(manifest['lessons'][5])
    for item in manifest['optional']:load(item)
    for id in collection.find_cards(''):
        card=collection.get_card(id)
        for face in (card.question(),card.answer()):
            assert '<invalid html' not in face.lower()
            for name in re.findall(r'<img[^>]+src="([^"]+)"',face):assert (Path(collection.media.dir())/name).is_file(),name
    assert len(collection.find_cards('tag:lesson_07'))==0,'Future lessons must not leak into current packages'
    load(manifest['lessons'][-1])
    load(next(p for p in manifest['library'] if p['id']=='complete'))
    assert collection.note_count()==manifest['preparedFacts']
    assert collection.card_count()==manifest['preparedCards']
    for id in collection.find_cards(''):
        card=collection.get_card(id)
        for face in (card.question(),card.answer()):
            for name in re.findall(r'<img[^>]+src="([^"]+)"',face):assert (Path(collection.media.dir())/name).is_file(),name
    for id,expected in before.items():
        card=collection.get_card(id);assert (card.ivl,card.due,card.reps)==expected
    print('Verified image inclusion, '+str(collection.card_count())+' rendered cards, duplicate-free reimport, incremental import, and preserved review scheduling.')
    collection.close()
