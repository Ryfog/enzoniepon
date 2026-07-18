/* ============ Enzo & Stacy — Qui de nous deux ? — version 🌶️ ============ */

const CATS = [
  { id: 'envies',    label: '💋 Envies' },
  { id: 'couette',   label: '🔥 Sous la couette' },
  { id: 'seduction', label: '😏 Séduction' },
  { id: 'distance',  label: '📱 Coquin à distance' },
  { id: 'fantasmes', label: '🫦 Fantasmes' },
  { id: 'hot',       label: '🌶️ Très hot' },
  { id: 'corps',     label: '💞 Corps & craquage' },
];

const QUESTIONS = [
  // 💋 Envies
  { c: 'envies', q: '…pense le plus souvent à des choses coquines ?' },
  { c: 'envies', q: '…a des envies aux pires moments de la journée ?' },
  { c: 'envies', q: '…craque en premier quand on se retrouve ?' },
  { c: 'envies', q: '…envoie le premier message coquin ?' },
  { c: 'envies', q: '…a le plus de mal à cacher son envie en public ?' },
  { c: 'envies', q: '…trouve toujours une excuse pour un câlin qui dérape ?' },
  { c: 'envies', q: '…est le/la plus insatiable ?' },
  { c: 'envies', q: '…provoque l\'autre juste pour voir sa réaction ?' },
  { c: 'envies', q: '…a déjà eu une pensée coquine pendant un appel tout innocent ?' },
  { c: 'envies', q: '…aurait le plus de mal à tenir une semaine sans rien ?' },
  { c: 'envies', q: '…se réveille avec des idées coquines ?' },
  { c: 'envies', q: '…a le plus d\'envies après minuit ?' },
  { c: 'envies', q: '…cache le mieux son jeu devant les autres ?' },
  { c: 'envies', q: '…dit « on se met un film » en pensant à tout sauf au film ?' },
  { c: 'envies', q: '…a l\'imagination la plus débordante ?' },
  // 🔥 Sous la couette
  { c: 'couette', q: '…est le/la plus câlin(e) sous la couette ?' },
  { c: 'couette', q: '…prend toute la place (et tout le reste) ?' },
  { c: 'couette', q: '…est le/la plus doué(e) de ses mains ?' },
  { c: 'couette', q: '…fait durer le plus les préliminaires ?' },
  { c: 'couette', q: '…est le/la plus bruyant(e) ?' },
  { c: 'couette', q: '…s\'endort direct après ?' },
  { c: 'couette', q: '…a le plus d\'énergie au réveil ?' },
  { c: 'couette', q: '…préfère les lumières éteintes ?' },
  { c: 'couette', q: '…est le/la plus joueur(se) ?' },
  { c: 'couette', q: '…dit des choses qu\'il/elle ne redirait JAMAIS en public ?' },
  { c: 'couette', q: '…reste romantique même dans ces moments-là ?' },
  { c: 'couette', q: '…a le plus de mal à rester discret(ète) ?' },
  { c: 'couette', q: '…transforme un câlin innocent en autre chose ?' },
  { c: 'couette', q: '…est le/la plus généreux(se) ?' },
  { c: 'couette', q: '…demande « encore » en premier ?' },
  // 😏 Séduction
  { c: 'seduction', q: '…embrasse le mieux ?' },
  { c: 'seduction', q: '…a le regard le plus déstabilisant ?' },
  { c: 'seduction', q: '…sait exactement quoi porter pour faire craquer l\'autre ?' },
  { c: 'seduction', q: '…drague encore l\'autre comme au premier jour ?' },
  { c: 'seduction', q: '…fait les compliments les plus coquins ?' },
  { c: 'seduction', q: '…a la voix la plus sexy au téléphone ?' },
  { c: 'seduction', q: '…danse de la façon la plus troublante ?' },
  { c: 'seduction', q: '…sait faire monter la température en une seule phrase ?' },
  { c: 'seduction', q: '…a le sourire le plus charmeur ?' },
  { c: 'seduction', q: '…jouerait le mieux la scène « on fait semblant de ne pas se connaître » au bar ?' },
  { c: 'seduction', q: '…est le/la plus doué(e) pour les sous-entendus ?' },
  { c: 'seduction', q: '…fait semblant de ne pas voir l\'effet qu\'il/elle fait ?' },
  { c: 'seduction', q: '…a le déhanché le plus dangereux ?' },
  { c: 'seduction', q: '…pourrait faire craquer l\'autre en dix secondes chrono ?' },
  { c: 'seduction', q: '…mérite le titre d\'allumeur(se) en chef ?' },
  // 📱 Coquin à distance
  { c: 'distance', q: '…envoie les photos les plus osées ?' },
  { c: 'distance', q: '…écrit les messages les plus chauds ?' },
  { c: 'distance', q: '…fait déraper les conversations innocentes ?' },
  { c: 'distance', q: '…est le/la plus frustré(e) par la distance ?' },
  { c: 'distance', q: '…a déjà envoyé un message coquin au pire moment ?' },
  { c: 'distance', q: '…est le/la plus créatif(ve) pour pimenter les appels vidéo ?' },
  { c: 'distance', q: '…chuchote des choses interdites au téléphone ?' },
  { c: 'distance', q: '…relit les vieilles conversations coquines ?' },
  { c: 'distance', q: '…serait capable de faire la route juste pour une nuit ?' },
  { c: 'distance', q: '…imagine les retrouvailles avec le plus de détails ?' },
  { c: 'distance', q: '…tient le moins longtemps sans appel vidéo ?' },
  { c: 'distance', q: '…envoie des vocaux à la voix beaucoup trop douce pour être innocents ?' },
  { c: 'distance', q: '…a le plus de mal à raccrocher le soir ?' },
  { c: 'distance', q: '…prépare des surprises coquines pour les retrouvailles ?' },
  { c: 'distance', q: '…transformerait la première minute des retrouvailles en scène de film interdit aux -16 ?' },
  // 🫦 Fantasmes
  { c: 'fantasmes', q: '…a les fantasmes les plus fous ?' },
  { c: 'fantasmes', q: '…ose le plus en parler ?' },
  { c: 'fantasmes', q: '…voudrait essayer le plus de nouvelles choses ?' },
  { c: 'fantasmes', q: '…a déjà rêvé de l\'autre de façon très peu innocente ?' },
  { c: 'fantasmes', q: '…proposerait un jeu de rôle en premier ?' },
  { c: 'fantasmes', q: '…voudrait une nuit d\'hôtel juste pour l\'occasion ?' },
  { c: 'fantasmes', q: '…aimerait le plus un massage… qui dérape ?' },
  { c: 'fantasmes', q: '…serait partant(e) pour un bain de minuit sans maillot ?' },
  { c: 'fantasmes', q: '…a une liste secrète d\'envies à réaliser ?' },
  { c: 'fantasmes', q: '…rougirait le plus si on lisait ses pensées à voix haute ?' },
  { c: 'fantasmes', q: '…voudrait revivre notre première fois ?' },
  { c: 'fantasmes', q: '…choisirait la plage déserte plutôt que la chambre ?' },
  { c: 'fantasmes', q: '…oserait dans un endroit où il ne faudrait pas ?' },
  { c: 'fantasmes', q: '…a déjà fait un rêve dont il/elle n\'a jamais osé parler ?' },
  { c: 'fantasmes', q: '…réaliserait un fantasme de l\'autre sans même hésiter ?' },
  // 🌶️ Très hot
  { c: 'hot', q: '…a le plus d\'endurance ?' },
  { c: 'hot', q: '…laisse des marques (et assume) ?' },
  { c: 'hot', q: '…a déjà été à deux doigts de se faire griller ?' },
  { c: 'hot', q: '…préfère le matin plutôt que le soir ?' },
  { c: 'hot', q: '…prend les initiatives les plus audacieuses ?' },
  { c: 'hot', q: '…dirait oui à « tout de suite, là, maintenant » ?' },
  { c: 'hot', q: '…est le/la plus sauvage ?' },
  { c: 'hot', q: '…est le/la plus sage… en apparence ?' },
  { c: 'hot', q: '…aime le plus prendre les commandes ?' },
  { c: 'hot', q: '…perdrait au jeu du « premier qui touche l\'autre a perdu » ?' },
  { c: 'hot', q: '…a le plus de mal à rester sage en soirée ?' },
  { c: 'hot', q: '…craquerait en premier au défi « interdiction de s\'embrasser » ?' },
  { c: 'hot', q: '…surprend le plus l\'autre ?' },
  { c: 'hot', q: '…ferait perdre tous ses moyens à l\'autre en un chuchotement ?' },
  { c: 'hot', q: '…gagnerait un concours de regards qui en disent beaucoup trop ?' },
  // 💞 Corps & craquage
  { c: 'corps', q: '…a le plus beau corps (soyez honnêtes 😏) ?' },
  { c: 'corps', q: '…est le/la plus sexy au réveil ?' },
  { c: 'corps', q: '…a les lèvres les plus embrassables ?' },
  { c: 'corps', q: '…a le cou le plus sensible ?' },
  { c: 'corps', q: '…frissonne le plus vite ?' },
  { c: 'corps', q: '…a les mains les plus baladeuses ?' },
  { c: 'corps', q: '…vole les vêtements de l\'autre (pour mieux les porter) ?' },
  { c: 'corps', q: '…est le/la plus chatouilleux(se)… et pas que sur les côtes 😏 ?' },
  { c: 'corps', q: '…a le parfum qui rend l\'autre fou/folle ?' },
  { c: 'corps', q: '…fait le plus d\'effet en sortant de la douche ?' },
  { c: 'corps', q: '…a le sourire qui fait tout basculer ?' },
  { c: 'corps', q: '…résiste le moins à l\'autre quand il/elle se déshabille ?' },
  { c: 'corps', q: '…a le point faible le plus facile à trouver ?' },
  { c: 'corps', q: '…fond complètement pour un bisou dans le cou ?' },
  { c: 'corps', q: '…a le plus de chance d\'avoir un(e) amoureux(se) aussi canon ? 🥰' },
];

