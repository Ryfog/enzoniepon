/* =========================================================
   LE GRAND OUVRAGE — rendu « matières cousues »
   Tout est dessiné au canvas : feutre, coutures, laine, carton.
   Les tuiles fixes sont pré-dessinées une fois par niveau dans un
   canvas hors écran, on n'en recopie ensuite que la partie visible.
   ========================================================= */

const T = 40;                       // taille d'une case
const VUE_L = 1280, VUE_H = 720;    // fenêtre de jeu

/* ---------- palette ---------- */
const PAL = {
  terre: '#7d5a3c', terreH: '#9a7049', terreB: '#5e4229',
  herbe: '#6fae4a', herbeH: '#8dc960',
  planche: '#c69a63', plancheH: '#dcb27e',
  cyan: '#3fd6c8', cyanS: '#8ef2e8',
  rose: '#ff7fb0', roseS: '#ffb8d4',
  ressort: '#f2b33c', tapis: '#8a6fb0',
  porte: '#a8623a', metal: '#8fa3ae',
  fil: '#f4e0c0'
};

/* ---------- texture feutre ---------- */
let motif = null;
function faisMotif() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const img = x.createImageData(64, 64);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() * 40 - 20);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 22;
  }
  x.putImageData(img, 0, 0);
  return x.canvas;
}

/* ---------- utilitaires de tracé ---------- */
function rrect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
/* couture : petits tirets clairs le long d'un segment */
function couture(g, x1, y1, x2, y2, col = 'rgba(255,255,255,.55)') {
  g.save();
  g.strokeStyle = col; g.lineWidth = 2; g.lineCap = 'round';
  g.setLineDash([5, 6]);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  g.restore();
}

/* =========================================================
   PRÉ-DESSIN DES TUILES FIXES
   ========================================================= */
