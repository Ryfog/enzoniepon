/* =========================================================
   LA BOÎTE À MUSIQUE
   On la remonte à la manivelle, elle joue, puis elle ralentit
   et s'éteint. Le son est fabriqué à la volée : aucun fichier
   audio, aucune mélodie empruntée — la phrase est composée ici.
   ========================================================= */
const $ = s => document.querySelector(s);
const cv = $('#scene'), g = cv.getContext('2d');

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
  ech = Math.min(L, H) / SC * 0.92;
}
taille(); addEventListener('resize', taille);
const px = x => L / 2 + x * ech;
const py = y => H / 2 + y * ech;
const pe = v => v * ech;

/* =========================================================
   LA MÉLODIE — composée pour l'occasion, gamme pentatonique
   Valeurs en demi-tons au-dessus du do central.
   ========================================================= */
const AIR = [
  7, 4, 2, 4, 7, 9, 7, 4,
  0, 2, 4, 7, 4, 2, 0, 2,
  4, 7, 9, 12, 9, 7, 4, 2,
  0, 4, 7, 4, 2, 0, -3, 0
];
const BASSE = [0, 7, 9, 7];
const DO5 = 72;
const freq = midi => 440 * Math.pow(2, (midi - 69) / 12);

/* =========================================================
   LES PHRASES
   ========================================================= */
const PHRASES = [
  'Il y a des choses qu\'on ne sait pas dire, alors on les fait jouer.',
  'Cette mélodie n\'existait pas avant toi. Je l\'ai écrite pour cette boîte.',
  'Elle ralentit quand on l\'oublie. Comme à peu près tout.',
  'C\'est pour ça qu\'il faut la remonter. Souvent.',
  'Tu remarqueras qu\'elle ne joue jamais tout à fait pareil.',
  'Nous non plus, d\'ailleurs. Et c\'est très bien.',
  'Garde-la. Elle ne s\'use pas.',
  'Et quand tu n\'auras plus la force de tourner, appelle-moi.'
];

/* =========================================================
   ÉTAT
   ========================================================= */
let tension = 0;            // 0 vide, 1 remontée à fond
let rotation = 0;           // avancement dans l'air, en pas
let notesJouees = 0;
let phraseIdx = -1;
let notes = [];             // notes qui s'envolent
let temps = 0, fini = false;

/* =========================================================
   SON
   ========================================================= */
let ctx = null, maitre = null;
function ouvreSon() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  maitre = ctx.createGain();
  maitre.gain.value = .22;
  /* un peu de rondeur, pour que ça ne pique pas */
  const filtre = ctx.createBiquadFilter();
  filtre.type = 'lowpass'; filtre.frequency.value = 5200;
  maitre.connect(filtre); filtre.connect(ctx.destination);
}

/* une lame de peigne : attaque sèche, longue résonance */
function lame(f, dur, vol) {
  if (!ctx) return;
  const t = ctx.currentTime;
  [[1, vol, 'triangle'], [2.01, vol * .3, 'sine'], [3.02, vol * .12, 'sine']]
    .forEach(([mult, v, forme]) => {
      const o = ctx.createOscillator(), gg = ctx.createGain();
      o.type = forme; o.frequency.value = f * mult;
      gg.gain.setValueAtTime(0, t);
      gg.gain.linearRampToValueAtTime(v, t + .004);
      gg.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(gg); gg.connect(maitre);
      o.start(t); o.stop(t + dur + .05);
    });
}

/* =========================================================
   DESSIN
   ========================================================= */
function fond() {
  const f = g.createRadialGradient(L / 2, H * .42, 10, L / 2, H * .5, Math.max(L, H) * .8);
  f.addColorStop(0, '#33223f');
  f.addColorStop(.5, '#241733');
  f.addColorStop(1, '#120c1c');
  g.fillStyle = f; g.fillRect(0, 0, L, H);

  /* halo qui pulse avec la musique */
  if (tension > .02) {
    const h = g.createRadialGradient(L / 2, py(-40), 10, L / 2, py(-40), pe(460));
    h.addColorStop(0, `rgba(255,214,150,${.13 * tension})`);
    h.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = h; g.fillRect(0, 0, L, H);
  }
}

const BX = -30, BY = 140;            // centre de la boîte
const BW = 330, BH = 150, BD = 70;

