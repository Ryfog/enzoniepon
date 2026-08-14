/* =========================================================
   ÉCHOS — moteur
   Deux joueurs, deux époques, un seul écran coupé en deux.
   Chaque moitié a sa caméra et son rendu ; la grille est commune,
   mais ce que le joueur du passé modifie ne se voit que dans le
   présent, trois siècles plus tard.
   ========================================================= */
const $ = s => document.querySelector(s);

/* --- dimensions --- */
const T = 40;                       // taille d'une case
const VUE_L = 1440, VUE_H = 720;    // canvas complet
const DEMI = VUE_L / 2;             // largeur d'une moitié d'écran
const PW = 24, PH = 32;             // boîte du personnage

/* --- physique (par pas de 1/60 s) --- */
const G = 0.86, VMAX = 4.6, ACC = 0.82, FROT = 0.78;
const SAUT = -14.4, CHUTE = 19;
const PAS = 1000 / 60, RETARD_MAX = 250, PAS_MAX = 5;

/* --- époques --- */
const PASSE = 0, PRESENT = 1;

/* --- palettes --- */
const PAL = [
  {   /* AUTREFOIS : pierre chaude, ciel franc */
    ciel1: '#8ec8e8', ciel2: '#dfeef2', lointain: '#a8b6a0',
    pierre: '#c9a978', pierreH: '#e0c396', pierreB: '#9c7f52',
    herbe: '#7bb85c', corniche: '#b98f5c', cornicheH: '#d4ab74',
    perso: '#e0b56b', persoC: '#f5d9a8', accent: '#c9603f'
  },
  {   /* AUJOURD'HUI : pierre patinée, ciel voilé */
    ciel1: '#6e7a86', ciel2: '#b9c4c0', lointain: '#5d6b60',
    pierre: '#7d8778', pierreH: '#95a08c', pierreB: '#5a6355',
    herbe: '#4f7a4a', corniche: '#6b7264', cornicheH: '#838b79',
    perso: '#6fbfa5', persoC: '#a8ded0', accent: '#4a8f7a'
  }
];

/* =========================================================
   ÉTAT
   ========================================================= */
let grille = [], larg = 0, niv = 0, enJeu = false, fini = false;
let solo = false, actif = 0;
let causal = {};          // colonne -> { type, fait, cases:[], bas }
let bassins = [];
let jetons = [], sortiePos = null;
let debut = 0, chutes = 0;

const depart = [{ x: 0, y: 0 }, { x: 0, y: 0 }];

const J = [
  { x: 0, y: 0, vx: 0, vy: 0, sol: false, d: 1, mort: 0, coyote: 0, tampon: 0, basAv: 0, ere: PASSE },
  { x: 0, y: 0, vx: 0, vy: 0, sol: false, d: 1, mort: 0, coyote: 0, tampon: 0, basAv: 0, ere: PRESENT }
];
const cam = [{ x: 0, y: 0 }, { x: 0, y: 0 }];

const touches = {};
let parts = [];

/* =========================================================
   CHARGEMENT
   ========================================================= */
function charge(n) {
  const N = NIVEAUX[n];
  niv = n; larg = N.larg; fini = false;
  grille = N.map.map(r => r.padEnd(larg, ' ').slice(0, larg).split(''));
  while (grille.length < HAUT) grille.push(Array(larg).fill(' '));

  causal = {}; jetons = []; sortiePos = null; chutes = 0; parts = [];
  bassins = (BASSINS[n] || []).map(b => ({ ...b }));

  for (let y = 0; y < HAUT; y++) {
    for (let x = 0; x < larg; x++) {
      const c = grille[y][x];
      if (c === '1') { depart[0] = { x: x * T + 8, y: y * T + 8 }; grille[y][x] = ' '; }
      else if (c === '2') { depart[1] = { x: x * T + 8, y: y * T + 8 }; grille[y][x] = ' '; }
      else if (c === '*') { jetons.push({ x: x * T + T / 2, y: y * T + T / 2, pris: [false, false], ph: Math.random() * 6 }); grille[y][x] = ' '; }
      else if (c === 'F') { sortiePos = { x: x * T, y: y * T }; grille[y][x] = ' '; }
      else if (c === 'G' || c === 'P' || c === 'V') {
        if (!causal[x]) causal[x] = { type: c, fait: false, cases: [], bas: y };
        causal[x].cases.push(y);
        causal[x].bas = Math.max(causal[x].bas, y);
      }
    }
  }

  J.forEach((p, i) => {
    p.x = depart[i].x; p.y = depart[i].y;
    p.vx = 0; p.vy = 0; p.mort = 0; p.sol = false; p.basAv = p.y + PH;
    cam[i].x = p.x; cam[i].y = p.y;
  });

  debut = performance.now();
  enJeu = true;
  ecran('e-jeu');
  $('#h-niv').textContent = N.nom;
  $('#fin').hidden = true;
  const a = $('#aide');
  a.textContent = N.aide; a.classList.remove('off');
  setTimeout(() => a.classList.add('off'), 7000);
  if (!boucle) boucle = requestAnimationFrame(tour);
}

