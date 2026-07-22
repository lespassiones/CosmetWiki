import json,re,math
COLOR={
 'ALOE BARBADENSIS LEAF JUICE':'Vert','AQUA':'Vert','BRASSICA ALCOHOL':'Vert',
 'BRASSICA OLERACEA ITALICA SEED OIL':'Vert','BUTYROSPERMUM PARKII BUTTER':'Vert',
 'CALCIUM GLUCONATE':'Vert','CANANGA ODORATA FLOWER WATER':'Jaune','CANNABIS SATIVA SEED OIL':'Vert',
 'CEDRUS ATLANTICA BARK OIL':'Jaune','CITRIC ACID':'Vert','COCO-CAPRYLATE/CAPRATE':'Vert',
 'DECYL GLUCOSIDE':'Vert','ERYTHRITOL':'Vert','HELIANTHUS ANNUUS SEED OIL':'Vert',
 'HYDROLYZED RICE PROTEIN':'Vert','LAVANDULA ANGUSTIFOLIA FLOWER WATER':'Jaune',
 'MANGIFERA INDICA SEED BUTTER':'Vert','PERSEA GRATISSIMA OIL':'Vert','POTASSIUM SORBATE':'Jaune',
 'PROPYLENE GLYCOL':'Jaune','RICINUS COMMUNIS SEED OIL':'Vert','SODIUM BENZOATE':'Jaune',
 'SODIUM COCOYL GLUTAMATE':'Vert','TOCOPHEROL':'Vert','URTICA DIOICA LEAF EXTRACT':'Vert',
 'URTICA DIOICA LEAF WATER':'Vert','XANTHAN GUM':'Vert',
 # BRASSICYL VALINATE ESYLATE -> absent (None)
}
BAND={'very-safe':(17.0,3.0),'safe':(13.0,3.9),'caution':(9.0,3.9),'warning':(5.0,3.9),'danger':(0.0,4.9),'high-risk':(0.0,2.0)}
STARS={'very-safe':5,'safe':4,'caution':3,'warning':2,'danger':1,'high-risk':1,'unknown':0}
def toks(inci):
    # 1) cut the "*Ingrédients issus de l'agriculture biologique" footnote (attached
    #    to the last ingredient with just a period, no comma)
    inci=re.sub(r'\*?\s*Ingr[ée]dients?\s+issus.*$','',inci,flags=re.I|re.S)
    # 2) drop biological-origin asterisks
    inci=inci.replace('*',' ')
    out=[]
    for p in inci.split(','):
        p=p.strip().strip('.').strip()   # strip trailing period on last token
        pl=p.lower()
        if not p or 'issus de' in pl or 'agriculture biologique' in pl: continue
        out.append(re.sub(r'\s{2,}',' ',p).strip())
    return out
def pastille(colored,total,gate=False):
    ident=sorted([c for c in colored if c['color']],key=lambda c:c['position'])
    n=len(ident)
    nV=sum(1 for c in ident if c['color']=='Vert'); nJ=sum(1 for c in ident if c['color']=='Jaune')
    nO=sum(1 for c in ident if c['color']=='Orange'); nR=sum(1 for c in ident if c['color']=='Rouge')
    base=dict(nVert=nV,nJaune=nJ,nOrange=nO,nRouge=nR,nIdent=n)
    if n==0 or (gate and total and n/total<0.5): return dict(tone='unknown',**base)
    if nO==0 and nR==0:
        if nJ>nV: return dict(tone='caution',**base)
        if nJ==0: return dict(tone='very-safe',**base)
        return dict(tone='safe',**base)
    # severe branch omitted-not needed but implement for completeness
    corpsMax=math.ceil(0.6*n)
    def zone(r): return 'Tete' if r<=5 else ('Corps' if r<=corpsMax else 'Queue')
    ceiling=0;cntR=0;cntO=0;sg=0;st=0
    for i,c in enumerate(ident):
        z=zone(i+1); w=3 if z=='Tete' else (2 if z=='Corps' else 1); st+=w
        if c['color']=='Vert': sg+=w
        elif c['color']=='Jaune': sg+=0.5*w
        if c['color']=='Rouge': cntR+=1; ceiling=max(ceiling,3 if z=='Tete' else (2 if z=='Corps' else 1))
        elif c['color']=='Orange': cntO+=1; ceiling=max(ceiling,0 if z=='Queue' else 1)
    if cntR>=2: ceiling=max(ceiling,2)
    if cntO>=4: ceiling=max(ceiling,2)
    ratio=sg/st if st else 0
    comp=0 if ratio>=0.8 else (1 if ratio>=0.55 else (2 if ratio>=0.32 else 3))
    compCapped=min(comp,2) if cntR==0 else comp
    final=max(ceiling,compCapped)
    if final==3: return dict(tone='high-risk' if cntR>=2 else 'danger',**base)
    if final==2: return dict(tone='warning',**base)
    if final==1: return dict(tone='caution',**base)
    return dict(tone='safe',**base)
def synth(p):
    if p['tone']=='unknown': return None
    b,w=BAND[p['tone']]; r=(p['nVert']+0.5*p['nJaune'])/p['nIdent'] if p['nIdent'] else 0
    return round((b+w*r)*100)/100
def label(s):
    if s is None: return (None,None)
    if s>=17: return('Très bien','green')
    if s>=13: return('Bien','green')
    if s>=9: return('Moyen','amber')
    if s>=5: return('Faible','orange')
    return('Faible','rose')

prods=json.load(open('scratchpad/vagance_products.json',encoding='utf-8'))
res=[]
seen_formula={}
for p in prods:
    tk=toks(p['INCI complet'])
    colored=[{'color':COLOR.get(t.upper()),'position':i} for i,t in enumerate(tk)]
    total=len(tk)
    pa=pastille(colored,total,gate=False)
    sc=synth(pa); lab,tone=label(sc)
    unmatched=[t for t in tk if t.upper() not in COLOR]
    r=dict(ean=p['EAN'],name=p['Nom commercial'],type=p['Type de produit'],
           cat=p['Catégorie'],sub=p['Sous-catégorie'],recharge=('recharge' in p['Type de produit'].lower()),
           total=total,nIdent=pa['nIdent'],nV=pa['nVert'],nJ=pa['nJaune'],nO=pa['nOrange'],nR=pa['nRouge'],
           tone=pa['tone'],score=sc,label=lab,score_tone=tone,stars=STARS[pa['tone']],
           ingredients_text=', '.join(tk),
           unmatched=unmatched,yuka=p['Score Yuka'])
    res.append(r)
json.dump(res,open('scratchpad/vagance_scored.json','w',encoding='utf-8'),ensure_ascii=False,indent=2)
print(f"{'EAN':<14}{'PRODUIT':<34}{'V/J/O/R':<12}{'TON':<11}{'SCORE':<7}{'STARS':<6}{'YUKA'}")
for r in res:
    nm=r['name'][:30]+(' [R]' if r['recharge'] else '')
    vjor=f"{r['nV']}/{r['nJ']}/{r['nO']}/{r['nR']}"
    print(f"{r['ean']:<14}{nm:<34}{vjor:<12}{r['tone']:<11}{str(r['score']):<7}{r['stars']:<6}{r['yuka']}")
print()
for r in res:
    if r['unmatched']: print('UNMATCHED in',r['name'],r['type'],'->',r['unmatched'])