function coffret() {
  /* ombre */
  g.fillStyle = 'rgba(0,0,0,.45)';
  g.beginPath();
  g.ellipse(px(BX), py(BY + BH / 2 + 14), pe(BW * .62), pe(22), 0, 0, TAU);
  g.fill();

  /* couvercle relevé, charnière sur l'arête arrière */
  g.save();
  g.translate(px(BX - BW / 2 + BD * .5), py(BY - BH / 2 - BD * .5));
  g.rotate(-1.12);
  const ep = 22, lg = BW;
  /* tranche du couvercle, vue de dessous */
  g.fillStyle = '#3f2818';
  g.fillRect(0, 0, pe(lg), pe(ep));
  /* doublure claire, l'intérieur du couvercle */
  const dl = g.createLinearGradient(0, 0, 0, pe(ep));
  dl.addColorStop(0, '#d8b489'); dl.addColorStop(1, '#a8825c');
  g.fillStyle = dl;
  g.fillRect(pe(8), pe(3), pe(lg - 16), pe(ep - 6));
  /* dessus du couvercle, en biais pour la profondeur */
  const cl = g.createLinearGradient(0, -pe(BD * .5), pe(lg), 0);
  cl.addColorStop(0, '#7d5335'); cl.addColorStop(.5, '#9a6a42'); cl.addColorStop(1, '#5a3a26');
  g.fillStyle = cl;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(pe(BD * .45), -pe(BD * .42));
  g.lineTo(pe(lg + BD * .45), -pe(BD * .42));
  g.lineTo(pe(lg), 0);
  g.closePath(); g.fill();
  /* filet de laiton sur le couvercle */
  g.strokeStyle = '#c99b50'; g.lineWidth = pe(2);
  g.strokeRect(pe(14), pe(6), pe(lg - 28), pe(ep - 12));
  g.restore();

  /* intérieur */
  g.fillStyle = '#241610';
  g.beginPath();
  g.moveTo(px(BX - BW / 2), py(BY - BH / 2));
  g.lineTo(px(BX - BW / 2 + BD * .5), py(BY - BH / 2 - BD * .5));
  g.lineTo(px(BX + BW / 2 + BD * .5), py(BY - BH / 2 - BD * .5));
  g.lineTo(px(BX + BW / 2), py(BY - BH / 2));
  g.closePath(); g.fill();

  cylindre();

  /* face avant */
  const fa = g.createLinearGradient(px(BX - BW / 2), 0, px(BX + BW / 2), 0);
  fa.addColorStop(0, '#5c3b26'); fa.addColorStop(.42, '#835836'); fa.addColorStop(1, '#4a2f1e');
  g.fillStyle = fa;
  g.fillRect(px(BX - BW / 2), py(BY - BH / 2), pe(BW), pe(BH));

  /* veines du bois */
  g.globalAlpha = .10;
  for (let i = 6; i < BH; i += 13) {
    g.strokeStyle = i % 26 ? '#000' : '#fff';
    g.lineWidth = pe(1.4);
    g.beginPath();
    g.moveTo(px(BX - BW / 2), py(BY - BH / 2 + i));
    g.bezierCurveTo(px(BX - BW / 6), py(BY - BH / 2 + i + 5),
      px(BX + BW / 6), py(BY - BH / 2 + i - 5),
      px(BX + BW / 2), py(BY - BH / 2 + i));
    g.stroke();
  }
  g.globalAlpha = 1;

  /* côté droit */
  g.fillStyle = '#3d2718';
  g.beginPath();
  g.moveTo(px(BX + BW / 2), py(BY - BH / 2));
  g.lineTo(px(BX + BW / 2 + BD * .5), py(BY - BH / 2 - BD * .5));
  g.lineTo(px(BX + BW / 2 + BD * .5), py(BY + BH / 2 - BD * .5));
  g.lineTo(px(BX + BW / 2), py(BY + BH / 2));
  g.closePath(); g.fill();

  /* filets de laiton */
  g.strokeStyle = '#c99b50'; g.lineWidth = pe(2.5);
  g.strokeRect(px(BX - BW / 2 + 9), py(BY - BH / 2 + 9), pe(BW - 18), pe(BH - 18));
}

