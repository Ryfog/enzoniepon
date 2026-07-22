/* ============ Enzo & Stacy — compte à rebours ============ */

/* Retrouvailles : mercredi 16 septembre 2026 (00:00).
   Départ du compte à rebours : 21 juillet 2026. */
const TARGET = new Date(2026, 8, 16, 0, 0, 0);
const START  = new Date(2026, 6, 21, 0, 0, 0);
const DAY = 86400000;

const $ = (id) => document.getElementById(id);
const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- petits mots (change chaque jour) ---------- */
const DAILY = [
  "Encore un dodo de moins avant de pouvoir te serrer dans mes bras.",
  "Chaque jour qui passe, c'est un jour de plus vers toi. Et ça, c'est beau.",
  "Où que tu sois là, sache qu'une partie de moi est déjà avec toi.",
  "Je ne compte pas les jours qui restent, je compte ceux qui nous rapprochent.",
  "Ferme les yeux : ce câlin qu'on se doit arrive à grands pas.",
  "Tu me manques d'une façon que même les kilomètres n'arrivent pas à mesurer.",
  "Un jour de moins, un sourire de plus rien qu'en pensant à toi.",
  "La distance n'a jamais rien pu contre nous. Elle ne commencera pas maintenant.",
  "Je t'imagine en train de lire ça, et ça me fait déjà sourire.",
  "Fais un bisou à Milo de ma part 🐾 — et garde le tien pour bientôt.",
  "On sera bientôt dans le même fuseau horaire que nos câlins.",
  "Le meilleur endroit du monde, c'est à côté de toi. J'y retourne bientôt.",
  "Aujourd'hui encore, tu es ma première et ma dernière pensée.",
  "Le temps passe lentement loin de toi, mais il passe. On y est presque.",
  "Je garde toutes mes bêtises pour te faire rire quand on se verra.",
  "T'inquiète : chaque coucher de soleil nous rapproche de nos retrouvailles.",
  "Si les câlins pouvaient s'envoyer par message, tu croulerais dessous.",
  "Tu es la personne que j'ai le plus hâte de retrouver au monde.",
  "On construit quelque chose de solide, toi et moi. La preuve : on tient.",
  "Je t'aime aujourd'hui un peu plus qu'hier, un peu moins que demain.",
  "Bientôt, plus d'écran entre nous. Juste toi, moi, et le vrai.",
  "Merci d'exister, et de m'attendre. Ça vaut tout l'or du monde.",
  "Quelque part, un mercredi de septembre nous attend en souriant.",
  "Je nous prépare des souvenirs qu'on n'oubliera jamais.",
  "Ta place à côté de moi reste chaude, promis. Elle n'attend que toi.",
  "On a survécu à un jour de plus loin l'un de l'autre. On est forts.",
  "Rien que d'écrire ton prénom, ça me met de bonne humeur : Stacy.",
  "Le compte à rebours tourne, et mon cœur avec lui — vers toi.",
  "Je t'aime plus que les mots de cette petite appli ne pourront jamais dire.",
  "Encore un peu de patience mon amour. Le plus beau nous attend.",
  "Ce matin, ma première pensée a été pour toi. Comme tous les matins.",
  "J'ai hâte de réentendre ton rire en vrai, pas dans un haut-parleur.",
  "On est deux aimants séparés : plus le temps passe, plus on s'attire.",
  "Je compte bien te voler un pull et le garder. Tu es prévenue.",
  "Un jour, on rira de toute cette distance, blottis l'un contre l'autre.",
  "Tu es ma bonne raison de me lever le matin et de sourire le soir.",
  "Prépare tes joues : j'ai un gros stock de bisous en retard à rattraper.",
  "Même à des kilomètres, je te choisis. Encore, et toujours.",
  "Notre histoire est ma préférée, et le plus beau chapitre arrive.",
  "Je t'aime le lundi, le mardi… et surtout tous les autres jours.",
  "Quand je pense à toi, la distance rétrécit d'un coup. Essaie, tu verras.",
  "Tu es la première personne à qui je veux tout raconter, chaque jour.",
  "On se rapproche, doucement mais sûrement. Comme deux évidences.",
  "J'ai réservé le plus grand câlin de l'histoire, et il porte ton nom.",
  "Ton sourire est mon fond d'écran préféré — dans ma tête et sur mon tel.",
  "Chaque jour loin de toi me rappelle la chance de t'avoir dans mon cœur.",
  "Bientôt je pourrai t'endormir pour de vrai, plus au téléphone.",
  "Je t'aime comme on aime une seule fois : à fond, sans plan B.",
  "Milo garde ta place au chaud, moi je garde la mienne dans ton cœur 🐾.",
  "On y est presque, mon amour. Tiens ma main même à travers l'écran.",
  "Tu rends l'attente supportable rien qu'en étant toi.",
  "J'ai mille choses à te dire, mais elles attendront ton oreille en vrai.",
  "Le plus dur est derrière nous. Devant, il n'y a que toi et moi.",
  "Compte avec moi : encore quelques dodos et je t'embrasse pour de vrai.",
  "Tu es mon aujourd'hui préféré et mon demain le plus sûr.",
  "Demain approche, et avec lui le moment que j'attends le plus au monde.",
  "C'est presque l'heure. Ouvre grand les bras, j'arrive. 💞",
];

