/* =========================================================
   LES LANTERNES
   Neuf lanternes posées au sol. On les allume une par une,
   elles s'emplissent d'air chaud et montent. Chacune porte un
   vœu. Quand elles sont toutes en haut, elles se rassemblent.
   Tout est dessiné : le ciel, les collines, la flamme, le papier.
   ========================================================= */
const $ = s => document.querySelector(s);
const cv = $('#ciel'), g = cv.getContext('2d');

const TAU = Math.PI * 2;
const serre = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sortie = t => 1 - Math.pow(1 - t, 3);

/* ---------- scène virtuelle ---------- */
const SC = 900;
let L = 0, H = 0, ech = 1, dpr = 1;
function taille() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  L = innerWidth; H = innerHeight;
  cv.width = L * dpr; cv.height = H * dpr;
  ech = Math.min(L, H) / SC;
}
taille(); addEventListener('resize', taille);
const px = x => L / 2 + x * ech;
const py = y => H / 2 + y * ech;
const pe = v => v * ech;

/* =========================================================
   LES VŒUX
   ========================================================= */
const VOEUX = [
  'Que tu dormes bien, pour une fois.',
  'Que tes journées soient plus douces que tu ne les crains.',
  'Que quelqu\'un te dise merci aujourd\'hui, même si ce n\'est pas moi.',
  'Que tu arrêtes de croire que tu déranges.',
  'Que tu te trouves belle un matin, sans que j\'aie besoin de le dire.',
  'Que la distance devienne une anecdote qu\'on raconte.',
  'Que tu aies moins peur, et plus souvent envie.',
  'Que tu saches, sans le demander, que tu comptes.',
  'Et que tu reviennes, tout simplement.'
];

/* =========================================================
   ÉTAT
   ========================================================= */
const N = VOEUX.length;
const SOL = 260;                 // hauteur du sol dans la scène

const lanternes = Array.from({ length: N }, (_, i) => {
  const col = i % 5, rang = Math.floor(i / 5);
  return {
    i,
    x: -260 + col * 130 + rang * 62 + (Math.random() - .5) * 16,
    y: SOL - rang * 34,
    x0: 0, y0: 0,
    vy: 0, allumee: false, feu: 0, mont: 0,
    sway: Math.random() * TAU,
    teinte: Math.random() * .18,
    rassemble: 0, cx: 0, cy: 0
  };
});
lanternes.forEach(l => { l.x0 = l.x; l.y0 = l.y; });

let allumees = 0, voeuIdx = -1, fini = false, rassemblement = 0;
let temps = 0, souris = { x: 0, y: 0, actif: false };

/* étoiles du fond */
const etoiles = Array.from({ length: 150 }, () => ({
  x: (Math.random() - .5) * SC * 1.6,
  y: -SC * .55 + Math.random() * SC * .82,
  r: .5 + Math.random() * 1.5,
  s: Math.random() * TAU,
  v: .4 + Math.random() * 1.2
}));

/* braises qui s'échappent des lanternes */
let braises = [];

/* =========================================================
   DÉCOR
   ========================================================= */
function ciel() {
  const f = g.createLinearGradient(0, 0, 0, H);
  f.addColorStop(0, '#070c1c');
  f.addColorStop(.42, '#121b38');
  f.addColorStop(.78, '#22304f');
  f.addColorStop(1, '#31405c');
  g.fillStyle = f; g.fillRect(0, 0, L, H);

  /* lueur chaude au ras du sol, elle grandit avec les lanternes */
  const chaud = allumees / N;
  const h = g.createRadialGradient(L / 2, py(SOL), 10, L / 2, py(SOL), pe(700));
  h.addColorStop(0, `rgba(255,170,90,${.05 + .13 * chaud})`);
  h.addColorStop(1, 'rgba(255,170,90,0)');
  g.fillStyle = h; g.fillRect(0, 0, L, H);

  etoiles.forEach(e => {
    const sc = .5 + .5 * Math.sin(temps * e.v + e.s);
    g.globalAlpha = .18 + sc * .6;
    g.fillStyle = '#eaf1ff';
    g.beginPath(); g.arc(px(e.x), py(e.y), pe(e.r), 0, TAU); g.fill();
  });
  g.globalAlpha = 1;
}