const ecran = id => document.querySelectorAll('.ecran').forEach(s => s.classList.toggle('on', s.id === id));

/* =========================================================
   GÉOMÉTRIE DES DEUX ÉPOQUES
   ========================================================= */

/* branches de l'arbre né d'une graine plantée (présent seulement) */
function estBranche(tx, ty) {
  const o = causal[tx] || causal[tx - 1] || causal[tx + 1];
  if (!o || o.type !== 'G' || !o.fait) return false;
  const col = causal[tx] ? tx : (causal[tx - 1] ? tx - 1 : tx + 1);
  const g = causal[col];
  if (g.type !== 'G' || !g.fait) return false;
  return ty === g.bas - 2 || ty === g.bas - 4;
}

/* une case est-elle de la pierre pleine, pour cette époque ? */
function estSolide(tx, ty, ere) {
  if (tx < 0 || tx >= larg) return true;
  if (ty < 0 || ty >= HAUT) return false;
  const c = grille[ty][tx];
  if (c === '#') return true;

  const o = causal[tx];
  if (o && o.cases.includes(ty)) {
    if (o.type === 'P') {
      if (!o.fait) return true;                          // pilier debout : bloque les deux
      return ere === PRESENT && ty === o.bas;            // brisé : éboulis au sol dans le présent
    }
    return false;                                        // graine et vanne ne bloquent pas
  }
  return false;
}

/* corniches et branches : on ne les franchit que par le dessus */
function poseDessus(p, ny, ere) {
  const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + PW - 1) / T);
  const bas = ny + PH, ty = Math.floor(bas / T);
  if (ty < 0 || ty >= HAUT) return null;
  for (let tx = x0; tx <= x1; tx++) {
    if (tx < 0 || tx >= larg) continue;
    const corniche = grille[ty][tx] === '_';
    const branche = ere === PRESENT && estBranche(tx, ty);
    if (!corniche && !branche) continue;
    const haut = ty * T + 8;
    if (p.basAv <= haut + 2 && bas >= haut) return haut;
  }
  return null;
}

/* le bassin du présent reste plein tant que la vanne n'est pas ouverte */
function vanneOuverte() {
  return Object.values(causal).some(o => o.type === 'V' && o.fait);
}
function dansEau(p, ere) {
  if (ere !== PRESENT || vanneOuverte()) return false;
  const cx = (p.x + PW / 2) / T, cy = (p.y + PH / 2) / T;
  return bassins.some(b => cx >= b.x0 && cx <= b.x1 && cy >= b.y - 1 && cy <= b.y + 1);
}

function heurte(p, nx, ny, ere) {
  const x0 = Math.floor(nx / T), x1 = Math.floor((nx + PW - 1) / T);
  const y0 = Math.floor(ny / T), y1 = Math.floor((ny + PH - 1) / T);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++)
      if (estSolide(tx, ty, ere)) return true;
  return false;
}

/* =========================================================
   SIMULATION
   ========================================================= */
function commandes(i) {
  if (solo && i !== actif) return { g: false, d: false, saut: false };
  if (i === 0) return {
    g: !!(touches['q'] || touches['a']),
    d: !!touches['d'],
    saut: !!(touches['z'] || touches['w'])
  };
  return {
    g: !!touches['arrowleft'],
    d: !!touches['arrowright'],
    saut: !!touches['arrowup']
  };
}

function meurt(p) { if (p.mort === 0) { p.mort = 40; chutes++; } }

