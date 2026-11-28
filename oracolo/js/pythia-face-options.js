/* Cinque volti alternativi, più pieni di quello attuale.
 * A rotondo, B classico, C sorridente, D arcade, E morbido. */
'use strict';

const PiziaFaces = (() => {
  const names = {
    a: 'Rotonda',
    b: 'Classica',
    c: 'Sorriso',
    d: 'Arcade',
    e: 'Morbida'
  };

  function neck(r, c, x, y, w) {
    r(x, y, w, 10, c.skinShade);
    r(x + 1, y + 1, w - 2, 8, c.skin);
    r(x + 4, y + 2, 4, 5, c.skinLight);
    r(x - 1, y + 7, 3, 2, c.gold);
    r(x + w - 2, y + 7, 3, 2, c.gold);
    r(x + Math.floor(w / 2) - 1, y + 8, 3, 2, c.gold);
  }

  function crown(r, c, x, y, w) {
    r(x, y, w, 2, c.bronze);
    r(x + 1, y, w - 2, 1, c.gold);
    for (let i = 0; i < 5; i++) r(x + 1 + i * Math.floor((w - 4) / 4), y - 2, 2, 2, c.gold);
    r(x + Math.floor(w / 2) - 2, y - 3, 4, 4, c.gold);
    r(x + Math.floor(w / 2) - 1, y - 2, 2, 2, c.jade);
  }

  function mouthAt(r, c, o, x, y, w) {
    if (o.mouth === 2 && o.state === 'speaking') {
      r(x, y, w, 3, c.mouth);
      r(x + 1, y, w - 2, 1, c.ivory);
      r(x + 1, y + 2, w - 2, 1, '#d9a094');
    } else if (o.mouth === 1 && o.state === 'speaking') {
      r(x, y, w, 2, c.mouth);
      r(x + 1, y + 1, w - 2, 1, '#d7a197');
    } else {
      r(x, y, w, 1, c.mouth);
      r(x + 1, y + 1, w - 2, 1, '#e7b8aa');
    }
  }

  function faceA(ctx, r, p, c, o) {
    neck(r, c, 53, 55, 14);
    p([[49,18],[71,18],[71,22],[74,22],[74,28],[50,28],[50,22],[46,22],[46,18]], c.hair);
    r(52,20,16,3, c.hairLight);
    p([[44,30],[52,30],[52,36],[49,36],[49,50],[46,50],[46,58],[44,58],[44,38]], c.hair);
    p([[68,30],[76,30],[76,38],[74,38],[74,52],[71,52],[71,42],[68,36]], c.hair);
    p([[50,31],[70,31],[74,37],[74,46],[71,53],[65,56],[60,58],[55,56],[49,53],[46,46],[46,37]], c.skinShade);
    p([[52,32],[68,32],[72,37],[72,46],[69,53],[63,56],[60,57],[57,56],[51,53],[48,46],[48,37]], c.skin);
    r(56,33,8,4, c.skinLight);
    r(50,44,3,3, '#e7ae98'); r(67,44,3,3, '#e7ae98');
    r(51,36,6,1, c.hairMid); r(63,36,6,1, c.hairMid);
    if (o.blink || o.state === 'waiting') {
      r(51,40,7,1, c.hairMid); r(62,40,7,1, c.hairMid);
    } else {
      r(51,38,7,4, c.ivory); r(62,38,7,4, c.ivory);
      r(51,38,7,1, c.skin); r(62,38,7,1, c.skin);
      r(53,39,3,3, c.hair); r(64,39,3,3, c.hair);
      r(53,39,1,1, '#fff6e4'); r(64,39,1,1, '#fff6e4');
    }
    r(59,43,2,3, c.skinShade);
    mouthAt(r, c, o, 56, 49, 8);
    crown(r, c, 49, 29, 22);
    r(72,40,2,5, c.skin); r(73,45,2,3, c.gold);
  }

  function faceB(ctx, r, p, c, o) {
    neck(r, c, 54, 56, 13);
    p([[51,15],[69,15],[69,19],[73,19],[73,26],[71,26],[71,31],[49,31],[49,26],[47,26],[47,19],[51,19]], c.hair);
    r(54,18,12,4, c.hairLight);
    p([[45,32],[52,32],[52,38],[49,38],[49,52],[47,52],[47,58],[45,58]], c.hair);
    p([[68,32],[75,32],[75,40],[73,40],[73,54],[70,54],[70,42],[68,36]], c.hair);
    p([[52,30],[68,30],[71,36],[71,45],[68,52],[63,56],[60,58],[57,56],[52,52],[49,45],[49,36]], c.skinShade);
    p([[53,31],[67,31],[69,36],[69,45],[67,52],[62,56],[60,57],[58,56],[53,52],[51,45],[51,36]], c.skin);
    r(57,32,6,3, c.skinLight);
    r(52,44,2,2, '#e8b19a'); r(66,44,2,2, '#e8b19a');
    r(52,35,6,1, c.hair); r(52,34,4,1, c.hairMid);
    r(62,35,6,1, c.hair); r(64,34,4,1, c.hairMid);
    if (o.blink || o.state === 'waiting') {
      r(52,39,6,1, c.hairMid); r(62,39,6,1, c.hairMid);
    } else {
      r(52,37,6,3, c.ivory); r(62,37,6,3, c.ivory);
      r(52,37,6,1, c.skin); r(62,37,6,1, c.skin);
      r(54,38,2,2, c.hair); r(64,38,2,2, c.hair);
      r(54,38,1,1, '#fff6e4'); r(64,38,1,1, '#fff6e4');
    }
    r(59,42,2,3, c.skinShade); r(58,44,1,1, c.skinShade); r(61,44,1,1, c.skinShade);
    mouthAt(r, c, o, 56, 48, 8);
    r(58,54,4,2, c.skinLight);
    crown(r, c, 50, 29, 20);
    r(69,39,2,5, c.skin); r(70,44,2,3, c.gold);
  }

  function faceC(ctx, r, p, c, o) {
    neck(r, c, 53, 55, 14);
    p([[50,17],[70,17],[70,21],[73,21],[73,28],[47,28],[47,21],[50,21]], c.hair);
    r(53,19,14,3, c.hairLight);
    p([[44,30],[51,30],[51,38],[48,38],[48,54],[45,54],[45,40],[44,34]], c.hair);
    p([[69,30],[76,30],[76,40],[73,40],[73,55],[70,55],[70,40],[69,34]], c.hair);
    p([[51,31],[69,31],[73,37],[73,47],[70,54],[64,57],[60,58],[56,57],[50,54],[47,47],[47,37]], c.skinShade);
    p([[53,32],[67,32],[71,37],[71,47],[68,54],[63,57],[60,58],[57,57],[52,54],[49,47],[49,37]], c.skin);
    r(56,33,8,3, c.skinLight);
    r(50,45,3,3, '#eeae96'); r(67,45,3,3, '#eeae96');
    r(51,36,6,1, c.hairMid); r(63,36,6,1, c.hairMid);
    if (o.blink || o.state === 'waiting') {
      r(51,40,7,1, c.hairMid); r(62,40,7,1, c.hairMid);
    } else {
      r(51,38,7,4, c.ivory); r(62,38,7,4, c.ivory);
      r(53,39,3,3, '#3c3348'); r(64,39,3,3, '#3c3348');
      r(53,39,1,1, '#fff6e4'); r(64,39,1,1, '#fff6e4');
    }
    r(59,44,2,2, c.skinShade);
    if (o.state !== 'speaking') {
      r(56,50,2,1, c.mouth); r(58,51,4,1, c.mouth); r(62,50,2,1, c.mouth);
      r(58,52,4,1, '#e7b8aa');
    } else mouthAt(r, c, o, 56, 50, 8);
    crown(r, c, 49, 28, 22);
    r(71,40,2,5, c.skin); r(72,45,2,3, c.gold);
  }

  function faceD(ctx, r, p, c, o) {
    neck(r, c, 52, 56, 16);
    r(48,16,24,12, c.hair); r(50,14,20,4, c.hairMid); r(54,16,12,3, c.hairLight);
    r(44,30,8,24, c.hair); r(68,30,8,24, c.hairMid);
    r(50,30,20,24, c.skinShade); r(52,31,16,21, c.skin);
    r(56,32,8,4, c.skinLight);
    r(52,44,4,3, '#e7ae98'); r(64,44,4,3, '#e7ae98');
    r(51,35,7,2, c.hair); r(62,35,7,2, c.hair);
    if (o.blink || o.state === 'waiting') {
      r(51,39,7,2, c.hairMid); r(62,39,7,2, c.hairMid);
    } else {
      r(51,38,7,5, c.ivory); r(62,38,7,5, c.ivory);
      r(53,39,3,3, c.hair); r(64,39,3,3, c.hair);
      r(53,39,1,1, '#fff6e4'); r(64,39,1,1, '#fff6e4');
    }
    r(58,44,4,3, c.skinShade);
    mouthAt(r, c, o, 55, 50, 10);
    r(50,28,20,3, c.gold); r(58,26,4,4, c.jade);
    r(72,38,3,6, c.skin); r(74,43,2,3, c.gold);
  }

  function faceE(ctx, r, p, c, o) {
    neck(r, c, 52, 56, 16);
    p([[46,16],[74,16],[74,21],[77,21],[77,29],[43,29],[43,21],[46,21]], c.hair);
    r(52,18,16,4, c.hairLight); r(48,24,24,3, c.hairMid);
    p([[36,32],[44,32],[44,40],[41,40],[41,56],[38,56],[38,42],[36,36]], c.hair);
    p([[76,32],[84,32],[84,42],[81,42],[81,57],[78,57],[78,42],[76,36]], c.hair);
    p([[50,31],[70,31],[77,38],[77,49],[70,55],[64,58],[60,59],[56,58],[50,55],[43,49],[43,38]], c.skinShade);
    p([[52,32],[68,32],[75,38],[75,49],[68,55],[63,58],[60,59],[57,58],[52,55],[45,49],[45,38]], c.skin);
    r(45,40,6,9, c.skin); r(69,40,6,9, c.skin);
    r(56,33,8,4, c.skinLight);
    r(45,44,4,4, '#e8b09a'); r(71,44,4,4, '#e8b09a');
    r(52,36,6,1, c.hairMid); r(62,36,6,1, c.hairMid);
    if (o.blink || o.state === 'waiting') {
      r(52,40,6,1, c.hairMid); r(62,40,6,1, c.hairMid);
    } else {
      r(52,38,6,3, c.ivory); r(62,38,6,3, c.ivory);
      r(54,39,2,2, c.hair); r(64,39,2,2, c.hair);
      r(54,39,1,1, '#fff6e4'); r(64,39,1,1, '#fff6e4');
    }
    r(59,43,2,3, c.skinShade);
    mouthAt(r, c, o, 56, 50, 8);
    r(58,56,4,2, c.skinLight);
    crown(r, c, 48, 29, 24);
    r(76,40,2,6, c.skin); r(77,46,2,3, c.gold);
  }

  return {
    names,
    has(id) { return Object.prototype.hasOwnProperty.call(names, id); },
    draw(id, ctx, r, p, c, options) {
      ({a: faceA, b: faceB, c: faceC, d: faceD, e: faceE}[id])(ctx, r, p, c, options);
      return true;
    }
  };
})();
