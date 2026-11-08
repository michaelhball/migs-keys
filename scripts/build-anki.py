"""Build cumulative Anki packages and original notation images.
Use the pinned tools in scripts/anki-requirements.txt. --images requires LilyPond;
otherwise committed images suffice. No runtime dependency is added to the app.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse,hashlib,html,itertools,json,re,sqlite3,subprocess,tempfile,time,zipfile
import genanki
from PIL import Image,ImageChops,ImageOps,ImageDraw
root=Path(__file__).resolve().parent.parent
folder=root/'content/anki';media=folder/'media';out=folder/'decks'
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--images',action='store_true');args=parser.parse_args()
notes=json.loads((folder/'notes.json').read_text());specs=json.loads((folder/'images.json').read_text())
if args.images:
    def render(item):
        key,spec=item
        with tempfile.TemporaryDirectory(prefix='migs-card-') as temp:
            work=Path(temp)
            clef='\\omit Staff.Clef' if spec['clef']=='none' else '\\clef '+spec['clef']
            meter='\\numericTimeSignature \\time '+spec['meter'] if spec.get('meter') else '\\omit Staff.TimeSignature \\cadenzaOn'
            source='\n'.join(['\\version "2.26.0"','\\header { tagline = ##f }','#(set-global-staff-size 26)','\\paper { indent = 0\\mm line-width = 55\\mm paper-width = 62\\mm paper-height = 35\\mm top-margin = 3\\mm ragged-right = ##f }','\\score { \\new Staff { '+clef+' '+meter+' '+spec['music']+' \\bar "" } \\layout { \\context { \\Score \\omit BarNumber } } }'])
            sourcepath=folder/'source'/f'migs-{key}.ly';sourcepath.parent.mkdir(exist_ok=True)
            if sourcepath.exists() and sourcepath.read_text()==source+'\n' and (media/f'migs-{key}.png').exists():return
            sourcepath.write_text(source+'\n')
            subprocess.run(['lilypond','--png','-dresolution=220','-o',str(work/'image'),str(sourcepath)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            image=Image.open(work/'image.png').convert('RGB')
            bounds=ImageChops.difference(image,Image.new('RGB',image.size,'white')).getbbox()
            image=ImageOps.expand(image.crop(bounds),border=20,fill='white')
            image.save(media/f'migs-{key}.png')
    with ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(render,specs.items()))
    # A compact contact sheet makes every notation image reviewable.
    sheet=Image.new('RGB',(1000,((len(specs)+3)//4)*180),'#eeeeee');draw=ImageDraw.Draw(sheet)
    for index,key in enumerate(specs):
        image=Image.open(media/f'migs-{key}.png');image.thumbnail((235,140))
        x=(index%4)*250;y=(index//4)*180
        draw.text((x+8,y+6),key,fill='black');sheet.paste(image,(x+8,y+30))
    sheet.save('/tmp/migs-anki-contact.png')
css='''.card { font: 22px/1.5 -apple-system, Arial, sans-serif; text-align: center; color: #24342b; background: #fafbf8; padding: 24px; } .prompt,.answer { max-width: 680px; margin: auto; } .notation { display: block; width: min(100%,360px); height: auto; margin: 20px auto; background: white; border-radius: 6px; } .extra { margin-top: 20px; font-size: 17px; color: #536154; } .source { font-size: 13px; margin-top: 24px; } hr { border: 0; border-top: 1px solid #cdd6cb; margin: 24px 0; } .nightMode.card { background:#202620; color:#edf4ec; } .nightMode .extra {color:#c4cec1;} .nightMode .notation {filter:none;}'''
# These IDs, field names and template ordinals are persistent import identities.
model=genanki.Model(1936742401,'Migs Keys · theory v1',fields=[{'name':name,'id':1936742410+i} for i,name in enumerate(['Key','Prompt','Answer','RecallPrompt','RecallAnswer','Extra','Source'])],templates=[{'name':'Recognise / explain','id':1936742421,'qfmt':'<div class="prompt">{{Prompt}}</div>','afmt':'{{FrontSide}}<hr id="answer"><div class="answer">{{Answer}}</div><div class="extra">{{Extra}}</div><div class="source">{{Source}}</div>'},{'name':'Recall / locate','id':1936742422,'qfmt':'{{#RecallPrompt}}<div class="prompt">{{RecallPrompt}}</div>{{/RecallPrompt}}','afmt':'{{FrontSide}}<hr id="answer"><div class="answer">{{RecallAnswer}}</div><div class="extra">{{Extra}}</div><div class="source">{{Source}}</div>'}],css=css,sort_field_index=0)
class CoursePackage(genanki.Package):
    def write_to_db(self,cursor,timestamp,id_gen):
        super().write_to_db(cursor,timestamp,id_gen)
        # Each deck gets a separate named preset, without changing Default.
        config=json.loads(cursor.execute('SELECT dconf FROM col').fetchone()[0])
        if not config:raise ValueError('Missing Anki deck configuration')
        preset=json.loads(json.dumps(next(iter(config.values()))));preset.update(id=1936742501,name='Migs Keys · 5 new cards',mod=int(timestamp),usn=-1)
        preset['new'].update(perDay=5,bury=True);preset['rev']['bury']=True;preset['buryInterdayLearning']=True
        config[str(preset['id'])]=preset
        decks=json.loads(cursor.execute('SELECT decks FROM col').fetchone()[0])
        for deck in decks.values():
            if deck['name'].startswith('Migs Keys'):
                deck['conf']=preset['id']
                for key in ('lrnToday','newToday','revToday','timeToday'):deck[key]=[0,0]
        cursor.execute('UPDATE col SET dconf=?,decks=?',(json.dumps(config),json.dumps(decks)))
course=json.loads((root/'content/course.json').read_text())
released=max(item['id'] for item in course['lessons'] if item.get('file'))
manifest={'version':1,'releasedThrough':released,'lessons':[],'optional':[],'library':[],'media':[]}
all_media=set()
def build(filename,selected,deck_id,deck_name):
    deck=genanki.Deck(deck_id,deck_name,description='Original practice questions for Migs Keys. Import later packages into the same profile to add lessons. Review scheduling is not included.')
    used=set()
    for index,n in enumerate(selected):
        lesson=f'Lesson {n["lesson"]}' if n['pack']=='course' else 'Later theory' if n['pack']=='advanced' else 'Song study'
        source=f'{lesson} · <a href="{html.escape(n["source"],quote=True)}">Reference</a>'
        fields=[n['id'],n['front'],n['back'],n['reverse'],n['reverseAnswer'],n['extra'],source]
        used.update(re.findall(r'<img[^>]+src="([^"]+)"',''.join(fields)))
        deck.add_note(genanki.Note(model=model,fields=fields,guid=genanki.guid_for('migs-keys/theory/'+n['id']),tags=['migs_keys',f'lesson_{n["lesson"]:02}' if n['lesson'] else 'optional_song',n['topic'],n['pack']],due=index+1))
    for name in used:assert (media/name).is_file(),name
    # Write directly so the temporary SQLite collection is always removed.
    with tempfile.TemporaryDirectory(prefix='migs-apkg-') as temporary:
        db=Path(temporary)/'collection.anki2';conn=sqlite3.connect(db)
        timestamp=int(time.time())
        CoursePackage(deck).write_to_db(conn.cursor(),timestamp,itertools.count(timestamp*1000))
        conn.commit();conn.close()
        with zipfile.ZipFile(out/filename,'w',compression=zipfile.ZIP_DEFLATED) as package:
            package.write(db,'collection.anki2')
            files={str(i):name for i,name in enumerate(sorted(used))}
            package.writestr('media',json.dumps(files))
            for i,name in files.items():package.write(media/name,i)
    all_media.update(used)
    return dict(file=filename,facts=len(selected),cards=sum(1+bool(n['reverse']) for n in selected))
for lesson in range(1,25):
    selected=[n for n in notes if (n['pack']=='course' and n['lesson']<=lesson) or n.get('alsoLesson',999)<=lesson]
    manifest['lessons'].append(dict(lesson=lesson,**build(f'lessons-01-{lesson:02}.apkg',selected,1936742402,'Migs Keys::Music theory')))
for i,(pack,title) in enumerate([('fur-elise','Für Elise theory'),('journey','Journey theory')]):
    selected=[n for n in notes if n['pack']==pack]
    manifest['optional'].append(dict(id=pack,title=title,**build(f'{pack}-theory.apkg',selected,1936742403+i,'Migs Keys::'+title)))
manifest['library'].append(dict(id='advanced',title='Advanced tonal theory',**build('advanced-theory.apkg',[n for n in notes if n['pack']=='advanced'],1936742405,'Migs Keys::Advanced theory')))
manifest['library'].append(dict(id='complete',title='Complete prepared library',**build('complete-library.apkg',notes,1936742406,'Migs Keys::Prepared library')))
manifest['preparedFacts']=len(notes)
manifest['preparedCards']=sum(1+bool(n['reverse']) for n in notes)
manifest['media']=sorted(all_media)
(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({key:manifest[key] for key in ['lessons','optional']},ensure_ascii=False,indent=2))