const N = QUESTIONS.length;
const NAMES = { E: 'Enzo', S: 'Stacy' };

/* ---------- état ---------- */
let me = localStorage.getItem('qdn2_me') || '';           // 'E' ou 'S'
let answers = JSON.parse(localStorage.getItem('qdn2_answers') || '[]'); // ['E','S',...]
let partner = localStorage.getItem('qdn2_partner') || ''; // code complet de l'autre
let idx = answers.length;

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0 });
}
function save() {
  localStorage.setItem('qdn2_me', me);
  localStorage.setItem('qdn2_answers', JSON.stringify(answers));
  localStorage.setItem('qdn2_partner', partner);
}

/* code = identité + base64url des réponses (1 bit / question) */
function encode(who, arr) {
  const bytes = new Uint8Array(Math.ceil(N / 8));
  arr.forEach((a, i) => { if (a === 'S') bytes[i >> 3] |= 1 << (i & 7); });
  let b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return who + b64;
}
function decode(code) {
  code = (code || '').trim();
  const who = code[0];
  if (who !== 'E' && who !== 'S') return null;
  let b64 = code.slice(1).replace(/-/g, '+').replace(/_/g, '/');
  try {
    const bin = atob(b64);
    if (bin.length < Math.ceil(N / 8)) return null;
    const arr = [];
    for (let i = 0; i < N; i++) arr.push((bin.charCodeAt(i >> 3) >> (i & 7)) & 1 ? 'S' : 'E');
    return { who, arr };
  } catch { return null; }
}