function preDessine(carte, larg, monIdx) {
  if (!motif) motif = faisMotif();
  const c = document.createElement('canvas');
  c.width = larg * T; c.height = HAUT * T;
  const g = c.getContext('2d');

  const plein = (x, y) => {
    const t = carte[y] && carte[y][x];
    return t === '#' ;
  };

  for (let y = 0; y < HAUT; y++) {
    for (let x = 0; x < larg; x++) {
      const t = carte[y][x], px = x * T, py = y * T;

      if (t === '#') {
        const surface = !plein(x, y - 1);
        g.fillStyle = surface ? PAL.terreH : PAL.terre;
        g.fillRect(px, py, T, T);
        g.fillStyle = PAL.terreB;
        g.fillRect(px, py + T - 4, T, 4);
        /* herbe en surface */
        if (surface) {
          g.fillStyle = PAL.herbe;
          g.fillRect(px, py, T, 11);
          g.fillStyle = PAL.herbeH;
          for (let i = 0; i < 4; i++) {
            const hx = px + 4 + i * 10;
            g.beginPath();
            g.moveTo(hx, py + 11);
            g.quadraticCurveTo(hx + 3, py + 2, hx + 6, py + 11);
            g.fill();
          }
          couture(g, px + 2, py + 15, px + T - 2, py + 15, 'rgba(255,255,255,.28)');
        }
        /* liseré vertical entre deux blocs */
        if (!plein(x - 1, y)) { g.fillStyle = PAL.terreB; g.fillRect(px, py, 3, T); }
        if (!plein(x + 1, y)) { g.fillStyle = PAL.terreB; g.fillRect(px + T - 3, py, 3, T); }
        g.drawImage(motif, px, py, T, T);
      }

      else if (t === '_') {
        g.fillStyle = PAL.planche;
        rrect(g, px, py + 6, T, 16, 5); g.fill();
        g.fillStyle = PAL.plancheH;
        rrect(g, px, py + 6, T, 6, 4); g.fill();
        couture(g, px + 3, py + 15, px + T - 3, py + 15, 'rgba(90,60,30,.45)');
        g.drawImage(motif, px, py + 6, T, 16);
      }

      else if (t === 'C' || t === 'P') {
        const pour = t === 'C' ? 0 : 1;
        const base = t === 'C' ? PAL.cyan : PAL.rose;
        const clair = t === 'C' ? PAL.cyanS : PAL.roseS;
        g.globalAlpha = (monIdx === pour || monIdx === -1) ? 1 : .32;
        g.fillStyle = base;
        rrect(g, px + 1, py + 5, T - 2, 20, 7); g.fill();
        g.fillStyle = clair;
        rrect(g, px + 1, py + 5, T - 2, 7, 5); g.fill();
        couture(g, px + 5, py + 15, px + T - 5, py + 15, 'rgba(255,255,255,.7)');
        g.globalAlpha = 1;
      }

      else if (t === '^') {
        /* épingles à couture plantées */
        for (let i = 0; i < 3; i++) {
          const ex = px + 7 + i * 13;
          g.strokeStyle = PAL.metal; g.lineWidth = 3; g.lineCap = 'round';
          g.beginPath(); g.moveTo(ex, py + T); g.lineTo(ex, py + 12); g.stroke();
          g.fillStyle = i % 2 ? '#ff5d7a' : '#5db8ff';
          g.beginPath(); g.arc(ex, py + 10, 5, 0, 7); g.fill();
        }
      }

      else if (t === 'B') {
        g.fillStyle = '#6b4a2a';
        rrect(g, px + 2, py + 26, T - 4, 14, 4); g.fill();
        g.strokeStyle = PAL.ressort; g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath();
        for (let i = 0; i < 3; i++) {
          g.moveTo(px + 7, py + 30 - i * 6);
          g.lineTo(px + T - 7, py + 26 - i * 6);
        }
        g.stroke();
        g.fillStyle = PAL.ressort;
        rrect(g, px + 4, py + 6, T - 8, 8, 4); g.fill();
      }

      else if (t === '>' || t === '<') {
        g.fillStyle = PAL.tapis;
        rrect(g, px, py + 8, T, 18, 4); g.fill();
        g.fillStyle = 'rgba(255,255,255,.25)';
        for (let i = 0; i < 3; i++) g.fillRect(px + 4 + i * 12, py + 12, 5, 10);
      }

      else if (t === 'b') {
        g.fillStyle = '#5a6b74';
        rrect(g, px + 2, py + 26, T - 4, 14, 4); g.fill();
        g.fillStyle = '#8fa3ae';
        rrect(g, px + 6, py + 22, T - 12, 8, 4); g.fill();
      }
    }
  }
  return c;
}

/* =========================================================
   FOND EN PARALLAXE
   ========================================================= */
function collines(g, camX, decal, y0, h, col, pas) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(-50, VUE_H);
  const off = -camX * decal;
  for (let x = -50; x <= VUE_L + 50; x += 10) {
    const t = (x - off) / pas;
    const y = y0 + Math.sin(t) * h + Math.sin(t * 2.3) * h * .35;
    g.lineTo(x, y);
  }
  g.lineTo(VUE_L + 50, VUE_H);
  g.closePath();
  g.fill();
}

function fond(g, camX, temps) {
  const ciel = g.createLinearGradient(0, 0, 0, VUE_H);
  ciel.addColorStop(0, '#8fd4f0');
  ciel.addColorStop(.55, '#bfe9f7');
  ciel.addColorStop(1, '#e9f7dd');
  g.fillStyle = ciel;
  g.fillRect(0, 0, VUE_L, VUE_H);

  /* soleil laineux */
  const sx = 190, sy = 130;
  const halo = g.createRadialGradient(sx, sy, 10, sx, sy, 190);
  halo.addColorStop(0, 'rgba(255,240,190,.85)');
  halo.addColorStop(1, 'rgba(255,240,190,0)');
  g.fillStyle = halo;
  g.beginPath(); g.arc(sx, sy, 190, 0, 7); g.fill();

  /* nuages en ouate */
  g.fillStyle = 'rgba(255,255,255,.85)';
  for (let i = 0; i < 5; i++) {
    const nx = ((i * 340 + temps * 6 - camX * .06) % (VUE_L + 400)) - 200;
    const ny = 70 + (i % 3) * 55;
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.arc(nx + k * 30, ny + Math.sin(k) * 8, 26 - k * 2, 0, 7);
      g.fill();
    }
  }

  collines(g, camX, .12, 430, 45, '#a8cf94', 130);
  collines(g, camX, .28, 505, 38, '#86ba72', 100);
  collines(g, camX, .48, 580, 30, '#6aa25c', 80);
}