function simule(p, i) {
  const ere = p.ere;
  if (p.mort > 0) {
    p.mort--;
    if (p.mort === 0) { p.x = depart[i].x; p.y = depart[i].y; p.vx = p.vy = 0; p.basAv = p.y + PH; }
    return;
  }
  const cmd = commandes(i);

  if (cmd.g) { p.vx -= ACC; p.d = -1; }
  if (cmd.d) { p.vx += ACC; p.d = 1; }
  if (!cmd.g && !cmd.d) p.vx *= FROT;
  p.vx = Math.max(-VMAX, Math.min(VMAX, p.vx));
  if (Math.abs(p.vx) < .05) p.vx = 0;

  const nx = p.x + p.vx;
  if (heurte(p, nx, p.y, ere)) {
    const pas = Math.sign(p.vx) || 1;
    while (!heurte(p, p.x + pas, p.y, ere) && Math.abs(p.x - nx) > .5) p.x += pas;
    p.vx = 0;
  } else p.x = nx;
  p.x = Math.max(0, Math.min(larg * T - PW, p.x));

  p.vy = Math.min(CHUTE, p.vy + G);
  if (cmd.saut) p.tampon = 8; else if (p.tampon > 0) p.tampon--;
  if (p.sol) p.coyote = 8; else if (p.coyote > 0) p.coyote--;
  if (p.tampon > 0 && p.coyote > 0) { p.vy = SAUT; p.tampon = 0; p.coyote = 0; p.sol = false; }
  if (!cmd.saut && p.vy < -5) p.vy *= .86;

  p.sol = false;
  const ny = p.y + p.vy;
  if (heurte(p, p.x, ny, ere)) {
    const pas = Math.sign(p.vy) || 1;
    while (!heurte(p, p.x, p.y + pas, ere) && Math.abs(p.y - ny) > .5) p.y += pas;
    if (p.vy > 0) { p.sol = true; if (p.vy > 10) poussiere(p.x + PW / 2, p.y + PH, ere, 5); }
    p.vy = 0;
  } else {
    const h = p.vy > 0 ? poseDessus(p, ny, ere) : null;
    if (h !== null) { p.y = h - PH; p.vy = 0; p.sol = true; }
    else p.y = ny;
  }

  if (p.y > HAUT * T + 60) meurt(p);
  if (dansEau(p, ere)) meurt(p);

  jetons.forEach(o => {
    if (o.pris[i]) return;
    if (Math.abs(p.x + PW / 2 - o.x) < 22 && Math.abs(p.y + PH / 2 - o.y) < 22) {
      o.pris[i] = true;
      etincelles(o.x, o.y, ere, PAL[ere].perso, 10);
    }
  });

  p.basAv = p.y + PH;
}

/* l'action : le joueur du passé agit sur les objets causaux */
function agit(i) {
  const p = J[i];
  if (p.mort > 0) return;
  if (i !== 0) { toast('Seul le passé peut encore être changé.'); return; }
  const col = Math.round((p.x + PW / 2) / T);
  for (let d = -1; d <= 1; d++) {
    const o = causal[col + d];
    if (!o || o.fait) continue;
    if (Math.abs(o.bas * T - (p.y + PH)) > T * 1.6) continue;
    o.fait = true;
    const wx = (col + d) * T + T / 2, wy = o.bas * T;
    if (o.type === 'G') { etincelles(wx, wy, PASSE, '#7bb85c', 16); toast('Une graine est plantée. Trois siècles plus tard, un arbre.'); }
    if (o.type === 'P') { etincelles(wx, wy, PASSE, '#c9a978', 20); toast('Le pilier cède. Il ne restera qu\'un éboulis.'); }
    if (o.type === 'V') { etincelles(wx, wy, PASSE, '#8ec8e8', 16); toast('La vanne s\'ouvre. Le bassin finira par se vider.'); }
    etincelles(wx, wy, PRESENT, PAL[1].perso, 18);
    return;
  }
  toast('Rien à faire ici.');
}

/* =========================================================
   PARTICULES (chaque particule appartient à une époque)
   ========================================================= */
function poussiere(x, y, ere, n) {
  for (let i = 0; i < n; i++) parts.push({
    x, y, ere, vx: (Math.random() - .5) * 2.4, vy: -Math.random() * 1.6,
    r: 2 + Math.random() * 2.5, c: 'rgba(210,200,180,.65)', v: 1
  });
}
function etincelles(x, y, ere, col, n) {
  for (let i = 0; i < n; i++) parts.push({
    x, y, ere, vx: (Math.random() - .5) * 5, vy: -Math.random() * 4 - 1,
    r: 2 + Math.random() * 2.5, c: col, v: 1
  });
}
function majParts() {
  if (parts.length > 260) parts.splice(0, parts.length - 260);
  parts = parts.filter(p => p.v > 0);
  parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .17; p.v -= .022; });
}

