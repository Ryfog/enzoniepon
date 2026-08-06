/* =========================================================
   POUR TOI — un paquet à dénouer, puis douze roses qui poussent.
   Tout est dessiné : la boîte, le ruban, les tiges, chaque pétale.
   Aucune image.
   ========================================================= */
const $ = s => document.querySelector(s);
const cv = $('#scene'), g = cv.getContext('2d');

const TAU = Math.PI * 2;
const serre = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
/* accélère puis freine en douceur */
const doux = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const sortie = t => 1 - Math.pow(1 - t, 3);

/* ---------- scène virtuelle : on dessine toujours en 900×900 ---------- */
const SC = 900;
let L = 0, H = 0, ech = 1, dpr = 1;

function taille() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  L = innerWidth; H = innerHeight;
  cv.width = L * dpr; cv.height = H * dpr;
  ech = Math.min(L, H) / SC * 0.92;
}
taille(); addEventListener('resize', taille);

/* passe des coordonnées de la scène à celles de l'écran */
const px = x => L / 2 + x * ech;
const py = y => H / 2 + y * ech;
const pe = v => v * ech;

/* =========================================================
   PALETTE
   ========================================================= */
/* du cœur vers l'extérieur : le centre est plus soutenu */
const ROSES = [
  ['#a63d61', '#bd5478', '#d1738f', '#e79ab3', '#f4c6d6'],
  ['#b0466a', '#c65f83', '#d97e9c', '#eaa8bf', '#f7d2df'],
  ['#9c3559', '#b44e72', '#cb7291', '#e29cb6', '#f2c0d2']
];
const FEUILLE = '#3f6140', FEUILLE_C = '#5c8455';
const TIGE = '#4a6b45';

/* =========================================================
   LES DOUZE ROSES
   dx, dy : position au-dessus de la boîte · e : échelle
   ========================================================= */
const MOTS = [
  'Pour chaque matin où tu t\'es levée sans envie, et où tu y es allée quand même.',
  'Pour ta patience, que je ne mérite pas toujours.',
  'Pour ta façon de rire trop fort quand tu es vraiment heureuse.',
  'Pour les kilomètres que tu ne comptes plus.',
  'Pour ce que tu es quand personne ne regarde.',
  'Pour ta douceur, même les jours où tu n\'en as plus pour toi.',
  'Pour toutes les fois où tu as attendu que je trouve mes mots.',
  'Pour la place que tu prends sans jamais la demander.',
  'Pour ton courage, celui dont tu ne parles jamais.',
  'Pour les silences avec toi, qui ne sont jamais gênants.',
  'Pour tout ce que tu me fais devenir sans même essayer.',
  'Et celle-ci, c\'est simplement parce que je t\'aime.'
];

const ROSIER = [
  [-206, -238, .74], [-104, -296, .80], [0, -324, .84], [104, -296, .80], [206, -238, .74],
  [-158, -160, .92], [-54, -204, .99], [54, -204, .99], [158, -160, .92],
  [-96, -88, 1.08], [0, -124, 1.14], [96, -88, 1.08]
];

const fleurs = ROSIER.map(([dx, dy, e], i) => ({
  dx, dy, e,
  mot: MOTS[i],
  teinte: i % 3,
  graine: Math.random() * TAU,
  courbe: (Math.random() - .5) * 46,
  balance: Math.random() * TAU,
  depart: null, t: 0, lue: false, halo: 0
}));

/* =========================================================
   ÉTAT
   ========================================================= */
const FERME = 0, OUVRE = 1, POUSSE = 2, FIN = 3;
let etat = FERME;
let noeud = 0;              // 0 = ruban noué, 1 = dénoué
let ouvT = 0;               // avancement de l'ouverture du couvercle
let debutPousse = null;     // null tant que la croissance n'a pas commencé
let poussieres = [];
let temps = 0;

/* =========================================================
   POUSSIÈRES DE LUMIÈRE
   ========================================================= */