/* arbres de laine au fond, calés sur la grille */
function arbres(g, camX, larg) {
  const dec = .62;
  for (let i = 0; i < larg; i += 7) {
    const wx = i * T, sx = wx - camX * dec;
    if (sx < -160 || sx > VUE_L + 160) continue;
    const base = 620 - ((i * 37) % 40);
    const h = 150 + ((i * 53) % 70);
    g.fillStyle = '#6b4a30';
    g.fillRect(sx - 9, base - h * .45, 18, h * .45);
    g.fillStyle = '#5f9c4e';
    g.beginPath(); g.arc(sx, base - h * .5, 52, 0, 7); g.fill();
    g.beginPath(); g.arc(sx - 34, base - h * .38, 36, 0, 7); g.fill();
    g.beginPath(); g.arc(sx + 34, base - h * .38, 36, 0, 7); g.fill();
    g.fillStyle = '#79b862';
    g.beginPath(); g.arc(sx - 12, base - h * .58, 30, 0, 7); g.fill();
  }
}

/* =========================================================
   PERSONNAGES
   ========================================================= */
function bonhomme(g, p, i, nom, temps) {
  const col = i === 0 ? PAL.cyan : PAL.rose;
  const clair = i === 0 ? PAL.cyanS : PAL.roseS;
  const w = PW, h = PH;

  g.save();
  if (p.mort > 0) g.globalAlpha = (p.mort % 10 < 5) ? .35 : .1;

  /* écrasement / étirement */
  const et = Math.max(-.28, Math.min(.28, p.vy / 46));
  const sx = 1 - et, sy = 1 + et;
  const cx = p.x + w / 2, bas = p.y + h;
  g.translate(cx, bas);
  g.scale(sx, sy);
  g.translate(-cx, -bas);

  /* ombre portée */
  g.fillStyle = 'rgba(0,0,0,.2)';
  g.beginPath(); g.ellipse(cx, bas + 3, w * .45, 5, 0, 0, 7); g.fill();

  /* jambes qui battent */
  const court = Math.abs(p.vx) > .4 && p.sol;
  const bat = court ? Math.sin(temps * 14) * 7 : 0;
  g.strokeStyle = col; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx - 6, bas - 8); g.lineTo(cx - 6 + bat, bas + 2);
  g.moveTo(cx + 6, bas - 8); g.lineTo(cx + 6 - bat, bas + 2);
  g.stroke();

  /* bras */
  const brasA = p.sol ? Math.sin(temps * 14) * 8 : -10;
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(p.x + 2, p.y + 16); g.lineTo(p.x - 4, p.y + 22 + brasA);
  g.moveTo(p.x + w - 2, p.y + 16); g.lineTo(p.x + w + 4, p.y + 22 - brasA);
  g.stroke();

  /* corps en tricot */
  g.fillStyle = col;
  rrect(g, p.x, p.y, w, h, 11); g.fill();
  g.fillStyle = clair;
  rrect(g, p.x + 2, p.y + 2, w - 4, 12, 8); g.fill();
  /* couture centrale */
  couture(g, cx, p.y + 6, cx, p.y + h - 5, 'rgba(255,255,255,.5)');

  /* yeux boutons */
  const dx = p.d > 0 ? 3 : -3;
  [[-6, 0], [6, 0]].forEach(([ox]) => {
    g.fillStyle = '#fffaf0';
    g.beginPath(); g.arc(cx + ox + dx, p.y + 14, 5.5, 0, 7); g.fill();
    g.fillStyle = '#33241a';
    g.beginPath(); g.arc(cx + ox + dx, p.y + 14, 2.6, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(cx + ox + dx - 2, p.y + 12); g.lineTo(cx + ox + dx + 2, p.y + 16); g.stroke();
  });

  /* bouche cousue */
  g.strokeStyle = 'rgba(60,35,20,.6)'; g.lineWidth = 2;
  g.beginPath(); g.arc(cx + dx, p.y + 22, 4, .2, Math.PI - .2); g.stroke();

  g.restore();

  /* prénom */
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(30,20,15,.55)';
  g.font = '600 13px "Space Grotesk", sans-serif';
  g.textAlign = 'center';
  g.fillText(nom, cx, p.y - 10);
}