/* ---------- surprises à débloquer (seuil = jours restants) ---------- */
const SURPRISES = [
  { at: 57, emoji: "💌", name: "Le début", title: "Défi n°1 — On lance le jeu 💌",
    text: "Envoie tout de suite à l'autre un message qui commence par « J'ai hâte de… » et finis la phrase avec la première chose qui te vient. C'est notre point de départ. 57 jours, on les fait ensemble." },
  { at: 50, emoji: "☁️", name: "Même ciel", title: "Défi — Le même ciel ☁️",
    text: "Où que tu sois, prends une photo du ciel maintenant et envoie-la à l'autre. On regarde le même, juste à quelques kilomètres près. Le tien contre le mien, on compare." },
  { at: 45, emoji: "🎙️", name: "Ta voix", title: "Défi — Un vocal rien que pour l'autre 🎙️",
    text: "Enregistre un vocal de 30 secondes où tu racontes ta journée, comme si l'autre était assis juste à côté de toi. Ta voix, c'est déjà un petit bout de retrouvailles." },
  { at: 40, emoji: "🐾", name: "Milo", title: "Défi — Câlin à Milo 🐾",
    text: "Attrape Milo, fais-lui un gros câlin de la part de l'autre, et envoie la photo en preuve. Il fait partie de l'équipe : c'est notre mascotte officielle du compte à rebours." },
  { at: 35, emoji: "💌", name: "3 raisons", title: "Défi — 3 choses que tu adores 💌",
    text: "Écris à l'autre 3 choses que tu adores chez lui/elle. Pas des grandes phrases, juste 3 vérités. Prépare-toi à recevoir les tiennes en retour…" },
  { at: 30, emoji: "😄", name: "Mi-chemin", title: "Défi — Selfie mi-chemin ! 😄",
    text: "La moitié du chemin est faite 🎉 Prends un selfie avec ton plus beau sourire et envoie-le. Ce sourire-là, c'est celui que l'autre a hâte de revoir en vrai." },
  { at: 21, emoji: "🤫", name: "Secret", title: "Défi — Un secret pour le jour J 🤫",
    text: "Planifie UNE petite chose que tu veux qu'on fasse le 16 septembre, et garde-la secrète. Écris juste à l'autre : « J'ai une surprise pour nous… » et rien d'autre 😏" },
  { at: 14, emoji: "📷", name: "Toi & moi", title: "Défi — Ce qui me fait penser à toi 📷",
    text: "Prends en photo une chose autour de toi qui te fait penser à l'autre aujourd'hui, et envoie-la sans explication. Laisse-le/la deviner pourquoi." },
  { at: 10, emoji: "🎶", name: "Notre son", title: "Défi — La chanson des retrouvailles 🎶",
    text: "Choisis LA chanson qui sera la bande-son de nos retrouvailles et envoie le lien à l'autre. Le jour J, on la met à fond. Promis." },
  { at: 7, emoji: "✍️", name: "Lettre", title: "Défi — Une lettre à ouvrir ensemble ✍️",
    text: "Écris une petite lettre (même trois lignes) à l'autre, mais ne l'envoie pas : garde-la pour la lire à voix haute quand vous serez enfin ensemble. Plus qu'une semaine." },
  { at: 5, emoji: "💭", name: "En un mot", title: "Défi — Comment tu te sens, là ? 💭",
    text: "En UN seul mot, dis à l'autre comment tu te sens à 5 jours de le/la retrouver. Un mot, pas plus. Le plus honnête possible." },
  { at: 3, emoji: "👗", name: "Prêt·e ?", title: "Défi — Prépare le jour J 👗",
    text: "Commence à préparer un truc pour le 16 (une tenue, une playlist, une idée…) et envoie à l'autre un indice, juste un, pour le/la faire patienter. Trois jours !" },
  { at: 2, emoji: "🖼️", name: "Souvenir", title: "Défi — Notre plus beau souvenir 🖼️",
    text: "Retrouve la plus belle photo de vous deux et renvoie-la à l'autre avec la légende de ton choix. Après-demain, on en crée de nouvelles." },
  { at: 1, emoji: "📞", name: "À demain", title: "Défi — Le dernier « à demain » 📞",
    text: "Ce soir, appelez-vous, et dites-vous « à demain » pour de vrai — le tout dernier avant longtemps. Endors-toi avec ça en tête : demain, plus d'écran." },
  { at: 0, emoji: "💞", name: "Aujourd'hui", title: "C'est aujourd'hui. Cours 💞",
    text: "Plus aucun défi. Juste un seul geste : cours dans les bras de l'autre et n'en sors plus. On y est. Le 16 septembre. Enfin. Je t'aime." },
];

