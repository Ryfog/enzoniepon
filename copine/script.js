/* =========================================================
   Ta journée — du réveil jusqu'aux étoiles
   ========================================================= */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd  = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ============ ÉTAPES ============ */
const ETAPES = ['reveil', 'dej', 'puzzle', 'devine', 'morpion', 'code', 'ciel'];
const KEY = 'tajournee1';

let done = {};
try { done = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { done = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {} };

if (/[?&]reset/.test(location.search)) {
  done = {};
  try { localStorage.removeItem(KEY); } catch (e) {}
  history.replaceState(null, '', location.pathname);
}
if (/[?&]tout/.test(location.search)) ETAPES.forEach(k => { done[k] = true; });

/* ============ CIEL + SOLEIL ============ */
const sky = $('#sky'), arcSun = $('#arc-sun');

function majProgression() {
  const n = ETAPES.filter(k => done[k]).length;

  sky.dataset.s = n;
  document.body.classList.toggle('nuit', n >= 7);
  $('#starfield').classList.toggle('on', n >= 6);

  // le soleil se place sur l'arc : demi-cercle de gauche à droite
  const a = Math.PI - (n / ETAPES.length) * Math.PI;
  arcSun.style.left = (50 + Math.cos(a) * 45.3) + '%';
  arcSun.style.top  = (96.7 - Math.sin(a) * 90.6) + '%';
  arcSun.textContent = n >= 7 ? '🌙' : '🌞';

  $('#arc-n').textContent = `${n} / ${ETAPES.length}`;
  if (n === ETAPES.length) $('#fin').classList.add('open');
  else $('#lock-l').textContent = n === 6 ? 'Encore une seule étape.' : `Encore ${ETAPES.length - n} étapes.`;
  return n;
}

function gagne(id, titre, texte, emo = '🌞', img = null) {
  const neuf = !done[id];
  done[id] = true; save();
  const n = majProgression();
  boum(90);
  if (neuf) fenetre(titre, texte, emo, img);
  if (n === ETAPES.length && neuf) {
    setTimeout(() => { boum(240); $('#fin').scrollIntoView({ behavior: 'smooth' }); }, 950);
  }
}

/* ============ FENÊTRE ============ */
const pop = $('#pop');
function fenetre(titre, texte, emo = '🌞', img = null) {
  $('#pop-t').textContent = titre;
  $('#pop-p').textContent = texte;
  const pi = $('#pop-img'), pe = $('#pop-e');
  if (img) { pi.src = img; pi.hidden = false; pe.hidden = true; }
  else { pi.hidden = true; pe.hidden = false; pe.textContent = emo; }
  pop.hidden = false;
}
const ferme = () => { pop.hidden = true; };
$('#pop-x').addEventListener('click', ferme);
$('#pop-ok').addEventListener('click', ferme);
pop.addEventListener('click', e => { if (e.target === pop) ferme(); });

/* ============ CONFETTIS ============ */
const cv = $('#conf'), cx = cv.getContext('2d');
let parts = [], tourne = false;
const taille = () => { cv.width = innerWidth; cv.height = innerHeight; };
taille(); addEventListener('resize', taille);
const COUL = ['#e8617f', '#f2a33c', '#5fb89a', '#8ab6f0', '#c9a8ff', '#fff', '#ffd98a'];

function boum(n = 120, ox = null, oy = null) {
  const x = ox === null ? innerWidth / 2 : ox;
  const y = oy === null ? innerHeight * .35 : oy;
  for (let i = 0; i < n; i++) parts.push({
    x, y, vx: rnd(-9, 9), vy: rnd(-15, 2),
    w: rnd(6, 12), h: rnd(8, 15), c: pick(COUL),
    a: rnd(0, 6.3), va: rnd(-.25, .25), l: 1
  });
  if (!tourne && parts.length) anime();
}
function anime() {
  tourne = true;
  (function pas() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.l > 0 && p.y < cv.height + 60);
    parts.forEach(p => {
      p.vy += .42; p.vx *= .995; p.x += p.vx; p.y += p.vy; p.a += p.va; p.l -= .004;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a);
      cx.globalAlpha = Math.max(0, Math.min(1, p.l));
      cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
    });
    if (parts.length) requestAnimationFrame(pas);
    else { cx.clearRect(0, 0, cv.width, cv.height); tourne = false; }
  })();
}