/* le cylindre à picots, il tourne quand ça joue */
function cylindre() {
  const cx = BX, cy = BY - BH / 2 - 16, r = 30, w = 200;
  g.save();
  g.translate(px(cx), py(cy));

  g.fillStyle = '#8a6a3a';
  g.fillRect(-pe(w / 2), -pe(r * .5), pe(w), pe(r));
  const bout = g.createLinearGradient(0, -pe(r * .5), 0, pe(r * .5));
  bout.addColorStop(0, '#d8ab5e'); bout.addColorStop(1, '#7a5a2c');
  g.fillStyle = bout;
  g.beginPath(); g.ellipse(-pe(w / 2), 0, pe(r * .22), pe(r * .5), 0, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(pe(w / 2), 0, pe(r * .22), pe(r * .5), 0, 0, TAU); g.fill();

  /* les picots défilent avec la rotation */
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU + rotation * .22;
    const s = Math.sin(a);
    if (s < 0) continue;                       // ceux de l'autre face sont cachés
    const x = -w / 2 + 12 + (i * 7.2) % (w - 24);
    g.globalAlpha = .35 + s * .65;
    g.fillStyle = '#f0d9a0';
    g.beginPath();
    g.arc(pe(x), -pe(r * .5) * s * .8, pe(2.6), 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;
  g.restore();
}

/* deux oiseaux qui tournent sur le couvercle */
function oiseaux() {
  const cx = BX + 20, cy = BY - BH / 2 - 96, R = 62;
  for (let i = 0; i < 2; i++) {
    const a = rotation * .5 + i * Math.PI;
    const x = cx + Math.cos(a) * R;
    const prof = (Math.sin(a) + 1) / 2;          // 0 derrière, 1 devant
    const y = cy - Math.sin(a) * 16;
    const s = .7 + prof * .5;
    g.save();
    g.translate(px(x), py(y));
    g.scale(s * (Math.cos(a) < 0 ? -1 : 1), s);
    g.globalAlpha = .45 + prof * .55;
    g.fillStyle = i ? '#e8c07d' : '#d9a45c';
    /* corps */
    g.beginPath();
    g.ellipse(0, 0, pe(17), pe(11), -.18, 0, TAU);
    g.fill();
    /* queue en éventail */
    g.beginPath();
    g.moveTo(-pe(13), -pe(2));
    g.lineTo(-pe(32), -pe(11));
    g.lineTo(-pe(30), pe(1));
    g.lineTo(-pe(31), pe(8));
    g.closePath(); g.fill();
    /* tête */
    g.beginPath(); g.arc(pe(15), -pe(9), pe(7.4), 0, TAU); g.fill();
    /* bec */
    g.fillStyle = '#c9803a';
    g.beginPath();
    g.moveTo(pe(21), -pe(10));
    g.lineTo(pe(30), -pe(8));
    g.lineTo(pe(21), -pe(6));
    g.closePath(); g.fill();
    /* œil */
    g.fillStyle = '#2b1a10';
    g.beginPath(); g.arc(pe(17), -pe(11), pe(1.7), 0, TAU); g.fill();
    /* aile qui bat au rythme */
    const bat = Math.sin(temps * 7 + i) * .55;
    g.save();
    g.translate(-pe(1), -pe(3));
    g.rotate(bat * .55);
    g.fillStyle = i ? '#fbeede' : '#f3d9a8';
    g.beginPath();
    g.ellipse(-pe(2), -pe(4), pe(14), pe(6.5), -.55, 0, TAU);
    g.fill();
    g.restore();
    g.restore();
  }
  g.globalAlpha = 1;
}

/* la manivelle, sur le flanc droit */
const MX = BX + BW / 2 + 74, MY = BY + 6;
function manivelle() {
  const a = -rotation * .8;
  g.save();
  g.translate(px(MX), py(MY));

  /* axe : il part vraiment du flanc du coffret */
  g.strokeStyle = '#8a6a3a'; g.lineWidth = pe(8); g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-pe(MX - (BX + BW / 2 + BD * .5) + 6), 0); g.lineTo(0, 0);
  g.stroke();
  /* embase contre le bois */
  g.fillStyle = '#c99b50';
  g.beginPath();
  g.ellipse(-pe(MX - (BX + BW / 2 + BD * .5) + 4), 0, pe(5), pe(9), 0, 0, TAU);
  g.fill();

  g.rotate(a);
  /* bras */
  g.strokeStyle = '#c99b50'; g.lineWidth = pe(9);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -pe(40)); g.stroke();
  /* poignée */
  const p = g.createRadialGradient(-pe(3), -pe(46), pe(1), 0, -pe(44), pe(13));
  p.addColorStop(0, '#f3d9a8'); p.addColorStop(1, '#9a7434');
  g.fillStyle = p;
  g.beginPath(); g.arc(0, -pe(44), pe(12), 0, TAU); g.fill();
  g.restore();

  /* jauge de tension autour de l'axe */
  g.strokeStyle = 'rgba(243,217,168,.18)'; g.lineWidth = pe(4);
  g.beginPath(); g.arc(px(MX), py(MY), pe(58), 0, TAU); g.stroke();
  if (tension > 0) {
    g.strokeStyle = '#e8c07d'; g.lineWidth = pe(4); g.lineCap = 'round';
    g.beginPath();
    g.arc(px(MX), py(MY), pe(58), -Math.PI / 2, -Math.PI / 2 + TAU * tension);
    g.stroke();
  }
}

/* les notes qui s'échappent */
function majNotes(dt) {
  notes = notes.filter(n => n.v > 0);
  notes.forEach(n => {
    n.y -= n.vy; n.x += Math.sin(n.p + temps * 1.4) * .5;
    n.v -= dt * .32; n.p += .02;
  });
}
function dessineNotes() {
  notes.forEach(n => {
    g.save();
    g.globalAlpha = serre(n.v) * .9;
    g.fillStyle = n.c;
    g.font = `${pe(n.t)}px 'Cormorant Garamond', serif`;
    g.textAlign = 'center';
    g.fillText(n.g, px(n.x), py(n.y));
    g.restore();
  });
}

