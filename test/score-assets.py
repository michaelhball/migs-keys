"""Independently compare every non-fingering SVG element and its position."""
import json, sys, xml.etree.ElementTree as ET
from pathlib import Path
root = Path(__file__).resolve().parent.parent

def visible_elements(file):
    result = []
    def walk(element, transforms=()):
        if 'score-fingering' in element.get('class', '').split(): return
        transforms = transforms + ((element.get('transform'),) if element.get('transform') else ())
        tag = element.tag.rsplit('}', 1)[-1]
        if tag not in ('svg', 'g', 'a'):
            attributes = tuple(sorted((k, ' '.join(v.split())) for k,v in element.attrib.items()))
            result.append((tag, transforms, attributes, (element.text or '').strip()))
        for child in element: walk(child, transforms)
    walk(ET.parse(file).getroot())
    return result

for song in json.loads((root/'content/songs.json').read_text())['songs']:
    for plain, fingered in zip(song['notationFiles'], song.get('fingeredNotationFiles', [])):
        assert visible_elements(root/'content/songs'/plain) == visible_elements(root/'content/songs'/fingered), f'Score geometry changed: {plain}'
print('All non-fingering score elements and positions match.')