for (let i = 0; i < 46; i++) poussieres.push({
  x: (Math.random() - .5) * SC, y: (Math.random() - .5) * SC,
  r: .8 + Math.random() * 2.2, v: .12 + Math.random() * .3,
  a: Math.random() * TAU, o: .12 + Math.random() * .3
});

/* =========================================================
   FOND
   ========================================================= */
function fond() {
  const f = g.createRadialGradient(L / 2, H * .38, 10, L / 2, H * .5, Math.max(L, H) * .78);
  f.addColorStop(0, '#4a2536');
  f.addColorStop(.45, '#361c29');
  f.addColorStop(1, '#1c0e16');
  g.fillStyle = f; g.fillRect(0, 0, L, H);

  /* halo qui s'intensifie quand le paquet s'ouvre */
  const chaud = etat >= OUVRE ? serre(ouvT * 1.4) : 0;
  if (chaud > 0) {
    const h = g.createRadialGradient(L / 2, py(-60), 10, L / 2, py(-60), pe(520));
    h.addColorStop(0, `rgba(255,214,230,${.20 * chaud})`);
    h.addColorStop(1, 'rgba(255,214,230,0)');
    g.fillStyle = h; g.fillRect(0, 0, L, H);
  }

  poussieres.forEach(p => {
    p.y -= p.v; p.a += .01;
    if (p.y < -SC / 2) p.y = SC / 2;
    const x = px(p.x + Math.sin(p.a) * 16), y = py(p.y);
    g.globalAlpha = p.o * (etat >= OUVRE ? 1 : .5);
    g.fillStyle = '#ffe6ef';
    g.beginPath(); g.arc(x, y, pe(p.r), 0, TAU); g.fill();
  });
  g.globalAlpha = 1;
}

/* =========================================================
   LA BOÎTE
   ========================================================= */
const BX = 0, BY = 150;            // centre de la boîte dans la scène
const BW = 300, BH = 170, BD = 62; // largeur, hauteur, profondeur du dessus

function boite() {
  const x = BX, y = BY;

  /* ombre portée */
  g.fillStyle = 'rgba(0,0,0,.4)';
  g.beginPath();
  g.ellipse(px(x), py(y + BH / 2 + 16), pe(BW * .62), pe(24), 0, 0, TAU);
  g.fill();

  /* intérieur visible une fois le couvercle parti */
  if (etat >= OUVRE) {
    g.fillStyle = '#2a1119';
    g.beginPath();
    g.moveTo(px(x - BW / 2), py(y - BH / 2));
    g.lineTo(px(x - BW / 2 + BD * .5), py(y - BH / 2 - BD * .5));
    g.lineTo(px(x + BW / 2 + BD * .5), py(y - BH / 2 - BD * .5));
    g.lineTo(px(x + BW / 2), py(y - BH / 2));
    g.closePath(); g.fill();
  }

  /* face avant */
  const fa = g.createLinearGradient(px(x - BW / 2), 0, px(x + BW / 2), 0);
  fa.addColorStop(0, '#6d2a3f');
  fa.addColorStop(.42, '#8e3a54');
  fa.addColorStop(1, '#5d2235');
  g.fillStyle = fa;
  g.fillRect(px(x - BW / 2), py(y - BH / 2), pe(BW), pe(BH));

  /* côté droit, pour la profondeur */
  g.fillStyle = '#4d1c2c';
  g.beginPath();
  g.moveTo(px(x + BW / 2), py(y - BH / 2));
  g.lineTo(px(x + BW / 2 + BD * .5), py(y - BH / 2 - BD * .5));
  g.lineTo(px(x + BW / 2 + BD * .5), py(y + BH / 2 - BD * .5));
  g.lineTo(px(x + BW / 2), py(y + BH / 2));
  g.closePath(); g.fill();

  /* grain du carton */
  g.globalAlpha = .06;
  for (let i = 0; i < BH; i += 5) {
    g.fillStyle = i % 10 ? '#fff' : '#000';
    g.fillRect(px(x - BW / 2), py(y - BH / 2 + i), pe(BW), pe(1.6));
  }
  g.globalAlpha = 1;

  /* ruban vertical sur la face avant */
  if (noeud < 1) {
    const dec = noeud * BW * .8;
    g.fillStyle = '#f2a8c0';
    g.fillRect(px(x - 26 + dec), py(y - BH / 2), pe(52), pe(BH));
    g.fillStyle = 'rgba(255,255,255,.28)';
    g.fillRect(px(x - 26 + dec), py(y - BH / 2), pe(15), pe(BH));
  }
}

