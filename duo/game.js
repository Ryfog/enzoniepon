/* =========================================================
   DUO — jeu de couple en temps réel (WebRTC pair-à-pair)
   L'hôte tient l'état du jeu, l'invité envoie ses actions.
   ========================================================= */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pick = a => a[Math.floor(Math.random() * a.length)];
const melange = a => [...a].sort(() => Math.random() - .5);
const PREFIXE = 'duo-es-';

/* ============ CONTENU ============ */
const QUI = [
  'Qui dit « je t\'aime » en premier le matin ?',
  'Qui met le plus de temps à se préparer ?',
  'Qui est le plus jaloux des deux ?',
  'Qui craquerait en premier après une dispute ?',
  'Qui mange le plus ?',
  'Qui est le plus bordélique ?',
  'Qui prend le plus de place dans le lit ?',
  'Qui rigole le plus pour rien ?',
  'Qui est le plus tête en l\'air ?',
  'Qui ferait le plus de bêtises si l\'autre n\'était pas là ?',
  'Qui a le plus de mal à se lever ?',
  'Qui pleure devant les films ?',
  'Qui est le plus rancunier ?',
  'Qui parle le plus au téléphone ?',
  'Qui a le pire goût musical ?',
  'Qui serait le plus perdu sans l\'autre ?',
  'Qui gagnerait à un bras de fer ?',
  'Qui est le meilleur en cuisine ?',
  'Qui râle le plus ?',
  'Qui offre les meilleurs cadeaux ?',
  'Qui a dit « je t\'aime » en premier, au tout début ?',
  'Qui est le plus jaloux de Milo ?',
  'Qui chante le plus faux ?',
  'Qui conduirait le mieux sur un long trajet ?',
  'Qui s\'endort en premier le soir ?',
  'Qui est le plus doué pour consoler l\'autre ?',
  'Qui envoie le plus de messages dans la journée ?',
  'Qui serait incapable de garder un secret ?'
];

const SYNCHRO = [
  'Notre meilleur souvenir, en un mot.',
  'Le tout premier truc qu\'on fait le 16 septembre ?',
  'Un plat qu\'on mangera ensemble.',
  'Un endroit où on doit absolument aller tous les deux.',
  'Un mot pour décrire l\'autre.',
  'Notre chanson, s\'il fallait en choisir une.',
  'Un animal en plus de Milo, ce serait quoi ?',
  'Le prénom de notre futur chat imaginaire.',
  'Une couleur pour notre futur salon.',
  'Ce qui te manque le plus, là, maintenant.',
  'Un film qu\'on doit revoir ensemble.',
  'Notre pire habitude à tous les deux.'
];

const MOTS = [
  'chien', 'bague', 'gâteau', 'voiture', 'coeur', 'lune', 'pizza', 'lit',
  'train', 'parapluie', 'café', 'avion', 'fleur', 'étoile', 'chat', 'guitare',
  'vélo', 'montagne', 'plage', 'cadeau', 'clé', 'fantôme', 'robot', 'château',
  'valise', 'lunettes', 'appareil photo', 'glace', 'soleil', 'maison'
];

const SUITE = ['qui', 'ref', 'syn', 'qui', 'des', 'qui', 'ref', 'syn', 'qui', 'des'];
const NOMS = { qui: 'Qui de nous deux', ref: 'Duel de réflexe', syn: 'Synchro', des: 'Dessine-moi' };

/* ============ ÉTAT ============ */
let peer = null, conn = null, hote = false, moi = 'h', autre = 'g';
let st = null, sacQui = [], sacSyn = [], sacMots = [], rtt = 60;
let minuteur = null, chrono = null;

const neuf = () => ({
  ph: 'round', i: 0, total: SUITE.length, type: 'qui',
  q: '', ans: { h: null, g: null }, sc: { h: 0, g: 0 },
  nm: { h: '', g: '' }, rev: null, drawer: 'h', fin: 0
});