/* =========================================================
   BOUCLE
   ========================================================= */
let boucle = null, dernierTs = 0, cumul = 0, temps = 0;

function tour(ts) {
  boucle = requestAnimationFrame(tour);
  if (!enJeu) return;
  temps = ts / 1000;

  if (!dernierTs) dernierTs = ts;
  let ecoule = ts - dernierTs;
  dernierTs = ts;
  if (ecoule > RETARD_MAX) ecoule = PAS;
  cumul += ecoule;

  let n = 0;
  while (cumul >= PAS && n < PAS_MAX) { unPas(); cumul -= PAS; n++; }
  if (n === PAS_MAX) cumul = 0;

  majCameras();
  dessine();

  $('#etat').textContent = solo
    ? `Tu diriges ${actif === 0 ? 'AUTREFOIS' : 'AUJOURD\'HUI'} — Tab pour changer d'époque`
    : 'Joueur 1 à gauche · Joueur 2 à droite';
}

function unPas() {
  simule(J[0], 0);
  simule(J[1], 1);
  majParts();

  if (sortiePos && !fini) {
    const sur = p => p.mort === 0 &&
      p.x + PW > sortiePos.x - 8 && p.x < sortiePos.x + T + 8 &&
      p.y + PH > sortiePos.y - 8 && p.y < sortiePos.y + T + 20;
    if (sur(J[0]) && sur(J[1])) gagne();
  }
}

function majCameras() {
  for (let i = 0; i < 2; i++) {
    const p = J[i], c = cam[i];
    const visL = DEMI, visH = VUE_H;
    const mondeL = larg * T, mondeH = HAUT * T;
    let vx = p.x + PW / 2, vy = p.y + PH / 2;
    vx = mondeL > visL ? Math.max(visL / 2, Math.min(mondeL - visL / 2, vx)) : mondeL / 2;
    vy = mondeH > visH ? Math.max(visH / 2, Math.min(mondeH - visH / 2, vy)) : mondeH / 2;
    c.x += (vx - c.x) * .11;
    c.y += (vy - c.y) * .11;
  }
}

function gagne() {
  fini = true;
  const secs = Math.round((performance.now() - debut) / 1000);
  const p1 = jetons.filter(o => o.pris[0]).length;
  const p2 = jetons.filter(o => o.pris[1]).length;
  $('#fin').hidden = false;
  $('#fin-stats').innerHTML =
    `<div><small>Temps</small><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</b></div>` +
    `<div><small>Autrefois</small><b>${p1}/${jetons.length}</b></div>` +
    `<div><small>Aujourd'hui</small><b>${p2}/${jetons.length}</b></div>` +
    `<div><small>Chutes</small><b>${chutes}</b></div>`;
}

/* =========================================================
   CLAVIER
   ========================================================= */
const saisie = e => {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
};
addEventListener('keydown', e => {
  if (saisie(e)) return;
  const k = e.key.toLowerCase();
  if (k === 'tab') { e.preventDefault(); if (solo) actif = 1 - actif; return; }
  if (k === 'e' && enJeu) { agit(0); return; }
  if (k === 'enter' && enJeu) { agit(1); return; }
  if (k === 'r' && enJeu) { charge(niv); return; }
  if ([' ', 'arrowup', 'arrowleft', 'arrowright', 'arrowdown'].includes(k)) e.preventDefault();
  touches[k] = true;
});
addEventListener('keyup', e => { if (!saisie(e)) touches[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in touches) touches[k] = false; });

/* =========================================================
   RENDU
   ========================================================= */
const cv = $('#cv'), g = cv.getContext('2d');
let densite = 1;
function ajusteDensite() {
  const d = Math.min(2, window.devicePixelRatio || 1);
  densite = d; cv.width = VUE_L * d; cv.height = VUE_H * d;
}
ajusteDensite();
addEventListener('resize', ajusteDensite);

