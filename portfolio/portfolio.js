// Portfolio : apparition au défilement, filtres, partage et visionneuse plein écran.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // apparition douce des blocs
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('vu'); io.unobserve(e.target); }
      }), { rootMargin: '0px 0px -6% 0px' })
    : null;
  $$('.reveal').forEach(el => (io ? io.observe(el) : el.classList.add('vu')));

  // barre du haut : transparente sur la photo, opaque dès qu'on descend
  const barre = $('.barre');
  if (barre && document.body.classList.contains('accueil')) {
    const majBarre = () => barre.classList.toggle('pleine', scrollY > 24);
    majBarre();
    addEventListener('scroll', majBarre, { passive: true });
  }

  // bandeau : le trait doré d'Enzo est posé en bas, et la photo est découpée exactement le long de sa courbe
  const visuel = $('.hero-visuel'), image = $('.hero-image'), ligne = $('.hero-ligne-or'), L = window.LIGNE_OR;
  const decouper = () => {
    if (!visuel || !image || !ligne || !L) return;
    const W = visuel.clientWidth, H = visuel.clientHeight;
    if (!W || !H) return;
    // le trait s'estompe à ses deux bouts : on l'étire pour que ses extrémités sortent de l'écran (3 % de chaque côté)
    // et que la partie bien dorée aille d'un bord à l'autre
    const xa = L.points[0][0], xb = L.points[L.points.length - 1][0], deborde = .03;
    const k = W * (1 + 2 * deborde) / (xb - xa);
    const gauche = -xa * k - W * deborde;
    const moyenne = L.points.reduce((t, p) => t + p[1], 0) / L.points.length;
    // le milieu du trait à une distance fixe du bas (le texte garde toujours sa place au-dessus, voir .hero-contenu)
    const haut = H - (14 + 28 * W / L.w) - moyenne * k;
    Object.assign(ligne.style, { top: haut + 'px', bottom: 'auto', left: gauche + 'px', width: L.w * k + 'px' });
    const pts = L.points.map(p => [gauche + p[0] * k, haut + p[1] * k]);
    const debut = pts[0], fin = pts[pts.length - 1];
    const d = `M${debut[0].toFixed(1)} -2H${fin[0].toFixed(1)}V${fin[1].toFixed(1)}`
      + pts.slice().reverse().map(p => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + 'Z';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'><path d='${d}'/></svg>`;
    const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    image.style.webkitMaskImage = url; image.style.maskImage = url;
    image.style.webkitMaskSize = image.style.maskSize = '100% 100%';
  };
  decouper();
  let attenteDecoupe;
  addEventListener('resize', () => { clearTimeout(attenteDecoupe); attenteDecoupe = setTimeout(decouper, 80); });

  // mosaïque : rangées de 4 puis 3 cartes sur grand écran, 2 par rangée sur tablette, 1 sur téléphone ;
  // la dernière rangée s'étire pour ne jamais laisser de trou
  const grille = $('#grille');
  const placer = () => {
    if (!grille) return;
    const w = innerWidth;
    const motif = w > 1100 ? [4, 3] : w > 760 ? [2] : [1];
    const visibles = $$('.carte', grille).filter(c => !c.classList.contains('cache'));
    let i = 0, r = 0;
    while (i < visibles.length) {
      const n = Math.min(motif[r % motif.length], visibles.length - i);
      visibles.slice(i, i + n).forEach(c => {
        c.classList.remove('l1', 'l2', 'l3', 'l4');
        c.classList.add('l' + n);
      });
      i += n; r++;
    }
  };
  placer();
  let attenteResize;
  addEventListener('resize', () => { clearTimeout(attenteResize); attenteResize = setTimeout(placer, 120); });

  // filtres par catégorie (page d'accueil)
  $$('.filtre').forEach(b => b.addEventListener('click', () => {
    $$('.filtre').forEach(x => x.classList.toggle('actif', x === b));
    const f = b.dataset.filtre;
    $$('#grille .carte').forEach(c => {
      const ok = !f || c.dataset.cat === f;
      c.classList.toggle('cache', !ok);
      if (ok) c.classList.add('vu');
    });
    placer();
  }));

  // partage : menu natif du téléphone, sinon copie du lien
  const toast = $('#toast');
  let minuteur;
  const dire = m => {
    if (!toast) return;
    toast.textContent = m; toast.classList.add('vu');
    clearTimeout(minuteur); minuteur = setTimeout(() => toast.classList.remove('vu'), 2200);
  };
  const copier = async url => {
    try { await navigator.clipboard.writeText(url); dire('Lien copié'); }
    catch { window.prompt('Copie ce lien :', url); }
  };
  $$('.partage').forEach(p => {
    const url = p.dataset.url, titre = p.dataset.titre;
    $('[data-partager]', p)?.addEventListener('click', async () => {
      if (navigator.share) { try { await navigator.share({ title: titre, url }); } catch { /* partage annulé */ } }
      else copier(url);
    });
    $('[data-copier]', p)?.addEventListener('click', () => copier(url));
  });

  // visionneuse (pages de série)
  const v = $('#visionneuse');
  const photos = window.PHOTOS || [];
  if (!v || !photos.length) return;
  const img = $('img', v), legende = $('figcaption', v);
  let i = 0, retour = null;
  const montrer = k => {
    i = (k + photos.length) % photos.length;
    img.src = photos[i].src; img.alt = photos[i].titre;
    legende.textContent = `${photos[i].titre} · ${i + 1} / ${photos.length}`;
    new Image().src = photos[(i + 1) % photos.length].src;   // la suivante se charge d'avance
  };
  const ouvrir = k => { retour = document.activeElement; montrer(k); v.hidden = false; document.body.classList.add('fige'); $('.v-fermer', v).focus(); };
  const fermer = () => { v.hidden = true; document.body.classList.remove('fige'); retour?.focus(); };
  $$('.zoom').forEach(b => b.addEventListener('click', () => ouvrir(+b.dataset.i)));
  $('.v-fermer', v).addEventListener('click', fermer);
  $('.v-prec', v).addEventListener('click', () => montrer(i - 1));
  $('.v-suiv', v).addEventListener('click', () => montrer(i + 1));
  v.addEventListener('click', e => { if (e.target === v || e.target.tagName === 'FIGURE') fermer(); });
  addEventListener('keydown', e => {
    if (v.hidden) return;
    if (e.key === 'Escape') fermer();
    else if (e.key === 'ArrowLeft') montrer(i - 1);
    else if (e.key === 'ArrowRight') montrer(i + 1);
  });
  let x0 = null;
  v.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  v.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) montrer(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