/* le couvercle : il se soulève, bascule et s'éloigne */
function couvercle() {
  if (etat > OUVRE && ouvT >= 1) return;
  const t = etat >= OUVRE ? sortie(ouvT) : 0;
  const monte = t * 330, incline = t * .55, fuite = t * 130;

  g.save();
  g.translate(px(BX + fuite), py(BY - BH / 2 - monte));
  g.rotate(-incline);
  g.globalAlpha = 1 - serre((t - .72) / .28);

  const w = BW + 22, d = BD * .5, hh = 34;
  /* dessus */
  const de = g.createLinearGradient(-pe(w / 2), 0, pe(w / 2), 0);
  de.addColorStop(0, '#a2455f');
  de.addColorStop(.45, '#c05a77');
  de.addColorStop(1, '#8b3651');
  g.fillStyle = de;
  g.beginPath();
  g.moveTo(-pe(w / 2), 0);
  g.lineTo(-pe(w / 2 - d), -pe(d));
  g.lineTo(pe(w / 2 + d), -pe(d));
  g.lineTo(pe(w / 2), 0);
  g.closePath(); g.fill();
  /* tranche */
  g.fillStyle = '#7a2f45';
  g.fillRect(-pe(w / 2), 0, pe(w), pe(hh));

  /* ruban croisé sur le couvercle */
  if (noeud < 1) {
    g.fillStyle = '#f2a8c0';
    g.fillRect(-pe(26), -pe(d), pe(52), pe(hh + d));
    g.fillStyle = 'rgba(255,255,255,.25)';
    g.fillRect(-pe(26), -pe(d), pe(15), pe(hh + d));
  }
  g.restore();
}

/* =========================================================
   LE NŒUD
   Les boucles se resserrent et les pans s'allongent
   à mesure qu'on tire.
   ========================================================= */
function boucle(cx, cy, sens, taille, tomb) {
  g.beginPath();
  g.moveTo(cx, cy);
  g.bezierCurveTo(
    cx + sens * taille * .5, cy - taille * .95,
    cx + sens * taille * 1.5, cy - taille * .35,
    cx + sens * taille * .96, cy + taille * .2 + tomb
  );
  g.bezierCurveTo(
    cx + sens * taille * .62, cy + taille * .34 + tomb,
    cx + sens * taille * .28, cy + taille * .12,
    cx, cy
  );
  g.fill();
}

function ruban() {
  if (noeud >= 1) return;
  const reste = 1 - noeud;
  const cx = px(BX), cy = py(BY - BH / 2 - BD * .5 - (etat >= OUVRE ? sortie(ouvT) * 330 : 0));
  const t = pe(58) * reste;

  g.save();
  g.globalAlpha = reste;

  /* les deux boucles */
  g.fillStyle = '#eb96b3';
  boucle(cx, cy, -1, t, pe(4));
  boucle(cx, cy, 1, t, pe(4));
  /* reflet satiné */
  g.fillStyle = 'rgba(255,255,255,.22)';
  boucle(cx, cy, -1, t * .62, pe(2));
  boucle(cx, cy, 1, t * .62, pe(2));

  /* les pans qui pendent, ils s'allongent quand on tire */
  const lg = pe(52) + noeud * pe(190);
  g.strokeStyle = '#eb96b3';
  g.lineWidth = pe(17); g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx, cy);
  g.quadraticCurveTo(cx - pe(34), cy + lg * .6, cx - pe(20) - noeud * pe(60), cy + lg);
  g.moveTo(cx, cy);
  g.quadraticCurveTo(cx + pe(30), cy + lg * .62, cx + pe(26) + noeud * pe(66), cy + lg * .94);
  g.stroke();

  /* le nœud central */
  g.fillStyle = '#d97b9c';
  g.beginPath();
  g.ellipse(cx, cy, pe(15) * reste + pe(5), pe(12) * reste + pe(4), 0, 0, TAU);
  g.fill();

  g.restore();
}