/* collines en silhouette, deux plans */
function collines() {
  const plans = [
    { y: SOL - 96, amp: 44, pas: 210, c: '#0d1526', dec: .0 },
    { y: SOL - 44, amp: 30, pas: 150, c: '#070c17', dec: .0 }
  ];
  plans.forEach(p => {
    g.fillStyle = p.c;
    g.beginPath();
    g.moveTo(0, H);
    for (let x = -20; x <= L + 20; x += 12) {
      const t = (x / ech) / p.pas;
      const y = py(p.y + Math.sin(t) * p.amp + Math.sin(t * 2.4) * p.amp * .38);
      g.lineTo(x, y);
    }
    g.lineTo(L, H); g.closePath(); g.fill();
  });

  /* quelques arbres nus sur la crête */
  g.strokeStyle = '#050912'; g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const x = -420 + i * 108 + ((i * 37) % 40);
    const base = SOL - 52 + Math.sin(i * 1.7) * 8;
    const ht = 42 + (i * 23) % 34;
    g.lineWidth = pe(3.4);
    g.beginPath(); g.moveTo(px(x), py(base)); g.lineTo(px(x), py(base - ht)); g.stroke();
    g.lineWidth = pe(2);
    for (let b = 0; b < 4; b++) {
      const yb = base - ht * (.45 + b * .16);
      const s = b % 2 ? 1 : -1;
      g.beginPath();
      g.moveTo(px(x), py(yb));
      g.lineTo(px(x + s * (13 - b * 2)), py(yb - 13 + b * 2));
      g.stroke();
    }
  }

  /* sol */
  g.fillStyle = '#040810';
  g.fillRect(0, py(SOL + 4), L, H);
}

/* =========================================================
   UNE LANTERNE
   ========================================================= */
