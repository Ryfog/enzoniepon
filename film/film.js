/* =========================================================
   NOTRE FILM — court-métrage dessiné image par image.
   Rien n'est une vidéo : chaque scène est peinte en direct,
   et la musique est fabriquée à la volée.
   ========================================================= */
'use strict';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
/* accélération/décélération douce, pour que rien ne soit mécanique */
const doux = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const sat = (a, b, v) => clamp((v - a) / (b - a), 0, 1);

/* le vrai nombre de jours qui restent : le film finit sur le chiffre du jour */
const RETROUVAILLES = new Date(2026, 8, 16);
const JOURS = Math.max(0, Math.ceil((RETROUVAILLES - new Date()) / 86400000));

/* ============ LE DÉCOUPAGE ============ */
const SCENES = [
  { a:   0, b:  10, f: deuxLumieres },
  { a:  10, b:  25, f: deuxVilles },
  { a:  25, b:  39, f: leFil },
  { a:  39, b:  56, f: leTrajet },
  { a:  56, b:  74, f: lesEclats },
  { a:  74, b:  88, f: leCompte },
  { a:  88, b: 104, f: retrouvailles },
  { a: 104, b: 116, f: carton }
];
const DUREE = 116;
const FONDU = 1.2;

const CARTONS = [
  { a:  1.5, b:  8.5, t: 'Quelque part, deux lumières qui ne se connaissaient pas.' },
  { a: 11.5, b: 17.0, t: 'L\'une au nord.' },
  { a: 17.5, b: 23.5, t: 'L\'autre au sud. Et beaucoup de route entre les deux.' },
  { a: 26.5, b: 32.0, t: 'Un soir, un message a fait le voyage.' },
  { a: 32.5, b: 37.5, t: 'Il n\'est jamais reparti tout seul.' },
  { a: 40.5, b: 47.0, t: 'Depuis, ce trajet se fait tous les jours.' },
  { a: 47.5, b: 54.5, t: 'En pensée, faute de mieux.' },
  /* ces quatre cartons sont calés sur les quatre vignettes de la scène */
  { a: 57.3, b: 61.2, t: 'Un fou rire à deux heures du matin.' },
  { a: 61.6, b: 65.3, t: 'Un appel qu\'on n\'arrive pas à raccrocher.' },
  { a: 65.7, b: 69.5, t: 'Milo qui court dans le vent.' },
  { a: 70.0, b: 73.4, t: 'Et cent petites choses que personne d\'autre ne sait.' },
  { a: 75.5, b: 81.0, t: 'Il reste un chiffre. Il descend.' },
  { a: 81.5, b: 86.5, t: 'Un peu plus bas chaque matin.' },
  { a: 89.5, b: 95.0, t: 'Le <b>16 septembre</b>, les deux lumières se touchent.' },
  { a: 95.5, b: 102.0, t: 'Et là, plus besoin de compter.' },
  { a: 106.5, b: 113.5, t: 'Pour toi.' }
];

/* ============ CANEVAS ============ */
const cv = $('#cv'), cx = cv.getContext('2d');
const VW = 1600, VH = 670;              /* 2.39:1, le format large */
let W = 0, H = 0, sc = 1, ox = 0, oy = 0, dpr = 1;

function taille() {
  W = window.innerWidth; H = window.innerHeight;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  /* on remplit l'écran : le cadre déborde, les bandes noires recadrent */
  sc = Math.max(W / VW, H / VH);
  ox = (W - VW * sc) / 2; oy = (H - VH * sc) / 2;
}
window.addEventListener('resize', taille);
taille();

