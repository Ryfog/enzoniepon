/* =========================================================
   EN GARDE — duel d'escrime à choix simultanés
   ---------------------------------------------------------
   Tour par tour : chacun choisit en secret, puis les deux
   actions se résolvent ensemble. Rien n'est chronométré au
   millième, donc la latence n'a aucune prise sur le jeu.
   L'hôte fait autorité et n'envoie JAMAIS le choix de l'un
   à l'autre avant la résolution.
   ========================================================= */
'use strict';

const $ = s => document.querySelector(s);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const PREFIXE = 'engarde-es-';

/* ============ RÈGLES ============ */
const PISTE = 15;                 /* cases 0 à 14 */
const DEPART = { h: 4, g: 10 };
const ENDUR_MAX = 8, ENDUR_DEP = 5;
const PORTEE = 2;                 /* les lames ne portent qu'à deux pas */
const VICTOIRE = 5;
const TOUR_MS = 22000;

const ACTIONS = {
  av: { nom: 'Avancer', t: 'un pas', cout: -1, fam: 'mv', pas: 1 },
  re: { nom: 'Rompre',  t: 'un pas en arrière', cout: -1, fam: 'mv', pas: -1 },
  bo: { nom: 'Bond',    t: 'deux pas', cout: 2, fam: 'mv', pas: 2 },
  fe: { nom: 'Fente',   t: 'attaque', cout: 3, fam: 'at', pas: 0 },
  pa: { nom: 'Parade',  t: 'arrête la fente', cout: 1, fam: 'df', pas: 0 },
  fi: { nom: 'Feinte',  t: 'passe la parade', cout: 1, fam: 'fi', pas: 0 }
};
const ORDRE_BTN = ['av', 're', 'bo', 'fe', 'pa', 'fi'];
const abordable = (k, e) => e >= ACTIONS[k].cout;

/* ============ ÉTAT ============ */
let peer = null, conn = null, hote = false, moi = 'h', autre = 'g', solo = false;
let st = null, codeSalon = '', monChoix = null;
let boucleRetour = null, essais = 0, garde = null, chronos = [];
let animT0 = 0;                    /* départ local de l'animation de résolution */

const neuf = () => ({
  demarree: false, ph: 'attente', tour: 1,
  pos: { ...DEPART }, end: { h: ENDUR_DEP, g: ENDUR_DEP },
  sc: { h: 0, g: 0 }, nm: { h: '', g: '' },
  choix: { h: null, g: null }, res: null, fin: null, t0: 0
});

const dist = () => Math.abs(st.pos.h - st.pos.g);
const sens = r => (st.pos.h <= st.pos.g ? (r === 'h' ? 1 : -1) : (r === 'h' ? -1 : 1));

/* ============ RÉSEAU ============ */
function envoie(m) { if (conn && conn.open) conn.send(m); }

/* on masque le choix de chacun tant que le tour n'est pas résolu */
function etatPublic() {
  const p = JSON.parse(JSON.stringify(st));
  if (p.ph === 'choix') p.choix = { h: st.choix.h ? 1 : 0, g: st.choix.g ? 1 : 0 };
  return p;
}
function diffuse() { envoie({ t: 'S', st: etatPublic() }); rendu(); }

function brancher(c) {
  if (conn && conn !== c) { conn.remplacee = true; try { conn.close(); } catch (e) {} }
  conn = c;
  c.on('data', recois);
  c.on('close', () => { if (!c.remplacee) { toast('Connexion perdue — on rattrape…'); relance(); } });
  c.on('error', () => { if (!c.remplacee) relance(); });
}

function recois(m) {
  switch (m.t) {
    case 'S': {
      const avant = st ? st.ph : '';
      st = m.st;
      if (st.ph === 'resolution' && avant !== 'resolution') animT0 = performance.now();
      if (st.ph === 'choix' && avant !== 'choix') monChoix = null;
      rendu();
      break;
    }
    case 'A': if (hote) choisit(autre, m.a); break;
    case 'KA': break;
    case 'HELLO':
      st.nm[autre] = m.nom || 'L\'adversaire';
      envoie({ t: 'WELCOME', nom: st.nm[moi] });
      if (!st.demarree) { ecran('e-attente'); majVestiaire(); }
      diffuse();
      break;
    case 'WELCOME':
      st.nm[autre] = m.nom || 'L\'adversaire';
      if (!st.demarree) { ecran('e-attente'); majVestiaire(); }
      break;
    case 'PING': envoie({ t: 'PONG' }); break;
  }
}