/* ============ RÉSEAU ============ */
function envoie(m) { if (conn && conn.open) conn.send(m); }
function diffuse() { envoie({ t: 'S', st }); rendu(); }

function brancher(c) {
  conn = c;
  c.on('data', m => recois(m));
  c.on('close', () => toast('Connexion perdue 💔'));
  c.on('error', () => toast('Souci de connexion'));
}

function recois(m) {
  if (m.t === 'S') { st = m.st; rendu(); }
  else if (m.t === 'A' && hote) action(autre, m.a);
  else if (m.t === 'HELLO') {
    st.nm[autre] = m.nom || 'L\'autre';
    ecran('s-wait'); majAttente();
    envoie({ t: 'WELCOME', nom: st.nm[moi] });
    diffuse();
  }
  else if (m.t === 'WELCOME') { st.nm[autre] = m.nom || 'L\'autre'; ecran('s-wait'); majAttente(); }
  else if (m.t === 'GO') topDepart();
  else if (m.t === 'D') dessineDistant(m);
  else if (m.t === 'PING') envoie({ t: 'PONG', k: m.k });
  else if (m.t === 'PONG') rtt = Math.min(400, Date.now() - m.k);
}

function ping() {
  const k = Date.now();
  envoie({ t: 'PING', k });
}

/* ============ LOBBY ============ */
const codeAlea = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]).join('');

function monNom() {
  const v = $('#pseudo').value.trim();
  return v || 'Moi';
}

$('#b-joinmode').addEventListener('click', () => {
  $('#joinbox').hidden = !$('#joinbox').hidden;
  if (!$('#joinbox').hidden) $('#code').focus();
});

$('#b-create').addEventListener('click', () => {
  const code = codeAlea();
  hote = true; moi = 'h'; autre = 'g';
  st = neuf(); st.nm.h = monNom();
  erreur('Ouverture du salon…');
  peer = new Peer(PREFIXE + code, { debug: 0 });
  peer.on('open', () => {
    erreur('');
    $('#code-big').textContent = code;
    ecran('s-wait'); majAttente();
  });
  peer.on('connection', c => {
    if (conn) { c.close(); return; }          // salon déjà plein
    brancher(c);
    c.on('open', () => { ping(); });
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id') { peer.destroy(); $('#b-create').click(); }
    else erreur('Impossible d\'ouvrir le salon. Réessaie.');
  });
});

$('#b-join').addEventListener('click', () => {
  const code = $('#code').value.trim().toUpperCase();
  if (code.length !== 4) { erreur('Il faut les 4 lettres du code.'); return; }
  hote = false; moi = 'g'; autre = 'h';
  st = neuf(); st.nm.g = monNom();
  erreur('Connexion…');
  peer = new Peer({ debug: 0 });
  peer.on('open', () => {
    const c = peer.connect(PREFIXE + code, { reliable: true });
    brancher(c);
    c.on('open', () => { erreur(''); envoie({ t: 'HELLO', nom: monNom() }); ping(); });
    setTimeout(() => { if (!conn || !conn.open) erreur('Salon introuvable. Vérifie le code.'); }, 6000);
  });
  peer.on('error', () => erreur('Salon introuvable. Vérifie le code.'));
});

$('#code').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
$('#b-copy').addEventListener('click', () => {
  navigator.clipboard?.writeText($('#code-big').textContent.trim())
    .then(() => toast('Code copié 📋')).catch(() => {});
});