/* ============ ÉTOILES ============ */
(function etoiles() {
  const f = $('#starfield'), frag = document.createDocumentFragment();
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('span');
    s.style.left = rnd(0, 100) + '%';
    s.style.top = rnd(0, 100) + '%';
    s.style.animationDelay = rnd(0, 3.4) + 's';
    const t = rnd(1, 2.6);
    s.style.width = s.style.height = t + 'px';
    frag.appendChild(s);
  }
  f.appendChild(frag);
})();

/* ============ ENTRÉE ============ */
function entrer() {
  $('#gate').classList.add('gone');
  boum(180);
  setTimeout(() => { $('#gate').style.display = 'none'; }, 850);
}
$('#gate-btn').addEventListener('click', entrer);
$('#sun-btn').addEventListener('click', entrer);
if (/[?&]nogate/.test(location.search)) $('#gate').style.display = 'none';

/* =========================================================
   1 · LE RÉVEIL
   ========================================================= */
(function reveil() {
  const b = $('#snooze'), msg = $('#reveil-msg'), boite = $('#clock');
  const MOTS = [
    'Non. Cinq minutes de plus, tu les mérites largement.',
    'Toujours pas. Reste couchée, c\'est ta journée après tout.',
    'Bon. D\'accord. Mais tu te lèves parce que tu en as envie, pas parce qu\'il faut.'
  ];
  let n = 0;
  b.addEventListener('click', () => {
    if (n < MOTS.length) {
      msg.textContent = MOTS[n];
      // le bouton s'échappe
      b.style.transform = `translate(${rnd(-70, 70)}px, ${rnd(-14, 14)}px) rotate(${rnd(-9, 9)}deg)`;
      n++;
      return;
    }
    b.style.transform = 'none';
    b.disabled = true;
    b.textContent = 'Réveil éteint ☀️';
    boite.classList.add('off');
    $('#clock-h').textContent = '07:15';
    msg.textContent = 'Debout. Doucement, hein.';
    gagne('reveil', 'Debout !', 'Première étape franchie. Le reste de la journée t\'attend, et il n\'y a que des bonnes choses dedans.', '⏰');
  });
})();

/* =========================================================
   2 · LE PETIT-DÉJ
   ========================================================= */
(function petitdej() {
  const PLATS = [
    ['☕', 'Un café. Je te l\'aurais monté au lit, évidemment.'],
    ['🥐', 'Un croissant. Je serais sorti le chercher en pyjama, sans râler.'],
    ['🍓', 'Des fraises. Parce que tu mérites le meilleur, même à 8h du matin.'],
    ['🥞', 'Des pancakes. Ratés, probablement. Mais faits par moi.'],
    ['🍊', 'Un jus pressé. Pour faire semblant qu\'on est raisonnables.'],
    ['🍫', 'Un chocolat chaud. Le remède à peu près universel.'],
    ['🧇', 'Une gaufre. Beaucoup trop de sucre dessus. C\'est ta journée.'],
    ['🍯', 'Du miel. Sur à peu près tout. Je te vois venir.']
  ];
  const m = $('#menu'), tray = $('#tray-in'), msg = $('#dej-msg');
  let n = 0;
  PLATS.forEach(([e, t]) => {
    const b = document.createElement('button');
    b.className = 'food'; b.textContent = e;
    b.addEventListener('click', () => {
      b.classList.add('on');
      tray.textContent += e;
      n++;
      msg.textContent = `${n} / 4`;
      const r = b.getBoundingClientRect();
      boum(14, r.left + r.width / 2, r.top + r.height / 2);
      fenetre('Dans le plateau', t, e);
      if (n === 4) {
        $$('.food:not(.on)', m).forEach(x => x.classList.add('on'));
        msg.textContent = 'Le plateau est prêt 🛎️';
        setTimeout(() => gagne('dej', 'Service !',
          'Un jour je te l\'apporterai pour de vrai, avec la tête des mauvais matins. En attendant, imagine bien.', '🛎️'), 500);
      }
    });
    m.appendChild(b);
  });
})();