function surveille() {
  clearInterval(garde);
  garde = setInterval(() => { if (conn && conn.open) envoie({ t: 'KA' }); else relance(); }, 10000);
}
function relance() {
  if (hote || !codeSalon || boucleRetour) return;
  essais = 0;
  boucleRetour = setInterval(() => {
    if (conn && conn.open) { clearInterval(boucleRetour); boucleRetour = null; toast('Reconnecté ⚔'); return; }
    if (++essais > 25) { clearInterval(boucleRetour); boucleRetour = null; toast('Reconnexion impossible. Recharge la page.'); return; }
    try {
      if (peer.disconnected && !peer.destroyed) peer.reconnect();
      const c = peer.connect(PREFIXE + codeSalon, { reliable: true });
      brancher(c);
      c.on('open', () => envoie({ t: 'HELLO', nom: monNom() }));
    } catch (e) {}
  }, 2500);
}

/* ============ SALLE ============ */
const codeAlea = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]).join('');
const monNom = () => $('#nom').value.trim() || 'Tireur';
const erreur = t => { $('#err').textContent = t; };
function ecran(id) { document.querySelectorAll('.ec').forEach(s => s.classList.toggle('on', s.id === id)); }

$('#b-rejoindre').addEventListener('click', () => {
  $('#joinbox').hidden = !$('#joinbox').hidden;
  if (!$('#joinbox').hidden) $('#code').focus();
});
$('#b-regles').addEventListener('click', () => ecran('e-regles'));
$('#b-fermer-regles').addEventListener('click', () => ecran(st && st.demarree ? 'e-piste' : 'e-entree'));

$('#b-ouvrir').addEventListener('click', () => {
  const code = codeAlea();
  hote = true; moi = 'h'; autre = 'g'; codeSalon = code; solo = false;
  st = neuf(); st.nm.h = monNom();
  erreur('On ouvre la salle…');
  peer = new Peer(PREFIXE + code, { debug: 0 });
  peer.on('open', () => { erreur(''); $('#code-geant').textContent = code; ecran('e-attente'); majVestiaire(); });
  peer.on('connection', c => {
    brancher(c);
    c.on('open', () => { surveille(); if (st.demarree) diffuse(); });
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { peer.destroy(); $('#b-ouvrir').click(); }
    else erreur('Impossible d\'ouvrir la salle. Réessaie.');
  });
});

$('#b-entrer').addEventListener('click', () => {
  const code = $('#code').value.trim().toUpperCase();
  if (code.length !== 4) { erreur('Il faut les 4 lettres du code.'); return; }
  hote = false; moi = 'g'; autre = 'h'; codeSalon = code; solo = false;
  st = neuf(); st.nm.g = monNom();
  erreur('Connexion…');
  peer = new Peer({ debug: 0 });
  peer.on('open', () => {
    const c = peer.connect(PREFIXE + code, { reliable: true });
    brancher(c);
    c.on('open', () => { erreur(''); envoie({ t: 'HELLO', nom: monNom() }); surveille(); });
    setTimeout(() => { if (!conn || !conn.open) erreur('Salle introuvable. Vérifie le code.'); }, 6000);
  });
  peer.on('error', () => erreur('Salle introuvable. Vérifie le code.'));
});

$('#b-seul').addEventListener('click', () => {
  solo = true; hote = true; moi = 'h'; autre = 'g';
  st = neuf(); st.nm.h = monNom(); st.nm.g = 'Maître d\'armes';
  $('#b-copier').hidden = true;
  ecran('e-attente'); $('#code-geant').textContent = '····';
  majVestiaire();
});

