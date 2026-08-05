/* =========================================================
   DUO — moteur du jeu (WebRTC pair-à-pair)
   L'hôte tient l'état, l'invité envoie ses actions.
   Les banques de contenu sont dans contenu.js
   ========================================================= */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pick = a => a[Math.floor(Math.random() * a.length)];
const melange = a => [...a].sort(() => Math.random() - .5);
const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const PREFIXE = 'duo-es-';

const TYPES = ['qui', 'syn', 'des', 'ref', 'bra', 'p4', 'pfc', 'vf', 'pre', 'int', 'cha', 'mem', 'qz',
  'seq', 'bac', 'tap', 'mdp', 'bom', 'pen', 'pom', 'lab', 'mlp', 'chr', 'emo'];
/* en mode piment on ne garde que les épreuves qui parlent de vous deux :
   les jeux d'adresse (puissance 4, bras de fer, tape vite…) n'ont rien de coquin */
const TYPES_PIMENT = ['qui', 'pre', 'syn', 'vf', 'osa', 'jam'];
const NOMS = {
  qui: 'Qui de nous deux', syn: 'Synchro', des: 'Dessine-moi', ref: 'Duel de réflexe',
  bra: 'Bras de fer', p4: 'Puissance 4', pfc: 'Pierre feuille ciseaux', vf: 'Vrai ou faux',
  pre: 'Tu préfères', int: 'Trouve l\'intrus', cha: 'Chasse aux cœurs',
  mem: 'Memory à deux', qz: 'Quiz éclair',
  seq: 'La séquence', bac: 'Petit bac', tap: 'Tape vite',
  mdp: 'Mot de passe', bom: 'Désamorçage',
  osa: 'Action ou vérité', jam: 'Je n\'ai jamais',
  pen: 'Le pendu', pom: 'Plus ou moins', lab: 'Labyrinthe aveugle',
  mlp: 'Le mot le plus long', chr: 'Chrono aveugle', emo: 'Devine l\'emoji'
};
const BAT = { pierre: 'ciseaux', feuille: 'pierre', ciseaux: 'feuille' };
const P4C = 7, P4L = 6;

/* ============ MÉMOIRE ANTI-RÉPÉTITION ============ */
const CLE_H = 'duo_hist';
let HIST = {};
try { HIST = JSON.parse(localStorage.getItem(CLE_H) || '{}'); } catch (e) { HIST = {}; }
const sauveHist = () => { try { localStorage.setItem(CLE_H, JSON.stringify(HIST)); } catch (e) {} };

/* tire un élément jamais vu ; quand le stock est épuisé on repart à zéro */
function tirer(cat, arr) {
  let vus = HIST[cat] || [];
  let libres = arr.map((_, i) => i).filter(i => !vus.includes(i));
  if (libres.length < 2) { vus = []; libres = arr.map((_, i) => i); }
  const i = pick(libres);
  vus.push(i);
  HIST[cat] = vus; sauveHist();
  return arr[i];
}

/* ============ ÉTAT ============ */
let peer = null, conn = null, hote = false, moi = 'h', autre = 'g';
let st = null, rtt = 60, longueur = 16, rythme = 1, piment = false, solo = false;
let actifs = TYPES.slice();
let minuteur = null, chrono = null, pouls = null, tempo = null;
/* réponses gardées côté hôte uniquement, pour qu'on ne puisse pas les lire */
let bonQz = 0, bonFil = 0, motSecret = '', cible = 0;

/* labyrinthe : creusé par retour sur trace, il existe toujours
   un chemin du départ à la sortie */
function fabriqueLabyrinthe(w, h) {
  const L = 2 * w + 1, H = 2 * h + 1;
  const g = Array.from({ length: H }, () => Array(L).fill('#'));
  const vu = Array.from({ length: h }, () => Array(w).fill(false));
  const pile = [[0, 0]];
  vu[0][0] = true; g[1][1] = ' ';
  while (pile.length) {
    const [cx, cy] = pile[pile.length - 1];
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => [cx + dx, cy + dy])
      .filter(([x, y]) => x >= 0 && x < w && y >= 0 && y < h && !vu[y][x]);
    if (!opts.length) { pile.pop(); continue; }
    const [nx, ny] = pick(opts);
    vu[ny][nx] = true;
    g[2 * ny + 1][2 * nx + 1] = ' ';
    g[cy + ny + 1][cx + nx + 1] = ' ';
    pile.push([nx, ny]);
  }
  return { g, w: L, h: H, depart: { x: 1, y: 1 }, sortie: { x: 2 * w - 1, y: 2 * h - 1 } };
}
let SUITE = [];

const neuf = () => ({
  demarree: false, ph: 'round', i: 0, total: longueur, type: 'qui',
  q: '', ans: { h: null, g: null }, sc: { h: 0, g: 0 },
  nm: { h: '', g: '' }, rev: null, drawer: 'h', dur: {}
});

/* ============ RÉSEAU ============ */
function envoie(m) { if (conn && conn.open) conn.send(m); }
function diffuse() { envoie({ t: 'S', st }); rendu(); }

function brancher(c) {
  if (conn && conn !== c) { conn.remplacee = true; try { conn.close(); } catch (e) {} }
  conn = c;
  c.on('data', m => recois(m));
  c.on('close', () => { if (c.remplacee) return; toast('Connexion perdue — reconnexion…'); relance(); });
  c.on('error', () => { if (!c.remplacee) relance(); });
}

function recois(m) {
  if (m.t === 'S') { st = m.st; rendu(); }
  else if (m.t === 'A' && hote) action(autre, m.a);
  else if (m.t === 'KA') { /* battement de cœur */ }
  else if (m.t === 'HELLO') {
    st.nm[autre] = m.nom || 'L\'autre';
    envoie({ t: 'WELCOME', nom: st.nm[moi] });
    if (!st.demarree) { ecran('s-wait'); majAttente(); }
    diffuse();
    setTimeout(renvoieDessin, 250);      // l'autre revient : on lui rend le dessin
  }
  else if (m.t === 'WELCOME') {
    st.nm[autre] = m.nom || 'L\'autre';
    if (!st.demarree) { ecran('s-wait'); majAttente(); }
    setTimeout(renvoieDessin, 250);
  }
  else if (m.t === 'GO') topDepart();
  else if (m.t === 'BF') poulsRecu(m);
  else if (m.t === 'D') dessineDistant(m);
  else if (m.t === 'PING') envoie({ t: 'PONG', k: m.k });
  else if (m.t === 'PONG') rtt = Math.min(400, Date.now() - m.k);
  else if (m.t === 'REFUS') toast('Interdit : ton indice contient le mot à faire deviner.');
  else if (m.t === 'MUR') toast('Un mur. Tu ne passes pas par là.');
}
function ping() { envoie({ t: 'PING', k: Date.now() }); }

/* ---------- reconnexion ---------- */
let codeSalon = '', boucleRetour = null, essais = 0, garde = null;

function relance() {
  if (hote || !codeSalon || boucleRetour) return;
  essais = 0;
  boucleRetour = setInterval(() => {
    if (conn && conn.open) { clearInterval(boucleRetour); boucleRetour = null; toast('Reconnecté 💜'); return; }
    if (++essais > 25) { clearInterval(boucleRetour); boucleRetour = null; toast('Reconnexion impossible. Recharge la page.'); return; }
    try {
      if (peer.disconnected && !peer.destroyed) peer.reconnect();
      const c = peer.connect(PREFIXE + codeSalon, { reliable: true });
      brancher(c);
      c.on('open', () => envoie({ t: 'HELLO', nom: monNom() }));
    } catch (e) {}
  }, 2500);
}
function surveille() {
  clearInterval(garde);
  garde = setInterval(() => { if (conn && conn.open) envoie({ t: 'KA' }); else relance(); }, 10000);
}