/* =========================================================
   UNE ROSE
   ========================================================= */
function petale(cx, cy, ang, lon, lar, coul) {
  g.save();
  g.translate(cx, cy);
  g.rotate(ang);
  g.fillStyle = coul;
  /* pétale de rose : base étroite, ventre marqué, pointe repliée */
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(-lar * .95, -lon * .30, -lar, -lon * .72, -lar * .18, -lon);
  g.bezierCurveTo(lar * .18, -lon, lar, -lon * .72, lar * .95, -lon * .30);
  g.bezierCurveTo(lar * .55, -lon * .10, -lar * .55, -lon * .10, 0, 0);
  g.fill();
  /* ourlet plus clair sur le bord extérieur */
  g.globalAlpha = .18;
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(-lar * .18, -lon);
  g.bezierCurveTo(-lar, -lon * .72, -lar * .95, -lon * .30, -lar * .60, -lon * .26);
  g.bezierCurveTo(-lar * .78, -lon * .66, -lar * .62, -lon * .84, 0, -lon * .94);
  g.fill();
  g.globalAlpha = 1;
  g.restore();
}

/* petit bruit déterministe : deux mêmes indices donnent toujours la
   même valeur, la fleur ne scintille donc pas d'une image à l'autre */
const bruit = (a, b) => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

function fleur(x, y, r, ouv, teinte, graine) {
  if (ouv <= 0) return;
  const P = ROSES[teinte];
  const COUCHES = 5;

  g.save();
  g.translate(x, y);

  /* de l'extérieur vers le cœur, pour que le centre recouvre le reste */
  for (let c = COUCHES - 1; c >= 0; c--) {
    const seuil = .13 * (COUCHES - 1 - c);
    const o = serre((ouv - seuil) / .55);
    if (o <= 0) continue;
    const n = 6 + c;
    const base = r * (.34 + c * .15);
    const lonBase = base * (.52 + .48 * o);
    const ecartBase = r * (.06 + c * .13) * o;
    const replie = (1 - o) * .55;
    for (let i = 0; i < n; i++) {
      /* chaque pétale est légèrement décalé et de taille différente,
         sinon les couches forment une étoile bien trop régulière */
      const j1 = bruit(c * 7 + i, graine * 31);
      const j2 = bruit(i * 13 + c, graine * 17);
      const a = (i / n) * TAU + c * .74 + graine + (j1 - .5) * .42;
      const lon = lonBase * (.82 + j2 * .36);
      const lar = lon * (.50 + j1 * .14);
      const ecart = ecartBase * (.85 + j2 * .3);
      petale(Math.cos(a) * ecart, Math.sin(a) * ecart,
        a + Math.PI / 2 + replie + (j2 - .5) * .3, lon, lar, P[c]);
    }
  }

  /* volume : un dégradé posé sur l'ensemble de la fleur */
  const v = g.createRadialGradient(-r * .22, -r * .28, r * .05, 0, 0, r * 1.05);
  v.addColorStop(0, 'rgba(255,255,255,.30)');
  v.addColorStop(.45, 'rgba(255,255,255,0)');
  v.addColorStop(1, 'rgba(70,20,40,.34)');
  g.fillStyle = v;
  g.beginPath(); g.arc(0, 0, r * 1.05, 0, TAU); g.fill();

  /* le cœur, roulé serré */
  g.fillStyle = P[0];
  g.beginPath(); g.arc(0, 0, r * .13 * ouv, 0, TAU); g.fill();

  g.restore();
}