$('#code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
$('#b-copier').addEventListener('click', () => {
  navigator.clipboard?.writeText($('#code-geant').textContent.trim())
    .then(() => toast('Code copié')).catch(() => {});
});

function majVestiaire() {
  $('#nm1').textContent = st.nm.h || '—';
  $('#nm2').textContent = st.nm.g || '—';
  const pret = solo || !!(st.nm.h && st.nm.g);
  $('#attente-txt').textContent = pret
    ? (solo ? 'Le maître d\'armes t\'attend sur la piste.' : 'Les deux tireurs sont prêts.')
    : 'On attend l\'adversaire…';
  $('#b-commencer').hidden = !(pret && hote);
}
$('#b-commencer').addEventListener('click', () => { if (hote) demarre(); });
$('#b-rejouer').addEventListener('click', () => {
  if (!hote) { toast('C\'est à ' + (st.nm.h || 'l\'hôte') + ' de relancer.'); return; }
  demarre();
});

/* ============ DÉROULÉ ============ */
function purge() { chronos.forEach(clearTimeout); chronos = []; }
function tard(f, ms) { const id = setTimeout(f, ms); chronos.push(id); return id; }

function demarre() {
  purge();
  const noms = st.nm;
  st = neuf(); st.nm = noms; st.demarree = true;
  ecran('e-piste');
  nouveauTour();
}

function nouveauTour() {
  purge();
  st.ph = 'choix'; st.choix = { h: null, g: null }; st.res = null; st.t0 = Date.now();
  monChoix = null;
  diffuse();
  /* si quelqu'un ne choisit pas, on tranche pour lui */
  tard(() => {
    if (st.ph !== 'choix') return;
    for (const r of ['h', 'g']) if (!st.choix[r]) st.choix[r] = defaut(r);
    resout();
  }, TOUR_MS + 900);
  if (solo) tard(() => choisit('g', maitre()), 700 + Math.random() * 900);
}

/* faute de choix, on rompt ; si la piste est finie derrière, on pare */
function defaut(r) {
  const p = st.pos[r], vers = sens(r);
  const bout = p - vers < 0 || p - vers > PISTE - 1;
  if (!bout) return 're';
  return abordable('pa', st.end[r]) ? 'pa' : 'av';
}

function choisit(qui, k) {
  if (!hote || st.ph !== 'choix' || st.choix[qui]) return;
  if (!ACTIONS[k] || !abordable(k, st.end[qui])) return;
  st.choix[qui] = k;
  if (st.choix.h && st.choix.g) resout(); else diffuse();
}

function joue(k) {
  if (st.ph !== 'choix' || monChoix) return;
  if (!abordable(k, st.end[moi])) return;
  monChoix = k;
  if (hote) choisit(moi, k); else { envoie({ t: 'A', a: k }); rendu(); }
}

/* ---------- le cœur : la résolution ---------- */
function resout() {
  purge();
  const a = { h: st.choix.h, g: st.choix.g };
  const dep = { ...st.pos };

  /* 1. l'endurance */
  const end = { ...st.end };
  for (const r of ['h', 'g']) end[r] = clamp(end[r] - ACTIONS[a[r]].cout, 0, ENDUR_MAX);

  /* 2. les déplacements, en même temps */
  const arr = { ...dep };
  const sortie = { h: false, g: false };
  for (const r of ['h', 'g']) {
    const v = sens(r), p = ACTIONS[a[r]].pas;
    if (!p) continue;
    let n = dep[r] + v * p;
    if (n < 0 || n > PISTE - 1) {
      /* rompre hors de la piste, c'est une sortie ; avancer s'arrête au bord */
      if (p < 0) sortie[r] = true;
      n = clamp(n, 0, PISTE - 1);
    }
    arr[r] = n;
  }
  /* on ne se traverse pas : à la rencontre, on s'arrête corps à corps */
  if ((dep.h < dep.g && arr.h >= arr.g) || (dep.h > dep.g && arr.h <= arr.g)) {
    const mil = (arr.h + arr.g) / 2;
    if (dep.h < dep.g) { arr.h = Math.floor(mil); arr.g = Math.max(arr.h + 1, Math.ceil(mil)); }
    else { arr.g = Math.floor(mil); arr.h = Math.max(arr.g + 1, Math.ceil(mil)); }
    arr.h = clamp(arr.h, 0, PISTE - 1); arr.g = clamp(arr.g, 0, PISTE - 1);
  }
  const d = Math.abs(arr.h - arr.g);
  const aPortee = d <= PORTEE;

  /* 3. les lames */
  const touche = { h: false, g: false };
  let cause = '';
  const f = r => a[r];
  const est = (r, k) => a[r] === k;

  if (est('h', 'fe') && est('g', 'fe')) {
    if (aPortee) { touche.h = touche.g = true; cause = 'Coup double — les deux lames arrivent ensemble.'; }
    else cause = 'Deux fentes dans le vide.';
  } else {
    for (const [r, o] of [['h', 'g'], ['g', 'h']]) {
      if (est(r, 'fe')) {
        if (est(o, 'pa')) { if (aPortee) { touche[o] = true; cause = 'Parade et riposte.'; } else cause = 'Fente trop courte, parade inutile.'; }
        else if (aPortee) { touche[r] = true; cause = est(o, 'fi') ? 'La fente traverse la feinte.' : 'Fente au but.'; }
        else cause = 'Fente trop courte.';
      } else if (est(r, 'fi') && est(o, 'pa')) {
        if (aPortee) { touche[r] = true; cause = 'La feinte contourne la parade.'; }
        else cause = 'Feinte hors de portée.';
      }
    }
  }
  /* la sortie de piste passe après : on ne perd pas un point déjà marqué */
  for (const [r, o] of [['h', 'g'], ['g', 'h']]) {
    if (sortie[r] && !touche[r] && !touche[o]) { touche[o] = true; cause = 'Sortie de piste arrière.'; }
  }
  if (!cause) cause = 'Rien à signaler.';

  st.pos = arr; st.end = end;
  st.res = { a, dep, arr, touche, cause, d, sortie };
  st.ph = 'resolution';
  animT0 = performance.now();
  diffuse();

  const marque = touche.h || touche.g;
  tard(() => {
    if (marque) {
      if (touche.h) st.sc.h++;
      if (touche.g) st.sc.g++;
      if (st.sc.h >= VICTOIRE || st.sc.g >= VICTOIRE) {
        st.ph = 'fin';
        st.fin = st.sc.h > st.sc.g ? 'h' : st.sc.g > st.sc.h ? 'g' : null;
        diffuse(); return;
      }
      /* on se remet en garde */
      st.pos = { ...DEPART }; st.end = { h: ENDUR_DEP, g: ENDUR_DEP };
    }
    st.tour++;
    nouveauTour();
  }, marque ? 3400 : 2400);
}

/* ---------- le maître d'armes (entraînement seul) ---------- */
function maitre() {
  const e = st.end.g, d = dist();
  const dispo = k => abordable(k, e);
  const opts = [];
  const bord = st.pos.g - sens('g') < 0 || st.pos.g - sens('g') > PISTE - 1;

  if (d > 3) { opts.push('av', 'av', 'av'); if (dispo('bo')) opts.push('bo'); }
  else if (d === 3) {
    opts.push('av', 'av'); if (dispo('bo')) opts.push('bo', 'bo');
    if (!bord) opts.push('re');
  } else {
    if (dispo('fe')) opts.push('fe', 'fe', 'fe');
    if (dispo('pa')) opts.push('pa', 'pa');
    if (dispo('fi')) opts.push('fi');
    if (!bord) opts.push('re');
    opts.push('av');
  }
  /* à bout de souffle, il reprend son air */
  if (e <= 1) { opts.length = 0; opts.push('av', bord ? 'av' : 're'); }
  const bons = opts.filter(dispo);
  return bons.length ? pick(bons) : 'av';
}

/* ============ TOAST ============ */
let toastId = null;
function toast(txt) {
  const el = $('#toast'); el.textContent = txt; el.hidden = false;
  clearTimeout(toastId); toastId = setTimeout(() => { el.hidden = true; }, 2600);
}

/* =========================================================
   DESSIN
   ========================================================= */
const cv = $('#cv'), cx = cv.getContext('2d');
const VW = 1000, VH = 560;
let W = 0, H = 0, sc = 1, ox = 0, oy = 0, dpr = 1;

function taille() {
  W = window.innerWidth; H = window.innerHeight;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  sc = Math.min(W / VW, H / VH);
  ox = (W - VW * sc) / 2; oy = (H - VH * sc) / 2;
}
window.addEventListener('resize', taille);
taille();

const PX0 = 90, PX1 = 910, PY = 338;   /* la piste reste au-dessus des boutons */
const caseX = p => PX0 + (PX1 - PX0) * p / (PISTE - 1);

function salle(now) {
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#0b1013'); g.addColorStop(.55, '#131c22'); g.addColorStop(1, '#080c0f');
  cx.fillStyle = g; cx.fillRect(-400, -300, VW + 800, VH + 600);

  /* la lumière crue au-dessus de la piste */
  const l = cx.createRadialGradient(VW / 2, 40, 20, VW / 2, 300, 620);
  l.addColorStop(0, 'rgba(210,230,240,.15)'); l.addColorStop(1, 'rgba(210,230,240,0)');
  cx.fillStyle = l; cx.fillRect(-400, -300, VW + 800, VH + 600);

  /* le parquet */
  cx.fillStyle = '#1b2229'; cx.fillRect(-400, PY + 44, VW + 800, VH);
  cx.strokeStyle = 'rgba(233,237,240,.04)'; cx.lineWidth = 1;
  for (let i = -6; i < 26; i++) {
    cx.beginPath(); cx.moveTo(i * 60 - 100, PY + 44); cx.lineTo(i * 60 - 260, VH + 200); cx.stroke();
  }

  /* la piste d'escrime */
  cx.fillStyle = '#c9d3d8';
  cx.beginPath();
  cx.moveTo(PX0 - 46, PY + 10); cx.lineTo(PX1 + 46, PY + 10);
  cx.lineTo(PX1 + 74, PY + 44); cx.lineTo(PX0 - 74, PY + 44);
  cx.closePath(); cx.fill();
  cx.fillStyle = '#aab6bd';
  cx.fillRect(PX0 - 46, PY + 6, (PX1 - PX0) + 92, 5);

  /* les marques : ligne médiane, lignes de mise en garde, zones d'avertissement */
  cx.strokeStyle = 'rgba(30,44,54,.55)'; cx.lineWidth = 2;
  const trait = (p, h) => {
    const x = caseX(p);
    cx.beginPath(); cx.moveTo(x, PY + 11); cx.lineTo(x, PY + 11 + h); cx.stroke();
  };
  trait((PISTE - 1) / 2, 32);
  trait(DEPART.h, 22); trait(DEPART.g, 22);
  cx.fillStyle = 'rgba(30,44,54,.18)';
  cx.fillRect(PX0 - 46, PY + 11, caseX(2) - (PX0 - 46), 32);
  cx.fillRect(caseX(PISTE - 3), PY + 11, (PX1 + 46) - caseX(PISTE - 3), 32);

  /* les deux lampes de l'appareil de touche */
  const LY = 104;
  for (const r of ['h', 'g']) {
    const x = r === 'h' ? VW / 2 - 62 : VW / 2 + 62;
    const on = st && st.res && st.res.touche[r] && st.ph === 'resolution' && (performance.now() - animT0) > 1150;
    const col = r === 'h' ? '226,65,63' : '55,196,107';
    cx.fillStyle = on ? `rgba(${col},1)` : `rgba(${col},.14)`;
    cx.beginPath(); cx.roundRect(x - 32, LY, 64, 24, 3); cx.fill();
    if (on) {
      const h = cx.createRadialGradient(x, LY + 12, 4, x, LY + 12, 160);
      h.addColorStop(0, `rgba(${col},.45)`); h.addColorStop(1, `rgba(${col},0)`);
      cx.fillStyle = h; cx.beginPath(); cx.arc(x, LY + 12, 160, 0, 6.3); cx.fill();
    }
    cx.strokeStyle = 'rgba(233,237,240,.18)'; cx.lineWidth = 1.5;
    cx.beginPath(); cx.roundRect(x - 32, LY, 64, 24, 3); cx.stroke();
  }
}

/* ---------- un tireur ---------- */
function tireur(x, role, dir, pose, k) {
  const rouge = role === 'h';
  const corps = rouge ? '#e2413f' : '#37c46b';
  const clair = rouge ? '#f4817f' : '#79dfa0';
  cx.save();
  cx.translate(x, PY + 28);            /* les pieds posés sur la piste, pas devant */
  cx.scale(dir * 1.15, 1.15);

  /* l'ombre */
  cx.fillStyle = 'rgba(0,0,0,.34)';
  cx.beginPath(); cx.ellipse(0, 2, 40, 7, 0, 0, 6.3); cx.fill();

  const fente = pose === 'fente' ? k : 0;
  const recul = pose === 'touche' ? k : 0;
  cx.translate(-recul * 16, 0);

  /* jambes : la fente allonge la jambe avant */
  cx.strokeStyle = '#e9edf0'; cx.lineWidth = 8; cx.lineCap = 'round';
  cx.beginPath();
  cx.moveTo(-4, -56); cx.lineTo(-26 - fente * 6, 0);                    /* jambe arrière */
  cx.moveTo(-4, -56); cx.lineTo(22 + fente * 46, 0);                    /* jambe avant */
  cx.stroke();

  /* le corps, penché en avant sur la fente */
  const pen = fente * 0.30;
  cx.save(); cx.translate(-4, -56); cx.rotate(pen);
  const g = cx.createLinearGradient(0, -46, 0, 4);
  g.addColorStop(0, clair); g.addColorStop(1, corps);
  cx.fillStyle = g;
  cx.beginPath();
  cx.moveTo(-12, 4); cx.lineTo(-9, -40); cx.lineTo(11, -40); cx.lineTo(13, 4);
  cx.closePath(); cx.fill();

  /* le masque */
  cx.fillStyle = '#cfd8dd';
  cx.beginPath(); cx.ellipse(4, -52, 15, 14, -0.2, 0, 6.3); cx.fill();
  cx.strokeStyle = 'rgba(30,44,54,.5)'; cx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    cx.beginPath(); cx.moveTo(4 + i * 4, -64); cx.lineTo(4 + i * 4, -40); cx.stroke();
  }
  cx.fillStyle = corps; cx.fillRect(-10, -44, 26, 5);

  /* le bras arrière, levé comme il se doit */
  cx.strokeStyle = clair; cx.lineWidth = 6;
  cx.beginPath(); cx.moveTo(-8, -34); cx.lineTo(-26, -50); cx.lineTo(-20, -66); cx.stroke();

  /* le bras armé et la lame */
  let ang = -0.16, ext = 0;
  if (pose === 'fente') { ang = -0.05; ext = k * 30; }
  else if (pose === 'parade') ang = -1.05;
  else if (pose === 'feinte') { ang = -0.35 + Math.sin(k * 12) * 0.30; ext = k * 12; }
  else if (pose === 'touche') ang = 0.5;

  cx.save(); cx.translate(10, -30); cx.rotate(ang);
  cx.strokeStyle = clair; cx.lineWidth = 6;
  cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(20 + ext, 0); cx.stroke();
  /* la coquille */
  cx.fillStyle = '#b9c6cd';
  cx.beginPath(); cx.arc(24 + ext, 0, 7, 0, 6.3); cx.fill();
  /* la lame */
  const lame = cx.createLinearGradient(24 + ext, 0, 96 + ext, 0);
  lame.addColorStop(0, '#e9edf0'); lame.addColorStop(1, 'rgba(233,237,240,.3)');
  cx.strokeStyle = lame; cx.lineWidth = 2.6;
  cx.beginPath(); cx.moveTo(28 + ext, 0); cx.lineTo(96 + ext, -2); cx.stroke();
  cx.restore();
  cx.restore();
  cx.restore();
}

