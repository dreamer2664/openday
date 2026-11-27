"""Optional Wikimedia Commons research helper. Never imported by the kiosk.

Set COMMONS_USER_AGENT to identify your own maintenance contact if using this
repeatedly. No fictitious school address or credentials are supplied.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

UA={'User-Agent':os.environ.get('COMMONS_USER_AGENT','CasardiPostcardResearch/1.0 (local educational asset verification)')}

def api(params,tries=5):
    url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)
    last_error=None
    for attempt in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=40) as response:
                return json.load(response)
        except Exception as exc:
            last_error=exc
            if attempt+1<tries:time.sleep(3*(attempt+1))
    raise SystemExit('Commons API non disponibile: '+type(last_error).__name__)

def search(query,n=8):
    r=api({'action':'query','format':'json','generator':'search','gsrsearch':'filetype:bitmap '+query,
           'gsrnamespace':'6','gsrlimit':n,'prop':'imageinfo','iiprop':'url|size|extmetadata'})
    out=[]
    for page in r.get('query',{}).get('pages',{}).values():
        if not page.get('imageinfo'):continue
        ii=page['imageinfo'][0];md=ii.get('extmetadata',{})
        out.append((page['title'],ii['width'],ii['height'],md.get('LicenseShortName',{}).get('value','non indicata')))
    return out

def info(title):
    r=api({'action':'query','format':'json','titles':title,'prop':'imageinfo','iiprop':'url|size|extmetadata'})
    for page in r.get('query',{}).get('pages',{}).values():
        if not page.get('imageinfo'):continue
        ii=page['imageinfo'][0];md=ii.get('extmetadata',{})
        clean=lambda key:re.sub('<[^>]+>','',md.get(key,{}).get('value','')).strip()
        return dict(title=page['title'],url=ii['url'],w=ii['width'],h=ii['height'],page=ii.get('descriptionurl'),
            artist=clean('Artist'),credit=clean('Credit'),lic=clean('LicenseShortName'),licurl=clean('LicenseUrl'),
            date=clean('DateTimeOriginal'),desc=clean('ImageDescription')[:500])
    raise SystemExit('File Commons non trovato.')

if __name__=='__main__':
    for query in sys.argv[1:]:
        print('===',query)
        for title,w,h,license_name in search(query):print(f'{w}×{h} | {license_name} | {title}')
        time.sleep(2)