/* =========================================================
   3 · LE PUZZLE (taquin 3×3)
   ========================================================= */
(function puzzle() {
  const g = $('#puz'), cn = $('#puz-n'), N = 3, TROU = N * N - 1;
  let ordre = [], coups = 0, fini = false;

  function dessine() {
    g.innerHTML = '';
    ordre.forEach((tuile, pos) => {
      const b = document.createElement('button');
      b.className = 'pz' + (tuile === TROU ? ' hole' : '');
      const c = tuile % N, r = Math.floor(tuile / N);
      b.style.backgroundPosition = `${c * 50}% ${r * 50}%`;
      b.addEventListener('click', () => bouge(pos));
      g.appendChild(b);
    });
  }
  const voisin = (a, b) => {
    const ca = a % N, ra = Math.floor(a / N), cb = b % N, rb = Math.floor(b / N);
    return Math.abs(ca - cb) + Math.abs(ra - rb) === 1;
  };
  function bouge(pos, silencieux) {
    const trou = ordre.indexOf(TROU);
    if (!voisin(pos, trou)) return;
    [ordre[pos], ordre[trou]] = [ordre[trou], ordre[pos]];
    if (!silencieux) {
      coups++; cn.textContent = coups + (coups > 1 ? ' coups' : ' coup');
      dessine(); verifie();
    }
  }
  function verifie() {
    if (fini) return;
    if (ordre.every((t, i) => t === i)) {
      fini = true;
      g.classList.add('done');
      cn.textContent = `Fini en ${coups} coups`;
      gagne('puzzle', 'C\'était toi.', 'Évidemment que c\'était toi. Je n\'allais pas mettre une photo de paysage.', '🧩');
    }
  }
  function melange() {
    ordre = [...Array(N * N).keys()];
    for (let i = 0; i < 200; i++) {
      const trou = ordre.indexOf(TROU);
      const opts = [...Array(N * N).keys()].filter(p => voisin(p, trou));
      bouge(pick(opts), true);
    }
    if (ordre.every((t, i) => t === i)) return melange();   // pas de grille déjà résolue
    coups = 0; fini = false;
    g.classList.remove('done');
    cn.textContent = '0 coup';
    dessine();
  }
  $('#puz-mix').addEventListener('click', melange);
  melange();
})();

/* =========================================================
   SI J'ÉTAIS LÀ AUJOURD'HUI
   ========================================================= */
(function journee() {
  const L = [
    ['07h30', 'Je te laisserais dormir et je ferais le café en silence.'],
    ['09h00', 'On sortirait promener Milo, même s\'il fait un temps pourri.'],
    ['11h00', 'Je te prendrais en photo sans te prévenir. Encore une fois.'],
    ['13h00', 'On mangerait trop, et on ne culpabiliserait pas une seconde.'],
    ['15h00', 'Sieste. Toi sur moi. Ce n\'est pas négociable.'],
    ['17h00', 'On irait voir l\'océan, juste pour le regarder sans rien dire.'],
    ['20h00', 'Je cuisinerais. Tu goûterais. Tu dirais que c\'est bon même si c\'est faux.'],
    ['23h00', 'On resterait éveillés beaucoup trop tard à parler de rien du tout.']
  ];
  const box = $('#jour');
  L.forEach(([h, t]) => {
    const b = document.createElement('button');
    b.className = 'moment';
    b.innerHTML = `<b>${h}</b><span>${t}</span><i class="dots">· · · · · · · · · ·</i>`;
    b.addEventListener('click', () => {
      if (b.classList.contains('on')) return;
      b.classList.add('on');
      const r = b.getBoundingClientRect();
      boum(10, r.left + r.width / 2, r.top + r.height / 2);
    });
    box.appendChild(b);
  });
})();