/* ---------- l'animation de la résolution ---------- */
function poseDe(role, p) {
  const a = st.res.a[role];
  if (p < 0.42) return a === 'bo' ? 'marche' : 'garde';
  if (st.res.touche[role === 'h' ? 'g' : 'h'] && p > 0.62) return 'touche';
  if (a === 'fe') return 'fente';
  if (a === 'pa') return 'parade';
  if (a === 'fi') return 'feinte';
  return 'garde';
}

function scene(now) {
  if (!st || !st.demarree || st.ph === 'attente') return;

  let xh, xg, ph = 'garde', pg = 'garde', kh = 0, kg = 0;

  if (st.ph === 'resolution' && st.res) {
    const t = clamp((now - animT0) / 1900, 0, 1);
    const m = clamp(t / 0.42, 0, 1);
    const doux = m < .5 ? 2 * m * m : 1 - Math.pow(-2 * m + 2, 2) / 2;
    xh = lerp(caseX(st.res.dep.h), caseX(st.res.arr.h), doux);
    xg = lerp(caseX(st.res.dep.g), caseX(st.res.arr.g), doux);
    ph = poseDe('h', t); pg = poseDe('g', t);
    const frappe = clamp((t - 0.42) / 0.24, 0, 1);
    kh = ph === 'touche' ? clamp((t - 0.62) / 0.2, 0, 1) : frappe;
    kg = pg === 'touche' ? clamp((t - 0.62) / 0.2, 0, 1) : frappe;
  } else {
    xh = caseX(st.pos.h); xg = caseX(st.pos.g);
    /* respiration en garde */
    const r = Math.sin(now * 0.0022) * 1.6;
    xh += r; xg -= r;
  }

  const dirH = xh <= xg ? 1 : -1;
  tireur(xh, 'h', dirH, ph, kh);
  tireur(xg, 'g', -dirH, pg, kg);

  /* la mesure entre les deux */
  const d = st.ph === 'resolution' && st.res ? st.res.d : dist();
  const mx = (xh + xg) / 2;
  cx.textAlign = 'center';
  cx.strokeStyle = d <= PORTEE ? 'rgba(226,65,63,.5)' : 'rgba(143,163,176,.25)';
  cx.lineWidth = 1; cx.setLineDash([4, 5]);
  cx.beginPath(); cx.moveTo(Math.min(xh, xg) + 40, PY - 108); cx.lineTo(Math.max(xh, xg) - 40, PY - 108); cx.stroke();
  cx.setLineDash([]);
  cx.font = '600 12px Inter, sans-serif';
  cx.fillStyle = d <= PORTEE ? '#e2413f' : '#5d6f7c';
  cx.fillText(d <= PORTEE ? 'À PORTÉE · ' + d + ' PAS' : d + ' PAS', mx, PY - 116);

  /* les jauges d'endurance, au-dessus de chacun */
  for (const [r, x] of [['h', xh], ['g', xg]]) {
    const e = st.end[r], col = r === 'h' ? '#e2413f' : '#37c46b';
    for (let i = 0; i < ENDUR_MAX; i++) {
      cx.fillStyle = i < e ? col : 'rgba(143,163,176,.18)';
      cx.fillRect(x - ENDUR_MAX * 5 + i * 10, PY - 148, 7, 7);
    }
    cx.font = '500 10px Inter, sans-serif'; cx.fillStyle = '#5d6f7c';
    cx.fillText('ENDURANCE', x, PY - 156);
  }

  /* ce que l'autre vient de jouer */
  if (st.ph === 'resolution' && st.res && (now - animT0) > 700) {
    for (const [r, x] of [['h', xh], ['g', xg]]) {
      cx.font = '400 22px "Bebas Neue", sans-serif';
      cx.fillStyle = r === 'h' ? '#f4817f' : '#79dfa0';
      cx.fillText(ACTIONS[st.res.a[r]].nom.toUpperCase(), x, PY - 176);
    }
  }
}

