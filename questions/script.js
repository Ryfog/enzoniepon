/* =========================================================
   LE GRAND QUESTIONNAIRE
   Une soixantaine de questions, des petits jeux glissés au
   hasard entre les blocs, tout est gardé au fur et à mesure
   pour qu'elle puisse s'arrêter et revenir.
   ========================================================= */
const $ = s => document.querySelector(s);
const pick = a => a[Math.floor(Math.random() * a.length)];
const melange = a => [...a].sort(() => Math.random() - .5);

/* ---------- on met les questions à plat, jeux compris ---------- */
function construitParcours() {
  const p = [];
  let jeux = melange(JEUX);
  BLOCS.forEach((b, bi) => {
    b.qs.forEach((q, qi) => {
      p.push({ k: 'q', bloc: b.titre, sous: b.sous, ...q, id: `${bi}-${qi}` });
    });
    /* une pause après chaque bloc sauf le dernier */
    if (bi < BLOCS.length - 1) {
      if (!jeux.length) jeux = melange(JEUX);
      p.push({ k: 'jeu', jeu: jeux.pop(), mot: PAUSES[bi % PAUSES.length] });
    }
  });
  return p;
}
const PARCOURS = construitParcours();
const NB_Q = PARCOURS.filter(e => e.k === 'q').length;

/* =========================================================
   DÉPÔT CHIFFRÉ
   Les réponses sont chiffrées dans le navigateur avant de
   partir. Le service qui les héberge ne reçoit que du
   charabia : sans le mot de passe, il n'y a rien à lire.
   ========================================================= */
const BOITE = 'https://jsonblob.com/api/jsonBlob/019fdbf1-2700-7db5-9051-0cbe36acf314';

const enc = new TextEncoder();
const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));

