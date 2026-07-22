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
];

/* ---------- surprises à débloquer (seuil = jours restants) ---------- */
const SURPRISES = [
  { at: 57, emoji: "💌", name: "Le début", title: "Notre compte à rebours commence 💫",
    text: "J'ai créé cette petite appli rien que pour nous deux. Chaque jour, un nouveau mot t'attend, et des surprises s'ouvriront au fil du temps. On y va ensemble, jusqu'au 16 septembre. Je t'aime." },
  { at: 50, emoji: "🎶", name: "Notre son", title: "La chanson de nous 🎶",
    text: "Mets la chanson qui te fait penser à moi, monte le son, et danse dans ta chambre comme si j'étais là. Moi je fais pareil de mon côté, au même moment si tu veux. La distance déteste quand on fait ça." },
  { at: 45, emoji: "📸", name: "Souvenir", title: "Notre plus beau souvenir 📸",
    text: "Repense à LE moment avec moi que tu préfères. Celui qui te fait sourire toute seule. Garde-le en tête aujourd'hui : c'est un avant-goût de tout ce qu'on va encore vivre." },
  { at: 40, emoji: "🐾", name: "Milo", title: "Un câlin à Milo 🐾",
    text: "Ordre officiel : fais un gros câlin à Milo de ma part. Il fait partie de l'équipe, et je suis sûr qu'il t'aide à patienter aussi. Dis-lui que je le remercie de veiller sur toi." },
  { at: 35, emoji: "💭", name: "Promesse", title: "Une promesse pour nous 💭",
    text: "Je te promets qu'à chaque fois qu'on se retrouvera, je te regarderai comme la première fois. La distance ne me fera jamais oublier la chance que j'ai de t'avoir." },
  { at: 30, emoji: "✨", name: "Mi-chemin", title: "On est à mi-chemin ! ✨",
    text: "La moitié du chemin est faite. Regarde en arrière : tout ce temps, on l'a tenu. Regarde devant : c'est encore plus court. Tu es incroyable de patience, et je suis fier de nous." },
  { at: 21, emoji: "💐", name: "3 semaines", title: "Plus que trois semaines 💐",
    text: "Trois petites semaines. Tu peux déjà commencer à imaginer le moment où on se voit : la porte qui s'ouvre, ton sourire, le mien. Moi j'y pense tous les jours." },
  { at: 14, emoji: "💞", name: "2 semaines", title: "Deux semaines, mon amour 💞",
    text: "On y est presque. Prépare-toi à te faire kidnapper pour un câlin d'une durée totalement déraisonnable. J'ai deux semaines de tendresse en réserve avec ton nom dessus." },
  { at: 10, emoji: "📅", name: "Bientôt", title: "Le compte à rebours des grands jours 📅",
    text: "Moins de deux mains pour compter les jours. Commence à penser à ce que tu veux qu'on fasse ensemble — je note tout, je veux rendre ces moments parfaits." },
  { at: 7, emoji: "🌙", name: "J-7", title: "Plus qu'une semaine 🌙",
    text: "Sept dodos. Sept. Cette semaine va être la plus longue et la plus excitante. Chaque soir en t'endormant, dis-toi : un de moins. Je fais exactement pareil en pensant à toi." },
  { at: 5, emoji: "🧳", name: "J-5", title: "On y est presque 🧳",
    text: "Cinq jours. Tu peux commencer à préparer ton plus beau sourire (celui que je préfère). Moi je compte les heures maintenant, plus vraiment les jours." },
  { at: 3, emoji: "💗", name: "J-3", title: "Trois jours ! 💗",
    text: "Trois jours et je peux enfin arrêter de t'aimer à travers un écran. Mon cœur bat plus vite rien qu'en écrivant ça. Tiens bon, on y est." },
  { at: 2, emoji: "🔥", name: "J-2", title: "Après-demain 🔥",
    text: "Après-demain. APRÈS-DEMAIN. J'ai du mal à y croire. La prochaine fois que tu ouvriras cette appli, ce sera presque le grand jour." },
  { at: 1, emoji: "🌅", name: "J-1", title: "Demain, enfin 🌅",
    text: "Demain, je te retrouve. Ce soir, endors-toi en sachant que c'est le tout dernier soir loin l'un de l'autre avant longtemps. Je t'aime tellement. À demain, mon amour." },
  { at: 0, emoji: "💞", name: "Aujourd'hui", title: "C'est aujourd'hui. 💞",
    text: "On y est. Le fameux 16 septembre. Plus d'écran, plus de kilomètres, plus d'attente — juste toi et moi. Prépare-toi au plus beau câlin de ta vie. Je t'aime, Stacy. Depuis toujours, pour toujours." },
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
    const n = Math.min(140, Math.floor(innerWidth*innerHeight/9000));
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