function feuille(x, y, ang, lon) {
  g.save(); g.translate(x, y); g.rotate(ang);
  const gr = g.createLinearGradient(0, 0, 0, -lon);
  gr.addColorStop(0, FEUILLE); gr.addColorStop(1, FEUILLE_C);
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(-lon * .42, -lon * .34, -lon * .30, -lon * .84, 0, -lon);
  g.bezierCurveTo(lon * .30, -lon * .84, lon * .42, -lon * .34, 0, 0);
  g.fill();
  g.strokeStyle = 'rgba(20,45,20,.4)'; g.lineWidth = Math.max(1, pe(1.2));
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -lon * .92); g.stroke();
  g.restore();
}

function rose(f) {
  const t = f.t;
  if (t <= 0) return;

  const bal = Math.sin(temps * .8 + f.balance) * 5 * (etat === FIN ? .4 : 1);
  const baseX = BX, baseY = BY - BH / 2 + 10;
  const hautX = BX + f.dx + bal, hautY = BY + f.dy;

  /* la tige pousse d'abord */
  const tp = serre(t / .5);
  const cx = baseX + f.courbe, cy = (baseY + hautY) / 2;
  const fx = baseX + (hautX - baseX) * doux(tp);
  const fy = baseY + (hautY - baseY) * doux(tp);

  g.strokeStyle = TIGE;
  g.lineWidth = pe(5.4 * f.e);
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(px(baseX), py(baseY));
  g.quadraticCurveTo(px(cx), py(cy), px(fx), py(fy));
  g.stroke();

  /* deux feuilles à mi-tige */
  const tf = serre((t - .3) / .3);
  if (tf > 0) {
    const mx = px(baseX + (cx - baseX) * .9), my = py(baseY + (cy - baseY) * .95);
    feuille(mx, my, -.6, pe(46 * f.e * tf));
    feuille(mx, my, 2.5, pe(40 * f.e * tf));
  }

  /* puis la fleur s'ouvre */
  const to = serre((t - .45) / .55);
  if (to > 0) {
    if (f.halo > 0) {
      g.save();
      g.globalAlpha = f.halo * .5;
      const h = g.createRadialGradient(px(fx), py(fy), 0, px(fx), py(fy), pe(96 * f.e));
      h.addColorStop(0, 'rgba(255,208,226,.9)');
      h.addColorStop(1, 'rgba(255,208,226,0)');
      g.fillStyle = h;
      g.beginPath(); g.arc(px(fx), py(fy), pe(96 * f.e), 0, TAU); g.fill();
      g.restore();
    }
    fleur(px(fx), py(fy), pe(46 * f.e), to, f.teinte, f.graine);
    f.ex = px(fx); f.ey = py(fy); f.er = pe(46 * f.e);
  }
}

/* =========================================================
   BOUCLE
   ========================================================= */
let dernier = 0;
function image(ts) {
  requestAnimationFrame(image);
  const dt = Math.min(50, ts - dernier) / 1000;
  dernier = ts; temps = ts / 1000;

  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, L, H);
  fond();

  if (etat === OUVRE) {
    ouvT = serre(ouvT + dt * .85);
    if (ouvT >= 1) { etat = POUSSE; debutPousse = ts; }
  }

  if (etat >= POUSSE) {
    /* on compare à null : l'horloge peut valoir 0 à la première image,
       et un simple test de vérité remettrait le départ à zéro sans fin */
    if (debutPousse === null) debutPousse = ts;
    fleurs.forEach((f, i) => {
      if (f.depart === null) f.depart = debutPousse + i * 210;
      f.t = serre((ts - f.depart) / 1500);
      if (f.halo > 0) f.halo = Math.max(0, f.halo - dt * .8);
    });
  }

  /* les roses du fond passent derrière la boîte, celles du devant par-dessus */
  fleurs.slice(0, 9).forEach(f => rose(f));
  boite();
  fleurs.slice(9).forEach(f => rose(f));
  couvercle();
  ruban();
}
requestAnimationFrame(image);