/* ============ BOUCLE ============ */
function boucle(now) {
  requestAnimationFrame(boucle);
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, W, H);
  cx.save();
  cx.translate(ox, oy); cx.scale(sc, sc);
  cx.save(); cx.beginPath(); cx.rect(-ox / sc, -oy / sc, VW + 2 * ox / sc, VH + 2 * oy / sc); cx.clip();
  salle(now);
  scene(now);
  cx.restore(); cx.restore();

  /* le compte à rebours du tour, rafraîchi ici pour rester fluide */
  if (st && st.ph === 'choix') {
    const reste = Math.max(0, TOUR_MS - (Date.now() - st.t0)) / 1000;
    $('#chrono').textContent = reste.toFixed(0);
  }
}
requestAnimationFrame(boucle);

/* =========================================================
   RENDU DOM
   ========================================================= */
let sigAct = '';
function rendu() {
  if (!st) return;
  if (!st.demarree) { majVestiaire(); return; }
  if (st.ph === 'fin') { ecranFin(); return; }
  if ($('#e-regles').classList.contains('on')) return;   /* on ne vole pas l'écran des règles */
  ecran('e-piste');

  $('#s1').textContent = st.sc.h;
  $('#s2').textContent = st.sc.g;
  $('#n1').textContent = (st.nm.h || 'Rouge') + (moi === 'h' ? ' (toi)' : '');
  $('#n2').textContent = (st.nm.g || 'Vert') + (moi === 'g' ? ' (toi)' : '');
  $('.lampe.l1').classList.toggle('on', !!(st.res && st.res.touche.h));
  $('.lampe.l2').classList.toggle('on', !!(st.res && st.res.touche.g));

  const monEnd = st.end[moi];

  if (st.ph === 'choix') {
    $('#phase').textContent = 'Tour ' + st.tour;
    $('#chrono').textContent = Math.ceil(TOUR_MS / 1000);
    $('#verdict').hidden = true;
    const attendu = hote ? !!st.choix[autre] : !!st.choix[autre];
    $('#etat').textContent = monChoix
      ? (attendu ? 'Résolution…' : 'Ton choix est verrouillé. L\'autre réfléchit encore.')
      : (attendu ? 'L\'adversaire a déjà choisi. À toi.' : 'Choisis en secret.');

    const sig = 'c|' + monEnd + '|' + (monChoix || '') + '|' + st.tour;
    if (sig !== sigAct) {
      sigAct = sig;
      $('#actions').innerHTML = ORDRE_BTN.map(k => {
        const a = ACTIONS[k];
        const off = !abordable(k, monEnd) || monChoix;
        const cout = a.cout < 0 ? '+' + (-a.cout) : a.cout === 0 ? '0' : '−' + a.cout;
        return `<button class="act ${a.fam}${monChoix === k ? ' pris' : ''}" data-k="${k}" ${off ? 'disabled' : ''}>
          <span class="n">${a.nom}</span><span class="t">${a.t}</span><span class="c">${cout} end.</span></button>`;
      }).join('');
    }
  } else if (st.ph === 'resolution') {
    $('#phase').textContent = 'Assaut';
    $('#chrono').textContent = '—';
    const r = st.res;
    const nm = x => st.nm[x] || (x === 'h' ? 'Rouge' : 'Vert');
    $('#verdict').hidden = false;
    if (r.touche.h && r.touche.g) { $('#v-titre').textContent = 'COUP DOUBLE'; $('#v-titre').style.color = '#e9edf0'; }
    else if (r.touche.h) { $('#v-titre').textContent = 'TOUCHE — ' + nm('h'); $('#v-titre').style.color = '#e2413f'; }
    else if (r.touche.g) { $('#v-titre').textContent = 'TOUCHE — ' + nm('g'); $('#v-titre').style.color = '#37c46b'; }
    else { $('#v-titre').textContent = 'PAS DE TOUCHE'; $('#v-titre').style.color = '#5d6f7c'; }
    $('#v-sous').textContent = r.cause;
    $('#etat').textContent = ACTIONS[r.a.h].nom + '  ·  ' + ACTIONS[r.a.g].nom;
    $('#actions').innerHTML = ''; sigAct = '';
  }

  $('#bandeau').hidden = !solo;
}