/* fil de laine qui relie les deux personnages */
function filDeLaine(g, a, b, temps) {
  const x1 = a.x + PW / 2, y1 = a.y + PH / 2;
  const x2 = b.x + PW / 2, y2 = b.y + PH / 2;
  const d = Math.hypot(x2 - x1, y2 - y1);
  const creux = Math.min(70, d * .22);
  g.save();
  g.strokeStyle = 'rgba(255,255,255,.5)';
  g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x1, y1);
  for (let t = 0; t <= 1.001; t += .05) {
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * creux
              + Math.sin(t * 9 + temps * 3) * 2.5;
    g.lineTo(x, y);
  }
  g.stroke();
  g.restore();
}

/* =========================================================
   BESTIOLES ET OBJETS
   ========================================================= */
function bestiole(g, e, temps) {
  if (!e.vif) {
    g.save(); g.globalAlpha = .5;
    g.fillStyle = '#8a6a52';
    rrect(g, e.x, e.y + 22, 34, 10, 5); g.fill();
    g.restore(); return;
  }
  const cx = e.x + 17, bas = e.y + 32;
  const dodu = Math.sin(temps * 6 + e.ph) * 2;
  g.fillStyle = 'rgba(0,0,0,.18)';
  g.beginPath(); g.ellipse(cx, bas + 3, 15, 4, 0, 0, 7); g.fill();

  g.fillStyle = '#d4574f';
  rrect(g, e.x, e.y + 6 - dodu, 34, 26 + dodu, 12); g.fill();
  g.fillStyle = '#e8807a';
  rrect(g, e.x + 2, e.y + 8 - dodu, 30, 9, 7); g.fill();
  couture(g, e.x + 5, e.y + 20, e.x + 29, e.y + 20, 'rgba(255,255,255,.45)');

  /* pattes */
  g.strokeStyle = '#a83f38'; g.lineWidth = 4; g.lineCap = 'round';
  const p = Math.sin(temps * 12 + e.ph) * 4;
  g.beginPath();
  g.moveTo(cx - 8, bas - 4); g.lineTo(cx - 8 + p, bas + 2);
  g.moveTo(cx + 8, bas - 4); g.lineTo(cx + 8 - p, bas + 2);
  g.stroke();

  /* yeux */
  const dx = e.dir > 0 ? 3 : -3;
  [[-7], [7]].forEach(([ox]) => {
    g.fillStyle = '#fffaf0';
    g.beginPath(); g.arc(cx + ox + dx, e.y + 16 - dodu, 5, 0, 7); g.fill();
    g.fillStyle = '#2b1c14';
    g.beginPath(); g.arc(cx + ox + dx + (e.dir > 0 ? 1 : -1), e.y + 16 - dodu, 2.3, 0, 7); g.fill();
  });
}