/* ---------- accueil ---------- */
function startAs(w) {
  if (me && me !== w && answers.length) {
    if (!confirm('Tu avais commencé en tant que ' + NAMES[me] + ' — changer effacera tes réponses. Continuer ?')) return;
    answers = []; idx = 0;
  }
  me = w; save();
  idx = Math.min(answers.length, N);
  if (idx >= N) { showResults(); } else { renderQ(); show('screen-quiz'); }
}
$('btn-im-enzo').onclick = () => startAs('E');
$('btn-im-stacy').onclick = () => startAs('S');
$('btn-continue').onclick = () => { idx = Math.min(answers.length, N); if (idx >= N) showResults(); else { renderQ(); show('screen-quiz'); } };

/* ---------- quiz ---------- */
function renderQ() {
  const item = QUESTIONS[idx];
  $('q-text').textContent = item.q;
  $('cat-chip').textContent = CATS.find(c => c.id === item.c).label;
  $('counter').textContent = (idx + 1) + ' / ' + N;
  $('progress-fill').style.width = ((idx) / N * 100) + '%';
  $('btn-back').disabled = idx === 0;
}
function answer(w) {
  answers[idx] = w; save();
  idx++;
  if (idx >= N) { showResults(); } else { renderQ(); }
}
$('btn-ans-enzo').onclick = () => answer('E');
$('btn-ans-stacy').onclick = () => answer('S');
$('btn-back').onclick = () => { if (idx > 0) { idx--; renderQ(); } };
$('btn-quit').onclick = () => { refreshHome(); show('screen-home'); };