async function cleDepuis(mdp, sel) {
  const base = await crypto.subtle.importKey('raw', enc.encode(mdp), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: sel, iterations: 150000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function chiffre(objet, mdp) {
  const sel = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await cleDepuis(mdp, sel);
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(JSON.stringify(objet)));
  return { v: 1, sel: b64(sel), iv: b64(iv), data: b64(c) };
}

/* ---------- mémoire ---------- */
const CLE = 'questions_stacy';
let etat = { i: 0, rep: {} };
try { Object.assign(etat, JSON.parse(localStorage.getItem(CLE) || '{}')); } catch (e) {}
const garde = () => { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {} };

const ecran = id => document.querySelectorAll('.ecran').forEach(s => s.classList.toggle('on', s.id === id));

/* =========================================================
   ACCUEIL
   ========================================================= */
if (etat.i > 0) $('#b-reprendre').hidden = false;
$('#b-start').addEventListener('click', () => { etat = { i: 0, rep: {} }; garde(); montre(); });
$('#b-reprendre').addEventListener('click', montre);

/* =========================================================
   AFFICHAGE D'UNE ÉTAPE
   ========================================================= */
let choixCourant = null;

function montre() {
  if (etat.i >= PARCOURS.length) return fin();
  const e = PARCOURS[etat.i];
  garde();

  const faites = PARCOURS.slice(0, etat.i).filter(x => x.k === 'q').length;
  $('#barre-in').style.width = (faites / NB_Q * 100).toFixed(1) + '%';
  $('#avance').textContent = `${Math.min(faites + 1, NB_Q)} / ${NB_Q}`;

  if (e.k === 'jeu') { ecran('e-jeu'); lanceJeu(e); return; }

  ecran('e-quiz');
  $('#bloc-titre').textContent = e.bloc;
  $('#question').textContent = e.q;
  choixCourant = etat.rep[e.id] ?? null;

  ['z-texte', 'z-choix', 'z-duo', 'z-echelle'].forEach(z => { $('#' + z).hidden = true; });

  if (e.t === 'texte') {
    $('#z-texte').hidden = false;
    const ta = $('#rep-texte');
    ta.value = etat.rep[e.id] || '';
    ta.placeholder = e.ph || 'écris ce que tu veux…';
    setTimeout(() => ta.focus(), 60);
  }

  else if (e.t === 'choix') {
    const z = $('#z-choix'); z.hidden = false; z.innerHTML = '';
    e.o.forEach(o => {
      const b = document.createElement('button');
      b.className = 'opt' + (choixCourant === o ? ' on' : '');
      b.textContent = o;
      b.addEventListener('click', () => {
        choixCourant = o;
        [...z.children].forEach(c => c.classList.toggle('on', c === b));
      });
      z.appendChild(b);
    });
  }

  else if (e.t === 'duo') {
    $('#z-duo').hidden = false;
    $('#duo-a').textContent = e.a;
    $('#duo-b').textContent = e.b;
    $('#duo-a').classList.toggle('on', choixCourant === e.a);
    $('#duo-b').classList.toggle('on', choixCourant === e.b);
  }

  else if (e.t === 'echelle') {
    $('#z-echelle').hidden = false;
    const v = etat.rep[e.id] ? parseInt(etat.rep[e.id], 10) : 5;
    $('#ech').value = v;
    $('#ech-val').textContent = v;
    $('#ech-bas').textContent = e.bas || '1';
    $('#ech-haut').textContent = e.haut || '10';
    choixCourant = String(v);
  }
}

$('#duo-a').addEventListener('click', () => {
  const e = PARCOURS[etat.i];
  choixCourant = e.a;
  $('#duo-a').classList.add('on'); $('#duo-b').classList.remove('on');
});
$('#duo-b').addEventListener('click', () => {
  const e = PARCOURS[etat.i];
  choixCourant = e.b;
  $('#duo-b').classList.add('on'); $('#duo-a').classList.remove('on');
});
$('#ech').addEventListener('input', e => {
  $('#ech-val').textContent = e.target.value;
  choixCourant = e.target.value;
});

function valide(passe) {
  const e = PARCOURS[etat.i];
  if (!passe) {
    const v = e.t === 'texte' ? $('#rep-texte').value.trim() : choixCourant;
    if (v) etat.rep[e.id] = v;
  }
  etat.i++; garde(); montre();
}
$('#b-suivant').addEventListener('click', () => valide(false));
$('#b-passer').addEventListener('click', () => valide(true));

/* entrée = suivant, sauf dans la zone de texte où on garde les retours à la ligne */
addEventListener('keydown', ev => {
  if (ev.key !== 'Enter' || ev.shiftKey) return;
  if (!$('#e-quiz').classList.contains('on')) return;
  if (ev.target.tagName === 'TEXTAREA') return;
  valide(false);
});

/* =========================================================
   LES PETITS JEUX
   ========================================================= */
const zone = () => $('#jeu-zone');
const info = t => { $('#jeu-info').textContent = t; };
let minuteurs = [];
const plusTard = (f, d) => { minuteurs.push(setTimeout(f, d)); };
function nettoie() { minuteurs.forEach(clearTimeout); minuteurs = []; }

function finJeu(msg) {
  info(msg);
  plusTard(() => { nettoie(); etat.i++; garde(); montre(); }, 1700);
}
$('#b-sauter-jeu').addEventListener('click', () => { nettoie(); etat.i++; garde(); montre(); });

function lanceJeu(e) {
  nettoie();
  zone().innerHTML = '';
  $('#jeu-titre').textContent = e.mot;
  ({ memo, reflexe, intrus, sequence, coeurs, ordre })[e.jeu]();
}

/* --- memory : 6 paires --- */
function memo() {
  info('Retrouve les paires.');
  const six = melange(PAIRES).slice(0, 6);
  const cartes = melange([...six, ...six]);
  const g = document.createElement('div');
  g.className = 'grille'; g.style.gridTemplateColumns = 'repeat(4,1fr)';
  let ouvertes = [], trouvees = 0, bloque = false;
  cartes.forEach((c, i) => {
    const b = document.createElement('button');
    b.textContent = c;
    b.addEventListener('click', () => {
      if (bloque || b.classList.contains('vu') || b.classList.contains('ok')) return;
      b.classList.add('vu'); ouvertes.push({ b, c });
      if (ouvertes.length < 2) return;
      bloque = true;
      const [x, y] = ouvertes;
      if (x.c === y.c) {
        x.b.classList.add('ok'); y.b.classList.add('ok');
        ouvertes = []; bloque = false; trouvees++;
        if (trouvees === 6) finJeu('Parfait. On reprend.');
      } else {
        plusTard(() => {
          x.b.classList.remove('vu'); y.b.classList.remove('vu');
          ouvertes = []; bloque = false;
        }, 700);
      }
    });
    g.appendChild(b);
  });
  zone().appendChild(g);
}

/* --- réflexe : attendre le signal --- */
function reflexe() {
  info('Attends que ça s\'allume, puis touche. Ne triche pas.');
  const c = document.createElement('div');
  c.className = 'cible'; c.textContent = '⏳';
  let pret = false, t0 = 0;
  c.addEventListener('click', () => {
    if (!pret) { info('Trop tôt ! On recommence.'); return; }
    finJeu(`${Math.round(performance.now() - t0)} millisecondes. Pas mal.`);
  });
  zone().appendChild(c);
  plusTard(() => {
    pret = true; t0 = performance.now();
    c.classList.add('go'); c.textContent = '💗';
    info('MAINTENANT !');
  }, 1400 + Math.random() * 3000);
}

/* --- trouve l'intrus --- */
function intrus() {
  info('Un seul est différent.');
  const [a, b] = pick(INTRUS);
  const n = 25, cible = Math.floor(Math.random() * n);
  const g = document.createElement('div');
  g.className = 'grille'; g.style.gridTemplateColumns = 'repeat(5,1fr)';
  for (let i = 0; i < n; i++) {
    const bt = document.createElement('button');
    bt.textContent = i === cible ? b : a;
    bt.style.color = 'inherit';
    bt.addEventListener('click', () => {
      if (i === cible) finJeu('Bien vu.');
      else { bt.classList.add('rate'); plusTard(() => bt.classList.remove('rate'), 350); info('Non, regarde mieux.'); }
    });
    g.appendChild(bt);
  }
  zone().appendChild(g);
}

/* --- séquence de couleurs --- */
function sequence() {
  info('Retiens l\'ordre…');
  const suite = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
  const g = document.createElement('div');
  g.className = 'pads off';
  const pads = [];
  for (let i = 0; i < 4; i++) {
    const b = document.createElement('button');
    b.className = `pad p${i}`;
    b.addEventListener('click', () => {
      b.classList.add('vif'); plusTard(() => b.classList.remove('vif'), 180);
      if (suite[pos] === i) {
        pos++;
        if (pos >= suite.length) finJeu('Impeccable.');
      } else { info('Raté. Tant pis, on continue.'); plusTard(() => finJeu('On reprend.'), 600); }
    });
    pads.push(b); g.appendChild(b);
  }
  let pos = 0;
  zone().appendChild(g);
  suite.forEach((v, k) => {
    plusTard(() => {
      pads[v].classList.add('vif');
      plusTard(() => pads[v].classList.remove('vif'), 340);
    }, 700 + k * 620);
  });
  plusTard(() => { g.classList.remove('off'); info('À toi.'); }, 700 + suite.length * 620 + 300);
}

/* --- compter les cœurs --- */
function coeurs() {
  const n = 4 + Math.floor(Math.random() * 6);
  info('Compte-les. Tu as trois secondes.');
  const d = document.createElement('div');
  d.className = 'flash';
  d.textContent = Array.from({ length: n }, () => pick(['💗', '💜', '🤍'])).join(' ');
  zone().appendChild(d);
  plusTard(() => {
    d.textContent = '';
    info('Alors, combien ?');
    const g = document.createElement('div');
    g.className = 'grille'; g.style.gridTemplateColumns = 'repeat(5,1fr)';
    for (let i = 4; i <= 13; i++) {
      const b = document.createElement('button');
      b.textContent = i; b.style.color = 'inherit'; b.style.fontSize = '1.1rem';
      b.addEventListener('click', () => {
        if (i === n) finJeu('Exact.');
        else { b.classList.add('rate'); info(`Non, il y en avait ${n}.`); plusTard(() => finJeu('On reprend.'), 900); }
      });
      g.appendChild(b);
    }
    zone().appendChild(g);
  }, 3000);
}

/* --- remettre dans l'ordre --- */
function ordre() {
  info('Touche les chiffres du plus petit au plus grand.');
  const n = 9;
  const nums = melange(Array.from({ length: n }, (_, i) => i + 1));
  let attendu = 1;
  const g = document.createElement('div');
  g.className = 'grille'; g.style.gridTemplateColumns = 'repeat(3,1fr)';
  nums.forEach(v => {
    const b = document.createElement('button');
    b.textContent = v; b.style.color = 'inherit'; b.style.fontSize = '1.2rem';
    b.addEventListener('click', () => {
      if (v !== attendu) { b.classList.add('rate'); plusTard(() => b.classList.remove('rate'), 350); return; }
      b.classList.add('ok'); attendu++;
      if (attendu > n) finJeu('Rapide.');
    });
    g.appendChild(b);
  });
  zone().appendChild(g);
}

/* =========================================================
   FIN — on rassemble tout pour Enzo
   ========================================================= */
function texteFinal() {
  const l = ['💭 MES RÉPONSES — pour Enzo', ''];
  let bloc = '';
  PARCOURS.filter(e => e.k === 'q').forEach(e => {
    if (e.bloc !== bloc) { bloc = e.bloc; l.push('', `— ${bloc.toUpperCase()} —`, ''); }
    const r = etat.rep[e.id];
    l.push(`▸ ${e.q}`);
    l.push(r ? `   ${e.t === 'echelle' ? r + '/10' : r}` : '   (pas répondu)');
    l.push('');
  });
  const n = Object.keys(etat.rep).length;
  l.push(`— ${n} réponses sur ${NB_Q} —`);
  return l.join('\n');
}

function fin() {
  ecran('e-fin');
  $('#barre-in').style.width = '100%';
  const n = Object.keys(etat.rep).length;
  $('#fin-resume').textContent =
    `Tu as répondu à ${n} questions sur ${NB_Q}. Ça fait beaucoup de choses que je ne savais pas.`;
  $('#apercu').textContent = texteFinal();
  envoieAEnzo();
}

/* dépose les réponses chiffrées ; en cas d'échec on laisse le bouton copier */
async function envoieAEnzo() {
  const e = $('#etat-copie');
  e.textContent = 'Envoi en cours…';
  try {
    const paquet = await chiffre({
      quand: new Date().toISOString(),
      nb: Object.keys(etat.rep).length,
      total: NB_Q,
      texte: texteFinal()
    }, 'trotro');
    const r = await fetch(BOITE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paquet)
    });
    if (!r.ok) throw new Error(r.status);
    e.textContent = '✅ Envoyé à Enzo. Tu n\'as rien d\'autre à faire.';
    $('#b-copier').textContent = '📋 Copier quand même (au cas où)';
  } catch (err) {
    e.textContent = '⚠️ L\'envoi n\'a pas marché. Appuie sur le bouton pour copier et colle-moi tout.';
  }
}