/* ---------- compte à rebours ---------- */
function tick() {
  const now = new Date();
  const diff = TARGET - now;

  const days = Math.ceil((midnight(TARGET) - midnight(now)) / DAY);

  if (days <= 0) {
    $('jnum').textContent = '0';
    $('jlabel').textContent = "c'est le grand jour ! 💞";
    ['t-d','t-h','t-m','t-s'].forEach(id => $(id).textContent = '0');
    $('target').textContent = "On se retrouve aujourd'hui 🥹";
  } else {
    /* le minuteur compte le temps avant que le J− ne baisse d'un cran (prochain minuit) */
    const toNextDay = (midnight(now).getTime() + DAY) - now.getTime();
    const h = Math.floor(toNextDay % DAY / 3600000);
    const m = Math.floor(toNextDay % 3600000 / 60000);
    const s = Math.floor(toNextDay % 60000 / 1000);
    $('jnum').textContent = days;
    $('jlabel').textContent = days > 1 ? 'jours à patienter' : 'jour à patienter';
    $('t-d').textContent = days;
    $('t-h').textContent = String(h).padStart(2,'0');
    $('t-m').textContent = String(m).padStart(2,'0');
    $('t-s').textContent = String(s).padStart(2,'0');
  }
}

/* ---------- progression ---------- */
function renderProgress() {
  const now = new Date();
  const total = midnight(TARGET) - midnight(START);
  const done = clamp(midnight(now) - midnight(START), 0, total);
  const pct = Math.round(done / total * 100);
  $('prog-fill').style.width = pct + '%';
  $('prog-heart').style.left = pct + '%';
  const daysDone = Math.round(done / DAY);
  const totalDays = Math.round(total / DAY);
  const jour = daysDone > 1 ? 'jours parcourus' : 'jour parcouru';
  $('prog-txt').innerHTML = `<b>${daysDone}</b> ${jour} sur <b>${totalDays}</b> — ${pct}% du chemin 💗`;
}

/* ---------- mot du jour ---------- */
function renderDaily() {
  const now = new Date();
  const dayIndex = Math.floor((midnight(now) - midnight(START)) / DAY);
  const msg = DAILY[((dayIndex % DAILY.length) + DAILY.length) % DAILY.length];
  $('daily').textContent = msg;
  $('daily-date').textContent = now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' }).toUpperCase();
}

/* ---------- chemin de cœurs ---------- */
function renderPath() {
  const now = new Date();
  const total = Math.round((midnight(TARGET) - midnight(START)) / DAY);
  const done = clamp(Math.round((midnight(now) - midnight(START)) / DAY), 0, total);
  const path = $('path');
  path.innerHTML = '';
  for (let i = 0; i <= total; i++) {
    const s = document.createElement('span');
    if (i < done) { s.textContent = '💗'; s.className = 'done'; }
    else if (i === done) { s.textContent = '💛'; s.className = 'today'; s.title = "Nous sommes ici"; }
    else { s.textContent = '🤍'; }
    path.appendChild(s);
  }
}