/* =========================================================
   BOUCLE
   ========================================================= */
const GLYPHES = ['♪', '♫', '♩', '♬'];
const COUL = ['#f3d9a8', '#e8c07d', '#d9a45c', '#fbeede'];

let dernier = 0, pasPrec = 0;
function image(ts) {
  requestAnimationFrame(image);
  const dt = Math.min(50, ts - dernier) / 1000;
  dernier = ts; temps = ts / 1000;

  /* la boîte se dévide : plus il reste de tension, plus elle joue vite */
  if (tension > 0) {
    const vitesse = 2.2 + tension * 5.4;          // pas par seconde
    rotation += vitesse * dt;
    tension = Math.max(0, tension - dt * .052);

    const pas = Math.floor(rotation);
    if (pas !== pasPrec) {
      pasPrec = pas;
      joueLePas(pas);
    }
  }

  majNotes(dt);

  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, L, H);
  fond();
  oiseaux();
  coffret();
  manivelle();
  dessineNotes();
}
requestAnimationFrame(image);

function joueLePas(pas) {
  const i = ((pas % AIR.length) + AIR.length) % AIR.length;
  const f = freq(DO5 + AIR[i]);
  lame(f, 1.9 + Math.random() * .5, .32);
  if (i % 8 === 0) {
    lame(freq(48 + BASSE[(Math.floor(i / 8)) % BASSE.length]), 2.8, .20);
  }

  /* une note s'envole */
  notes.push({
    x: BX + (Math.random() - .5) * 120,
    y: BY - BH / 2 - 30,
    vy: .55 + Math.random() * .5,
    v: 1, p: Math.random() * TAU,
    t: 20 + Math.random() * 16,
    g: GLYPHES[Math.floor(Math.random() * GLYPHES.length)],
    c: COUL[Math.floor(Math.random() * COUL.length)]
  });

  notesJouees++;
  if (notesJouees % 8 === 1) montrePhrase();
}

/* =========================================================
   LES PHRASES
   ========================================================= */
let cachePhrase = null;
function montrePhrase() {
  if (phraseIdx >= PHRASES.length - 1) { verifieFin(); return; }
  phraseIdx++;
  const b = $('#phrase');
  $('#phrase-num').textContent = `${phraseIdx + 1} / ${PHRASES.length}`;
  $('#phrase-txt').textContent = PHRASES[phraseIdx];
  b.hidden = false;
  b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(cachePhrase);
  cachePhrase = setTimeout(() => { b.hidden = true; }, 9000);
  if (phraseIdx === PHRASES.length - 1) setTimeout(verifieFin, 9000);
}
function verifieFin() {
  if (fini || phraseIdx < PHRASES.length - 1) return;
  fini = true;
  $('#phrase').hidden = true;
  $('#final').hidden = false;
}

/* =========================================================
   TOURNER LA MANIVELLE
   ========================================================= */
let tourne = false, angPrec = 0;

const surManivelle = (x, y) =>
  Math.hypot(x - px(MX), y - py(MY)) < pe(90);

cv.addEventListener('pointerdown', e => {
  if (fini || !surManivelle(e.clientX, e.clientY)) return;
  ouvreSon();
  tourne = true;
  angPrec = Math.atan2(e.clientY - py(MY), e.clientX - px(MX));
  cv.classList.add('tourne');
  cv.setPointerCapture(e.pointerId);
  $('#consigne').classList.add('parti');
  setTimeout(() => { $('#consigne').hidden = true; }, 900);
});

cv.addEventListener('pointermove', e => {
  if (!tourne) return;
  const a = Math.atan2(e.clientY - py(MY), e.clientX - px(MX));
  let d = a - angPrec;
  /* on recolle le saut de −π à +π */
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  angPrec = a;
  /* seul le sens horaire remonte le ressort */
  if (d > 0) tension = serre(tension + d / TAU * .34);
});

addEventListener('pointerup', () => {
  tourne = false; cv.classList.remove('tourne');
});

/* ?joue : démarre la boîte remontée, pour revoir la scène */
if (/[?&]joue/.test(location.search)) {
  tension = 1;
  $('#consigne').hidden = true;
}

$('#rejouer').addEventListener('click', () => {
  $('#final').hidden = true;
  tension = 0; rotation = 0; pasPrec = 0;
  notesJouees = 0; phraseIdx = -1; notes = []; fini = false;
  $('#consigne').hidden = false;
  $('#consigne').classList.remove('parti');
});