function lanterne(l) {
  const mont = l.mont;
  /* elle rétrécit en s'éloignant */
  const s = 1 - serre(mont / 1400) * .62;
  const x = l.x + Math.sin(temps * .5 + l.sway) * (10 + mont * .02);
  const y = l.y;
  const X = px(x), Y = py(y), S = pe(s);

  const vif = l.allumee ? .55 + .45 * (0.75 + .25 * Math.sin(temps * 9 + l.sway)) : 0;

  /* halo */
  if (vif > 0) {
    const R = pe(96 * s);
    const h = g.createRadialGradient(X, Y, 0, X, Y, R);
    h.addColorStop(0, `rgba(255,190,110,${.34 * vif})`);
    h.addColorStop(.4, `rgba(255,150,70,${.14 * vif})`);
    h.addColorStop(1, 'rgba(255,150,70,0)');
    g.fillStyle = h;
    g.beginPath(); g.arc(X, Y, R, 0, TAU); g.fill();
  }

  g.save();
  g.translate(X, Y);
  g.scale(S / ech * ech, S / ech * ech);   /* échelle déjà dans S */

  const w = 40 * s, ht = 52 * s;

  /* le papier : plus chaud et plus lumineux quand c'est allumé */
  const pap = g.createLinearGradient(0, pe(-ht * .5), 0, pe(ht * .5));
  if (l.allumee) {
    pap.addColorStop(0, `hsl(${34 + l.teinte * 20}, 92%, ${62 + vif * 12}%)`);
    pap.addColorStop(.55, `hsl(${26 + l.teinte * 20}, 95%, ${52 + vif * 10}%)`);
    pap.addColorStop(1, `hsl(${18 + l.teinte * 20}, 88%, ${40 + vif * 8}%)`);
  } else {
    pap.addColorStop(0, '#3a4358');
    pap.addColorStop(1, '#232b3d');
  }
  g.fillStyle = pap;
  /* forme de lanterne : renflée au milieu, resserrée en bas */
  g.beginPath();
  g.moveTo(pe(-w * .34), pe(-ht * .5));
  g.bezierCurveTo(pe(-w * .62), pe(-ht * .18), pe(-w * .58), pe(ht * .22), pe(-w * .3), pe(ht * .46));
  g.lineTo(pe(w * .3), pe(ht * .46));
  g.bezierCurveTo(pe(w * .58), pe(ht * .22), pe(w * .62), pe(-ht * .18), pe(w * .34), pe(-ht * .5));
  g.closePath();
  g.fill();

  /* nervures du papier */
  g.strokeStyle = l.allumee ? 'rgba(120,55,10,.30)' : 'rgba(0,0,0,.28)';
  g.lineWidth = Math.max(1, pe(1.1));
  for (const k of [-.2, .2]) {
    g.beginPath();
    g.moveTo(pe(w * k * .8), pe(-ht * .48));
    g.quadraticCurveTo(pe(w * k * 1.5), 0, pe(w * k * .8), pe(ht * .44));
    g.stroke();
  }

  /* cerceau du haut et du bas */
  g.strokeStyle = l.allumee ? '#8a4a18' : '#1a2130';
  g.lineWidth = Math.max(1, pe(2));
  g.beginPath(); g.moveTo(pe(-w * .34), pe(-ht * .5)); g.lineTo(pe(w * .34), pe(-ht * .5)); g.stroke();
  g.beginPath(); g.moveTo(pe(-w * .3), pe(ht * .46)); g.lineTo(pe(w * .3), pe(ht * .46)); g.stroke();

  /* la flamme */
  if (l.allumee) {
    const fh = (7 + Math.sin(temps * 11 + l.sway) * 2.2) * s;
    const fg = g.createRadialGradient(0, pe(ht * .3), 0, 0, pe(ht * .3), pe(fh * 2));
    fg.addColorStop(0, 'rgba(255,246,214,.95)');
    fg.addColorStop(.5, 'rgba(255,186,80,.7)');
    fg.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = fg;
    g.beginPath(); g.arc(0, pe(ht * .3), pe(fh * 2), 0, TAU); g.fill();
    g.fillStyle = '#fff6d6';
    g.beginPath();
    g.moveTo(0, pe(ht * .3 - fh));
    g.quadraticCurveTo(pe(fh * .6), pe(ht * .3), 0, pe(ht * .3 + fh * .5));
    g.quadraticCurveTo(pe(-fh * .6), pe(ht * .3), 0, pe(ht * .3 - fh));
    g.fill();
  }
  g.restore();

  l.ex = X; l.ey = Y; l.er = pe(34 * s);
}

/* =========================================================
   BRAISES
   ========================================================= */
function braise(x, y) {
  braises.push({
    x, y, vx: (Math.random() - .5) * .6, vy: -.5 - Math.random() * .9,
    v: 1, r: .8 + Math.random() * 1.6
  });
}
function majBraises(dt) {
  if (braises.length > 200) braises.splice(0, braises.length - 200);
  braises = braises.filter(b => b.v > 0);
  braises.forEach(b => {
    b.x += b.vx + Math.sin(temps + b.y * .01) * .18;
    b.y += b.vy; b.v -= dt * .5;
  });
}
function dessineBraises() {
  braises.forEach(b => {
    g.globalAlpha = serre(b.v) * .8;
    g.fillStyle = `hsl(${28 + b.v * 22}, 96%, ${58 + b.v * 16}%)`;
    g.beginPath(); g.arc(px(b.x), py(b.y), pe(b.r), 0, TAU); g.fill();
  });
  g.globalAlpha = 1;
}

/* =========================================================
   BOUCLE
   ========================================================= */
