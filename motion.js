/* ============================================================
   Mouvement : défilement doux, titres qui montent de leur masque,
   et le portfolio « Dans l'objectif » : une bague de photos qui
   tourne avec le défilement.
   Rien ne se lance si le visiteur préfère moins d'animations ou si
   GSAP n'a pas chargé : le site reste complet sans ce fichier.
   ============================================================ */
(() => {
  'use strict';
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flat = /[?&]flat/.test(location.search);
  if (reduit || flat || !window.gsap || !window.ScrollTrigger) return;

  const { gsap, ScrollTrigger } = window;
  const SplitText = window.SplitText;
  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const tactile = matchMedia('(hover: none)').matches;

  /* ---------- défilement doux (souris et pavé tactile seulement) ---------- */
  let lenis = null;
  if (!tactile && window.Lenis) {
    //  Les liens d'ancre tiennent compte du scroll-padding-top (menu fixe)
    lenis = new window.Lenis({ lerp: 0.1, anchors: true, autoRaf: false });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    addEventListener('visionneuse:ouverte', () => lenis.stop());
    addEventListener('visionneuse:fermee', () => lenis.start());
  } else {
    //  Sans Lenis, le « scroll-behavior: smooth » de la page ferait glisser chaque
    //  pas de l'aimantation de la bague (elle repartirait au début) : on le coupe,
    //  et les liens d'ancre glissent quand même, en JS
    document.documentElement.style.scrollBehavior = 'auto';
    document.addEventListener('click', e => {
      const a = e.target.closest?.('a[href^="#"]');
      const id = a && a.getAttribute('href').slice(1);
      const cible = id && document.getElementById(decodeURIComponent(id));
      if (!cible) return;
      e.preventDefault();
      cible.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- accueil : le nom monte lettre par lettre ---------- */
  const shutter = $('#shutter');
  const retard = shutter && !shutter.classList.contains('done') ? 0.8 : 0.1;
  const h1 = $('.hero h1');
  if (h1 && SplitText) {
    SplitText.create(h1, {
      type: 'lines,chars', mask: 'lines', linesClass: 'ligne', autoSplit: true,
      onSplit: self => gsap.from(self.chars, {
        yPercent: 115, rotate: 6, duration: 1.2, ease: 'power4.out', stagger: 0.045, delay: retard,
        //  une fois posées, les lettres redeviennent du texte normal (et l'ombre revient entière)
        onComplete: () => self.revert()
      })
    });
  }
  gsap.from($$('.hero .kicker, .hero .tagline, .hero-cta'), {
    y: 26, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14, delay: retard + 0.45,
    clearProps: 'transform,opacity,visibility'
  });
  //  En descendant, le contenu de l'accueil s'éloigne doucement
  if ($('.hero')) {
    gsap.to('.hero-inner', {
      yPercent: -16, opacity: 0, ease: 'power1.in',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.scroll-hint', {
      opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '18% top', scrub: true }
    });
  }

  /* ---------- titres de section : chaque ligne sort de son masque ---------- */
  if (SplitText) {
    $$('.section-title').filter(t => !t.closest('.objectif')).forEach(t => {
      t.classList.remove('reveal');
      SplitText.create(t, {
        type: 'lines', mask: 'lines', linesClass: 'ligne', autoSplit: true,
        onSplit: self => gsap.from(self.lines, {
          yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.1,
          scrollTrigger: { trigger: t, start: 'top 88%', once: true }
        })
      });
    });
  }

  /* ---------- Dans l'objectif : la bague ---------- */
  const sec = $('.objectif');
  const bague = sec && $('.obj-bague', sec);
  const cartes = sec ? $$('.obj-carte', sec) : [];
  if (bague && cartes.length > 2 && CSS.supports('transform-style', 'preserve-3d')) {
    sec.classList.add('en-3d');
    //  Écart fixe entre deux photos, comme sur une bague de 10 : avec plus de photos,
    //  seules les voisines (±110°) sont visibles, la bague n'a jamais l'air bondée
    const N = cartes.length;
    const pas = 36;
    const etat = { angle: 0 };
    const num = $('.obj-num', sec);
    const titre = $('.obj-titre', sec);
    const cat = $('.obj-cat', sec);
    const mise = $('.v-mise', sec);
    const aide = $('.obj-aide', sec);
    const total = $('.obj-total', sec);
    if (total) total.textContent = String(N).padStart(2, '0');
    let R = 0, actuel = -1, decoupe = null, sortie = null, entree = null;

    //  Nouveau titre : l'ancien s'en va vers le haut, le nouveau monte lettre par lettre
    const poserTitre = (texte, categorie, instantane) => {
      sortie?.kill(); entree?.kill();
      if (instantane || !SplitText) {
        decoupe?.revert(); decoupe = null;
        titre.textContent = texte; cat.textContent = categorie;
        return;
      }
      const monter = () => {
        decoupe?.revert();
        titre.textContent = texte;
        cat.textContent = categorie;
        decoupe = SplitText.create(titre, { type: 'words,chars', mask: 'words', wordsClass: 'mot' });
        entree = gsap.timeline()
          .from(decoupe.chars, { yPercent: 110, duration: 0.75, ease: 'power4.out', stagger: 0.02 })
          .fromTo(cat, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0);
      };
      if (!decoupe) decoupe = SplitText.create(titre, { type: 'words,chars', mask: 'words', wordsClass: 'mot' });
      sortie = gsap.timeline({ onComplete: monter })
        .to(decoupe.chars, { yPercent: -110, duration: 0.26, ease: 'power2.in', stagger: 0.008 })
        .to(cat, { opacity: 0, duration: 0.2 }, 0);
    };

    //  Une nouvelle photo arrive au premier plan : mise au point, couleur, légende
    const changer = i => {
      const premier = actuel < 0;
      actuel = i;
      const c = cartes[i];
      cartes.forEach(x => {
        x.classList.toggle('devant', x === c);
        x.setAttribute('aria-current', x === c ? 'true' : 'false');
      });
      if (num) num.textContent = String(i + 1).padStart(2, '0');
      gsap.to(sec, { '--teinte': c.dataset.teinte, duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
      if (mise) {
        mise.classList.remove('net');
        gsap.fromTo(mise, { scale: 1.12, opacity: 0.55 }, {
          scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2.2)', overwrite: true,
          onComplete: () => mise.classList.add('net')
        });
      }
      poserTitre(c.dataset.titre, c.dataset.cat, premier && i === 0);
    };

    //  Chaque image du défilement : position de la bague et des photos
    const peindre = () => {
      bague.style.transform = `translateZ(${-R}px) rotateY(${-etat.angle}deg)`;
      cartes.forEach((c, i) => {
        const a = Math.abs(i * pas - etat.angle);
        const o = Math.max(0, 1 - Math.pow(a / 110, 1.4));
        c.style.opacity = o.toFixed(3);
        c.style.visibility = o < 0.02 ? 'hidden' : '';
      });
      const i = Math.min(N - 1, Math.max(0, Math.round(etat.angle / pas)));
      if (i !== actuel) changer(i);
      sec.style.setProperty('--p', (etat.angle / ((N - 1) * pas)).toFixed(4));
    };

    //  Rayon : les photos voisines se touchent presque, un peu d'air en plus
    const placer = () => {
      const cw = cartes[0].offsetWidth || bague.offsetWidth || 240;
      R = Math.round(cw * 0.5 / Math.tan(Math.PI * pas / 360) * 1.25);
      cartes.forEach((c, i) => { c.style.transform = `rotateY(${i * pas}deg) translateZ(${R}px)`; });
      peindre();
    };

    const tourner = gsap.fromTo(etat, { angle: 0 }, {
      angle: (N - 1) * pas,
      ease: 'none',
      onUpdate: peindre,
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: () => '+=' + Math.round((N - 1) * innerHeight * 0.32),
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        snap: { snapTo: 1 / (N - 1), inertia: false, duration: { min: 0.25, max: 0.7 }, delay: 0.1, ease: 'power2.inOut' }
      }
    });
    placer();
    ScrollTrigger.addEventListener('refresh', placer);

    //  Le viseur s'allume quand la section arrive
    gsap.from($$('.v-coin, .v-haut, .v-cellule', sec), {
      opacity: 0, duration: 0.9, ease: 'power2.out', stagger: 0.06,
      scrollTrigger: { trigger: sec, start: 'top 60%', once: true }
    });
    //  L'aide disparaît dès qu'on a commencé à tourner
    if (aide) {
      gsap.to(aide, {
        opacity: 0, ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top',
          end: () => '+=' + Math.round(innerHeight * 0.3), scrub: true
        }
      });
    }

    //  Toucher une photo sur le côté fait tourner la bague jusqu'à elle
    //  (celle du premier plan ouvre la visionneuse, voir script.js)
    const aller = i => {
      const st = tourner.scrollTrigger;
      const y = st.start + (i / (N - 1)) * (st.end - st.start);
      if (lenis) lenis.scrollTo(y, { duration: 1.2 });
      else scrollTo({ top: y, behavior: 'smooth' });
    };
    //  En fermant la visionneuse, la bague se place sur la dernière photo regardée
    addEventListener('visionneuse:fermee', e => {
      const i = e.detail?.index;
      if (Number.isInteger(i) && i !== actuel) aller(i);
    });
    cartes.forEach((c, i) => {
      c.addEventListener('click', () => { if (!c.classList.contains('devant')) aller(i); });
      c.addEventListener('focus', () => {
        if (!c.classList.contains('devant') && c.matches(':focus-visible')) aller(i);
      });
    });
  }

  //  Les polices et les images changent les hauteurs : un dernier calcul
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
