"""Write matching fingered and plain SVGs without moving any score elements.
LilyPond tags Fingering grobs; removing only those groups preserves noteheads,
bar numbers, lyrics, articulations and the existing playback coordinates.
"""
import re, shutil, subprocess, xml.etree.ElementTree as ET

FINGERING_LAYOUT = r'''\layout { \context { \Voice \override Fingering.output-attributes = #'((class . "score-fingering")) } }'''

def write_score_pages(pages, folder, slug):
    viewboxes = []
    for i, page in enumerate(pages, 1):
        text = re.sub(r'<a[^>]+xlink:href="textedit:[^"]*"[^>]*>(.*?)</a>', r'<g>\1</g>', page.read_text(), flags=re.S)
        tree = ET.fromstring(text)
        viewboxes.append(tree.get('viewBox'))
        (folder/f'{slug}-fingering-page-{i}.svg').write_text(text)
        for parent in tree.iter():
            for child in list(parent):
                if 'score-fingering' in child.get('class', '').split(): parent.remove(child)
        ET.register_namespace('', 'http://www.w3.org/2000/svg')
        ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
        (folder/f'{slug}-page-{i}.svg').write_text(ET.tostring(tree, encoding='unicode')+'\n')
    return viewboxes

def plain_pdf(source, work, folder, slug):
    text = source.read_text()
    assert FINGERING_LAYOUT in text
    text = text.replace(FINGERING_LAYOUT, r'\layout { \context { \Voice \override Fingering.transparent = ##t } }')
    plain = work/'plain.ly'; plain.write_text(text)
    subprocess.run(['lilypond', '-dno-point-and-click', '-o', str(work/'plain'), str(plain)], check=True)
    shutil.copyfile(work/'plain.pdf', folder/f'{slug}.pdf')