const erreur = t => { $('#lobby-err').textContent = t; };
function ecran(id) { $$('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }

function majAttente() {
  $('#pl-h').querySelector('b').textContent = st.nm.h || '—';
  $('#pl-g').querySelector('b').textContent = st.nm.g || '—';
  const pret = !!(st.nm.h && st.nm.g);
  $('#pl-g').classList.toggle('off', !st.nm.g);
  $('#wait-txt').textContent = pret ? 'Vous êtes deux. C\'est parti quand vous voulez.' : 'En attente de l\'autre…';
  $('#b-start').hidden = !(pret && hote);
}

$('#b-start').addEventListener('click', () => { if (hote) manche(0); });

/* =========================================================
   MOTEUR (hôte uniquement)
   ========================================================= */
function manche(i) {
  clearTimeout(minuteur);
  if (i >= SUITE.length) { st.ph = 'end'; diffuse(); return; }
  if (!sacQui.length) sacQui = melange(QUI);
  if (!sacSyn.length) sacSyn = melange(SYNCHRO);
  if (!sacMots.length) sacMots = melange(MOTS);

  st.i = i;
  st.type = SUITE[i];
  st.ph = 'round';
  st.ans = { h: null, g: null };
  st.rev = null;
  st.guesses = [];
  st.go = false;

  if (st.type === 'qui') st.q = sacQui.pop();
  if (st.type === 'syn') st.q = sacSyn.pop();
  if (st.type === 'des') {
    st.drawer = (i % 4 === 0) ? 'h' : 'g';
    st.q = sacMots.pop();
    st.fin = Date.now() + 90000;
    minuteur = setTimeout(() => { if (st.ph === 'round') reveler({ e: '⏰', t: 'Temps écoulé', p: `C\'était « ${st.q} ».` }); }, 90000);
  }
  if (st.type === 'ref') {
    st.q = '';
    diffuse();
    const d = 1800 + Math.random() * 4200;
    minuteur = setTimeout(() => {
      envoie({ t: 'GO' });
      setTimeout(topDepart, Math.round(rtt / 2));   // on compense la latence
    }, d);
    return;
  }
  diffuse();
}

function action(qui, a) {
  if (!hote || !st) return;

  if (a.k === 'qui' && st.ph === 'round' && st.type === 'qui') {
    st.ans[qui] = a.v;
    if (st.ans.h && st.ans.g) {
      const ok = st.ans.h === st.ans.g;
      if (ok) { st.sc.h++; st.sc.g++; }
      reveler({
        e: ok ? '💞' : '🙃',
        t: ok ? 'Vous êtes d\'accord !' : 'Pas du tout d\'accord…',
        p: ok ? '+1 pour chacun. Vous vous connaissez bien.' : 'Il va falloir en parler, là.',
        deux: true
      });
    } else diffuse();
  }

  else if (a.k === 'syn' && st.ph === 'round' && st.type === 'syn') {
    st.ans[qui] = (a.v || '').slice(0, 60);
    if (st.ans.h !== null && st.ans.g !== null) {
      reveler({ e: '👀', t: 'Vos réponses', p: 'Vous aviez pareil ? À vous de juger.', deux: true, juge: true });
    } else diffuse();
  }

  else if (a.k === 'juge' && st.ph === 'rev' && st.rev && st.rev.juge) {
    if (a.v) { st.sc.h++; st.sc.g++; st.rev.p = '+1 pour chacun 💞'; st.rev.e = '💞'; }
    else { st.rev.p = 'Tant pis. Ça fera un sujet de conversation.'; st.rev.e = '🙃'; }
    st.rev.juge = false;
    diffuse();
  }

  else if (a.k === 'hit' && st.ph === 'round' && st.type === 'ref') {
    if (!st.go) {   // faux départ
      st.sc[qui === 'h' ? 'g' : 'h']++;
      reveler({ e: '🚨', t: 'Faux départ !', p: `${st.nm[qui]} a cliqué trop tôt. Le point va à ${st.nm[qui === 'h' ? 'g' : 'h']}.` });
      return;
    }
    st.sc[qui]++;
    reveler({ e: '⚡', t: `${st.nm[qui]} gagne le duel !`, p: 'Des réflexes de compétition.' });
  }

  else if (a.k === 'guess' && st.ph === 'round' && st.type === 'des') {
    const g = norm(a.v), cible = norm(st.q);
    ajouteGuess(a.v);
    if (g && cible.includes(g) && g.length >= Math.min(3, cible.length)) {
      st.sc.h++; st.sc.g++;
      reveler({ e: '🎨', t: 'Trouvé !', p: `C\'était bien « ${st.q} ». +1 pour chacun.` });
    } else diffuse();
  }

  else if (a.k === 'next' && st.ph === 'rev') manche(st.i + 1);
  else if (a.k === 'again') { st = { ...neuf(), nm: st.nm }; sacQui = []; sacSyn = []; sacMots = []; manche(0); }
}

function reveler(r) {
  clearTimeout(minuteur);
  st.go = false;
  st.ph = 'rev';
  st.rev = r;
  diffuse();
}

const norm = s => (s || '').toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
// NFD sépare les accents, puis on ne garde que a-z0-9 : les diacritiques sautent d'eux-mêmes
function ajouteGuess(t) {
  st.guesses = (st.guesses || []).concat(t).slice(-4);
}

/* action locale (marche des deux côtés) */
function jouer(a) { if (hote) action('h', a); else envoie({ t: 'A', a }); }

/* =========================================================
   RENDU
   ========================================================= */
function rendu() {
  if (!st) return;
  if (st.ph === 'end') { finPartie(); return; }
  ecran('s-game');

  $('#n1').textContent = st.nm[moi] || 'Moi';
  $('#n2').textContent = st.nm[autre] || 'L\'autre';
  $('#p1').textContent = st.sc[moi];
  $('#p2').textContent = st.sc[autre];
  $('#r-lab').textContent = `Manche ${st.i + 1} / ${st.total}`;
  $('#r-type').textContent = NOMS[st.type] || '';

  const on = id => $$('.mode').forEach(m => { m.hidden = m.id !== id; });

  if (st.ph === 'rev') {
    on('m-rev');
    $('#rev-e').textContent = st.rev.e;
    $('#rev-t').textContent = st.rev.t;
    $('#rev-p').textContent = st.rev.p;
    const box = $('#rev-two'); box.innerHTML = '';
    if (st.rev.deux) {
      [moi, autre].forEach(k => {
        const v = st.type === 'qui' ? (st.nm[st.ans[k]] || '?') : (st.ans[k] || '—');
        const d = document.createElement('div');
        d.className = 'rev-c';
        d.innerHTML = `<small>${st.nm[k]}</small><span>${esc(v)}</span>`;
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
      $('#rev-w').textContent = hote ? '' : 'Vous pouvez cliquer tous les deux.';
    }
    return;
  }

  /* --- manches --- */
  if (st.type === 'qui') {
    on('m-qui');
    $('#qui-q').textContent = st.q;
    $('#qui-an').textContent = st.nm.h;
    $('#qui-bn').textContent = st.nm.g;
    const fait = st.ans[moi];
    $('#qui-a').classList.toggle('on', fait === 'h');
    $('#qui-b').classList.toggle('on', fait === 'g');
    $('#qui-a').disabled = !!fait;
    $('#qui-b').disabled = !!fait;
    $('#qui-w').textContent = fait ? 'C\'est noté. On attend l\'autre…' : 'Répondez tous les deux, sans vous concerter.';
  }

  else if (st.type === 'syn') {
    on('m-syn');
    $('#syn-q').textContent = st.q;
    const fait = st.ans[moi] !== null;
    $('#syn-in').disabled = fait;
    $('#syn-ok').disabled = fait;
    $('#syn-w').textContent = fait ? 'Envoyé. On attend l\'autre…' : 'Le but : écrire exactement la même chose.';
  }

  else if (st.type === 'ref') {
    on('m-ref');
    const t = $('#ref-t');
    t.classList.toggle('go', !!st.go);
    t.disabled = false;
    $('#ref-face').textContent = st.go ? '💗' : '⏳';
    $('#ref-w').textContent = st.go ? 'MAINTENANT !' : 'Attends le signal… ne clique pas trop tôt.';
  }

  else if (st.type === 'des') {
    on('m-des');
    const jeDessine = st.drawer === moi;
    $('#des-q').textContent = jeDessine ? `Fais-lui deviner : « ${st.q} »` : `${st.nm[st.drawer]} dessine. À toi de trouver.`;
    $('#des-tools').hidden = !jeDessine;
    $('#des-guessbox').hidden = jeDessine;
    pad.style.cursor = jeDessine ? 'crosshair' : 'default';
    $('#des-live').innerHTML = (st.guesses || []).map(g => `<b>${esc(g)}</b>`).join(' · ');
    lanceChrono();
  }
}

const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/* le compte à rebours est calculé localement : les deux PC n'ont pas
   forcément la même heure système, on ne peut pas se fier à st.fin */
let manchePrec = -1, finLocale = 0;
function lanceChrono() {
  if (manchePrec !== st.i) { manchePrec = st.i; finLocale = Date.now() + 90000; raz(); }
  clearInterval(chrono);
  chrono = setInterval(() => {
    if (!st || st.type !== 'des' || st.ph !== 'round') { clearInterval(chrono); return; }
    const r = Math.max(0, Math.ceil((finLocale - Date.now()) / 1000));
    $('#des-w').textContent = `${r} s`;
  }, 250);
}

/* --- réflexe --- */
function topDepart() {
  if (!st) return;
  st.go = true;
  $('#ref-t').classList.add('go');
  $('#ref-face').textContent = '💗';
  $('#ref-w').textContent = 'MAINTENANT !';
}
$('#ref-t').addEventListener('click', () => {
  if (!st || st.type !== 'ref' || st.ph !== 'round') return;
  $('#ref-t').disabled = true;
  jouer({ k: 'hit' });
});

/* --- qui --- */
$('#qui-a').addEventListener('click', () => jouer({ k: 'qui', v: 'h' }));
$('#qui-b').addEventListener('click', () => jouer({ k: 'qui', v: 'g' }));

/* --- synchro --- */
function envoieSyn() {
  const v = $('#syn-in').value.trim();
  if (!v) return;
  jouer({ k: 'syn', v });
  $('#syn-in').value = '';
}
$('#syn-ok').addEventListener('click', envoieSyn);
$('#syn-in').addEventListener('keydown', e => { if (e.key === 'Enter') envoieSyn(); });

/* --- dessin --- */
const pad = $('#pad'), ctx = pad.getContext('2d');
let trace = false, coul = '#ffffff', buf = [];

function raz() { ctx.clearRect(0, 0, pad.width, pad.height); }
function segment(a, b, c) {
  ctx.strokeStyle = c; ctx.lineWidth = 4;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(a[0] * pad.width, a[1] * pad.height);
  ctx.lineTo(b[0] * pad.width, b[1] * pad.height);
  ctx.stroke();
}
const posXY = e => {
  const r = pad.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
};
let dernier = null;

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
  envoie({ t: 'D', s: buf, c: coul });
  buf = [];
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
$('#des-clear').addEventListener('click', () => { raz(); envoie({ t: 'D', raz: true }); });
$('#des-in').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const v = e.target.value.trim();
  if (!v) return;
  jouer({ k: 'guess', v });
  e.target.value = '';
});

/* =========================================================
   FIN DE PARTIE
   ========================================================= */
function finPartie() {
  ecran('s-end');
  const a = st.sc[moi], b = st.sc[autre];
  $('#end-sc').innerHTML =
    `<div><small>${esc(st.nm[moi])}</small><b>${a}</b></div>` +
    `<div><small>${esc(st.nm[autre])}</small><b>${b}</b></div>`;
  if (a === b) {
    $('#end-e').textContent = '🤝';
    $('#end-t').textContent = 'Égalité parfaite';
    $('#end-p').textContent = 'Franchement, c\'est le meilleur résultat possible pour un couple.';
  } else {
    const gagne = a > b ? st.nm[moi] : st.nm[autre];
    $('#end-e').textContent = '🏆';
    $('#end-t').textContent = `${gagne} gagne cette partie`;
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