/* =========================================================
   TIRER LE RUBAN
   ========================================================= */
let tire = false, depX = 0, depY = 0;

const dansBoite = (x, y) => {
  const dx = Math.abs(x - px(BX)), dy = y - py(BY - BH / 2 - 90);
  return dx < pe(BW * .75) && dy > -pe(160) && dy < pe(BH + 90);
};

cv.addEventListener('pointerdown', e => {
  if (etat === FERME && dansBoite(e.clientX, e.clientY)) {
    tire = true; depX = e.clientX; depY = e.clientY;
    cv.classList.add('tire');
    cv.setPointerCapture(e.pointerId);
    return;
  }
  if (etat === POUSSE) toucheRose(e.clientX, e.clientY);
});

cv.addEventListener('pointermove', e => {
  if (!tire) return;
  const d = Math.hypot(e.clientX - depX, e.clientY - depY);
  noeud = serre(d / (Math.min(L, H) * .30));
  if (noeud >= 1) denoue();
});

addEventListener('pointerup', () => {
  if (!tire) return;
  tire = false; cv.classList.remove('tire');
  if (etat === FERME) rappel();
});

/* si elle relâche trop tôt, le nœud se resserre */
function rappel() {
  const dep = noeud;
  const t0 = performance.now();
  (function retour() {
    if (etat !== FERME) return;
    const k = serre((performance.now() - t0) / 420);
    noeud = dep * (1 - sortie(k));
    if (k < 1) requestAnimationFrame(retour);
  })();
}

function denoue() {
  if (etat !== FERME) return;
  tire = false; cv.classList.remove('tire');
  etat = OUVRE;
  $('#consigne').classList.add('parti');
  setTimeout(() => { $('#consigne').hidden = true; }, 900);
}

/* =========================================================
   TOUCHER UNE ROSE
   ========================================================= */
function toucheRose(x, y) {
  /* de l'avant vers l'arrière : on prend celle du dessus */
  for (let i = fleurs.length - 1; i >= 0; i--) {
    const f = fleurs[i];
    if (f.t < .95 || f.ex === undefined) continue;
    if (Math.hypot(x - f.ex, y - f.ey) > f.er * 1.15) continue;
    f.halo = 1;
    if (!f.lue) { f.lue = true; verifieFin(); }
    montreMot(i, f.mot);
    return;
  }
}

let cacheMot = null;
function montreMot(i, txt) {
  const b = $('#mot');
  $('#mot-num').textContent = `${i + 1} / ${fleurs.length}`;
  $('#mot-txt').textContent = txt;
  b.hidden = false;
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(cacheMot);
  cacheMot = setTimeout(() => { b.hidden = true; }, 7000);
}

function verifieFin() {
  if (!fleurs.every(f => f.lue)) return;
  setTimeout(() => {
    etat = FIN;
    $('#mot').hidden = true;
    $('#final').hidden = false;
  }, 1600);
}

/* ?ouvert : ouvre le paquet tout de suite, pour revoir les roses.
   C'est la boucle qui fixera l'instant de départ, sur sa propre horloge. */
if (/[?&]ouvert/.test(location.search)) {
  noeud = 1; ouvT = 1; etat = POUSSE; debutPousse = null;
  $('#consigne').hidden = true;
}
/* ?fleuri : roses déjà écloses dès la première image (contrôle du rendu) */
if (/[?&]fleuri/.test(location.search)) {
  noeud = 1; ouvT = 1; etat = POUSSE; debutPousse = -1e6;
  $('#consigne').hidden = true;
}

$('#rejouer').addEventListener('click', () => {
  $('#final').hidden = true;
  etat = FERME; noeud = 0; ouvT = 0; debutPousse = null;
  fleurs.forEach(f => { f.t = 0; f.depart = null; f.lue = false; f.halo = 0; f.ex = undefined; });
  $('#consigne').hidden = false;
  $('#consigne').classList.remove('parti');
});