function rrect(x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function dessine() {
  g.setTransform(densite, 0, 0, densite, 0, 0);
  g.clearRect(0, 0, VUE_L, VUE_H);
  dessineMoitie(PASSE, 0);
  dessineMoitie(PRESENT, DEMI);
  couture();
}

/* la ligne d'or et de vert-de-gris qui sépare les deux époques */
function couture() {
  const x = DEMI;
  const d = g.createLinearGradient(x - 3, 0, x + 3, VUE_H);
  d.addColorStop(0, '#e0b56b');
  d.addColorStop(1, '#6fbfa5');
  g.fillStyle = d;
  g.fillRect(x - 2, 0, 4, VUE_H);
  g.fillStyle = 'rgba(0,0,0,.45)';
  g.fillRect(x - 6, 0, 4, VUE_H);
  g.fillRect(x + 2, 0, 4, VUE_H);
}

function dessineMoitie(ere, ox) {
  const P = PAL[ere], c = cam[ere];
  g.save();
  g.beginPath(); g.rect(ox, 0, DEMI, VUE_H); g.clip();

  /* ciel */
  const ciel = g.createLinearGradient(0, 0, 0, VUE_H);
  ciel.addColorStop(0, P.ciel1);
  ciel.addColorStop(1, P.ciel2);
  g.fillStyle = ciel; g.fillRect(ox, 0, DEMI, VUE_H);

  /* silhouettes lointaines de la cité, en parallaxe */
  g.fillStyle = P.lointain;
  const dec = c.x * .3;
  for (let i = -1; i < 14; i++) {
    const bx = ox + i * 120 - (dec % 120);
    const h = 130 + ((i * 71) % 90);
    const bas = VUE_H * .74;
    g.fillRect(bx, bas - h, 74, h);
    if (ere === PASSE) {                      /* toits intacts */
      g.beginPath();
      g.moveTo(bx - 8, bas - h); g.lineTo(bx + 37, bas - h - 34); g.lineTo(bx + 82, bas - h);
      g.closePath(); g.fill();
    } else {                                   /* sommets rongés */
      g.fillRect(bx + 10, bas - h - 16, 20, 16);
      g.fillRect(bx + 48, bas - h - 9, 14, 9);
    }
  }

  g.translate(ox + DEMI / 2 - c.x, VUE_H / 2 - c.y);

  /* --- la pierre --- */
  const x0 = Math.max(0, Math.floor((c.x - DEMI / 2) / T) - 1);
  const x1 = Math.min(larg - 1, Math.ceil((c.x + DEMI / 2) / T) + 1);
  const y0 = Math.max(0, Math.floor((c.y - VUE_H / 2) / T) - 1);
  const y1 = Math.min(HAUT - 1, Math.ceil((c.y + VUE_H / 2) / T) + 1);

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const px = x * T, py = y * T;
      const t = grille[y][x];

      if (t === '#') {
        const surface = !(grille[y - 1] && grille[y - 1][x] === '#');
        g.fillStyle = surface ? P.pierreH : P.pierre;
        g.fillRect(px, py, T, T);
        g.fillStyle = P.pierreB;
        g.fillRect(px, py + T - 3, T, 3);
        g.fillRect(px, py, 2, T);
        if (surface) {
          g.fillStyle = P.herbe;
          g.fillRect(px, py, T, ere === PASSE ? 6 : 9);
          if (ere === PRESENT) {                 /* lierre qui retombe */
            g.fillStyle = 'rgba(70,110,70,.5)';
            for (let k = 0; k < 3; k++) g.fillRect(px + 5 + k * 12, py + 9, 4, 10 + ((x + k) % 3) * 7);
          }
        }
        if (ere === PRESENT) {                   /* fissures */
          g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1;
          g.beginPath(); g.moveTo(px + 8, py + 6); g.lineTo(px + 14, py + T - 6); g.stroke();
        }
      }

      else if (t === '_') {
        g.fillStyle = P.corniche;
        rrect(px, py + 8, T, 14, 4); g.fill();
        g.fillStyle = P.cornicheH;
        rrect(px, py + 8, T, 5, 3); g.fill();
      }
    }
  }

  /* --- objets causaux --- */
  Object.entries(causal).forEach(([col, o]) => {
    const cx = +col * T;
    if (o.type === 'P') dessinePilier(cx, o, ere, P);
    if (o.type === 'G') dessineGraine(cx, o, ere, P);
    if (o.type === 'V') dessineVanne(cx, o, ere, P);
  });

  /* --- bassin du présent --- */
  if (ere === PRESENT && !vanneOuverte()) {
    bassins.forEach(b => {
      const bx = b.x0 * T, bw = (b.x1 - b.x0 + 1) * T, by = (b.y - 1) * T;
      g.fillStyle = 'rgba(70,120,130,.72)';
      g.fillRect(bx, by, bw, T * 2);
      g.fillStyle = 'rgba(180,230,235,.3)';
      for (let k = 0; k < bw; k += 26)
        g.fillRect(bx + k, by + 5 + Math.sin(temps * 2 + k * .1) * 3, 16, 3);
    });
  }

  /* --- jetons --- */
  jetons.forEach(o => {
    if (o.pris[ere]) return;
    const y = o.y + Math.sin(temps * 2.6 + o.ph) * 4;
    g.save();
    g.shadowColor = P.perso; g.shadowBlur = 14;
    g.fillStyle = P.persoC;
    g.beginPath(); g.arc(o.x, y, 9, 0, 7); g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = P.perso; g.lineWidth = 2;
    g.beginPath(); g.arc(o.x, y, 9, 0, 7); g.stroke();
    g.restore();
  });

  /* --- sortie --- */
  if (sortiePos) {
    const sx = sortiePos.x + T / 2, sy = sortiePos.y + T;
    g.strokeStyle = P.pierreB; g.lineWidth = 5;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy - 74); g.stroke();
    for (let k = 0; k < 3; k++) {
      g.fillStyle = k % 2 ? P.persoC : P.perso;
      g.fillRect(sx + 3, sy - 72 + k * 15, 26 + Math.sin(temps * 2 + k) * 3, 14);
    }
  }

  /* --- personnage de cette époque --- */
  perso(J[ere], ere, P);

  /* --- particules --- */
  parts.forEach(p => {
    if (p.ere !== ere) return;
    g.globalAlpha = Math.max(0, p.v);
    g.fillStyle = p.c;
    g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
  });
  g.globalAlpha = 1;

  g.restore();

  /* voile de teinte propre à l'époque */
  g.fillStyle = ere === PASSE ? 'rgba(224,181,107,.05)' : 'rgba(90,120,110,.1)';
  g.fillRect(ox, 0, DEMI, VUE_H);
}