let dernier = 0;
function image(ts) {
  requestAnimationFrame(image);
  const dt = Math.min(50, ts - dernier) / 1000;
  dernier = ts; temps = ts / 1000;

  lanternes.forEach(l => {
    if (!l.allumee) return;

    /* elle s'emplit d'abord, puis décolle */
    l.feu = Math.min(1, l.feu + dt * 1.5);
    if (l.feu >= 1) {
      l.vy = Math.min(46, l.vy + dt * 16);
      l.y -= l.vy * dt;
      l.mont += l.vy * dt;
    }

    /* le curseur pousse un peu l'air autour d'elle */
    if (souris.actif) {
      const d = Math.hypot(px(l.x) - souris.x, py(l.y) - souris.y);
      if (d < pe(160) && d > 1) {
        l.x += ((px(l.x) - souris.x) / d) * (1 - d / pe(160)) * 34 * dt;
      }
    }

    if (Math.random() < .18) braise(l.x + (Math.random() - .5) * 14, l.y + 16);

    /* rassemblement final */
    if (rassemblement > 0) {
      l.rassemble = Math.min(1, l.rassemble + dt * .35);
      const k = sortie(l.rassemble);
      l.x += (l.cx - l.x) * k * dt * 2.2;
      l.y += (l.cy - l.y) * k * dt * 2.2;
    }
  });

  majBraises(dt);

  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, L, H);
  ciel();
  /* les plus hautes derrière */
  [...lanternes].sort((a, b) => a.y - b.y).forEach(l => { if (l.y < SOL - 120) lanterne(l); });
  collines();
  [...lanternes].sort((a, b) => a.y - b.y).forEach(l => { if (l.y >= SOL - 120) lanterne(l); });
  dessineBraises();
}
requestAnimationFrame(image);

/* =========================================================
   ALLUMER
   ========================================================= */
cv.addEventListener('pointerdown', e => {
  souris.x = e.clientX; souris.y = e.clientY; souris.actif = true;
  if (fini) return;
  for (const l of lanternes) {
    if (l.allumee || l.ex === undefined) continue;
    if (Math.hypot(e.clientX - l.ex, e.clientY - l.ey) > l.er * 1.5) continue;
    allume(l);
    return;
  }
});
cv.addEventListener('pointermove', e => { souris.x = e.clientX; souris.y = e.clientY; souris.actif = true; });
addEventListener('pointerup', () => { souris.actif = false; });
cv.addEventListener('pointerleave', () => { souris.actif = false; });

function allume(l) {
  l.allumee = true;
  allumees++;
  for (let k = 0; k < 18; k++) braise(l.x + (Math.random() - .5) * 20, l.y + 14);

  $('#consigne').classList.add('parti');
  setTimeout(() => { $('#consigne').hidden = true; }, 900);

  const c = $('#compte');
  c.hidden = false;
  c.textContent = `${allumees} / ${N}`;

  montreVoeu(l.i);
  if (allumees === N) setTimeout(rassemble, 4200);
}

let cacheVoeu = null;
function montreVoeu(i) {
  voeuIdx = i;
  const b = $('#voeu');
  $('#voeu-txt').textContent = VOEUX[i];
  b.hidden = false;
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(cacheVoeu);
  cacheVoeu = setTimeout(() => { b.hidden = true; }, 6500);
}

/* elles se rangent en cœur, puis le mot de la fin */
function rassemble() {
  rassemblement = 1;
  lanternes.forEach((l, i) => {
    const t = (i / N) * TAU;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    l.cx = hx * 11;
    l.cy = -hy * 11 - 170;
  });
  setTimeout(() => {
    fini = true;
    $('#voeu').hidden = true;
    $('#compte').hidden = true;
    $('#final').hidden = false;
  }, 5200);
}

/* ?toutes : tout allumer d'un coup, pour revoir la scène */
if (/[?&]toutes/.test(location.search)) {
  lanternes.forEach((l, i) => {
    l.allumee = true; l.feu = 1;
    l.y = SOL - 160 - i * 62;
    l.mont = 200 + i * 60;
    l.vy = 30;
  });
  allumees = N;
  $('#consigne').hidden = true;
}

$('#rejouer').addEventListener('click', () => {
  $('#final').hidden = true;
  lanternes.forEach(l => {
    l.x = l.x0; l.y = l.y0; l.vy = 0;
    l.allumee = false; l.feu = 0; l.mont = 0; l.rassemble = 0;
  });
  allumees = 0; voeuIdx = -1; fini = false; rassemblement = 0; braises = [];
  $('#compte').hidden = true;
  $('#consigne').hidden = false;
  $('#consigne').classList.remove('parti');
});