/* =========================================================
   4 · PLUS OU MOINS
   ========================================================= */
(function devine() {
  const CIBLE = 347;
  const f = $('#guess'), input = $('#g-in'), msg = $('#g-msg'), tr = $('#g-try');
  let n = 0;
  f.addEventListener('submit', e => {
    e.preventDefault();
    const v = parseInt(input.value, 10);
    if (!v || v < 1 || v > 500) { msg.textContent = 'Entre 1 et 500, allez.'; return; }
    n++;
    tr.textContent = `${n} essai${n > 1 ? 's' : ''}`;
    if (v === CIBLE) {
      msg.textContent = `${CIBLE}. Pile.`;
      input.disabled = true;
      gagne('devine', '347 fois.', 'Et encore, j\'ai arrêté de compter vers midi parce que ça devenait ridicule.', '🔢');
    } else if (v < CIBLE) {
      msg.textContent = pick(['C\'est plus que ça.', 'Plus haut. Beaucoup plus haut.', 'Tu me sous-estimes. C\'est plus.']);
    } else {
      msg.textContent = pick(['C\'est moins.', 'Un peu moins quand même.', 'Descends un peu.']);
    }
  });
})();

/* =========================================================
   5 · LE MORPION (truqué en sa faveur)
   ========================================================= */
(function morpion() {
  const LIGNES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const g = $('#ttt'), msg = $('#ttt-msg');
  let cases = Array(9).fill(''), fini = false;

  const gagnant = (c, j) => LIGNES.find(l => l.every(i => c[i] === j));

  function dessine() {
    g.innerHTML = '';
    cases.forEach((v, i) => {
      const b = document.createElement('button');
      b.className = 'tc' + (v ? ' taken' : '');
      b.textContent = v;
      b.addEventListener('click', () => joue(i));
      g.appendChild(b);
    });
  }
  function surligne(l) { l.forEach(i => g.children[i].classList.add('win')); }

  function joue(i) {
    if (fini || cases[i]) return;
    cases[i] = '❤️'; dessine();
    const w = gagnant(cases, '❤️');
    if (w) { fini = true; dessine(); surligne(w); fin(true); return; }
    if (cases.every(Boolean)) { fini = true; msg.textContent = 'Match nul. On recommence ?'; relance(); return; }
    setTimeout(moi, 380);
  }
  function moi() {
    const libres = cases.map((v, i) => v ? null : i).filter(i => i !== null);
    // je ne gagne jamais, et je ne bloque jamais
    const mauvais = libres.filter(i => {
      const t1 = [...cases]; t1[i] = '🐾';
      if (gagnant(t1, '🐾')) return false;
      const t2 = [...cases]; t2[i] = '❤️';
      if (gagnant(t2, '❤️')) return false;   // ce coup bloquerait : je l'évite
      return true;
    });
    const c = pick(mauvais.length ? mauvais : libres);
    cases[c] = '🐾'; dessine();
    if (cases.every(Boolean)) { fini = true; msg.textContent = 'Match nul. On recommence ?'; relance(); }
    else msg.textContent = pick(['À toi.', 'Vas-y, je regarde.', 'Je réfléchis très fort. Enfin, non.']);
  }
  function relance() {
    const b = document.createElement('button');
    b.className = 'btn small ghost'; b.textContent = 'Rejouer';
    b.style.marginTop = '14px';
    b.addEventListener('click', () => { cases = Array(9).fill(''); fini = false; dessine(); msg.textContent = 'À toi de commencer.'; b.remove(); });
    msg.after(b);
  }
  function fin() {
    msg.textContent = 'Tu as gagné. Sans surprise.';
    gagne('morpion', 'Tu as gagné !', 'Comme prévu. J\'ai passé toute la partie à te laisser faire — c\'est un peu ma spécialité.', '🏆');
  }
  dessine();
})();