function dessinePilier(cx, o, ere, P) {
  const haut = Math.min(...o.cases), n = o.cases.length;
  if (!o.fait) {
    g.fillStyle = P.pierre;
    g.fillRect(cx + 4, haut * T, T - 8, n * T);
    g.fillStyle = P.pierreH;
    g.fillRect(cx + 4, haut * T, T - 8, 6);
    g.fillStyle = P.pierreB;
    for (let k = 1; k < n; k++) g.fillRect(cx + 4, (haut + k) * T - 2, T - 8, 3);
  } else if (ere === PRESENT) {
    g.fillStyle = P.pierre;
    g.beginPath();
    g.moveTo(cx, (o.bas + 1) * T);
    g.lineTo(cx + 6, o.bas * T + 8);
    g.lineTo(cx + 22, o.bas * T + 2);
    g.lineTo(cx + T, o.bas * T + 12);
    g.lineTo(cx + T, (o.bas + 1) * T);
    g.closePath(); g.fill();
    g.fillStyle = P.pierreB;
    g.fillRect(cx, (o.bas + 1) * T - 3, T, 3);
  } else {
    g.fillStyle = 'rgba(0,0,0,.14)';
    g.fillRect(cx + 8, (o.bas + 1) * T - 5, T - 16, 4);
  }
}

function dessineGraine(cx, o, ere, P) {
  const by = o.bas * T;
  if (ere === PASSE) {
    g.fillStyle = o.fait ? '#7bb85c' : '#a8734a';
    g.beginPath();
    g.moveTo(cx + 10, by + T); g.lineTo(cx + 13, by + 18);
    g.lineTo(cx + T - 13, by + 18); g.lineTo(cx + T - 10, by + T);
    g.closePath(); g.fill();
    if (o.fait) {
      g.strokeStyle = '#7bb85c'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(cx + T / 2, by + 18); g.lineTo(cx + T / 2, by + 2); g.stroke();
    } else {
      g.fillStyle = 'rgba(255,255,255,.35)';
      g.font = '600 15px Inter, sans-serif'; g.textAlign = 'center';
      g.fillText('E', cx + T / 2, by - 6);
    }
    return;
  }
  /* présent : l'arbre, s'il a été planté */
  if (!o.fait) {
    g.fillStyle = 'rgba(0,0,0,.16)';
    g.beginPath(); g.ellipse(cx + T / 2, by + T - 4, 13, 4, 0, 0, 7); g.fill();
    return;
  }
  g.fillStyle = '#5e4630';
  g.fillRect(cx + T / 2 - 7, by - 5 * T, 14, 5 * T + T);
  [2, 4].forEach(k => {
    const y = (o.bas - k) * T;
    g.fillStyle = P.corniche;
    rrect(cx - T + 4, y + 8, T * 3 - 8, 14, 5); g.fill();
    g.fillStyle = '#4f7a4a';
    g.beginPath(); g.arc(cx - T + 12, y + 6, 15, 0, 7); g.fill();
    g.beginPath(); g.arc(cx + T + 26, y + 6, 15, 0, 7); g.fill();
  });
  g.fillStyle = '#4f7a4a';
  g.beginPath(); g.arc(cx + T / 2, by - 5 * T - 6, 30, 0, 7); g.fill();
}