function ecranFin() {
  const nm = x => esc(st.nm[x] || (x === 'h' ? 'Rouge' : 'Vert'));
  const gagne = st.fin;
  $('#fin-t').textContent = gagne ? nm(gagne) + ' l\'emporte' : 'Assaut nul';
  $('#fin-sc').innerHTML =
    `<div class="r"><small>${nm('h')}</small><b>${st.sc.h}</b></div>` +
    `<div class="v"><small>${nm('g')}</small><b>${st.sc.g}</b></div>`;
  const ecart = Math.abs(st.sc.h - st.sc.g);
  $('#fin-p').textContent = ecart >= 4 ? 'Une leçon d\'escrime.'
    : ecart >= 2 ? 'Nette, mais il a fallu la chercher.'
      : 'Une touche d\'écart. Il faut refaire l\'assaut.';
  ecran('e-fin');
}

/* ---------- entrées ---------- */
$('#actions').addEventListener('click', e => {
  const b = e.target.closest('[data-k]');
  if (b && !b.disabled) joue(b.dataset.k);
});
const saisie = e => /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
window.addEventListener('keydown', e => {
  if (saisie(e)) { if (e.key === 'Enter' && e.target.id === 'code') $('#b-entrer').click(); return; }
  if (!st || st.ph !== 'choix') return;
  const i = '123456'.indexOf(e.key);
  if (i >= 0) { e.preventDefault(); joue(ORDRE_BTN[i]); }
});

/* ?apercu=1 : la piste en position, seul, pour revoir la salle */
if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('apercu')) {
  solo = true; hote = true; moi = 'h'; autre = 'g';
  st = neuf(); st.nm.h = 'Rouge'; st.nm.g = 'Vert'; st.demarree = true;
  st.sc = { h: 2, g: 1 };
  ecran('e-piste'); nouveauTour();
}