$('#b-copier').addEventListener('click', async () => {
  const t = texteFinal();
  try {
    await navigator.clipboard.writeText(t);
    $('#etat-copie').textContent = '✅ Copié ! Colle-le dans notre conversation.';
  } catch (e) {
    /* certains navigateurs refusent : on sélectionne le texte pour qu'elle copie à la main */
    const p = $('#apercu');
    p.closest('details').open = true;
    const r = document.createRange(); r.selectNodeContents(p);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    $('#etat-copie').textContent = 'Le texte est sélectionné juste en dessous — fais copier.';
  }
});

$('#b-refaire').addEventListener('click', () => {
  if (!confirm('Tout effacer et recommencer ?')) return;
  etat = { i: 0, rep: {} }; garde();
  $('#etat-copie').textContent = '';
  ecran('e-accueil');
});

/* ?reset : efface la progression enregistrée et repart de zéro.
   Utile après un essai, pour que la page soit vierge. */
if (/[?&]reset/.test(location.search)) {
  etat = { i: 0, rep: {} };
  try { localStorage.removeItem(CLE); } catch (e) {}
  $('#b-reprendre').hidden = true;
  history.replaceState(null, '', location.pathname);
}

/* raccourci d'essai : ?fin pour voir l'écran final */
if (/[?&]fin/.test(location.search)) { etat.i = PARCOURS.length; fin(); }