/* ============ PETITS OUTILS DE DESSIN ============ */
function lueur(x, y, r, col, a) {
  const g = cx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${col},${a})`);
  g.addColorStop(.4, `rgba(${col},${a * .28})`);
  g.addColorStop(1, `rgba(${col},0)`);
  cx.fillStyle = g;
  cx.beginPath(); cx.arc(x, y, r, 0, 6.3); cx.fill();
}
function point(x, y, r, col, a) {
  cx.fillStyle = `rgba(${col},${a})`;
  cx.beginPath(); cx.arc(x, y, r, 0, 6.3); cx.fill();
}

/* un semis d'étoiles fixe, tiré une fois pour toutes */
const ETOILES = [];
(function () {
  let g = 12345;
  const rnd = () => (g = (g * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 190; i++) ETOILES.push({
    x: rnd() * VW, y: rnd() * VH * .72, r: .5 + rnd() * 1.5, p: rnd() * 6.3, v: .4 + rnd() * .8
  });
})();
function cielEtoile(t, a) {
  for (const e of ETOILES) {
    const s = .35 + .65 * (.5 + .5 * Math.sin(t * e.v + e.p));
    point(e.x, e.y, e.r, '244,240,230', s * a);
  }
}
function fondNuit(a, haut, bas) {
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, haut || '#04060c');
  g.addColorStop(.62, '#0a1020');
  g.addColorStop(1, bas || '#070b14');
  cx.globalAlpha = a; cx.fillStyle = g; cx.fillRect(0, 0, VW, VH); cx.globalAlpha = 1;
}

/* une ville : des toits, des fenêtres qui s'allument */
function ville(cxx, sol, larg, graine, t, a, allum) {
  let g = graine;
  const rnd = () => (g = (g * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  cx.save();
  cx.globalAlpha = a;
  const n = 13;
  for (let i = 0; i < n; i++) {
    const bw = larg / n * (.7 + rnd() * .7);
    const bx = cxx - larg / 2 + (larg / n) * i;
    const bh = 34 + rnd() * 96;
    cx.fillStyle = '#070a12';
    cx.fillRect(bx, sol - bh, bw, bh);
    /* les fenêtres */
    const cols = Math.max(1, Math.floor(bw / 13));
    const rows = Math.max(1, Math.floor(bh / 17));
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      if (rnd() > .42) continue;
      const on = rnd() < allum;
      if (!on) continue;
      const sc2 = .55 + .45 * Math.sin(t * .8 + c * 2 + r * 3.1 + graine);
      cx.fillStyle = `rgba(242,201,138,${.5 + sc2 * .45})`;
      cx.fillRect(bx + 4 + c * 13, sol - bh + 6 + r * 17, 5, 7);
    }
  }
  cx.restore();
}

/* =========================================================
   SCÈNE 1 — deux lumières dans le noir
   ========================================================= */
function deuxLumieres(k, t) {
  fondNuit(1);
  cielEtoile(t, sat(0, .35, k) * .55);

  const aA = sat(.06, .30, k);
  const aB = sat(.36, .60, k);
  const battA = 1 + Math.sin(t * 1.6) * .10;
  const battB = 1 + Math.sin(t * 1.6 + 1.1) * .10;
  const xA = 470, xB = 1130;

  lueur(xA, 300, 190 * battA, '240,170,190', .40 * aA);
  point(xA, 300, 4.2 * battA, '255,245,240', aA);
  lueur(xB, 372, 190 * battB, '150,190,240', .40 * aB);
  point(xB, 372, 4.2 * battB, '255,245,240', aB);

  /* elles se cherchent : un frémissement entre les deux, à la toute fin */
  const ap = sat(.72, 1, k);
  if (ap > 0) {
    cx.save();
    cx.setLineDash([2, 16]); cx.lineDashOffset = -t * 26;
    cx.strokeStyle = `rgba(242,201,138,${ap * .16})`; cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(xA, 300); cx.lineTo(xB, 372); cx.stroke();
    cx.restore();
  }
}

/* =========================================================
   SCÈNE 2 — deux villes, deux nuits
   ========================================================= */
function deuxVilles(k, t) {
  fondNuit(1);
  cielEtoile(t, .6);

  /* une aurore très pâle au nord — en halo, pour n'avoir aucun bord */
  const aur = sat(.1, .5, k);
  if (aur > 0) {
    const au = cx.createRadialGradient(430, 150, 10, 430, 150, 620);
    au.addColorStop(0, `rgba(120,205,195,${.16 * aur})`);
    au.addColorStop(.5, `rgba(110,170,210,${.07 * aur})`);
    au.addColorStop(1, 'rgba(110,170,210,0)');
    cx.fillStyle = au; cx.fillRect(0, 0, VW, VH);
  }

  const solA = 300, solB = 596;
  const aA = sat(.05, .28, k), aB = sat(.34, .58, k);

  ville(390, solA, 460, 77, t, aA, .30);
  ville(1200, solB, 520, 991, t, aB, .34);

  /* le sol de chaque ville */
  cx.globalAlpha = aA; cx.fillStyle = '#05070d'; cx.fillRect(0, solA, VW, 3); cx.globalAlpha = 1;
  cx.globalAlpha = aB; cx.fillStyle = '#05070d'; cx.fillRect(0, solB, VW, 4); cx.globalAlpha = 1;

  /* la fenêtre allumée, dans chaque ville : elles */
  const fA = 1 + Math.sin(t * 1.4) * .1, fB = 1 + Math.sin(t * 1.4 + 1) * .1;
  lueur(392, solA - 96, 78 * fA, '240,170,190', .55 * aA);
  point(392, solA - 96, 3.4, '255,240,235', aA);
  lueur(1206, solB - 104, 78 * fB, '150,190,240', .55 * aB);
  point(1206, solB - 104, 3.4, '255,240,235', aB);

  /* la distance, marquée d'un trait discret */
  const ad = sat(.55, .82, k);
  if (ad > 0) {
    cx.save();
    cx.setLineDash([3, 13]); cx.lineDashOffset = -t * 18;
    cx.strokeStyle = `rgba(242,201,138,${ad * .22})`; cx.lineWidth = 1.2;
    cx.beginPath();
    cx.moveTo(392, solA - 96);
    cx.quadraticCurveTo(800, 330, 1206, solB - 104);
    cx.stroke();
    cx.restore();
  }
}

/* =========================================================
   SCÈNE 3 — le fil : un message traverse, puis mille
   ========================================================= */
const DEP = { x: 392, y: 204 }, ARR = { x: 1206, y: 492 };
function surArc(u) {
  const mx = 800, my = 250;
  const x = (1 - u) * (1 - u) * DEP.x + 2 * (1 - u) * u * mx + u * u * ARR.x;
  const y = (1 - u) * (1 - u) * DEP.y + 2 * (1 - u) * u * my + u * u * ARR.y;
  return { x, y };
}
function leFil(k, t) {
  fondNuit(1);
  cielEtoile(t, .5);
  ville(390, 300, 460, 77, t, .8, .30);
  ville(1200, 596, 520, 991, t, .8, .34);
  lueur(DEP.x, DEP.y, 70, '240,170,190', .45);
  lueur(ARR.x, ARR.y, 70, '150,190,240', .45);

  /* le premier message : un seul, qu'on suit du regard */
  const u1 = sat(.10, .52, k);
  if (u1 > 0 && u1 < 1) {
    cx.save();
    cx.strokeStyle = 'rgba(242,201,138,.34)'; cx.lineWidth = 1.6;
    cx.beginPath();
    for (let s = 0; s <= u1; s += .02) { const p = surArc(s); s ? cx.lineTo(p.x, p.y) : cx.moveTo(p.x, p.y); }
    cx.stroke();
    cx.restore();
    const p = surArc(u1);
    lueur(p.x, p.y, 46, '242,201,138', .9);
    point(p.x, p.y, 3.4, '255,250,240', 1);
  } else if (u1 >= 1) {
    cx.strokeStyle = 'rgba(242,201,138,.20)'; cx.lineWidth = 1.4;
    cx.beginPath();
    for (let s = 0; s <= 1; s += .02) { const p = surArc(s); s ? cx.lineTo(p.x, p.y) : cx.moveTo(p.x, p.y); }
    cx.stroke();
  }

  /* puis ils se multiplient, dans les deux sens */
  const nb = Math.floor(sat(.55, 1, k) * 22);
  for (let i = 0; i < nb; i++) {
    const dec = (t * .30 + i * .137) % 1;
    const vers = i % 2 === 0;
    const u = vers ? dec : 1 - dec;
    const p = surArc(u);
    const a = Math.sin(dec * Math.PI) * .9;
    point(p.x, p.y, 2.2, vers ? '242,201,138' : '240,170,190', a);
    lueur(p.x, p.y, 22, vers ? '242,201,138' : '240,170,190', a * .5);
  }
}

/* =========================================================
   SCÈNE 4 — le trajet : la route qui défile, les saisons
   ========================================================= */
/* la profondeur : 0 = tout au fond, 1 = juste devant nous.
   On répartit sur l'inverse de la distance, comme le fait un objectif. */
function profondeur(brut) {
  const zLoin = 1, zPres = .052;
  const z = zLoin - brut * (zLoin - zPres);
  return (1 / z - 1 / zLoin) / (1 / zPres - 1 / zLoin);
}

function leTrajet(k, t) {
  const s = k;                          /* l'après-midi glisse vers le soir */
  const hz = 286, fx = 800;

  /* le ciel : bleu profond en haut, or à l'horizon */
  const g = cx.createLinearGradient(0, 0, 0, hz + 40);
  g.addColorStop(0, `rgb(${lerp(38, 26, s) | 0},${lerp(62, 40, s) | 0},${lerp(116, 84, s) | 0})`);
  g.addColorStop(.55, `rgb(${lerp(126, 108, s) | 0},${lerp(126, 88, s) | 0},${lerp(150, 112, s) | 0})`);
  g.addColorStop(.86, `rgb(${lerp(232, 226, s) | 0},${lerp(168, 132, s) | 0},${lerp(126, 106, s) | 0})`);
  g.addColorStop(1, `rgb(${lerp(250, 240, s) | 0},${lerp(206, 168, s) | 0},${lerp(146, 118, s) | 0})`);
  cx.fillStyle = g; cx.fillRect(0, 0, VW, hz + 40);
  cielEtoile(t, .22 * s);

  /* le soleil bas, qui descend au fil de la scène */
  const sy = hz - 74 + s * 62;
  lueur(fx, sy, 340, '255,214,150', .55);
  point(fx, sy, 40 - s * 12, '255,238,206', .92);

  /* quelques nuages étirés, contre-jour */
  for (let i = 0; i < 5; i++) {
    const y = 90 + i * 34, dec = (t * (6 + i * 3)) % (VW + 700) - 350;
    cx.fillStyle = `rgba(${255 - i * 12},${180 - i * 14},${160 - i * 16},${.20 - i * .025})`;
    cx.beginPath(); cx.ellipse(dec, y, 190 - i * 18, 9, 0, 0, 6.3); cx.fill();
  }

  /* la plaine */
  const pl = cx.createLinearGradient(0, hz, 0, VH);
  pl.addColorStop(0, `rgb(${lerp(96, 70, s) | 0},${lerp(96, 66, s) | 0},${lerp(62, 48, s) | 0})`);
  pl.addColorStop(1, `rgb(${lerp(44, 30, s) | 0},${lerp(48, 32, s) | 0},${lerp(32, 24, s) | 0})`);
  cx.fillStyle = pl; cx.fillRect(0, hz, VW, VH - hz);

  /* la route */
  cx.fillStyle = `rgb(${lerp(74, 52, s) | 0},${lerp(72, 50, s) | 0},${lerp(78, 56, s) | 0})`;
  cx.beginPath();
  cx.moveTo(fx - 20, hz); cx.lineTo(fx + 20, hz);
  cx.lineTo(VW * 1.02, VH); cx.lineTo(-VW * .02, VH);
  cx.closePath(); cx.fill();

  /* les bas-côtés clairs */
  cx.strokeStyle = `rgba(240,226,200,${.30 + s * .1})`; cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(fx - 20, hz); cx.lineTo(-VW * .02, VH);
  cx.moveTo(fx + 20, hz); cx.lineTo(VW * 1.02, VH);
  cx.stroke();

  /* la ligne médiane : des tirets qui foncent vers nous */
  for (let i = 0; i < 30; i++) {
    const u = profondeur((t * .34 + i / 30) % 1);
    const y = hz + (VH - hz) * u;
    const larg = lerp(1.4, 26, u), haut = lerp(2, 46, u);
    cx.fillStyle = `rgba(248,240,222,${.30 + u * .6})`;
    cx.fillRect(fx - larg / 2, y, larg, haut);
  }

  /* les arbres du bord, en ombre chinoise sur le couchant */
  for (let i = 0; i < 20; i++) {
    const u = profondeur((t * .22 + i / 20) % 1);
    if (u < .012) continue;
    const y = hz + (VH - hz) * u, ec = lerp(.12, 2.6, u);
    for (const cote of [-1, 1]) {
      const x = fx + cote * (34 + u * 1020);
      if (x < -120 || x > VW + 120) continue;
      cx.fillStyle = `rgba(${lerp(46, 26, s) | 0},${lerp(42, 24, s) | 0},${lerp(34, 22, s) | 0},.94)`;
      cx.beginPath(); cx.ellipse(x, y - 30 * ec, 14 * ec, 23 * ec, 0, 0, 6.3); cx.fill();
      cx.fillRect(x - 2 * ec, y - 12 * ec, 4 * ec, 14 * ec);
    }
  }

  /* les deux lueurs, toujours là, aux deux bouts du monde */
  lueur(120, 108, 130, '240,170,190', .34);
  lueur(VW - 120, 108, 130, '150,190,240', .34);
}

/* =========================================================
   SCÈNE 5 — les éclats : quatre petites choses
   ========================================================= */
function vignette(cxx, cyy, r, a, dessin) {
  cx.save();
  cx.globalAlpha = a;
  cx.beginPath(); cx.arc(cxx, cyy, r, 0, 6.3); cx.clip();
  const g = cx.createRadialGradient(cxx, cyy - r * .3, r * .1, cxx, cyy, r);
  g.addColorStop(0, '#1a2338'); g.addColorStop(1, '#080c16');
  cx.fillStyle = g; cx.fillRect(cxx - r, cyy - r, r * 2, r * 2);
  dessin(cxx, cyy, r);
  cx.restore();
  cx.save();
  cx.globalAlpha = a * .5;
  cx.strokeStyle = 'rgba(242,201,138,.5)'; cx.lineWidth = 1.4;
  cx.beginPath(); cx.arc(cxx, cyy, r, 0, 6.3); cx.stroke();
  cx.restore();
}
function lesEclats(k, t) {
  fondNuit(1); cielEtoile(t, .4);

  const q = [
    { a: .02, b: .30, x: 330, y: 250, d: (x, y, r) => {   /* le fou rire */
      for (let i = 0; i < 9; i++) {
        const p = (t * .8 + i * .7) % 1;
        point(x + Math.sin(i * 2.3) * r * .55, y + r * .5 - p * r * 1.1, 4 + (1 - p) * 5,
          '242,201,138', Math.sin(p * Math.PI) * .8);
      }
      cx.strokeStyle = 'rgba(244,236,226,.8)'; cx.lineWidth = 3; cx.lineCap = 'round';
      cx.beginPath(); cx.arc(x, y - 6, r * .34, .35, Math.PI - .35); cx.stroke();
    } },
    { a: .26, b: .54, x: 660, y: 400, d: (x, y, r) => {  /* l'appel tard le soir */
      point(x + r * .42, y - r * .42, 15, '242,232,190', .9);
      lueur(x + r * .42, y - r * .42, 60, '242,232,190', .5);
      cx.save(); cx.translate(x - 10, y + 14); cx.rotate(-.18);
      cx.fillStyle = '#0d1220'; cx.strokeStyle = 'rgba(242,201,138,.85)'; cx.lineWidth = 2;
      cx.beginPath(); cx.roundRect(-22, -38, 44, 76, 7); cx.fill(); cx.stroke();
      cx.fillStyle = `rgba(242,201,138,${.35 + .3 * Math.sin(t * 3)})`;
      cx.beginPath(); cx.roundRect(-17, -31, 34, 58, 4); cx.fill();
      cx.restore();
    } },
    { a: .50, b: .78, x: 990, y: 240, d: (x, y, r) => {  /* Milo qui court */
      const c = Math.sin(t * 7);
      cx.save(); cx.translate(x, y + 18);
      cx.fillStyle = '#e8d3b8';
      cx.beginPath(); cx.ellipse(0, 0, 34, 17, 0, 0, 6.3); cx.fill();          /* le corps */
      cx.beginPath(); cx.arc(34, -12, 14, 0, 6.3); cx.fill();                   /* la tête */
      cx.beginPath(); cx.ellipse(42, -22, 5, 8, .5, 0, 6.3); cx.fill();         /* l'oreille */
      cx.strokeStyle = '#e8d3b8'; cx.lineWidth = 5; cx.lineCap = 'round';
      cx.beginPath();
      cx.moveTo(-16, 12); cx.lineTo(-24 + c * 12, 30);
      cx.moveTo(14, 13); cx.lineTo(20 - c * 12, 30);
      cx.moveTo(-32, -2); cx.lineTo(-46 - c * 8, -12);                          /* la queue */
      cx.stroke();
      cx.restore();
      for (let i = 0; i < 7; i++) {
        const p = (t * .9 + i * .3) % 1;
        point(x - 40 - p * 60, y + 34 - Math.sin(p * 3) * 6, 3 * (1 - p), '244,236,226', (1 - p) * .5);
      }
    } },
    { a: .72, b: 1.0, x: 1290, y: 420, d: (x, y, r) => { /* la mer */
      for (let i = 0; i < 7; i++) {
        const yy = y - 20 + i * 15;
        cx.strokeStyle = `rgba(150,200,230,${.25 + i * .07})`; cx.lineWidth = 2.4;
        cx.beginPath();
        for (let xx = -r; xx <= r; xx += 8) {
          const h = Math.sin(xx * .05 + t * 1.6 + i) * 4;
          xx === -r ? cx.moveTo(x + xx, yy + h) : cx.lineTo(x + xx, yy + h);
        }
        cx.stroke();
      }
      lueur(x, y - 52, 70, '242,201,138', .35);
    } }
  ];

  for (const v of q) {
    const a = Math.min(sat(v.a, v.a + .09, k), 1 - sat(v.b - .07, v.b, k));
    if (a <= 0) continue;
    const gr = 1 + (1 - a) * .06;
    vignette(v.x, v.y, 152 * gr, a, v.d);
  }
}

/* =========================================================
   SCÈNE 6 — le compte à rebours
   ========================================================= */
/* chaque page a sa propre trajectoire, tirée une fois pour toutes */
const PAGES = (function () {
  let g = 9871;
  const rnd = () => (g = (g * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  return Array.from({ length: 26 }, () => ({
    dec: rnd(), cote: rnd() < .5 ? -1 : 1, ecart: rnd() * 320, haut: rnd() * 210,
    ond: rnd() * 6.3, rot0: rnd() * 6.3, vrille: (rnd() - .5) * 9
  }));
})();

function leCompte(k, t) {
  fondNuit(1); cielEtoile(t, .45);
  const depart = JOURS + 96;
  const n = Math.round(lerp(depart, JOURS, doux(sat(.05, .82, k))));

  /* les pages du calendrier qui s'arrachent et s'envolent, chacune à sa façon */
  for (let i = 0; i < 26; i++) {
    const h = PAGES[i];
    const p = ((t * .30 + h.dec) % 1);
    const x = 800 + h.cote * (60 + p * (420 + h.ecart)) + Math.sin(p * 5 + h.ond) * 46;
    const y = 372 - p * (300 + h.haut) + Math.sin(p * 3.4 + h.ond) * 22;
    cx.save(); cx.translate(x, y); cx.rotate(h.rot0 + p * h.vrille);
    cx.globalAlpha = Math.sin(Math.min(1, p * 1.6) * Math.PI * .82) * .62;
    cx.fillStyle = '#f2ece0'; cx.fillRect(-14, -18, 28, 36);
    cx.fillStyle = '#c05a66'; cx.fillRect(-14, -18, 28, 6);
    cx.fillStyle = 'rgba(60,50,44,.30)'; cx.fillRect(-9, -6, 18, 2);
    cx.fillRect(-9, 0, 12, 2);
    cx.restore();
  }
  cx.globalAlpha = 1;

  const ch = sat(.12, .95, k);
  lueur(800, 348, 300, '242,201,138', .22 * ch);
  cx.save();
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.font = '300 ' + Math.round(190 + (1 - ch) * 20) + 'px "Cormorant Garamond", serif';
  cx.fillStyle = `rgba(244,236,226,${ch})`;
  cx.fillText(String(n), 800, 340);
  cx.font = '300 30px "Cormorant Garamond", serif';
  cx.fillStyle = `rgba(242,201,138,${ch * .9})`;
  cx.fillText(n > 1 ? 'jours' : 'jour', 800, 452);
  cx.restore();
}

/* =========================================================
   SCÈNE 7 — les retrouvailles
   ========================================================= */
let petales = [];
function retrouvailles(k, t) {
  const jour = sat(.55, 1, k);
  /* la nuit se lève */
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, `rgb(${lerp(4, 60, jour) | 0},${lerp(6, 40, jour) | 0},${lerp(12, 72, jour) | 0})`);
  g.addColorStop(.6, `rgb(${lerp(10, 210, jour) | 0},${lerp(16, 140, jour) | 0},${lerp(32, 140, jour) | 0})`);
  g.addColorStop(1, `rgb(${lerp(7, 246, jour) | 0},${lerp(11, 200, jour) | 0},${lerp(20, 170, jour) | 0})`);
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
  cielEtoile(t, .5 * (1 - jour));

  const u = doux(sat(.05, .52, k));
  const xA = lerp(180, 782, u), yA = lerp(190, 336, u);
  const xB = lerp(1420, 818, u), yB = lerp(500, 336, u);

  /* la traînée qu'elles laissent : elle s'efface derrière, pas un trait net */
  cx.save();
  for (const [x0, y0, x1, y1, col] of [[180, 190, xA, yA, '240,170,190'], [1420, 500, xB, yB, '150,190,240']]) {
    const tr = cx.createLinearGradient(x0, y0, x1, y1);
    tr.addColorStop(0, `rgba(${col},0)`);
    tr.addColorStop(1, `rgba(${col},.28)`);
    cx.strokeStyle = tr; cx.lineWidth = 2.4; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke();
  }
  cx.restore();

  const contact = sat(.48, .56, k);
  const explo = sat(.52, .78, k);

  if (contact < 1) {
    lueur(xA, yA, 130, '240,170,190', .75);
    point(xA, yA, 6, '255,250,248', 1);
    lueur(xB, yB, 130, '150,190,240', .75);
    point(xB, yB, 6, '255,250,248', 1);
  }

  /* le contact : une seule lumière, qui grandit */
  if (explo > 0) {
    const r = 60 + explo * 520;
    lueur(800, 336, r, '250,225,200', .55 * (1 - explo * .45));
    point(800, 336, 14 + explo * 18, '255,252,248', 1 - explo * .3);
    /* l'onde */
    cx.strokeStyle = `rgba(255,240,225,${(1 - explo) * .5})`; cx.lineWidth = 2;
    cx.beginPath(); cx.arc(800, 336, explo * 620, 0, 6.3); cx.stroke();
  }

  /* les pétales de lumière qui s'échappent */
  if (explo > .02 && petales.length < 90) {
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * 6.3, v = 1.4 + Math.random() * 4;
      petales.push({ x: 800, y: 336, vx: Math.cos(a) * v, vy: Math.sin(a) * v - .7, r: 3 + Math.random() * 6, vie: 1, ang: a });
    }
  }
  for (const p of petales) {
    p.x += p.vx; p.y += p.vy; p.vy += .012; p.vx *= .992; p.vy *= .992; p.vie -= .006; p.ang += .02;
  }
  petales = petales.filter(p => p.vie > 0);
  for (const p of petales) {
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.ang);
    cx.globalAlpha = clamp(p.vie, 0, 1) * .85;
    cx.fillStyle = '#f7d9b8';
    cx.beginPath(); cx.ellipse(0, 0, p.r * 1.7, p.r * .8, 0, 0, 6.3); cx.fill();
    cx.restore();
  }
  cx.globalAlpha = 1;
}

/* =========================================================
   SCÈNE 8 — le carton de fin
   ========================================================= */
function carton(k, t) {
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#2a1c34'); g.addColorStop(.55, '#8a4a5e'); g.addColorStop(1, '#e8a074');
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);

  const so = 1 - sat(0, .5, k) * .25;
  lueur(800, 470, 420 * so, '250,210,170', .5);
  point(800, 470, 9, '255,250,245', .95);

  /* deux silhouettes minuscules, ensemble, devant la lumière */
  cx.save();
  cx.globalAlpha = sat(.12, .4, k) * .9;
  cx.fillStyle = '#2a1420';
  for (const [dx, h] of [[-13, 54], [13, 50]]) {
    cx.beginPath();
    cx.moveTo(800 + dx - 7, 520);
    cx.lineTo(800 + dx - 5, 520 - h);
    cx.lineTo(800 + dx + 5, 520 - h);
    cx.lineTo(800 + dx + 7, 520);
    cx.closePath(); cx.fill();
    cx.beginPath(); cx.arc(800 + dx, 520 - h - 8, 8, 0, 6.3); cx.fill();
  }
  cx.restore();
  /* la terre, qui s'assombrit vers nous — et qui porte le dernier carton */
  const sol = cx.createLinearGradient(0, 512, 0, VH);
  sol.addColorStop(0, 'rgba(58,26,36,.62)');
  sol.addColorStop(.45, 'rgba(30,13,22,.88)');
  sol.addColorStop(1, 'rgba(14,6,12,.97)');
  cx.fillStyle = sol; cx.fillRect(0, 512, VW, VH - 512);
}

/* =========================================================
   LA MUSIQUE — fabriquée à la volée
   ========================================================= */
let ac = null, maitre = null, sonCoupe = false;
const freq = m => 440 * Math.pow(2, (m - 69) / 12);
/* une couleur d'accord par moment du film */
const ACCORDS = [
  { t:   0, n: [57, 60, 64] },   { t:  25, n: [53, 57, 60] },
  { t:  39, n: [48, 55, 60] },   { t:  56, n: [55, 59, 62] },
  { t:  74, n: [57, 60, 64] },   { t:  88, n: [60, 64, 67] },
  { t: 104, n: [60, 67, 72] }
];
const accordA = t => { let c = ACCORDS[0]; for (const a of ACCORDS) if (t >= a.t) c = a; return c; };

function ouvreAudio() {
  if (ac) return;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    maitre = ac.createGain();
    maitre.gain.value = 0;
    maitre.connect(ac.destination);
    /* le tapis : deux nappes légèrement désaccordées */
    const filtre = ac.createBiquadFilter();
    filtre.type = 'lowpass'; filtre.frequency.value = 520; filtre.Q.value = .6;
    filtre.connect(maitre);
    nappe = ac.createGain(); nappe.gain.value = .16; nappe.connect(filtre);
    for (const d of [-4, 4]) {
      const o = ac.createOscillator();
      o.type = 'sawtooth'; o.detune.value = d;
      o.frequency.value = freq(45);
      o.connect(nappe); o.start();
      nappes.push(o);
    }
  } catch (e) { ac = null; }
}
let nappe = null, nappes = [], prochaineNote = 0;

function note(midi, quand, duree, vol) {
  if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'triangle'; o.frequency.value = freq(midi);
  g.gain.setValueAtTime(0, quand);
  g.gain.linearRampToValueAtTime(vol, quand + .02);
  g.gain.exponentialRampToValueAtTime(.0001, quand + duree);
  o.connect(g); g.connect(maitre);
  o.start(quand); o.stop(quand + duree + .05);
}

let pasArp = 0;
function musique(tFilm) {
  if (!ac || ac.state !== 'running') return;
  const av = ac.currentTime + .6;
  const acc = accordA(tFilm);
  /* la nappe suit la fondamentale */
  for (const o of nappes) o.frequency.setTargetAtTime(freq(acc.n[0] - 12), ac.currentTime, .6);
  /* l'intensité monte vers les retrouvailles */
  const inten = tFilm < 88 ? .55 + sat(0, 88, tFilm) * .3 : 1;
  while (prochaineNote < av) {
    const g = acc.n;
    const m = g[pasArp % g.length] + (pasArp % 7 === 6 ? 12 : 0);
    note(m + 12, prochaineNote, 1.7, .05 * inten);
    if (pasArp % 4 === 0) note(g[0], prochaineNote, 2.6, .045 * inten);
    if (tFilm > 88 && pasArp % 2 === 0) note(m + 24, prochaineNote + .18, 1.1, .022);
    pasArp++;
    prochaineNote += .44;
  }
}

/* =========================================================
   LA PROJECTION
   ========================================================= */
let tFilm = 0, joue = false, derImage = 0, finMontree = false;

function scene(t) { return SCENES.find(s => t >= s.a && t < s.b) || null; }

function dessine() {
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, W, H);
  cx.fillStyle = '#05070c'; cx.fillRect(0, 0, W, H);
  cx.save();
  cx.translate(ox, oy); cx.scale(sc, sc);

  for (const s of SCENES) {
    if (tFilm < s.a - .05 || tFilm > s.b) continue;
    const k = clamp((tFilm - s.a) / (s.b - s.a), 0, 1);
    /* chaque scène s'ouvre et se ferme en fondu au noir */
    const a = Math.min(sat(0, FONDU / (s.b - s.a), k), 1 - sat(1 - FONDU / (s.b - s.a), 1, k));
    if (a <= 0) continue;
    cx.save(); cx.globalAlpha = a;
    cx.beginPath(); cx.rect(0, 0, VW, VH); cx.clip();
    s.f(k, tFilm);
    cx.restore();
  }
  cx.restore();
}

function majCarton() {
  const c = CARTONS.find(x => tFilm >= x.a && tFilm < x.b);
  const el = $('#soustitre');
  const veut = c ? c.t : '';
  if (el.dataset.txt !== veut) {
    el.dataset.txt = veut;
    el.classList.remove('vu');
    if (veut) setTimeout(() => { el.innerHTML = veut; el.classList.add('vu'); }, 260);
    else el.innerHTML = '';
  }
}

function boucle(now) {
  requestAnimationFrame(boucle);
  const dt = Math.min(.05, (now - derImage) / 1000 || 0);
  derImage = now;
  if (joue) {
    tFilm += dt;
    musique(tFilm);
    if (tFilm >= DUREE && !finMontree) termine();
  }
  dessine();
  majCarton();
  $('#avance').style.width = clamp(tFilm / DUREE, 0, 1) * 100 + '%';
}
requestAnimationFrame(boucle);

/* ---------- les boutons ---------- */
function lance() {
  tFilm = 0; petales = []; pasArp = 0; finMontree = false;
  $('#e-debut').classList.remove('on');
  $('#e-fin').classList.remove('on');
  document.body.classList.add('projection');
  $('#commandes').hidden = false;
  ouvreAudio();
  if (ac) {
    ac.resume();
    prochaineNote = ac.currentTime + .2;
    maitre.gain.cancelScheduledValues(ac.currentTime);
    maitre.gain.setValueAtTime(0, ac.currentTime);
    maitre.gain.linearRampToValueAtTime(sonCoupe ? 0 : .9, ac.currentTime + 2.5);
  }
  joue = true;
  reveille();
}
$('#b-jouer').addEventListener('click', lance);
$('#b-revoir').addEventListener('click', lance);

function termine() {
  finMontree = true; joue = false;
  document.body.classList.remove('projection');
  $('#commandes').hidden = true;
  $('#soustitre').classList.remove('vu');
  if (ac) maitre.gain.linearRampToValueAtTime(0, ac.currentTime + 3);
  $('#mot-fin').innerHTML = JOURS > 0
    ? 'Il reste <b>' + JOURS + ' jour' + (JOURS > 1 ? 's' : '') + '</b>.<br>Je les compte avec toi.'
    : 'C\'est aujourd\'hui.<br>Viens là.';
  $('#e-fin').classList.add('on');
}

$('#b-pause').addEventListener('click', () => {
  joue = !joue;
  $('#b-pause').textContent = joue ? 'II' : '▶';
  if (ac) joue ? ac.resume() : ac.suspend();
});
$('#b-son').addEventListener('click', () => {
  sonCoupe = !sonCoupe;
  $('#b-son').classList.toggle('eteint', sonCoupe);
  if (ac) maitre.gain.linearRampToValueAtTime(sonCoupe ? 0 : .9, ac.currentTime + .4);
});

/* les commandes s'effacent quand on ne bouge plus */
let sommeil = null;
function reveille() {
  document.body.classList.add('montre-commandes');
  clearTimeout(sommeil);
  sommeil = setTimeout(() => document.body.classList.remove('montre-commandes'), 2600);
}
window.addEventListener('pointermove', reveille);
window.addEventListener('pointerdown', reveille);

/* ?t=90 : entrer directement à la 90e seconde, pour vérifier une scène */
const P = new URLSearchParams(location.search);
if (P.has('t')) {
  document.body.classList.add('sans-transition');
  lance();
  tFilm = clamp(parseFloat(P.get('t')) || 0, 0, DUREE - .5);
}