/* ---------- résultats ---------- */
function showResults() {
  $('res-name').textContent = NAMES[me] || 'toi';
  const ne = answers.filter(a => a === 'E').length;
  $('res-summary').textContent = 'Tu as répondu « Enzo » ' + ne + ' fois et « Stacy » ' + (N - ne) + ' fois.';
  const link = location.origin + location.pathname + '?p=' + encode(me, answers);
  $('share-link').value = link;
  refreshCompareBtn();
  show('screen-results');
}
function refreshCompareBtn() {
  const p = decode(partner);
  const ok = p && p.who !== me;
  $('btn-compare').classList.toggle('hidden', !ok);
}
$('btn-copy').onclick = async () => {
  try { await navigator.clipboard.writeText($('share-link').value); $('copy-ok').textContent = 'Copié ! Envoie-le sur Insta/Snap 💌'; }
  catch { $('share-link').select(); document.execCommand('copy'); $('copy-ok').textContent = 'Copié !'; }
  setTimeout(() => $('copy-ok').textContent = '', 3500);
};
$('btn-import').onclick = () => importCode($('partner-code').value);
function importCode(raw) {
  raw = (raw || '').trim();
  const m = raw.match(/[?&]p=([^&\s]+)/);
  if (m) raw = m[1];
  const p = decode(raw);
  if (!p) { $('import-msg').textContent = 'Code invalide 😢 vérifie le copier-coller.'; return false; }
  if (p.who === me) { $('import-msg').textContent = 'C\'est ton propre code 😅 il faut celui de l\'autre !'; return false; }
  partner = raw; save();
  $('import-msg').textContent = '';
  refreshCompareBtn();
  return true;
}
$('btn-compare').onclick = () => renderCompare();
$('btn-redo').onclick = () => {
  if (!confirm('Effacer toutes tes réponses et recommencer ?')) return;
  answers = []; idx = 0; save();
  renderQ(); show('screen-quiz');
};
$('btn-home2').onclick = () => { refreshHome(); show('screen-home'); };
$('btn-back-results').onclick = () => show('screen-results');

