"""Original 64-pixel sci-fi equipment, authored on LPC v3 pose anchors.

Independent equipment designs, not Cyberpunk 2077 / ARK imagery or branded
costumes. MIT code; new equipment drawings CC0 1.0. LPC retains its own licenses.
This restricted Python geometry is compiled to the browser at build time.
"""
from .palette import ramp, FABRIC_COLORS, LEATHER_COLORS, METAL_COLORS, SKIN_TONES


def equipment_color(table,key,fallback):
    for ident,_label,hx in table:
        if ident==key:return ramp(hx)
    return ramp(fallback)


def plate(c,x,y,w,h,dark,mid,light):
    # Chipped corners and a lit top/left edge, not a smooth vector rectangle.
    c.poly([(x+1,y),(x+w-1,y),(x+w,y+1),(x+w,y+h-1),(x+w-1,y+h),(x+1,y+h),(x,y+h-1),(x,y+1)],dark)
    c.rect(x+1,y+1,x+w-1,y+h-1,mid)
    c.hline(x+1,x+w-2,y+1,light)
    c.vline(x+1,y+1,y+h-2,light)


def paint_equipment(c,s,stage,pose):
    ink=(14,20,30,255)
    deep,shadow,base,light,shine=equipment_color(FABRIC_COLORS,s['inner_color'],'#4bcabb')
    ad,am,ac,al,ah=equipment_color(FABRIC_COLORS,s['accessory_color'],'#8b9aa5')
    bd,bm,bc,bl,bh=equipment_color(LEATHER_COLORS,s['belt_color'],'#232b36')
    md,mm,mc,ml,mh=equipment_color(METAL_COLORS,'argento','#a4b4c1')
    sd,sm,sk,sl,sh=equipment_color(SKIN_TONES,s['skin'],'#eec4a4')
    top=s['top'];acc=s['accessory']
    if acc=='collana':ad,am,ac,al,ah=equipment_color(METAL_COLORS,s['accessory_color'],'#b9bcc2')
    if stage=='back':
        if acc in ('zaino','exopack'):
            plate(c,22,34,20,17,ink,am,al)
            if acc=='exopack':
                plate(c,40,34,5,14,ink,(39,54,67,255),(91,116,131,255))
                c.vline(43,26,34,ink);c.set(43,25,light);c.set(44,25,shine)
                c.vline(43,37,40,light);c.vline(43,43,46,base)
        if acc=='tracolla':plate(c,40,43,7,8,ink,am,al)
        return

    # Body anchors common to all LPC v3 adult/teen bodies. Arm equipment has
    # its own per-pose anchors rather than a fixed rectangular overlay.
    shoulder_y=35
    left_cuff,right_cuff=[((20,44),(42,44)),((21,44),(47,40)),((17,33),(45,33)),((26,39),(36,39))][pose]
    if top in ('cyber_jacket','field_suit','tech_vest'):
        # Inner high-neck shirt closes the ordinary cardigan's V opening.
        if pose!=3:
            c.poly([(29,36),(35,36),(36,40),(35,45),(28,45),(28,40)],ink)
            c.rect(30,37,34,44,shadow)
            c.vline(31,38,44,base)
            c.set(33,38,light)
        if top=='cyber_jacket':
            # Offset, cropped pilot jacket: asymmetric lapel, shoulder yokes,
            # segmented zipper and one small cyan status badge.
            c.line(27,36,29,39,(116,132,145,255))
            c.line(37,36,35,39,(67,83,101,255))
            c.line(27,37,27,42,ink)
            c.line(36,39,36,45,ink)
            c.vline(37,41,43,base)
            c.hline(23,26,36,light);c.hline(38,41,36,base)
            c.hline(24,26,37,shadow);c.hline(38,40,37,shadow)
            c.rect(24,41,26,42,ink);c.hline(24,25,41,light)
            c.set(35,44,mc);c.set(36,44,ml)
        elif top=='field_suit':
            # Expedition/exosuit: articulated chest, two shoulder guards and
            # joint pads, deliberately unbranded and without weapons.
            c.poly([(26,36),(29,38),(35,38),(38,36),(39,41),(36,44),(27,44),(24,41)],ink)
            c.poly([(27,37),(30,39),(34,39),(37,37),(37,41),(35,42),(28,42),(26,41)],(67,83,99,255))
            c.line(27,38,30,40,(125,148,156,255));c.line(34,40,36,38,(96,119,133,255))
            c.hline(29,34,42,base);c.hline(30,33,43,light)
            plate(c,22,35,5,3,ink,(62,80,95,255),(119,142,155,255))
            plate(c,38,35,4,3,ink,(47,64,82,255),(91,115,132,255))
            c.hline(23,26,36,light);c.hline(39,41,36,base)
        else:
            # Compact tactical vest over a distinct short-sleeved source.
            c.poly([(26,35),(29,37),(34,37),(37,35),(39,38),(38,46),(25,46),(24,38)],ink)
            c.poly([(27,36),(29,39),(34,39),(36,36),(37,39),(36,45),(27,45),(26,39)],(54,66,81,255))
            c.vline(31,39,44,(119,137,144,255));c.vline(32,39,44,ink)
            plate(c,26,40,4,3,ink,(83,99,111,255),(130,149,157,255))
            plate(c,34,40,3,3,ink,(67,84,103,255),(107,133,145,255))
            c.hline(26,29,37,light);c.set(35,38,shine)
        # Two small cuffs track the pose; never connect across empty air.
        for anchor in [left_cuff,right_cuff]:
            xx,yy=anchor
            if c.alpha(xx,yy):
                c.hline(xx,xx+2,yy,ink);c.hline(xx,xx+2,yy-1,base);c.set(xx,yy-1,light)
        if pose!=3:c.vline(33,40,44,ink)

    if top in ('cappotto','trench'):
        c.hline(24,27,35,light);c.hline(37,40,35,base)
        c.line(29,37,31,41,ink);c.vline(32,42,48,ink)
        c.rect(35,39,38,40,ink);c.hline(35,37,39,light)
        c.set(29,47,mc);c.set(29,50,mc)

    if s['bottom'] in ('cargo','jeans','chino','shorts'):
        # The belt is a separate colour, retained across clothing changes.
        c.hline(26,37,47,bd);c.hline(27,36,46,bc)
        c.rect(30,46,33,47,ink);c.hline(31,32,46,ml)
    if s['bottom']=='cargo':
        for xx in [25,36]:
            plate(c,xx,49,3,4,ink,(43,59,76,255),(88,106,117,255))
            c.hline(xx+1,xx+2,50,base)
        for xx in [26,35]:
            c.rect(xx,54,xx+2,55,ink);c.hline(xx,xx+2,54,(84,100,114,255))
    if s['shoes']=='tech_boots':
        for xx in [25,35]:
            c.hline(xx,xx+3,57,ink);c.hline(xx,xx+3,56,base)
            c.hline(xx,xx+3,60,(83,105,120,255));c.set(xx+1,58,(138,155,160,255))

    # Bags are drawn behind the silhouette, with thin visible straps in front.
    if acc in ('zaino','exopack'):
        c.line(25,35,27,44,ink,2);c.line(37,35,36,44,ink,2)
        c.line(25,35,27,43,ac);c.line(37,35,36,43,al)
        c.set(27,42,ml);c.set(36,42,mc)
    elif acc=='tracolla':
        c.line(24,35,40,47,ink,3);c.line(24,35,40,47,ac)
        c.set(36,44,ml)
    elif acc=='collana':
        c.line(28,36,31,39,al);c.line(35,36,32,39,ac)
        c.set(31,40,ac);c.set(32,40,ah)

    # Subtle facial alternatives; expressions themselves are genuine LPC art.
    # Closed-eye expressions and a blink must not grow replacement pupils.
    if not s.get('blink') and s['expression'] not in ('sorriso','entusiasta'):
        if s['eye_shape']=='mandorla':
            c.hline(26,28,28,ink);c.hline(35,37,28,ink)
        elif s['eye_shape']=='tondi':
            c.set(27,27,(250,239,216,255));c.set(36,27,(250,239,216,255))
            c.set(27,28,ink);c.set(36,28,ink)
    if s['mouth']=='piene' and s['expression'] in ('neutra','seria','curiosa'):
        c.hline(31,33,33,(141,71,70,255));c.set(32,34,(196,118,105,255))

    hat=s['hat']
    if hat=='cuffie':
        c.line(22,24,24,17,ink,2);c.line(24,17,39,17,ink,2);c.line(39,17,41,24,ink,2)
        c.hline(25,38,16,(98,116,133,255))
        plate(c,20,25,4,7,ink,(44,57,73,255),(109,127,142,255))
        plate(c,40,25,4,7,ink,(35,48,63,255),(83,104,122,255))
        c.vline(21,27,29,light);c.vline(42,27,29,base)
    elif hat=='berretto':
        hd,hm,hc,hl,hh=equipment_color(FABRIC_COLORS,s['hat_color'],'#263143')
        c.poly([(22,22),(24,17),(28,15),(36,15),(40,18),(42,23),(39,25),(24,25)],ink)
        c.poly([(23,21),(26,17),(35,16),(39,19),(40,22),(26,22)],hc)
        c.hline(26,36,17,hl);c.hline(22,40,23,hm);c.hline(27,42,24,ink)
        c.hline(28,41,23,hc);c.set(35,19,light)
    elif hat=='corona_alloro':
        for xx,yy in [(23,21),(24,19),(26,18),(28,18),(35,18),(37,18),(39,19),(40,21)]:
            c.line(xx,yy,xx+1,yy+1,(51,74,39,255));c.set(xx,yy,(139,161,80,255))
    if s['glasses']=='visore':
        # Not a logo or copied visor: a five-colour, hard-edged HUD band.
        c.hline(23,40,27,ink);c.hline(24,39,30,ink)
        c.rect(24,28,39,29,shadow);c.hline(25,31,28,light)
        c.hline(34,38,28,base);c.set(25,29,shine);c.set(32,28,ink)
        c.rect(40,27,42,29,(59,76,92,255));c.set(41,27,light)

    held=s['held']
    if held!='none':
        # All carried items use the actual forward-hands source pose.
        if held=='libro':
            c.poly([(25,38),(30,37),(32,39),(34,37),(39,38),(39,46),(34,45),(32,46),(30,45),(25,46)],ink)
            c.poly([(26,39),(30,38),(31,40),(31,45),(27,44),(26,45)],(234,218,179,255))
            c.poly([(33,40),(35,38),(38,39),(38,45),(34,44),(33,45)],(205,186,148,255))
            c.vline(32,39,45,(100,65,55,255));c.hline(27,29,40,(160,145,119,255));c.hline(34,36,41,(145,132,108,255))
        elif held=='tablet':
            plate(c,26,37,12,9,ink,(53,71,89,255),(134,156,166,255))
            c.rect(28,39,36,43,(21,46,59,255));c.hline(29,34,40,light);c.hline(29,32,42,base);c.set(37,42,mc)
        elif held=='pergamena':
            c.rect(26,38,38,45,ink);c.rect(27,39,37,44,(224,201,153,255))
            c.hline(28,35,40,(146,123,87,255));c.hline(28,34,42,(171,143,105,255))
            c.rect(25,38,27,39,(245,226,184,255));c.rect(37,44,39,45,(245,226,184,255))
        elif held=='cetra':
            c.poly([(26,36),(29,35),(29,39),(35,39),(35,35),(38,36),(38,45),(35,47),(29,47),(26,45)],ink)
            c.line(27,37,28,44,(185,132,58,255),2);c.line(37,37,36,44,(232,184,91,255),2)
            c.hline(28,36,36,(242,202,120,255));c.hline(28,36,44,(184,135,62,255),2)
            for xx in [30,32,34]:c.vline(xx,37,44,(239,211,160,255))
        else:
            plate(c,26,42,12,4,ink,(47,68,87,255),(97,127,145,255))
            c.hline(28,36,42,light);c.hline(29,35,40,base)
            c.poly([(32,32),(36,36),(32,40),(28,36)],shadow)
            c.line(32,32,36,36,shine);c.line(36,36,32,40,base);c.line(32,40,28,36,base);c.line(28,36,32,32,light)
            c.set(32,35,shine);c.set(31,36,light)
        c.set(25,42,sk);c.set(25,43,sl);c.set(39,42,sk);c.set(39,43,sl)


def native_over(top,bottom):
    """Straight-alpha over on the native pixel grid, integer-rounded identically.

    LPC hair/hood shadows and glass lenses include intentional translucency.
    They must darken the head, not punch transparent holes through the sprite.
    This is not edge antialiasing and never interpolates neighbouring pixels.
    """
    a=top[3];b=bottom[3]
    if a==255:return top
    if a==0:return bottom
    n=a*255+b*(255-a)
    return ((top[0]*a*255+bottom[0]*b*(255-a)+n//2)//n,
            (top[1]*a*255+bottom[1]*b*(255-a)+n//2)//n,
            (top[2]*a*255+bottom[2]*b*(255-a)+n//2)//n,
            (n+127)//255)
