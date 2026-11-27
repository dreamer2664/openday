import json, urllib.request, urllib.parse, sys, re
UA={'User-Agent':'CasardiPostcard/1.0 (educational school project)'}
def info(title):
    url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json',
      'titles':title,'prop':'imageinfo','iiprop':'url|size|extmetadata'})
    r=json.load(urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=30))
    for p in r['query']['pages'].values():
        ii=p['imageinfo'][0]; md=ii['extmetadata']
        def g(k):
            v=md.get(k,{}).get('value','')
            return re.sub('<[^>]+>','',v).strip()
        print('TITLE :',p['title'])
        print('URL   :',ii['url'])
        print('SIZE  :',ii['width'],'x',ii['height'])
        for k in ['Artist','Credit','LicenseShortName','LicenseUrl','DateTimeOriginal','ImageDescription','AttributionRequired','UsageTerms']:
            print(f'  {k}: {g(k)[:200]}')
        print('  DESC PAGE:', ii.get('descriptionurl'))
        print()
for t in sys.argv[1:]: info(t)