/* =========================================================
   6 · LE MESSAGE CODÉ
   ========================================================= */
(function code() {
  const CLAIR = 'TU ES MA PERSONNE PREFEREE SUR CETTE PLANETE';
  const DEC = 7;
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const decale = (t, d) => t.replace(/[A-Z]/g, c => A[(A.indexOf(c) + d + 26) % 26]);

  const el = $('#crypt'), sl = $('#shift'), msg = $('#code-msg');
  const CODE = decale(CLAIR, DEC);
  el.textContent = CODE;
  let ok = false;

  sl.addEventListener('input', () => {
    const d = +sl.value;
    el.textContent = decale(CODE, -d);
    msg.textContent = `Décalage : ${d}`;
    if (d === DEC && !ok) {
      ok = true;
      el.classList.add('ok');
      msg.textContent = 'Et voilà. 🤍';
      gagne('code', 'Décodé !', 'C\'était pas si secret que ça, en vrai. Je le pense tout le temps, je le dis juste rarement.', '🔐');
    } else if (d !== DEC) {
      el.classList.remove('ok');
    }
  });
})();

/* =========================================================
   LA BOÎTE À QUESTIONS
   ========================================================= */
(function questions() {
  const Q = [
    'Quel est le tout premier truc que tu veux qu\'on fasse le 16 septembre ?',
    'C\'est quoi la chose la plus bête qui t\'a fait rire cette semaine ?',
    'Si on pouvait partir trois jours n\'importe où demain, tu choisis quoi ?',
    'Quelle chanson te fait penser à moi sans que tu me l\'aies jamais dit ?',
    'C\'est quoi le compliment que tu aimerais entendre plus souvent ?',
    'Qu\'est-ce qui t\'a le plus manqué de moi cette semaine ?',
    'Raconte-moi un souvenir de toi enfant que je ne connais pas.',
    'Si Milo pouvait parler pendant une minute, il dirait quoi en premier ?',
    'C\'est quoi ton pire défaut ? Sois honnête, je ne bougerai pas.',
    'Quel est le truc que tu as toujours voulu essayer sans jamais oser ?',
    'À quel moment tu t\'es dit « ok, lui, c\'est pas comme les autres » ?',
    'Qu\'est-ce que tu veux qu\'on ait dans notre appartement, un jour ?',
    'C\'est quoi la dernière fois où tu as été vraiment fière de toi ?',
    'Si tu devais me décrire à quelqu\'un en trois mots, ce serait quoi ?',
    'Qu\'est-ce que je pourrais faire, concrètement, pour te rendre les semaines plus faciles ?',
    'C\'est quoi ton plus beau souvenir avec moi jusqu\'ici ?',
    'Il y a un truc que tu n\'oses pas me demander ? C\'est le moment.',
    'Dans dix ans, on est où, on fait quoi ?'
  ];
  const box = $('#qbox');
  let sac = [];
  $('#q-draw').addEventListener('click', () => {
    if (!sac.length) sac = [...Q].sort(() => Math.random() - .5);
    box.textContent = sac.pop();
    box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash');
  });
  $('#q-copy').addEventListener('click', () => {
    const t = box.textContent.trim();
    if (!t || t.startsWith('Appuie')) return;
    navigator.clipboard?.writeText(t)
      .then(() => fenetre('Copié', 'Tu peux la coller dans notre conversation et me répondre quand tu veux.', '📋'))
      .catch(() => fenetre('Presque', 'Ton navigateur ne veut pas copier tout seul — sélectionne la question à la main.', '🤷'));
  });
})();

/* =========================================================
   7 · LA CONSTELLATION
   ========================================================= */