/* ---------- surprises ---------- */
function renderSurprises() {
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((midnight(TARGET) - midnight(now)) / DAY));
  const opened = JSON.parse(localStorage.getItem('nous_opened') || '[]');
  const box = $('surprises');
  box.innerHTML = '';

  SURPRISES.forEach((sp, i) => {
    const unlocked = daysLeft <= sp.at;
    const el = document.createElement('div');
    el.className = 'surprise ' + (unlocked ? 'open' : 'locked');
    const isNew = unlocked && !opened.includes(i);
    if (isNew) el.classList.add('fresh');

    if (unlocked) {
      el.innerHTML =
        (isNew ? '<span class="badge-new">NOUVEAU</span>' : '') +
        `<div class="s-emoji">${sp.emoji}</div>` +
        `<div class="s-name">${sp.name}</div>` +
        `<div class="s-tap">Ouvrir ✦</div>`;
      el.onclick = () => openSurprise(i);
    } else {
      el.innerHTML =
        `<span class="s-lock">🔒</span>` +
        `<div class="s-emoji">🎁</div>` +
        `<div class="s-when">J−${sp.at}</div>` +
        `<div class="s-name">Bientôt…</div>`;
    }
    box.appendChild(el);
  });
}

function openSurprise(i) {
  const sp = SURPRISES[i];
  $('modal-emoji').textContent = sp.emoji;
  $('modal-title').textContent = sp.title;
  $('modal-text').textContent = sp.text;
  $('modal').hidden = false;
  const opened = JSON.parse(localStorage.getItem('nous_opened') || '[]');
  if (!opened.includes(i)) { opened.push(i); localStorage.setItem('nous_opened', JSON.stringify(opened)); }
  renderSurprises();
  hearts(18);
}
$('modal-x').onclick = () => $('modal').hidden = true;
$('modal').onclick = (e) => { if (e.target === $('modal')) $('modal').hidden = true; };

/* ---------- pluie de cœurs ---------- */
function hearts(n) {
  const box = $('particles');
  const g = ['💗','💖','✨','💛','🌟'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = g[i % g.length];
    s.style.left = Math.random()*100 + 'vw';
    s.style.fontSize = (14 + Math.random()*16) + 'px';
    s.style.animationDuration = (5 + Math.random()*5) + 's';
    box.appendChild(s);
    setTimeout(() => s.remove(), 11000);
  }
}
/* particules d'ambiance permanentes */
(function ambient() {
  const box = $('particles');
  const g = ['✨','💫','·','✦','💗'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.textContent = g[i % g.length];
    s.style.left = Math.random()*100 + 'vw';
    s.style.fontSize = (10 + Math.random()*16) + 'px';
    s.style.animationDuration = (10 + Math.random()*12) + 's';
    s.style.animationDelay = (-Math.random()*20) + 's';
    box.appendChild(s);
  }
})();

/* ---------- ciel étoilé (canvas) ---------- */
(function starfield() {
  const c = $('stars'), x = c.getContext('2d');
  let stars = [];
  function resize() {
    c.width = innerWidth; c.height = innerHeight;
    const n = Math.min(80, Math.floor(innerWidth*innerHeight/15000));
    stars = Array.from({length:n}, () => ({
      x: Math.random()*c.width, y: Math.random()*c.height,
      r: Math.random()*1.4+.3, a: Math.random(), sp: Math.random()*.02+.004,
    }));
  }
  function draw() {
    x.clearRect(0,0,c.width,c.height);
    for (const s of stars) {
      s.a += s.sp; const tw = (Math.sin(s.a)+1)/2;
      x.globalAlpha = .2 + tw*.8;
      x.fillStyle = tw > .6 ? '#fff3d6' : '#e8dcff';
      x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill();
    }
    x.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  addEventListener('resize', resize);
  resize(); draw();
})();

/* ---------- init ---------- */
function refreshDaily() { renderProgress(); renderDaily(); renderPath(); renderSurprises(); }
tick(); refreshDaily();
setInterval(tick, 1000);
setInterval(refreshDaily, 60000);
setTimeout(() => hearts(14), 600);