/* ============ LOBBY ============ */
const codeAlea = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]).join('');
const monNom = () => $('#pseudo').value.trim() || 'Moi';
const erreur = t => { $('#lobby-err').textContent = t; };
function ecran(id) { $$('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }

$('#b-joinmode').addEventListener('click', () => {
  $('#joinbox').hidden = !$('#joinbox').hidden;
  if (!$('#joinbox').hidden) $('#code').focus();
});

$('#b-create').addEventListener('click', () => {
  const code = codeAlea();
  hote = true; moi = 'h'; autre = 'g'; codeSalon = code;
  st = neuf(); st.nm.h = monNom();
  erreur('Ouverture du salon…');
  peer = new Peer(PREFIXE + code, { debug: 0 });
  peer.on('open', () => { erreur(''); $('#code-big').textContent = code; ecran('s-wait'); majAttente(); });
  peer.on('connection', c => {
    brancher(c);
    c.on('open', () => { ping(); surveille(); if (st.demarree) diffuse(); });
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { peer.destroy(); $('#b-create').click(); }
    else erreur('Impossible d\'ouvrir le salon. Réessaie.');
  });
});

$('#b-join').addEventListener('click', () => {
  const code = $('#code').value.trim().toUpperCase();
  if (code.length !== 4) { erreur('Il faut les 4 lettres du code.'); return; }
  hote = false; moi = 'g'; autre = 'h'; codeSalon = code;
  st = neuf(); st.nm.g = monNom();
  erreur('Connexion…');
  peer = new Peer({ debug: 0 });
  peer.on('open', () => {
    const c = peer.connect(PREFIXE + code, { reliable: true });
    brancher(c);
    c.on('open', () => { erreur(''); envoie({ t: 'HELLO', nom: monNom() }); ping(); surveille(); });
    setTimeout(() => { if (!conn || !conn.open) erreur('Salon introuvable. Vérifie le code.'); }, 6000);
  });
  peer.on('error', () => erreur('Salon introuvable. Vérifie le code.'));
});

$('#code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
$('#b-copy').addEventListener('click', () => {
  navigator.clipboard?.writeText($('#code-big').textContent.trim()).then(() => toast('Code copié 📋')).catch(() => {});
});

function majAttente() {
  $('#pl-h').querySelector('b').textContent = st.nm.h || '—';
  $('#pl-g').querySelector('b').textContent = st.nm.g || '—';
  const pret = !!(st.nm.h && st.nm.g);
  $('#pl-g').classList.toggle('off', !st.nm.g);
  $('#wait-txt').textContent = pret ? 'Vous êtes deux. C\'est parti quand vous voulez.' : 'En attente de l\'autre…';
  $('#b-start').hidden = !((pret || solo) && hote);
  /* les réglages s'affichent dès que l'hôte a ouvert le salon :
     inutile d'attendre l'autre joueur pour configurer la partie */
  $('#lens').hidden = !hote;
  if (solo) $('#wait-txt').textContent = 'Mode essai : tu joues les deux camps.';
}

/* ---------- options ---------- */
$$('.len').forEach(b => b.addEventListener('click', () => {
  longueur = +b.dataset.n;
  $$('.len').forEach(x => x.classList.toggle('on', x === b));
}));
$$('.ryt').forEach(b => b.addEventListener('click', () => {
  rythme = +b.dataset.r;
  $$('.ryt').forEach(x => x.classList.toggle('on', x === b));
}));
$('#b-opt').addEventListener('click', () => { $('#opts').hidden = !$('#opts').hidden; });
/* ---------- mode essai : un seul navigateur joue les deux camps ---------- */
$('#b-seul').addEventListener('click', () => {
  solo = true; hote = true; moi = 'h'; autre = 'g';
  st = neuf();
  st.nm.h = monNom();
  st.nm.g = 'Joueur 2';
  ecran('s-wait');
  $('#code-big').textContent = 'SOLO';
  majAttente();
});

function majBascule() {
  $('#bascule').hidden = !solo;
  if (solo) $('#switch-nom').textContent = st.nm[moi];
}
function changeCamp() {
  if (!solo) return;
  [moi, autre] = [autre, moi];
  majBascule();
  rendu();
  toast('Tu joues maintenant ' + st.nm[moi]);
}
$('#b-switch').addEventListener('click', changeCamp);
addEventListener('keydown', e => {
  if (e.key !== 'Tab' || !solo) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  e.preventDefault(); changeCamp();
});

$('#b-piment').addEventListener('click', () => {
  piment = !piment;
  $('#b-piment').classList.toggle('on', piment);
  toast(piment
    ? 'Mode piment activé 🌶️ — « Qui de nous deux », « Tu préfères » et « Synchro » changent de registre.'
    : 'Mode piment désactivé.');
});

(function construitOptions() {
  const g = $('#opt-grid');
  TYPES.forEach(t => {
    const b = document.createElement('button');
    b.className = 'opt on';
    b.dataset.t = t;
    b.innerHTML = `<span class="tick"></span>${NOMS[t]}`;
    b.addEventListener('click', () => {
      b.classList.toggle('on');
      actifs = $$('.opt.on').map(x => x.dataset.t);
      if (!actifs.length) { b.classList.add('on'); actifs = [t]; }
      $('#opt-info').textContent = `${actifs.length} épreuve${actifs.length > 1 ? 's' : ''} sur ${TYPES.length}`;
    });
    g.appendChild(b);
  });
})();
$('#b-all').addEventListener('click', () => {
  $$('.opt').forEach(x => x.classList.add('on'));
  actifs = TYPES.slice();
  $('#opt-info').textContent = `${TYPES.length} épreuves sur ${TYPES.length}`;
});
$('#b-hist').addEventListener('click', () => {
  HIST = {}; sauveHist();
  toast('Historique vidé — tout le contenu redevient possible');
});

/* mélange l'ordre des manches, sans jamais deux fois le même type d'affilée */
function construitSuite(n, types) {
  const out = []; let sac = [];
  while (out.length < n) {
    if (!sac.length) sac = melange(types);
    const t = sac.pop();
    if (out.length && out[out.length - 1] === t && sac.length) { sac.unshift(t); continue; }
    out.push(t);
  }
  return out;
}

$('#b-start').addEventListener('click', () => {
  if (!hote) return;
  /* en piment, on ignore la sélection d'épreuves : seules celles
     qui parlent de vous deux tournent */
  SUITE = construitSuite(longueur, piment ? TYPES_PIMENT : actifs);
  st.total = SUITE.length;
  manche(0);
});

/* =========================================================
   MOTEUR (hôte uniquement)
   ========================================================= */
function manche(i) {
  clearTimeout(minuteur); clearInterval(pouls); clearTimeout(tempo);
  if (i >= SUITE.length) { st.ph = 'end'; diffuse(); return; }

  st.demarree = true;
  st.i = i;
  st.type = SUITE[i];
  st.ph = 'round';
  st.ans = { h: null, g: null };
  st.rev = null; st.guesses = []; st.go = false; st.sub = null;
  st.dur = { des: 90000 * rythme, bra: 12000 * rythme, cha: 25000 * rythme };

  const T = st.type;

  /* en mode piment, ces trois épreuves puisent dans l'autre banque */
  if (T === 'qui') { st.q = piment ? tirer('quiP', PIMENT.qui) : tirer('qui', QUI); diffuse(); return; }
  if (T === 'syn') { st.q = piment ? tirer('synP', PIMENT.syn) : tirer('syn', SYNCHRO); diffuse(); return; }
  if (T === 'pre') { st.q = piment ? tirer('preP', PIMENT.pre) : tirer('pre', PREFERE); diffuse(); return; }

  if (T === 'des') {
    st.drawer = i % 2 === 0 ? 'h' : 'g';
    st.q = tirer('mot', MOTS);
    minuteur = setTimeout(() => { if (st.ph === 'round') reveler({ e: '⏰', t: 'Temps écoulé', p: `C'était « ${st.q} ».` }); }, st.dur.des);
    diffuse(); return;
  }

  if (T === 'pen') {
    motSecret = tirer('pen', SECRETS);
    st.pen = { mot: motSecret.toUpperCase(), tentees: [], ratees: 0, max: 7 };
    diffuse(); return;
  }

  if (T === 'pom') {
    cible = 1 + Math.floor(Math.random() * 500);
    st.pom = { fil: [], ko: {} };
    diffuse(); return;
  }

  if (T === 'lab') {
    const L = fabriqueLabyrinthe(9, 7);
    st.lab = { g: L.g, w: L.w, h: L.h, pos: { ...L.depart }, sortie: L.sortie, guide: i % 2 === 0 ? 'h' : 'g', vus: [] };
    st.fin = Date.now() + 90000 * rythme;
    minuteur = setTimeout(() => {
      if (st.ph === 'round') reveler({ e: '🧭', t: 'Perdus.', p: 'La sortie était pourtant là.' });
    }, 90000 * rythme);
    diffuse(); return;
  }

  if (T === 'mlp') {
    const l = [];
    for (let k = 0; k < 4; k++) l.push(pick(VOYELLES));
    for (let k = 0; k < 5; k++) l.push(pick(CONSONNES));
    st.mlp = { lettres: melange(l) };
    diffuse(); return;
  }

  if (T === 'chr') {
    st.chr = { objectif: 8 + Math.floor(Math.random() * 8), depart: {}, arret: {} };
    diffuse(); return;
  }

  if (T === 'emo') {
    const [suite, rep] = tirer('emo', EMOJIS);
    motSecret = rep;
    st.emo = { suite, ko: {} };
    diffuse(); return;
  }

  if (T === 'osa') {
    const [genre, txt] = tirer('osa', PIMENT.osa);
    st.osa = { cible: i % 2 === 0 ? 'h' : 'g', genre, txt, juge: true };
    diffuse(); return;
  }

  if (T === 'jam') {
    st.q = tirer('jam', PIMENT.jam);
    diffuse(); return;
  }

  if (T === 'seq') {
    st.seq = { suite: Array.from({ length: 5 }, () => Math.floor(Math.random() * 4)), phase: 'montre', pos: { h: 0, g: 0 }, ko: {} };
    diffuse();
    minuteur = setTimeout(() => {
      if (st.type !== 'seq' || st.ph !== 'round') return;
      st.seq.phase = 'repete'; diffuse();
    }, (st.seq.suite.length * 620 + 900) * rythme);
    return;
  }

  if (T === 'bac') {
    st.q = { lettre: pick(LETTRES), cat: tirer('bac', CATEGORIES) };
    diffuse(); return;
  }

  if (T === 'tap') {
    st.q = tirer('tap', PHRASES);
    diffuse(); return;
  }

  if (T === 'mdp') {
    motSecret = tirer('mdp', SECRETS);
    st.mdp = { donneur: i % 2 === 0 ? 'h' : 'g', fil: [] };
    st.q = motSecret;                        // seul le donneur l'affichera
    st.fin = Date.now() + 75000 * rythme;
    minuteur = setTimeout(() => {
      if (st.ph === 'round') reveler({ e: '⏳', t: 'Temps écoulé', p: `Le mot était « ${motSecret} ».` });
    }, 75000 * rythme);
    diffuse(); return;
  }

  if (T === 'bom') {
    const fils = Array.from({ length: 4 }, () => pick(COULEURS_FILS));
    const regle = pick(REGLES);
    bonFil = regle.calcule(fils);
    st.bom = { fils, regle: regle.texte, panneau: i % 2 === 0 ? 'h' : 'g', coupe: -1 };
    minuteur = setTimeout(() => {
      if (st.ph === 'round') reveler({ e: '💥', t: 'Trop tard !', p: `Il fallait couper le fil n° ${bonFil + 1}.` });
    }, 60000 * rythme);
    diffuse(); return;
  }

  if (T === 'ref') {
    st.q = ''; diffuse();
    minuteur = setTimeout(() => {
      envoie({ t: 'GO' });
      setTimeout(topDepart, Math.round(rtt / 2));
    }, (1800 + Math.random() * 4200) * rythme);
    return;
  }

  if (T === 'bra') {
    st.bf = { h: 0, g: 0 }; diffuse();
    pouls = setInterval(() => {
      envoie({ t: 'BF', h: st.bf.h, g: st.bf.g });
      if (solo) corde(st.bf.h, st.bf.g);      // en solo, personne ne renvoie le pouls
    }, 120);
    minuteur = setTimeout(() => {
      clearInterval(pouls);
      const a = st.bf.h, b = st.bf.g;
      if (a === b) reveler({ e: '🤝', t: 'Parfaitement à égalité', p: `${a} coups chacun.` });
      else { const w = a > b ? 'h' : 'g'; st.sc[w]++; reveler({ e: '💪', t: `${st.nm[w]} l'emporte !`, p: `${Math.max(a, b)} coups contre ${Math.min(a, b)}.` }); }
    }, st.dur.bra);
    return;
  }

  if (T === 'p4') { st.p4 = { b: Array(P4C * P4L).fill(''), tour: i % 2 === 0 ? 'h' : 'g', win: null }; diffuse(); return; }
  if (T === 'pfc') { st.pfc = { h: 0, g: 0, n: 1, res: '' }; diffuse(); return; }
  if (T === 'vf') { st.vf = { teller: i % 2 === 0 ? 'h' : 'g', txt: '', truth: null }; st.sub = 'write'; diffuse(); return; }

  if (T === 'int') {
    const [a, b] = tirer('int', INTRUS);
    const n = 36;
    st.int = { base: a, cible: b, idx: Math.floor(Math.random() * n), n, bloque: {} };
    diffuse(); return;
  }

  if (T === 'cha') {
    st.cha = { pris: 0, act: [], but: 14 };
    let id = 0;
    const spawn = () => {
      if (st.ph !== 'round' || st.type !== 'cha') return;
      if (st.cha.act.length < 3) {
        const libres = [...Array(16).keys()].filter(c => !st.cha.act.some(x => x.c === c));
        if (libres.length) {
          const o = { id: ++id, c: pick(libres) };
          st.cha.act.push(o);
          setTimeout(() => {
            st.cha.act = st.cha.act.filter(x => x.id !== o.id);
            if (st.ph === 'round' && st.type === 'cha') diffuse();
          }, 2600 * rythme);
          diffuse();
        }
      }
    };
    pouls = setInterval(spawn, 640 * rythme);
    spawn();
    minuteur = setTimeout(() => {
      clearInterval(pouls);
      const ok = st.cha.pris >= st.cha.but;
      if (ok) { st.sc.h++; st.sc.g++; }
      reveler({ e: ok ? '💘' : '😅', t: `${st.cha.pris} cœurs attrapés`, p: ok ? `Objectif ${st.cha.but} atteint. +1 pour chacun.` : `Il en fallait ${st.cha.but}. Ce sera pour la prochaine.` });
    }, st.dur.cha);
    return;
  }

  if (T === 'mem') {
    const six = melange(PAIRES).slice(0, 6);
    st.mem = { c: melange([...six, ...six]), up: [], ok: [], tour: i % 2 === 0 ? 'h' : 'g', coups: 0 };
    diffuse(); return;
  }

  if (T === 'qz') {
    const [q, opts, bon] = tirer('qz', QUIZ);
    const ordre = melange(opts.map((o, k) => [o, k]));
    bonQz = ordre.findIndex(([, k]) => k === bon);
    st.q = { t: q, o: ordre.map(([o]) => o) };
    st.qzKO = {};
    diffuse(); return;
  }
}

function action(qui, a) {
  if (!hote || !st) return;
  const adv = qui === 'h' ? 'g' : 'h';

  /* --- qui de nous deux / tu préfères --- */
  if ((a.k === 'qui' || a.k === 'pre') && st.ph === 'round') {
    st.ans[qui] = a.v;
    if (st.ans.h && st.ans.g) {
      const ok = st.ans.h === st.ans.g;
      if (ok) { st.sc.h++; st.sc.g++; }
      reveler({
        e: ok ? '💞' : '🙃',
        t: ok ? 'Vous êtes d\'accord !' : 'Pas du tout d\'accord…',
        p: ok ? '+1 pour chacun.' : 'Il va falloir en parler.',
        deux: true, pre: a.k === 'pre'
      });
    } else diffuse();
  }

  else if (a.k === 'syn' && st.ph === 'round') {
    st.ans[qui] = (a.v || '').slice(0, 60);
    if (st.ans.h !== null && st.ans.g !== null)
      reveler({ e: '👀', t: 'Vos réponses', p: 'Vous aviez pareil ? À vous de juger.', deux: true, juge: true });
    else diffuse();
  }

  else if (a.k === 'juge' && st.ph === 'rev' && st.rev && st.rev.juge) {
    if (a.v) { st.sc.h++; st.sc.g++; st.rev.p = '+1 pour chacun 💞'; st.rev.e = '💞'; }
    else { st.rev.p = 'Tant pis. Ça fera un sujet de conversation.'; st.rev.e = '🙃'; }
    st.rev.juge = false; diffuse();
  }

  else if (a.k === 'hit' && st.ph === 'round' && st.type === 'ref') {
    if (!st.go) { st.sc[adv]++; reveler({ e: '🚨', t: 'Faux départ !', p: `${st.nm[qui]} a cliqué trop tôt. Le point va à ${st.nm[adv]}.` }); return; }
    st.sc[qui]++;
    reveler({ e: '⚡', t: `${st.nm[qui]} gagne le duel !`, p: 'Des réflexes de compétition.' });
  }

  else if (a.k === 'guess' && st.ph === 'round' && st.type === 'des') {
    const g = norm(a.v), cible = norm(st.q);
    st.guesses = (st.guesses || []).concat(a.v).slice(-4);
    if (g && cible.includes(g) && g.length >= Math.min(3, cible.length)) {
      st.sc.h++; st.sc.g++;
      reveler({ e: '🎨', t: 'Trouvé !', p: `C'était bien « ${st.q} ». +1 pour chacun.` });
    } else diffuse();
  }

  else if (a.k === 'bf' && st.ph === 'round' && st.type === 'bra') {
    st.bf[qui] = Math.max(st.bf[qui], a.n | 0);
  }

  else if (a.k === 'p4' && st.ph === 'round' && st.type === 'p4') {
    const P = st.p4;
    if (P.tour !== qui) return;
    let pos = -1;
    for (let l = P4L - 1; l >= 0; l--) { const idx = l * P4C + a.c; if (!P.b[idx]) { pos = idx; break; } }
    if (pos < 0) return;
    P.b[pos] = qui;
    const w = gagneP4(P.b, pos);
    if (w) { P.win = w; st.sc[qui]++; reveler({ e: '🔴', t: `${st.nm[qui]} aligne 4 jetons !`, p: 'Puissance 4, sans discussion.' }); return; }
    if (P.b.every(Boolean)) { reveler({ e: '⚖️', t: 'Grille pleine', p: 'Match nul.' }); return; }
    P.tour = adv; diffuse();
  }

  else if (a.k === 'pfc' && st.ph === 'round' && st.type === 'pfc') {
    st.ans[qui] = a.v;
    if (!st.ans.h || !st.ans.g) { diffuse(); return; }
    const A = st.ans.h, B = st.ans.g;
    if (A === B) st.pfc.res = `Égalité : ${A} contre ${B}.`;
    else if (BAT[A] === B) { st.pfc.h++; st.pfc.res = `${A} bat ${B} — point pour ${st.nm.h}.`; }
    else { st.pfc.g++; st.pfc.res = `${B} bat ${A} — point pour ${st.nm.g}.`; }
    st.ans = { h: null, g: null };
    if (st.pfc.h === 2 || st.pfc.g === 2) {
      const w = st.pfc.h === 2 ? 'h' : 'g'; st.sc[w]++;
      reveler({ e: '✌️', t: `${st.nm[w]} gagne la manche`, p: `${st.pfc.h} — ${st.pfc.g}. ${st.pfc.res}` });
      return;
    }
    st.pfc.n++; diffuse();
  }

  else if (a.k === 'vfw' && st.sub === 'write' && qui === st.vf.teller) {
    st.vf.txt = (a.txt || '').slice(0, 90); st.vf.truth = !!a.v; st.sub = 'guess'; diffuse();
  }
  else if (a.k === 'vfg' && st.sub === 'guess' && qui !== st.vf.teller) {
    const bon = a.v === st.vf.truth;
    st.sc[bon ? qui : st.vf.teller]++;
    st.sub = null;
    reveler({ e: bon ? '🕵️' : '🎭', t: bon ? 'Bien vu !' : 'Raté !',
      p: `« ${st.vf.txt} » — c'était ${st.vf.truth ? 'VRAI' : 'FAUX'}. Le point va à ${st.nm[bon ? qui : st.vf.teller]}.` });
  }

  /* --- trouve l'intrus --- */
  else if (a.k === 'int' && st.ph === 'round' && st.type === 'int') {
    if (st.int.bloque[qui]) return;
    if (a.c === st.int.idx) {
      st.sc[qui]++;
      reveler({ e: '🔍', t: `${st.nm[qui]} l'a repéré !`, p: `L'intrus était le ${st.int.cible}.` });
    } else {
      st.int.bloque[qui] = true;
      diffuse();
      setTimeout(() => { if (st.int) { st.int.bloque[qui] = false; if (st.ph === 'round') diffuse(); } }, 1400);
    }
  }

  /* --- chasse aux cœurs --- */
  else if (a.k === 'cha' && st.ph === 'round' && st.type === 'cha') {
    const av = st.cha.act.length;
    st.cha.act = st.cha.act.filter(x => x.id !== a.id);
    if (st.cha.act.length < av) { st.cha.pris++; diffuse(); }
  }

  /* --- memory --- */
  else if (a.k === 'mem' && st.ph === 'round' && st.type === 'mem') {
    const M = st.mem;
    if (M.tour !== qui || M.up.length >= 2) return;
    if (M.up.includes(a.c) || M.ok.includes(a.c)) return;
    M.up.push(a.c);
    if (M.up.length < 2) { diffuse(); return; }
    M.coups++;
    const [x, y] = M.up;
    if (M.c[x] === M.c[y]) {
      M.ok.push(x, y); M.up = [];
      if (M.ok.length === M.c.length) {
        st.sc.h++; st.sc.g++;
        reveler({ e: '🧠', t: `Toutes les paires !`, p: `Trouvées en ${M.coups} coups, à vous deux. +1 pour chacun.` });
        return;
      }
      diffuse();
    } else {
      diffuse();
      tempo = setTimeout(() => {
        if (st.type !== 'mem' || st.ph !== 'round') return;
        M.up = []; M.tour = adv; diffuse();
      }, 1100 * rythme);
    }
  }

  /* --- quiz éclair --- */
  else if (a.k === 'qz' && st.ph === 'round' && st.type === 'qz') {
    if (st.qzKO[qui]) return;
    if (a.c === bonQz) {
      st.sc[qui]++;
      reveler({ e: '⚡', t: `${st.nm[qui]} a la bonne réponse !`, p: `C'était « ${st.q.o[bonQz]} ».` });
    } else {
      st.qzKO[qui] = true;
      if (st.qzKO.h && st.qzKO.g) reveler({ e: '🤷', t: 'Personne n\'a trouvé', p: `C'était « ${st.q.o[bonQz]} ».` });
      else diffuse();
    }
  }

  /* --- le pendu : coopératif, on partage les erreurs --- */
  else if (a.k === 'pen' && st.ph === 'round' && st.type === 'pen') {
    const P = st.pen, L = (a.v || '').toUpperCase();
    if (!/^[A-Z]$/.test(L) || P.tentees.includes(L)) return;
    P.tentees.push(L);
    if (!P.mot.includes(L)) P.ratees++;
    const fini = [...P.mot].every(c => c === ' ' || c === '-' || P.tentees.includes(c));
    if (fini) {
      st.sc.h++; st.sc.g++;
      reveler({ e: '🎪', t: 'Sauvé !', p: `Le mot était « ${motSecret} ». +1 pour chacun.` });
    } else if (P.ratees >= P.max) {
      reveler({ e: '💀', t: 'Pendu.', p: `C'était « ${motSecret} ».` });
    } else diffuse();
  }

  /* --- plus ou moins --- */
  else if (a.k === 'pom' && st.ph === 'round' && st.type === 'pom') {
    const v = parseInt(a.v, 10);
    if (!v || v < 1 || v > 500) return;
    if (v === cible) {
      st.sc[qui]++;
      reveler({ e: '🎯', t: `${st.nm[qui]} a trouvé !`, p: `C'était bien ${cible}.` });
      return;
    }
    st.pom.fil.push({ de: qui, v, sens: v < cible ? '↑' : '↓' });
    st.pom.fil = st.pom.fil.slice(-10);
    diffuse();
  }

  /* --- labyrinthe aveugle --- */
  else if (a.k === 'lab' && st.ph === 'round' && st.type === 'lab') {
    const L = st.lab;
    if (qui === L.guide) return;                    // le guide ne bouge pas
    const d = { h: [0, -1], b: [0, 1], g: [-1, 0], d: [1, 0] }[a.v];
    if (!d) return;
    const nx = L.pos.x + d[0], ny = L.pos.y + d[1];
    if (nx < 0 || nx >= L.w || ny < 0 || ny >= L.h) return;
    if (L.g[ny][nx] === '#') { envoie({ t: 'MUR' }); return; }
    L.pos = { x: nx, y: ny };
    if (!L.vus.some(p => p[0] === nx && p[1] === ny)) L.vus.push([nx, ny]);
    if (nx === L.sortie.x && ny === L.sortie.y) {
      st.sc.h++; st.sc.g++;
      reveler({ e: '🧭', t: 'Sortis !', p: 'Guidé les yeux fermés. +1 pour chacun.' });
      return;
    }
    diffuse();
  }

  /* --- le mot le plus long --- */
  else if (a.k === 'mlp' && st.ph === 'round' && st.type === 'mlp') {
    st.ans[qui] = (a.v || '').slice(0, 20);
    if (st.ans.h === null || st.ans.g === null) { diffuse(); return; }
    const faisable = m => {
      const dispo = st.mlp.lettres.map(c => c.toLowerCase());
      return [...norm(m)].every(c => {
        const i = dispo.indexOf(c);
        if (i < 0) return false;
        dispo.splice(i, 1); return true;
      });
    };
    const lh = faisable(st.ans.h) ? norm(st.ans.h).length : 0;
    const lg = faisable(st.ans.g) ? norm(st.ans.g).length : 0;
    if (lh > lg) st.sc.h++;
    else if (lg > lh) st.sc.g++;
    else if (lh > 0) { st.sc.h++; st.sc.g++; }
    reveler({
      e: '🔡',
      t: lh === lg ? 'Égalité' : `${st.nm[lh > lg ? 'h' : 'g']} l'emporte`,
      p: `${st.nm.h} : ${lh || 'lettres non disponibles'} · ${st.nm.g} : ${lg || 'lettres non disponibles'}`,
      deux: true
    });
  }

  /* --- chrono aveugle --- */
  else if (a.k === 'chr' && st.ph === 'round' && st.type === 'chr') {
    const C = st.chr;
    if (a.v === 'start') { if (!C.depart[qui]) { C.depart[qui] = Date.now(); diffuse(); } return; }
    if (!C.depart[qui] || C.arret[qui]) return;
    C.arret[qui] = (Date.now() - C.depart[qui]) / 1000;
    if (C.arret.h === undefined || C.arret.g === undefined) { diffuse(); return; }
    const eh = Math.abs(C.arret.h - C.objectif), eg = Math.abs(C.arret.g - C.objectif);
    if (eh < eg) st.sc.h++; else if (eg < eh) st.sc.g++; else { st.sc.h++; st.sc.g++; }
    reveler({
      e: '⏱️',
      t: eh === eg ? 'Pile la même erreur' : `${st.nm[eh < eg ? 'h' : 'g']} est le plus proche`,
      p: `Objectif ${C.objectif} s · ${st.nm.h} : ${C.arret.h.toFixed(2)} s · ${st.nm.g} : ${C.arret.g.toFixed(2)} s`
    });
  }

  /* --- devine l'emoji --- */
  else if (a.k === 'emo' && st.ph === 'round' && st.type === 'emo') {
    if (st.emo.ko[qui]) return;
    if (norm(a.v) === norm(motSecret)) {
      st.sc[qui]++;
      reveler({ e: '🧩', t: `${st.nm[qui]} a décodé !`, p: `C'était « ${motSecret} ».` });
    } else {
      st.emo.fil = (st.emo.fil || []).concat({ de: qui, txt: a.v }).slice(-6);
      diffuse();
    }
  }

  /* --- action ou vérité : c'est l'AUTRE qui valide --- */
  else if (a.k === 'osa' && st.ph === 'round' && st.type === 'osa') {
    if (qui === st.osa.cible) return;
    if (a.v) { st.sc.h++; st.sc.g++; }
    reveler({
      e: a.v ? '🔥' : '🙈',
      t: a.v ? 'Relevé !' : 'Passé.',
      p: a.v ? '+1 pour chacun. On note.' : 'Pas grave. Ce sera pour la prochaine.'
    });
  }

  /* --- je n'ai jamais --- */
  else if (a.k === 'jam' && st.ph === 'round' && st.type === 'jam') {
    st.ans[qui] = a.v;
    if (!st.ans.h || !st.ans.g) { diffuse(); return; }
    const pareil = st.ans.h === st.ans.g;
    if (pareil) { st.sc.h++; st.sc.g++; }
    reveler({
      e: pareil ? '😳' : '👀',
      t: pareil ? 'Vous êtes pareils.' : 'Ah bon ?',
      p: pareil ? '+1 pour chacun. Vous vous ressemblez plus que prévu.' : 'Voilà qui mérite une explication.',
      deux: true, jam: true
    });
  }

  /* --- la séquence --- */
  else if (a.k === 'seq' && st.ph === 'round' && st.type === 'seq') {
    const S = st.seq;
    if (S.phase !== 'repete' || S.ko[qui]) return;
    if (S.suite[S.pos[qui]] === a.i) {
      S.pos[qui]++;
      if (S.pos[qui] >= S.suite.length) {
        st.sc[qui]++;
        reveler({ e: '🧠', t: `${st.nm[qui]} a tout retenu !`, p: `Les ${S.suite.length} couleurs, dans l'ordre.` });
        return;
      }
      diffuse();
    } else {
      S.ko[qui] = true;
      if (S.ko.h && S.ko.g) reveler({ e: '😵', t: 'Ratée tous les deux', p: 'Personne ne marque, la séquence était vicieuse.' });
      else diffuse();
    }
  }

  /* --- petit bac --- */
  else if (a.k === 'bac' && st.ph === 'round' && st.type === 'bac') {
    st.ans[qui] = (a.v || '').slice(0, 24);
    if (st.ans.h === null || st.ans.g === null) { diffuse(); return; }
    const bon = v => norm(v).startsWith(norm(st.q.lettre));
    const okH = bon(st.ans.h), okG = bon(st.ans.g);
    if (okH) st.sc.h++;
    if (okG) st.sc.g++;
    const dire = (n, o) => `${n} : ${o ? '✅' : '❌ mauvaise lettre'}`;
    reveler({
      e: (okH && okG) ? '🎯' : '🔤',
      t: (okH && okG) ? 'Les deux ont trouvé !' : 'Voyons voir…',
      p: `${dire(st.nm.h, okH)} · ${dire(st.nm.g, okG)}`,
      deux: true
    });
  }

  /* --- tape vite --- */
  else if (a.k === 'tap' && st.ph === 'round' && st.type === 'tap') {
    st.sc[qui]++;
    reveler({ e: '⌨️', t: `${st.nm[qui]} tape le plus vite !`, p: 'Phrase recopiée sans une faute.' });
  }

  /* --- mot de passe --- */
  else if (a.k === 'mdp' && st.ph === 'round' && st.type === 'mdp') {
    const v = (a.v || '').slice(0, 28);
    const estDonneur = qui === st.mdp.donneur;
    if (estDonneur) {
      if (norm(v).includes(norm(motSecret))) { envoie({ t: 'REFUS' }); return; }
      st.mdp.fil.push({ de: qui, txt: v, indice: true });
    } else {
      if (norm(v) === norm(motSecret)) {
        st.sc.h++; st.sc.g++;
        reveler({ e: '🔓', t: 'Trouvé !', p: `C'était bien « ${motSecret} ». +1 pour chacun.` });
        return;
      }
      st.mdp.fil.push({ de: qui, txt: v, indice: false });
    }
    st.mdp.fil = st.mdp.fil.slice(-8);
    diffuse();
  }

  /* --- désamorçage --- */
  else if (a.k === 'bom' && st.ph === 'round' && st.type === 'bom') {
    if (qui !== st.bom.panneau || st.bom.coupe >= 0) return;
    st.bom.coupe = a.i;
    if (a.i === bonFil) {
      st.sc.h++; st.sc.g++;
      reveler({ e: '🧯', t: 'Désamorcée !', p: `Le fil n° ${bonFil + 1} était le bon. +1 pour chacun.` });
    } else {
      reveler({ e: '💥', t: 'Boum.', p: `C'était le fil n° ${bonFil + 1}. Vous vous êtes mal compris.` });
    }
  }

  else if (a.k === 'next' && st.ph === 'rev') manche(st.i + 1);
  else if (a.k === 'again') {
    st = { ...neuf(), nm: st.nm };
    SUITE = construitSuite(longueur, piment ? TYPES_PIMENT : actifs);
    st.total = SUITE.length;
    manche(0);
  }
}

/* NFD sépare les accents, le filtre a-z0-9 les élimine ensuite */
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

function gagneP4(b, pos) {
  const c0 = pos % P4C, l0 = Math.floor(pos / P4C), j = b[pos];
  for (const [dc, dl] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    const suite = [pos];
    for (const s of [1, -1]) {
      let c = c0 + dc * s, l = l0 + dl * s;
      while (c >= 0 && c < P4C && l >= 0 && l < P4L && b[l * P4C + c] === j) { suite.push(l * P4C + c); c += dc * s; l += dl * s; }
    }
    if (suite.length >= 4) return suite;
  }
  return null;
}

function reveler(r) {
  clearTimeout(minuteur); clearInterval(pouls); clearTimeout(tempo);
  st.go = false; st.ph = 'rev'; st.rev = r;
  diffuse();
}

/* en solo, l'hôte joue tantôt pour l'un tantôt pour l'autre :
   on transmet donc le camp courant et non 'h' en dur */
function jouer(a) { if (hote) action(moi, a); else envoie({ t: 'A', a }); }

/* =========================================================
   RENDU
   ========================================================= */
let manchePrec = -1, finLocale = 0, mesCoups = 0, dernierEnvoi = 0, chronoBra = null;

function rendu() {
  if (!st) return;
  if (st.ph === 'end') { finPartie(); return; }
  ecran('s-game');

  /* couleurs et côtés ABSOLUS : les deux écrans sont identiques */
  $('#n1').textContent = (st.nm.h || 'Hôte') + (moi === 'h' ? ' (toi)' : '');
  $('#n2').textContent = (st.nm.g || 'Invité') + (moi === 'g' ? ' (toi)' : '');
  $('#p1').textContent = st.sc.h;
  $('#p2').textContent = st.sc.g;
  $('#r-lab').textContent = `Manche ${st.i + 1} / ${st.total}`;
  $('#r-type').textContent = NOMS[st.type] || '';
  majBascule();

  const on = id => $$('.mode').forEach(m => { m.hidden = m.id !== id; });

  if (st.ph === 'rev') { renduRev(on); return; }

  const T = st.type;

  if (T === 'qui') {
    on('m-qui');
    $('#qui-q').textContent = st.q;
    $('#qui-an').textContent = st.nm.h;
    $('#qui-bn').textContent = st.nm.g;
    const f = st.ans[moi];
    $('#qui-a').classList.toggle('on', f === 'h');
    $('#qui-b').classList.toggle('on', f === 'g');
    $('#qui-a').disabled = !!f; $('#qui-b').disabled = !!f;
    $('#qui-w').textContent = f ? 'C\'est noté. On attend l\'autre…' : 'Répondez tous les deux, sans vous concerter.';
  }

  else if (T === 'pre') {
    on('m-pre');
    $('#pre-an').textContent = st.q[0];
    $('#pre-bn').textContent = st.q[1];
    const f = st.ans[moi];
    $('#pre-a').classList.toggle('on', f === 'a');
    $('#pre-b').classList.toggle('on', f === 'b');
    $('#pre-a').disabled = !!f; $('#pre-b').disabled = !!f;
    $('#pre-w').textContent = f ? 'Choisi. On attend l\'autre…' : 'Le but : tomber sur le même choix.';
  }

  else if (T === 'syn') {
    on('m-syn');
    $('#syn-q').textContent = st.q;
    const f = st.ans[moi] !== null;
    $('#syn-in').disabled = f; $('#syn-ok').disabled = f;
    $('#syn-w').textContent = f ? 'Envoyé. On attend l\'autre…' : 'Le but : écrire exactement la même chose.';
  }

  else if (T === 'ref') {
    on('m-ref');
    $('#ref-t').classList.toggle('go', !!st.go);
    $('#ref-t').disabled = false;
    $('#ref-face').textContent = st.go ? '💗' : '⏳';
    $('#ref-w').textContent = st.go ? 'MAINTENANT !' : 'Attends le signal… ne clique pas trop tôt.';
  }

  else if (T === 'bra') {
    on('m-bra');
    $('#bra-nl').textContent = st.nm.h; $('#bra-nr').textContent = st.nm.g;
    $('#bra-b').disabled = false;
    if (manchePrec !== st.i) { manchePrec = st.i; mesCoups = 0; finLocale = Date.now() + (st.dur.bra || 12000); }
    corde(st.bf ? st.bf.h : 0, st.bf ? st.bf.g : 0);
    lanceChronoBra();
  }

  else if (T === 'p4') {
    on('m-p4');
    const P = st.p4, aMoi = P.tour === moi;
    $('#p4-q').textContent = aMoi ? 'À toi de jouer.' : `${st.nm[autre]} réfléchit…`;
    const g = $('#p4-grid');
    g.classList.toggle('off', !aMoi);
    if (g.children.length !== P4C * P4L) {
      g.innerHTML = '';
      for (let k = 0; k < P4C * P4L; k++) {
        const b = document.createElement('button');
        b.addEventListener('click', () => jouer({ k: 'p4', c: k % P4C }));
        g.appendChild(b);
      }
    }
    [...g.children].forEach((b, k) => {
      b.className = P.b[k] || '';
      if (P.win && P.win.includes(k)) b.classList.add('win');
    });
    $('#p4-w').textContent = aMoi ? 'Clique dans la colonne de ton choix.' : 'Patience…';
  }

  else if (T === 'pfc') {
    on('m-pfc');
    $('#pfc-sc').textContent = `${st.pfc.h} — ${st.pfc.g}`;
    const f = !!st.ans[moi];
    $$('.pfc').forEach(b => { b.disabled = f; b.classList.toggle('on', st.ans[moi] === b.dataset.v); });
    $('#pfc-w').textContent = st.pfc.res ? `${st.pfc.res} — duel ${st.pfc.n}/3`
      : (f ? 'Choisi. On attend l\'autre…' : `Duel ${st.pfc.n} : choisis vite.`);
  }

  else if (T === 'vf') {
    on('m-vf');
    const jeRaconte = st.vf.teller === moi;
    $('#vf-write').hidden = !(jeRaconte && st.sub === 'write');
    $('#vf-guess').hidden = !(!jeRaconte && st.sub === 'guess');
    if (st.sub === 'write') {
      $('#vf-q').textContent = jeRaconte ? 'Raconte un truc sur toi. Vrai ou complètement inventé, à toi de voir.'
        : `${st.nm[autre]} prépare quelque chose sur lui…`;
      $('#vf-w').textContent = jeRaconte ? 'Écris, puis dis si c\'est vrai ou faux.' : 'Ça arrive…';
    } else {
      $('#vf-claim').textContent = st.vf.txt;
      $('#vf-q').textContent = jeRaconte ? 'À l\'autre de deviner…' : `${st.nm[autre]} affirme :`;
      $('#vf-w').textContent = jeRaconte ? 'On verra bien si ça passe.' : 'Vrai, ou bien on t\'embrouille ?';
    }
  }

  else if (T === 'int') {
    on('m-int');
    const I = st.int, g = $('#int-grid');
    g.style.setProperty('--n', 6);
    g.classList.toggle('off', !!I.bloque[moi]);
    if (g.children.length !== I.n || g.dataset.r !== String(st.i)) {
      g.dataset.r = String(st.i);
      g.innerHTML = '';
      for (let k = 0; k < I.n; k++) {
        const b = document.createElement('button');
        b.textContent = k === I.idx ? I.cible : I.base;
        b.addEventListener('click', () => {
          if (k !== I.idx) { b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 350); }
          jouer({ k: 'int', c: k });
        });
        g.appendChild(b);
      }
    }
    $('#int-w').textContent = I.bloque[moi] ? 'Raté — tu es bloqué une seconde.' : 'Cherche bien…';
  }

  else if (T === 'cha') {
    on('m-cha');
    const C = st.cha, g = $('#cha-grid');
    if (g.children.length !== 16) {
      g.innerHTML = '';
      for (let k = 0; k < 16; k++) {
        const b = document.createElement('button');
        b.addEventListener('click', () => {
          const o = (st.cha.act || []).find(x => x.c === k);
          if (o) jouer({ k: 'cha', id: o.id });
        });
        g.appendChild(b);
      }
    }
    [...g.children].forEach((b, k) => {
      const o = (C.act || []).find(x => x.c === k);
      b.className = o ? 'up' : '';
      b.textContent = o ? '💗' : '';
    });
    if (manchePrec !== st.i) { manchePrec = st.i; finLocale = Date.now() + (st.dur.cha || 25000); }
    $('#cha-q').textContent = `Attrapez ${C.but} cœurs à deux !`;
    lanceChronoCha();
  }

  else if (T === 'mem') {
    on('m-mem');
    const M = st.mem, g = $('#mem-grid'), aMoi = M.tour === moi;
    g.classList.toggle('off', !aMoi || M.up.length >= 2);
    if (g.children.length !== M.c.length || g.dataset.r !== String(st.i)) {
      g.dataset.r = String(st.i);
      g.innerHTML = '';
      M.c.forEach((_, k) => {
        const b = document.createElement('button');
        b.addEventListener('click', () => jouer({ k: 'mem', c: k }));
        g.appendChild(b);
      });
    }
    [...g.children].forEach((b, k) => {
      const vis = M.up.includes(k) || M.ok.includes(k);
      b.className = M.ok.includes(k) ? 'ok' : (M.up.includes(k) ? 'up' : '');
      b.textContent = vis ? M.c[k] : '💜';
    });
    $('#mem-q').textContent = aMoi ? 'À toi de retourner une carte.' : `${st.nm[autre]} joue…`;
    $('#mem-w').textContent = `${M.ok.length / 2} paire(s) sur ${M.c.length / 2} — ${M.coups} coups`;
  }

  else if (T === 'qz') {
    on('m-qz');
    $('#qz-q').textContent = st.q.t;
    const g = $('#qz-opts');
    g.classList.toggle('off', !!st.qzKO[moi]);
    if (g.dataset.r !== String(st.i)) {
      g.dataset.r = String(st.i);
      g.innerHTML = '';
      st.q.o.forEach((o, k) => {
        const b = document.createElement('button');
        b.textContent = o;
        b.addEventListener('click', () => { b.classList.add('bad'); jouer({ k: 'qz', c: k }); });
        g.appendChild(b);
      });
    }
    $('#qz-w').textContent = st.qzKO[moi] ? 'Raté — laisse l\'autre tenter.' : 'Le premier qui trouve marque le point.';
  }

  else if (T === 'pen') {
    on('m-pen');
    const P = st.pen;
    $('#pen-mot').textContent = [...P.mot]
      .map(c => (c === ' ' || c === '-') ? c : (P.tentees.includes(c) ? c : '_')).join(' ');
    const cl = $('#pen-clavier');
    if (cl.dataset.r !== String(st.i)) {
      cl.dataset.r = String(st.i); cl.innerHTML = '';
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(L => {
        const b = document.createElement('button');
        b.textContent = L;
        b.addEventListener('click', () => jouer({ k: 'pen', v: L }));
        cl.appendChild(b);
      });
    }
    [...cl.children].forEach(b => {
      const t = P.tentees.includes(b.textContent);
      b.disabled = t;
      b.className = t ? (P.mot.includes(b.textContent) ? 'ok' : 'no') : '';
    });
    $('#pen-w').textContent = `${P.max - P.ratees} erreur(s) restante(s)`;
  }

  else if (T === 'pom') {
    on('m-pom');
    $('#pom-fil').innerHTML = st.pom.fil.map(m =>
      `<span>${esc(st.nm[m.de])} : ${m.v} ${m.sens}</span>`).join('');
    $('#pom-w').textContent = '↑ c\'est plus grand · ↓ c\'est plus petit';
  }

  else if (T === 'lab') {
    on('m-lab');
    const L = st.lab, jeGuide = L.guide === moi;
    $('#lab-q').textContent = jeGuide
      ? 'Tu vois le plan. Guide-le à la voix, il avance à l\'aveugle.'
      : 'Tu ne vois presque rien. Écoute-le et avance.';
    $('#lab-dpad').hidden = jeGuide;
    const g = $('#lab-grille');
    g.style.gridTemplateColumns = `repeat(${L.w}, 1fr)`;
    if (g.dataset.r !== String(st.i)) { g.dataset.r = String(st.i); g.innerHTML = ''; }
    if (g.children.length !== L.w * L.h) {
      g.innerHTML = '';
      for (let k = 0; k < L.w * L.h; k++) g.appendChild(document.createElement('i'));
    }
    [...g.children].forEach((el, k) => {
      const x = k % L.w, y = Math.floor(k / L.w);
      const ici = x === L.pos.x && y === L.pos.y;
      const but = x === L.sortie.x && y === L.sortie.y;
      const vu = L.vus.some(p => p[0] === x && p[1] === y);
      const proche = Math.abs(x - L.pos.x) + Math.abs(y - L.pos.y) <= 1;
      let c = '';
      if (ici) c = 'moi';
      else if (but && (jeGuide || vu)) c = 'but';
      else if (jeGuide || proche) c = L.g[y][x] === '#' ? 'mur' : '';
      else if (vu) c = 'vu';
      el.className = c;
    });
    $('#lab-w').textContent = jeGuide ? 'Décris-lui les murs et les tournants.' : 'Tu ne vois que les cases juste à côté.';
  }

  else if (T === 'mlp') {
    on('m-mlp');
    $('#mlp-lettres').innerHTML = st.mlp.lettres.map(l => `<span>${l}</span>`).join('');
    const fait = st.ans[moi] !== null;
    $('#mlp-in').disabled = fait;
    $('#mlp-w').textContent = fait ? 'Envoyé. On attend l\'autre…' : 'Chaque lettre ne sert qu\'une fois.';
  }

  else if (T === 'chr') {
    on('m-chr');
    const C = st.chr, lance = !!C.depart[moi], stop = C.arret[moi] !== undefined;
    $('#chr-q').textContent = `Arrête-toi à exactement ${C.objectif} secondes.`;
    $('#chr-btn').textContent = stop ? 'ENVOYÉ' : (lance ? 'STOP !' : 'DÉMARRER');
    $('#chr-btn').disabled = stop;
    $('#chr-w').textContent = stop
      ? 'On attend l\'autre…'
      : (lance ? 'Compte dans ta tête. Aucun chiffre ne s\'affichera.' : 'Appuie quand tu es prêt.');
  }

  else if (T === 'emo') {
    on('m-emo');
    $('#emo-suite').textContent = st.emo.suite;
    $('#emo-fil').innerHTML = (st.emo.fil || []).map(m =>
      `<span>${esc(m.txt)}</span>`).join('');
    $('#emo-in').disabled = !!st.emo.ko[moi];
    $('#emo-w').textContent = 'Le premier qui trouve marque le point.';
  }

  else if (T === 'osa') {
    on('m-osa');
    const O = st.osa, pourMoi = O.cible === moi;
    $('#osa-genre').textContent = O.genre === 'v' ? 'VÉRITÉ' : 'ACTION';
    $('#osa-genre').className = 'osa-genre ' + (O.genre === 'v' ? 'v' : 'a');
    $('#osa-pour').textContent = pourMoi ? 'C\'est pour toi.' : `C'est pour ${st.nm[autre]}.`;
    $('#osa-txt').textContent = O.txt;
    $('#osa-boutons').hidden = pourMoi;
    $('#osa-w').textContent = pourMoi
      ? 'Vas-y. C\'est l\'autre qui valide.'
      : 'À toi de dire si c\'est validé.';
  }

  else if (T === 'jam') {
    on('m-jam');
    $('#jam-q').textContent = st.q;
    const f = st.ans[moi];
    $('#jam-si').classList.toggle('on', f === 'si');
    $('#jam-non').classList.toggle('on', f === 'jamais');
    $('#jam-si').disabled = !!f; $('#jam-non').disabled = !!f;
    $('#jam-w').textContent = f ? 'C\'est noté. On attend l\'autre…' : 'Répondez tous les deux, honnêtement.';
  }

  else if (T === 'seq') {
    on('m-seq');
    const S = st.seq, montre = S.phase === 'montre';
    $('#seq-pads').classList.toggle('off', !montre ? !!S.ko[moi] : true);
    $('#seq-q').textContent = montre ? 'Retiens bien la séquence…' : 'À toi de la refaire.';
    if (montre && seqJouee !== st.i) { seqJouee = st.i; rejoueSequence(S.suite); }
    $('#seq-w').textContent = S.ko[moi]
      ? 'Raté. On attend l\'autre.'
      : (montre ? 'Regarde.' : `${S.pos[moi]} / ${S.suite.length}`);
  }

  else if (T === 'bac') {
    on('m-bac');
    $('#bac-lettre').textContent = st.q.lettre;
    $('#bac-q').textContent = `Trouve ${st.q.cat} qui commence par…`;
    const fait = st.ans[moi] !== null;
    $('#bac-in').disabled = fait;
    $('#bac-w').textContent = fait ? 'Envoyé. On attend l\'autre…' : 'Le premier mot qui te vient.';
  }

  else if (T === 'tap') {
    on('m-tap');
    $('#tap-phrase').textContent = st.q;
    if (tapRound !== st.i) { tapRound = st.i; $('#tap-in').value = ''; $('#tap-jauge').style.width = '0%'; $('#tap-in').focus(); }
    $('#tap-w').textContent = 'Le premier qui la recopie sans faute marque.';
  }

  else if (T === 'mdp') {
    on('m-mdp');
    const jeDonne = st.mdp.donneur === moi;
    $('#mdp-q').textContent = jeDonne
      ? `Fais-lui deviner : « ${st.q} »`
      : `${st.nm[autre]} te donne des indices. Trouve le mot.`;
    $('#mdp-in').placeholder = jeDonne ? 'un indice, un seul mot…' : 'ta proposition…';
    if (manchePrec !== st.i) { manchePrec = st.i; finLocale = Date.now() + (75000 * 1); $('#mdp-in').value = ''; }
    $('#mdp-fil').innerHTML = st.mdp.fil.map(m =>
      `<span class="${m.de === moi ? 'moi' : ''}">${m.indice ? '💡 ' : '❓ '}${esc(m.txt)}</span>`).join('');
    lanceChronoMdp();
  }

  else if (T === 'bom') {
    on('m-bom');
    const jeCoupe = st.bom.panneau === moi;
    $('#bom-panneau').hidden = !jeCoupe;
    $('#bom-manuel').hidden = jeCoupe;
    $('#bom-q').textContent = jeCoupe
      ? 'Tu as les fils. Décris-les à voix haute, c\'est l\'autre qui a le manuel.'
      : 'Tu as le manuel. Lis-le à voix haute, c\'est l\'autre qui coupe.';
    if (!jeCoupe) $('#bom-regle').textContent = st.bom.regle;
    const box = $('#bom-fils');
    if (box.dataset.r !== String(st.i)) {
      box.dataset.r = String(st.i);
      box.innerHTML = '';
      st.bom.fils.forEach((c, k) => {
        const b = document.createElement('button');
        b.className = c; b.dataset.n = 'n° ' + (k + 1);
        b.addEventListener('click', () => jouer({ k: 'bom', i: k }));
        box.appendChild(b);
      });
    }
    box.classList.toggle('off', st.bom.coupe >= 0);
    [...box.children].forEach((b, k) => b.classList.toggle('coupe', st.bom.coupe === k));
    $('#bom-w').textContent = 'Parlez-vous. Vous n\'avez pas les mêmes informations.';
  }

  else if (T === 'des') {
    on('m-des');
    const jeDessine = st.drawer === moi;
    $('#des-q').textContent = jeDessine ? `Fais-lui deviner : « ${st.q} »` : `${st.nm[st.drawer]} dessine. À toi de trouver.`;
    $('#des-tools').hidden = !jeDessine;
    $('#des-form').hidden = jeDessine;
    pad.style.cursor = jeDessine ? 'crosshair' : 'default';
    $('#des-live').innerHTML = (st.guesses || []).map(g => `<b>${esc(g)}</b>`).join(' · ');
    if (manchePrec !== st.i) { manchePrec = st.i; finLocale = Date.now() + (st.dur.des || 90000); raz(); histTrace = []; }
    lanceChrono();
  }
}

function renduRev(on) {
  on('m-rev');
  $('#rev-e').textContent = st.rev.e;
  $('#rev-t').textContent = st.rev.t;
  $('#rev-p').textContent = st.rev.p;
  const box = $('#rev-two'); box.innerHTML = '';
  if (st.rev.deux) {
    ['h', 'g'].forEach(k => {
      let v;
      if (st.rev.jam) v = st.ans[k] === 'si' ? 'Moi si 🙋' : 'Moi jamais 🙅';
      else if (st.rev.pre) v = st.ans[k] === 'a' ? st.q[0] : st.q[1];
      else if (st.type === 'qui') v = st.nm[st.ans[k]] || '?';
      else v = st.ans[k] || '—';
      const d = document.createElement('div');
      d.className = 'rev-c';
      d.innerHTML = `<small>${esc(st.nm[k])}</small><span>${esc(v)}</span>`;
      box.appendChild(d);
    });
  }
  const btn = $('#rev-next');
  if (st.rev.juge) {
    btn.textContent = 'On avait pareil ✅';
    btn.onclick = () => jouer({ k: 'juge', v: true });
    if (!$('#rev-no')) {
      const no = document.createElement('button');
      no.className = 'btn ghost'; no.id = 'rev-no'; no.textContent = 'Pas pareil ❌';
      no.style.marginLeft = '10px';
      no.onclick = () => jouer({ k: 'juge', v: false });
      btn.after(no);
    }
    $('#rev-w').textContent = 'L\'un de vous deux tranche.';
  } else {
    $('#rev-no')?.remove();
    btn.textContent = 'Manche suivante →';
    btn.onclick = () => jouer({ k: 'next' });
    $('#rev-w').textContent = 'Vous pouvez cliquer tous les deux.';
  }
}

/* ---------- chronos locaux (les deux PC n'ont pas la même heure) ---------- */
function lanceChrono() {
  clearInterval(chrono);
  chrono = setInterval(() => {
    if (!st || st.type !== 'des' || st.ph !== 'round') { clearInterval(chrono); return; }
    $('#des-w').textContent = `${Math.max(0, Math.ceil((finLocale - Date.now()) / 1000))} s`;
  }, 250);
}
function lanceChronoCha() {
  clearInterval(chrono);
  chrono = setInterval(() => {
    if (!st || st.type !== 'cha' || st.ph !== 'round') { clearInterval(chrono); return; }
    $('#cha-w').textContent = `${Math.max(0, Math.ceil((finLocale - Date.now()) / 1000))} s — ${st.cha.pris} / ${st.cha.but}`;
  }, 200);
}
function lanceChronoBra() {
  clearInterval(chronoBra);
  chronoBra = setInterval(() => {
    if (!st || st.type !== 'bra' || st.ph !== 'round') { clearInterval(chronoBra); return; }
    const r = Math.max(0, Math.ceil((finLocale - Date.now()) / 1000));
    $('#bra-w').textContent = `${r} s — ${mesCoups} coups`;
    if (r === 0) $('#bra-b').disabled = true;
  }, 150);
}

/* ---------- interactions ---------- */
function topDepart() {
  if (!st) return;
  st.go = true;
  $('#ref-t').classList.add('go');
  $('#ref-face').textContent = '💗';
  $('#ref-w').textContent = 'MAINTENANT !';
}
$('#ref-t').addEventListener('click', () => {
  if (!st || st.type !== 'ref' || st.ph !== 'round') return;
  $('#ref-t').disabled = true; jouer({ k: 'hit' });
});

/* --- plus ou moins --- */
$('#pom-form').addEventListener('submit', e => {
  e.preventDefault();
  const el = $('#pom-in'), v = el.value.trim();
  if (!v) { el.focus(); return; }
  jouer({ k: 'pom', v }); el.value = ''; el.focus();
});

/* --- labyrinthe : les 4 flèches --- */
$$('#lab-dpad button').forEach(b => b.addEventListener('click', () => jouer({ k: 'lab', v: b.dataset.d })));

/* --- le mot le plus long --- */
$('#mlp-form').addEventListener('submit', e => {
  e.preventDefault();
  const el = $('#mlp-in'), v = el.value.trim();
  if (!v) { el.focus(); return; }
  jouer({ k: 'mlp', v }); el.value = '';
});

/* --- chrono aveugle : premier appui = départ, second = arrêt --- */
$('#chr-btn').addEventListener('click', () => {
  if (!st || st.type !== 'chr' || st.ph !== 'round') return;
  jouer({ k: 'chr', v: st.chr.depart[moi] ? 'stop' : 'start' });
});

/* --- devine l'emoji --- */
$('#emo-form').addEventListener('submit', e => {
  e.preventDefault();
  const el = $('#emo-in'), v = el.value.trim();
  if (!v) { el.focus(); return; }
  jouer({ k: 'emo', v }); el.value = ''; el.focus();
});

$('#osa-ok').addEventListener('click', () => jouer({ k: 'osa', v: true }));
$('#osa-non').addEventListener('click', () => jouer({ k: 'osa', v: false }));
$('#jam-si').addEventListener('click', () => jouer({ k: 'jam', v: 'si' }));
$('#jam-non').addEventListener('click', () => jouer({ k: 'jam', v: 'jamais' }));

$('#qui-a').addEventListener('click', () => jouer({ k: 'qui', v: 'h' }));
$('#qui-b').addEventListener('click', () => jouer({ k: 'qui', v: 'g' }));
$('#pre-a').addEventListener('click', () => jouer({ k: 'pre', v: 'a' }));
$('#pre-b').addEventListener('click', () => jouer({ k: 'pre', v: 'b' }));
$$('.pfc').forEach(b => b.addEventListener('click', () => jouer({ k: 'pfc', v: b.dataset.v })));

function envoieSyn() {
  const v = $('#syn-in').value.trim();
  if (!v) return;
  jouer({ k: 'syn', v }); $('#syn-in').value = '';
}
$('#syn-ok').addEventListener('click', envoieSyn);
$('#syn-in').addEventListener('keydown', e => { if (e.key === 'Enter') envoieSyn(); });

function envoieVF(v) {
  const t = $('#vf-in').value.trim();
  if (!t) { toast('Écris quelque chose d\'abord'); return; }
  jouer({ k: 'vfw', txt: t, v }); $('#vf-in').value = '';
}
$('#vf-true').addEventListener('click', () => envoieVF(true));
$('#vf-false').addEventListener('click', () => envoieVF(false));
$('#vf-gt').addEventListener('click', () => jouer({ k: 'vfg', v: true }));
$('#vf-gf').addEventListener('click', () => jouer({ k: 'vfg', v: false }));

/* --- la séquence : rejoue l'animation en local --- */
let seqJouee = -1, tapRound = -1;
function rejoueSequence(suite) {
  const pads = $$('#seq-pads .pad');
  pads.forEach(p => p.classList.remove('vif'));
  suite.forEach((v, k) => {
    setTimeout(() => {
      if (!st || st.type !== 'seq') return;
      pads[v].classList.add('vif');
      setTimeout(() => pads[v].classList.remove('vif'), 340);
    }, 700 + k * 620);
  });
}
$$('#seq-pads .pad').forEach(b => b.addEventListener('click', () => {
  if (!st || st.type !== 'seq' || st.ph !== 'round' || st.seq.phase !== 'repete') return;
  b.classList.add('vif');
  setTimeout(() => b.classList.remove('vif'), 200);
  jouer({ k: 'seq', i: +b.dataset.i });
}));

/* --- petit bac --- */
$('#bac-form').addEventListener('submit', e => {
  e.preventDefault();
  const el = $('#bac-in'), v = el.value.trim();
  if (!v) { el.focus(); return; }
  jouer({ k: 'bac', v }); el.value = '';
});

/* --- tape vite : on compare à chaque frappe --- */
$('#tap-in').addEventListener('input', e => {
  if (!st || st.type !== 'tap' || st.ph !== 'round') return;
  const cible = norm(st.q), tape = norm(e.target.value);
  const p = Math.min(100, (tape.length / Math.max(1, cible.length)) * 100);
  $('#tap-jauge').style.width = p.toFixed(1) + '%';
  if (tape === cible) { e.target.value = ''; jouer({ k: 'tap' }); }
});
$('#tap-form').addEventListener('submit', e => e.preventDefault());

/* --- mot de passe --- */
$('#mdp-form').addEventListener('submit', e => {
  e.preventDefault();
  const el = $('#mdp-in'), v = el.value.trim();
  if (!v) { el.focus(); return; }
  jouer({ k: 'mdp', v }); el.value = ''; el.focus();
});
function lanceChronoMdp() {
  clearInterval(chrono);
  chrono = setInterval(() => {
    if (!st || st.type !== 'mdp' || st.ph !== 'round') { clearInterval(chrono); return; }
    const r = Math.max(0, Math.ceil((finLocale - Date.now()) / 1000));
    const jeDonne = st.mdp.donneur === moi;
    $('#mdp-w').textContent = `${r} s — ${jeDonne ? 'un seul mot par indice, et jamais le mot lui-même' : 'propose autant que tu veux'}`;
  }, 250);
}

/* bras de fer */
function corde(a, b) {
  const t = a + b, p = t ? (a / t) : .5;
  $('#bra-h').style.left = (12 + p * 76) + '%';
}
function poulsRecu(m) {
  if (!st || st.type !== 'bra' || hote) return;
  st.bf = { h: m.h, g: m.g };
  corde(st.bf.h, st.bf.g);
}
$('#bra-b').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (!st || st.type !== 'bra' || st.ph !== 'round' || Date.now() > finLocale) return;
  mesCoups++;
  const now = Date.now();
  if (now - dernierEnvoi > 110) { dernierEnvoi = now; jouer({ k: 'bf', n: mesCoups }); }
});

