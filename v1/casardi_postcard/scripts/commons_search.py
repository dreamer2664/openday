import json, urllib.request, urllib.parse, sys
UA={'User-Agent':'CasardiPostcard/1.0 (educational school project)'}
def api(params):
    url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers=UA)
    return json.load(urllib.request.urlopen(req,timeout=30))
def search(q,n=8):
    r=api({'action':'query','format':'json','generator':'search','gsrsearch':'filetype:bitmap '+q,
           'gsrnamespace':'6','gsrlimit':n,'prop':'imageinfo','iiprop':'url|size|extmetadata','iiurlwidth':'1200'})
    out=[]
    for p in r.get('query',{}).get('pages',{}).values():
        ii=p['imageinfo'][0]; md=ii.get('extmetadata',{})
        out.append(dict(title=p['title'],w=ii['width'],h=ii['height'],
            lic=md.get('LicenseShortName',{}).get('value'),artist=md.get('Artist',{}).get('value','')[:90],
            url=ii['url'],thumb=ii.get('thumburl')))
    return out
for q in sys.argv[1:]:
    print('===',q)
    for x in search(q):
        print(f"  {x['w']}x{x['h']:5} {x['lic']:>18} | {x['title'][:70]}")