function dessineVanne(cx, o, ere, P) {
  const by = o.bas * T;
  g.fillStyle = ere === PASSE ? '#8a95a0' : '#6b7268';
  g.fillRect(cx + 9, by + 16, T - 18, T - 16);
  g.strokeStyle = o.fait ? '#8ec8e8' : (ere === PASSE ? '#c9603f' : '#5a6355');
  g.lineWidth = 4;
  g.beginPath(); g.arc(cx + T / 2, by + 14, 10, 0, 7); g.stroke();
  g.beginPath();
  const a = o.fait ? Math.PI / 2 : 0;
  g.moveTo(cx + T / 2 - Math.cos(a) * 13, by + 14 - Math.sin(a) * 13);
  g.lineTo(cx + T / 2 + Math.cos(a) * 13, by + 14 + Math.sin(a) * 13);
  g.stroke();
  if (ere === PASSE && !o.fait) {
    g.fillStyle = 'rgba(255,255,255,.35)';
    g.font = '600 15px Inter, sans-serif'; g.textAlign = 'center';
    g.fillText('E', cx + T / 2, by - 6);
  }
}

function perso(p, ere, P) {
  const w = PW, h = PH, cx = p.x + w / 2, bas = p.y + h;
  g.save();
  if (p.mort > 0) g.globalAlpha = (p.mort % 10 < 5) ? .35 : .12;

  const et = Math.max(-.25, Math.min(.25, p.vy / 48));
  g.translate(cx, bas); g.scale(1 - et, 1 + et); g.translate(-cx, -bas);

  g.fillStyle = 'rgba(0,0,0,.2)';
  g.beginPath(); g.ellipse(cx, bas + 3, w * .45, 4, 0, 0, 7); g.fill();

  const court = Math.abs(p.vx) > .4 && p.sol;
  const bat = court ? Math.sin(temps * 13) * 6 : 0;
  g.strokeStyle = P.perso; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx - 5, bas - 7); g.lineTo(cx - 5 + bat, bas + 2);
  g.moveTo(cx + 5, bas - 7); g.lineTo(cx + 5 - bat, bas + 2);
  g.stroke();

  g.fillStyle = P.perso;
  rrect(p.x, p.y, w, h, 9); g.fill();
  g.fillStyle = P.persoC;
  rrect(p.x + 2, p.y + 2, w - 4, 10, 6); g.fill();

  const dx = p.d > 0 ? 3 : -3;
  [-5, 5].forEach(ox => {
    g.fillStyle = '#1c1622';
    g.beginPath(); g.arc(cx + ox + dx, p.y + 13, 3, 0, 7); g.fill();
  });

  g.restore();
  g.globalAlpha = 1;

  /* halo du personnage inactif en solo */
  if (solo && actif !== ere) {
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2;
    g.setLineDash([4, 4]);
    rrect(p.x - 4, p.y - 4, w + 8, h + 8, 11); g.stroke();
    g.setLineDash([]);
  }
}

/* =========================================================
   MENU
   ========================================================= */
$('#b-jouer').addEventListener('click', () => { solo = false; charge(0); });
$('#b-solo').addEventListener('click', () => { solo = true; actif = 0; charge(0); });
$('#b-rejouer').addEventListener('click', () => charge(niv));

let tT = null;
function toast(t) {
  const el = $('#toast');
  el.textContent = t; el.hidden = false;
  clearTimeout(tT);
  tT = setTimeout(() => { el.hidden = true; }, 3000);
}

/* essai rapide : ?jouer */
if (/[?&]jouer/.test(location.search)) { solo = true; actif = 0; charge(0); }