/* dessin */
const pad = $('#pad'), ctx = pad.getContext('2d');
let trace = false, coul = '#ffffff', buf = [], dernier = null;
/* on garde tout le tracé de la manche pour pouvoir le renvoyer
   si l'autre perd la connexion en plein milieu */
let histTrace = [];
function raz() { ctx.clearRect(0, 0, pad.width, pad.height); }
function segment(a, b, c) {
  ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(a[0] * pad.width, a[1] * pad.height);
  ctx.lineTo(b[0] * pad.width, b[1] * pad.height); ctx.stroke();
}
const posXY = e => { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
pad.addEventListener('pointerdown', e => {
  if (!st || st.type !== 'des' || st.ph !== 'round' || st.drawer !== moi) return;
  trace = true; dernier = posXY(e); pad.setPointerCapture(e.pointerId);
});
pad.addEventListener('pointermove', e => {
  if (!trace) return;
  e.preventDefault();
  const p = posXY(e);
  segment(dernier, p, coul);
  buf.push([dernier[0], dernier[1], p[0], p[1]]);
  dernier = p;
  if (buf.length > 6) purge();
});
addEventListener('pointerup', () => { if (trace) { trace = false; purge(); } });
function purge() {
  if (!buf.length) return;
  const m = { t: 'D', s: buf, c: coul };
  histTrace.push(m);
  envoie(m);
  buf = [];
}
/* renvoie tout le dessin en cours (après une reconnexion) */
function renvoieDessin() {
  if (!st || st.type !== 'des' || st.drawer !== moi || !histTrace.length) return;
  envoie({ t: 'D', raz: true });
  histTrace.forEach(m => envoie(m));
}
function dessineDistant(m) {
  if (m.raz) { raz(); return; }
  (m.s || []).forEach(s => segment([s[0], s[1]], [s[2], s[3]], m.c));
}
$$('.tool').forEach(b => b.addEventListener('click', () => {
  coul = b.dataset.c;
  $$('.tool').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
}));
$('#des-clear').addEventListener('click', () => { raz(); histTrace = []; envoie({ t: 'D', raz: true }); });

/* formulaire : marche au bouton ET à la touche entrée du clavier mobile */
$('#des-form').addEventListener('submit', e => {
  e.preventDefault();
  const el = $('#des-in'), v = el.value.trim();
  if (!v) { el.focus(); return; }
  jouer({ k: 'guess', v });
  el.value = '';
  el.focus();
});

/* =========================================================
   FIN
   ========================================================= */
function finPartie() {
  ecran('s-end');
  const a = st.sc.h, b = st.sc.g;
  $('#end-sc').innerHTML =
    `<div><small>${esc(st.nm.h)}</small><b>${a}</b></div>` +
    `<div><small>${esc(st.nm.g)}</small><b>${b}</b></div>`;
  if (a === b) {
    $('#end-e').textContent = '🤝';
    $('#end-t').textContent = 'Égalité parfaite';
    $('#end-p').textContent = 'Franchement, c\'est le meilleur résultat possible pour un couple.';
  } else {
    $('#end-e').textContent = '🏆';
    $('#end-t').textContent = `${a > b ? st.nm.h : st.nm.g} gagne cette partie`;
    $('#end-p').textContent = 'L\'autre prendra sa revanche. Il y a toujours une revanche.';
  }
  boum(200);
}
$('#b-again').addEventListener('click', () => jouer({ k: 'again' }));

/* =========================================================
   CONFETTIS + TOAST
   ========================================================= */
const cv = $('#conf'), cx = cv.getContext('2d');
let parts = [], tourne = false;
const taille = () => { cv.width = innerWidth; cv.height = innerHeight; };
taille(); addEventListener('resize', taille);
const COUL = ['#8b5cf6', '#ff6fae', '#5ee0e6', '#ffd76e', '#fff'];
function boum(n = 140) {
  for (let i = 0; i < n; i++) parts.push({
    x: innerWidth / 2, y: innerHeight * .34,
    vx: (Math.random() - .5) * 18, vy: Math.random() * -16 - 1,
    w: 6 + Math.random() * 7, h: 8 + Math.random() * 8,
    c: pick(COUL), a: Math.random() * 6.3, va: (Math.random() - .5) * .5, l: 1
  });
  if (!tourne) anime();
}
function anime() {
  tourne = true;
  (function pas() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.l > 0 && p.y < cv.height + 60);
    parts.forEach(p => {
      p.vy += .42; p.x += p.vx; p.y += p.vy; p.a += p.va; p.l -= .004;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a);
      cx.globalAlpha = Math.max(0, p.l); cx.fillStyle = p.c;
      cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
    });
    if (parts.length) requestAnimationFrame(pas);
    else { cx.clearRect(0, 0, cv.width, cv.height); tourne = false; }
  })();
}

let tToast = null;
function toast(t) {
  const el = $('#toast');
  el.textContent = t; el.hidden = false;
  clearTimeout(tToast);
  tToast = setTimeout(() => { el.hidden = true; }, 3200);
}