function bouton(g, o, temps) {
  if (o.pris) return;
  const y = o.y + Math.sin(temps * 3 + o.ph) * 4;
  g.save();
  g.shadowColor = 'rgba(255,220,120,.9)'; g.shadowBlur = 14;
  g.fillStyle = '#ffd35c';
  g.beginPath(); g.arc(o.x, y, 11, 0, 7); g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = '#e8a92c'; g.lineWidth = 2;   // il manquait strokeStyle : le contour héritait d'une couleur au hasard
  g.beginPath(); g.arc(o.x, y, 11, 0, 7); g.stroke();
  g.fillStyle = '#a97516';
  [[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].forEach(([a, b]) => {
    g.beginPath(); g.arc(o.x + a, y + b, 1.6, 0, 7); g.fill();
  });
  g.restore();
}

function coeurLaine(g, o, temps) {
  if (o.pris) return;
  const y = o.y + Math.sin(temps * 2.4 + o.ph) * 5;
  const s = 1 + Math.sin(temps * 5) * .06;
  g.save();
  g.translate(o.x, y); g.scale(s, s);
  g.shadowColor = 'rgba(255,120,170,.9)'; g.shadowBlur = 16;
  g.fillStyle = '#ff6fa8';
  g.beginPath();
  g.moveTo(0, 6);
  g.bezierCurveTo(-13, -5, -8, -15, 0, -8);
  g.bezierCurveTo(8, -15, 13, -5, 0, 6);
  g.fill();
  g.restore();
}

function checkpoint(g, k, actif, temps) {
  const bx = k.x + T / 2, by = k.y + T;
  g.strokeStyle = '#8a6a52'; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by - 46); g.stroke();
  const on = actif;
  g.fillStyle = on ? '#6fd46f' : '#b9a893';
  const fl = on ? Math.sin(temps * 4) * 3 : 0;
  g.beginPath();
  g.moveTo(bx, by - 46);
  g.lineTo(bx + 30 + fl, by - 38);
  g.lineTo(bx, by - 28);
  g.closePath(); g.fill();
  couture(g, bx + 3, by - 41, bx + 22, by - 37, 'rgba(255,255,255,.6)');
}

function arrivee(g, f, temps) {
  const bx = f.x + T / 2, by = f.y + T;
  g.strokeStyle = '#8a6a52'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by - 90); g.stroke();
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      g.fillStyle = (i + j) % 2 ? '#fffaf0' : '#e8557f';
      const on = Math.sin(temps * 3 + i * .6) * 3;
      g.fillRect(bx + 4 + j * 13, by - 88 + i * 13 + on, 13, 13);
    }
  }
}

function porteRendu(g, x, y, ouverte, temps) {
  if (ouverte) return;
  g.fillStyle = PAL.porte;
  rrect(g, x + 3, y, T - 6, T, 4); g.fill();
  g.fillStyle = 'rgba(0,0,0,.18)';
  g.fillRect(x + 3, y + T / 2 - 2, T - 6, 3);
  couture(g, x + 8, y + 6, x + T - 8, y + 6, 'rgba(255,255,255,.3)');
}

function planche(g, x, y, usure) {
  const a = 1 - usure * .7;
  g.save(); g.globalAlpha = a;
  g.fillStyle = '#e0c48f';
  rrect(g, x, y + 6, T, 16, 5); g.fill();
  g.fillStyle = '#f2dcb0';
  rrect(g, x, y + 6, T, 6, 4); g.fill();
  if (usure > .3) {
    g.strokeStyle = 'rgba(90,60,30,.6)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x + 12, y + 6); g.lineTo(x + 16, y + 22); g.stroke();
    g.beginPath(); g.moveTo(x + 28, y + 6); g.lineTo(x + 24, y + 22); g.stroke();
  }
  g.restore();
}

function mobileRendu(g, o) {
  g.fillStyle = '#6b5a8a';
  rrect(g, o.x, o.y + 4, o.w, 18, 6); g.fill();
  g.fillStyle = '#8f7cb0';
  rrect(g, o.x, o.y + 4, o.w, 7, 5); g.fill();
  couture(g, o.x + 5, o.y + 14, o.x + o.w - 5, o.y + 14, 'rgba(255,255,255,.45)');
}