/* ---------- comparaison ---------- */
function renderCompare() {
  const p = decode(partner);
  if (!p) return;
  const mine = answers, theirs = p.arr;
  const enzoArr = me === 'E' ? mine : theirs;
  const stacyArr = me === 'S' ? mine : theirs;

  let match = 0;
  QUESTIONS.forEach((_, i) => { if (enzoArr[i] === stacyArr[i]) match++; });
  const pct = Math.round(match / N * 100);
  $('match-pct').textContent = pct + '%';
  $('match-circle').style.setProperty('--pct', pct);
  $('match-msg').textContent =
    pct >= 90 ? 'Fusionnels 💞 vous pensez quasiment pareil, c\'est presque flippant !' :
    pct >= 75 ? 'Très connectés 💘 vous vous connaissez par cœur (ou presque) !' :
    pct >= 60 ? 'Belle complicité 💕 mais il reste des petits mystères entre vous…' :
    pct >= 45 ? 'Hmm 😏 vous n\'êtes pas d\'accord sur tout — de quoi débattre en appel !' :
    'Aïe aïe 😂 vous ne vivez clairement pas dans le même film. Débat immédiat !';

  // stats par catégorie
  const catBox = $('cat-stats'); catBox.innerHTML = '';
  CATS.forEach(cat => {
    const ids = QUESTIONS.map((q, i) => q.c === cat.id ? i : -1).filter(i => i >= 0);
    const m = ids.filter(i => enzoArr[i] === stacyArr[i]).length;
    const el = document.createElement('span');
    el.className = 'cat-stat';
    el.textContent = cat.label + ' ' + m + '/' + ids.length;
    catBox.appendChild(el);
  });

  // liste détaillée
  const list = $('compare-list'); list.innerHTML = '';
  CATS.forEach(cat => {
    const title = document.createElement('h3');
    title.className = 'cmp-cat-title';
    title.textContent = cat.label;
    list.appendChild(title);
    QUESTIONS.forEach((q, i) => {
      if (q.c !== cat.id) return;
      const same = enzoArr[i] === stacyArr[i];
      const item = document.createElement('div');
      item.className = 'cmp-item' + (same ? '' : ' diff');
      item.innerHTML =
        '<span class="cmp-icon">' + (same ? '💚' : '🧡') + '</span>' +
        '<span class="cmp-q">Qui ' + q.q.replace(/^…/, '') + '</span>' +
        '<span class="cmp-ans">' +
          '<span class="pill pill-enzo">Enzo dit : ' + NAMES[enzoArr[i]] + '</span>' +
          '<span class="pill pill-stacy">Stacy dit : ' + NAMES[stacyArr[i]] + '</span>' +
        '</span>';
      list.appendChild(item);
    });
  });
  show('screen-compare');
}

/* ---------- cœurs flottants ---------- */
(function hearts() {
  const box = document.querySelector('.hearts-bg');
  const glyphs = ['💗', '💕', '💖', '🩷', '💞', '❤️'];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.textContent = glyphs[i % glyphs.length];
    s.style.left = (Math.random() * 98) + 'vw';
    s.style.fontSize = (14 + Math.random() * 20) + 'px';
    s.style.animationDuration = (9 + Math.random() * 12) + 's';
    s.style.animationDelay = (-Math.random() * 18) + 's';
    box.appendChild(s);
  }
})();

/* ---------- init ---------- */
function refreshHome() {
  const started = me && answers.length > 0;
  $('btn-continue').classList.toggle('hidden', !started);
  if (started) {
    $('btn-continue').textContent = answers.length >= N
      ? 'Voir mes résultats (' + NAMES[me] + ') →'
      : 'Reprendre — ' + NAMES[me] + ', question ' + (answers.length + 1) + '/' + N + ' →';
  }
}
(function init() {
  const m = location.search.match(/[?&]p=([^&]+)/);
  if (m) {
    const code = decodeURIComponent(m[1]);
    const p = decode(code);
    if (p) {
      if (!me) {
        // premier passage : le lien reçu détermine qui je suis (l'autre)
        me = p.who === 'E' ? 'S' : 'E';
      }
      if (p.who !== me) { partner = code; save(); }
    }
    history.replaceState(null, '', location.pathname);
  }
  refreshHome();
  if (me && answers.length >= N) showResults();
})();
