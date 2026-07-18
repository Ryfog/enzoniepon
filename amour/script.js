/* ============ Enzo & Stacy — Qui de nous deux ? ============ */

const CATS = [
  { id: 'amour',    label: '💘 Amour' },
  { id: 'fun',      label: '😂 Fun & délires' },
  { id: 'quotidien',label: '🏠 Au quotidien' },
  { id: 'distance', label: '📱 À distance' },
  { id: 'futur',    label: '🔮 Notre futur' },
  { id: 'coquin',   label: '🌶️ Coquin' },
  { id: 'caractere',label: '✨ Caractère' },
];

const QUESTIONS = [
  // 💘 Amour
  { c: 'amour', q: '…est tombé(e) amoureux(se) en premier ?' },
  { c: 'amour', q: '…dit « je t\'aime » le plus souvent ?' },
  { c: 'amour', q: '…est le/la plus romantique ?' },
  { c: 'amour', q: '…fait les plus belles déclarations ?' },
  { c: 'amour', q: '…pense le plus à l\'autre dans la journée ?' },
  { c: 'amour', q: '…est le/la plus jaloux(se) ?' },
  { c: 'amour', q: '…pardonne le plus vite après une dispute ?' },
  { c: 'amour', q: '…fait le premier pas pour se réconcilier ?' },
  { c: 'amour', q: '…offre les meilleurs cadeaux ?' },
  { c: 'amour', q: '…est le/la plus attentionné(e) ?' },
  { c: 'amour', q: '…se souvient le mieux des dates importantes ?' },
  { c: 'amour', q: '…écrit les messages les plus mignons ?' },
  { c: 'amour', q: '…est le/la plus fier(ère) de montrer l\'autre ?' },
  { c: 'amour', q: '…aime le plus les câlins ?' },
  { c: 'amour', q: '…serait complètement perdu(e) sans l\'autre ?' },
  // 😂 Fun
  { c: 'fun', q: '…rit le plus fort ?' },
  { c: 'fun', q: '…fait les pires blagues ?' },
  { c: 'fun', q: '…est le/la plus maladroit(e) ?' },
  { c: 'fun', q: '…chante le plus faux ?' },
  { c: 'fun', q: '…danse le mieux ?' },
  { c: 'fun', q: '…est le/la plus mauvais(e) perdant(e) ?' },
  { c: 'fun', q: '…triche aux jeux ?' },
  { c: 'fun', q: '…fait les grimaces les plus drôles ?' },
  { c: 'fun', q: '…a le rire le plus contagieux ?' },
  { c: 'fun', q: '…raconte le mieux les histoires ?' },
  { c: 'fun', q: '…imite le mieux les gens ?' },
  { c: 'fun', q: '…fait le plus de bêtises ?' },
  { c: 'fun', q: '…est le/la plus dramatique ?' },
  { c: 'fun', q: '…a les idées les plus folles ?' },
  { c: 'fun', q: '…ferait n\'importe quoi pour un pari ?' },
  // 🏠 Quotidien
  { c: 'quotidien', q: '…dort le plus ?' },
  { c: 'quotidien', q: '…ronfle (même si il/elle le nie) ?' },
  { c: 'quotidien', q: '…est le/la plus bordélique ?' },
  { c: 'quotidien', q: '…cuisine le mieux ?' },
  { c: 'quotidien', q: '…mange le plus ?' },
  { c: 'quotidien', q: '…est le/la plus gourmand(e) ?' },
  { c: 'quotidien', q: '…passe le plus de temps dans la salle de bain ?' },
  { c: 'quotidien', q: '…est toujours en retard ?' },
  { c: 'quotidien', q: '…dépense le plus d\'argent ?' },
  { c: 'quotidien', q: '…est le/la plus accro à son téléphone ?' },
  { c: 'quotidien', q: '…regarde le plus de séries ?' },
  { c: 'quotidien', q: '…se plaint le plus ?' },
  { c: 'quotidien', q: '…a le pire caractère au réveil ?' },
  { c: 'quotidien', q: '…oublie tout, tout le temps ?' },
  { c: 'quotidien', q: '…gagnerait un concours de flemme ?' },
  // 📱 À distance
  { c: 'distance', q: '…envoie le premier message le matin ?' },
  { c: 'distance', q: '…appelle le plus souvent ?' },
  { c: 'distance', q: '…supporte le moins la distance ?' },
  { c: 'distance', q: '…s\'endort en premier en appel vidéo ?' },
  { c: 'distance', q: '…envoie le plus de vocaux ?' },
  { c: 'distance', q: '…envoie le plus de photos ?' },
  { c: 'distance', q: '…re-regarde le plus nos anciennes photos ?' },
  { c: 'distance', q: '…compte les jours avant qu\'on se revoie ?' },
  { c: 'distance', q: '…est le/la plus ému(e) aux retrouvailles ?' },
  { c: 'distance', q: '…est le/la plus triste aux départs ?' },
  { c: 'distance', q: '…ferait la route en pleine nuit sur un coup de tête ?' },
  { c: 'distance', q: '…organise le mieux les retrouvailles ?' },
  { c: 'distance', q: '…est le/la plus impatient(e) ?' },
  { c: 'distance', q: '…envoie des messages même quand l\'autre dort ?' },
  { c: 'distance', q: '…stalke le plus le profil de l\'autre ?' },
  // 🔮 Futur
  { c: 'futur', q: '…veut se marier en premier ?' },
  { c: 'futur', q: '…fera sa demande à l\'autre ?' },
  { c: 'futur', q: '…pleurera le plus au mariage ?' },
  { c: 'futur', q: '…veut le plus d\'enfants ?' },
  { c: 'futur', q: '…sera le parent le plus sévère ?' },
  { c: 'futur', q: '…sera le parent qui gâte trop ?' },
  { c: 'futur', q: '…choisira la déco de notre maison ?' },
  { c: 'futur', q: '…voudra adopter (encore) un animal ?' },
  { c: 'futur', q: '…gérera le mieux le budget ?' },
  { c: 'futur', q: '…fera la cuisine dans notre future maison ?' },
  { c: 'futur', q: '…conduira pendant les road trips ?' },
  { c: 'futur', q: '…choisira les destinations de voyage ?' },
  { c: 'futur', q: '…deviendra accro au bricolage ?' },
  { c: 'futur', q: '…voudrait vivre à l\'étranger ?' },
  { c: 'futur', q: '…dira « je te l\'avais dit » dans 10 ans ?' },
  // 🌶️ Coquin
  { c: 'coquin', q: '…est le/la plus câlin(e) ?' },
  { c: 'coquin', q: '…embrasse le mieux ?' },
  { c: 'coquin', q: '…envoie les messages les plus coquins ?' },
  { c: 'coquin', q: '…a le plus de charme ?' },
  { c: 'coquin', q: '…fait craquer l\'autre d\'un seul regard ?' },
  { c: 'coquin', q: '…est le/la plus taquin(e) ?' },
  { c: 'coquin', q: '…prend le plus d\'initiatives ?' },
  { c: 'coquin', q: '…était le/la plus timide au début ?' },
  { c: 'coquin', q: '…a le plus d\'imagination ?' },
  { c: 'coquin', q: '…est le/la plus démonstratif(ve) en public ?' },
  { c: 'coquin', q: '…vole les vêtements de l\'autre ?' },
  { c: 'coquin', q: '…est le/la plus beau/belle au réveil ?' },
  { c: 'coquin', q: '…a le sourire le plus craquant ?' },
  { c: 'coquin', q: '…résiste le moins à l\'autre ?' },
  { c: 'coquin', q: '…a les pensées les plus coquines dans la journée ?' },
  // ✨ Caractère
  { c: 'caractere', q: '…est le/la plus têtu(e) ?' },
  { c: 'caractere', q: '…est le/la plus patient(e) ?' },
  { c: 'caractere', q: '…s\'inquiète le plus ?' },
  { c: 'caractere', q: '…est le/la plus courageux(se) ?' },
  { c: 'caractere', q: '…a le plus confiance en lui/elle ?' },
  { c: 'caractere', q: '…est le/la plus généreux(se) ?' },
  { c: 'caractere', q: '…est le/la plus curieux(se) ?' },
  { c: 'caractere', q: '…garde le mieux un secret ?' },
  { c: 'caractere', q: '…est le/la plus optimiste ?' },
  { c: 'caractere', q: '…s\'énerve le plus vite ?' },
  { c: 'caractere', q: '…est le/la plus sensible ?' },
  { c: 'caractere', q: '…prend les meilleures décisions ?' },
  { c: 'caractere', q: '…est le/la plus intelligent(e) ?' },
  { c: 'caractere', q: '…a le plus grand cœur ?' },
  { c: 'caractere', q: '…a le plus de chance d\'avoir trouvé l\'autre ? 🥰' },
];

const N = QUESTIONS.length;
const NAMES = { E: 'Enzo', S: 'Stacy' };

/* ---------- état ---------- */
let me = localStorage.getItem('qdn_me') || '';           // 'E' ou 'S'
let answers = JSON.parse(localStorage.getItem('qdn_answers') || '[]'); // ['E','S',...]
let partner = localStorage.getItem('qdn_partner') || ''; // code complet de l'autre
let idx = answers.length;

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0 });
}
function save() {
  localStorage.setItem('qdn_me', me);
  localStorage.setItem('qdn_answers', JSON.stringify(answers));
  localStorage.setItem('qdn_partner', partner);
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