(function constellation() {
  // un cœur, en 12 points
  const P = [
    [50, 39.4], [54.8, 30.4], [74.7, 25.6], [88, 41.5], [74.7, 61.6], [54.8, 78.1],
    [50, 86], [45.3, 78.1], [25.3, 61.6], [12, 41.5], [25.3, 25.6], [45.3, 30.4]
  ];
  const box = $('#const'), msg = $('#const-msg');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  path.setAttribute('class', 'const-l');
  path.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.appendChild(path);
  box.appendChild(svg);

  let suivant = 0;
  const faits = [];

  P.forEach(([x, y], i) => {
    const b = document.createElement('button');
    b.className = 'st';
    b.style.left = x + '%';
    b.style.top = y + '%';
    b.innerHTML = `<b>${i + 1}</b>`;
    b.addEventListener('click', () => {
      if (i !== suivant) {
        msg.textContent = `Pas celle-là. Cherche la ${suivant + 1}.`;
        return;
      }
      b.classList.add('on');
      faits.push(`${x},${y}`);
      path.setAttribute('points', faits.join(' '));
      suivant++;
      if (suivant === P.length) {
        path.setAttribute('points', faits.concat(faits[0]).join(' '));
        msg.textContent = 'Un cœur. Forcément.';
        setTimeout(() => gagne('ciel', 'Tu l\'as trouvé.',
          'Un cœur, oui, je sais, c\'est très cliché. Mais il est au-dessus de toi et au-dessus de moi en même temps, et ça, ça me plaît bien.', '✨'), 400);
      } else {
        msg.textContent = `${suivant} / ${P.length}`;
      }
    });
    box.appendChild(b);
  });
})();

/* =========================================================
   EASTER EGG 1 — Milo traverse l'écran
   ========================================================= */
(function miloCourt() {
  const m = $('#milo-run');
  let vu = false;

  function lance() {
    if (!m.classList.contains('go') && pop.hidden) {
      m.classList.add('go');
      setTimeout(() => m.classList.remove('go'), 16000);
    }
  }
  setTimeout(lance, 25000);
  setInterval(lance, 70000);

  m.addEventListener('click', () => {
    const r = m.getBoundingClientRect();
    boum(50, r.left + r.width / 2, r.top);
    fenetre(vu ? 'Encore lui' : 'Tu l\'as attrapé !',
      vu ? 'Il repassera. Il repasse toujours.'
         : 'Il traverse la page de temps en temps quand personne ne regarde. Tu as de bons yeux — lui, il t\'aime déjà, c\'était pas à prouver.',
      '🐾', 'dog/milo1.jpg');
    vu = true;
    m.classList.remove('go');
  });
})();

/* =========================================================
   EASTER EGG 2 — le titre tapé 5 fois
   ========================================================= */
(function secretTitre() {
  const t = $('#hero-t');
  let n = 0, tm = null;
  t.addEventListener('click', () => {
    n++;
    clearTimeout(tm);
    tm = setTimeout(() => { n = 0; }, 2500);
    if (n >= 5) {
      n = 0;
      boum(220);
      fenetre('Secret débloqué 🎁',
        'Cinq clics sur le titre, personne n\'aurait trouvé ça par hasard. Tu es officiellement la personne la plus curieuse que je connaisse — et Milo approuve ce message.',
        '🐶', 'dog/milo2.jpg');
    }
  });
})();

/* =========================================================
   EASTER EGG 3 — le soleil de l'arc
   ========================================================= */
(function secretSoleil() {
  const MOTS = [
    'Il fait forcément beau quelque part. Chez toi, par exemple.',
    'Le même soleil que celui qui est chez moi. C\'est déjà ça de commun.',
    'Tu brilles plus que lui, mais ne lui dis pas, il est susceptible.',
    'Il tourne, il tourne… et nous on se rapproche du 16 septembre.',
    'Petit rappel officiel du service météo : tu es magnifique.'
  ];
  $('#arc-sun').addEventListener('click', () => {
    const r = $('#arc-sun').getBoundingClientRect();
    boum(24, r.left + r.width / 2, r.top);
    fenetre('☀️', pick(MOTS), '☀️');
  });
})();

/* ============ FIN ============ */
$('#boom').addEventListener('click', () => boum(260));

majProgression();
