/* =========================================================
   LE GRAND OUVRAGE — les mondes
   Les lignes sont composées par code : on pose des morceaux à
   une colonne donnée, le reste est du vide. Impossible de se
   tromper en comptant les espaces.

   #  terre           _  plateforme traversable par le bas
   C  feutre cyan (ne porte que le joueur 1)
   P  feutre rose (ne porte que le joueur 2)
   ^  épingles (mortel)      B  ressort
   x  planche qui s'effondre  > tapis roulant droite   < tapis roulant gauche
   M  plateforme mobile       D  porte    b  plaque de pression
   E  bestiole (se saute sur la tête)
   K  point de reprise        *  bouton (à ramasser)   o  cœur
   1  départ joueur 1         2  départ joueur 2       F  arrivée

   PORTÉES DU MOTEUR : montée 3 rangées, vide 3 colonnes,
   ressort environ 7 rangées.
   ========================================================= */

const HAUT = 20;

function ligne(larg, ...blocs) {
  const a = Array(larg).fill(' ');
  for (const [x, s] of blocs)
    for (let i = 0; i < s.length; i++)
      if (x + i >= 0 && x + i < larg) a[x + i] = s[i];
  return a.join('');
}
const rep = (c, n) => c.repeat(Math.max(0, n));

/* sol continu avec des trous : trous = [[debut, largeur], …] */
function sol(larg, trous) {
  const a = Array(larg).fill('#');
  trous.forEach(([x, w]) => { for (let i = 0; i < w; i++) a[x + i] = ' '; });
  return a.join('');
}

function monde(nom, aide, larg, f) {
  const rows = Array.from({ length: HAUT }, () => ligne(larg));
  const put = (y, ...blocs) => { rows[y] = ligne(larg, [0, rows[y]], ...blocs); };
  f(put, larg);
  return { nom, aide, larg, map: rows };
}

const MONDES = [

  /* ============ 1 ============ */
  monde('Le jardin de laine',
    'Q D pour courir, Z ou Espace pour sauter. Ramassez les boutons et rejoignez le fil d\'arrivée à deux.',
    76, (put, L) => {
      put(19, [0, sol(L, [[22, 3], [41, 3], [59, 3]])]);
      put(18, [0, sol(L, [[22, 3], [41, 3], [59, 3]])]);

      put(17, [2, '1  2'], [30, 'K'], [56, 'K']);
      put(16, [8, '****'], [27, '***'], [46, '***'], [66, '****']);

      put(15, [7, '_____'], [40, '______'], [63, '______']);
      put(12, [14, '______'], [45, '______']);
      put(11, [16, '**'], [47, '**']);
      put(9, [25, '_____'], [54, '_____']);
      put(8, [27, 'o'], [56, 'o']);

      put(17, [13, 'E'], [36, 'E'], [51, 'E'], [68, 'E']);
      put(14, [16, 'E'], [47, 'E']);

      put(16, [72, 'F']);
      put(17, [70, '#####']);
    }),

  /* ============ 2 ============ */
  monde('La couture',
    'Le feutre cyan ne porte que le joueur 1, le rose que le joueur 2. Montez chacun de votre côté.',
    80, (put, L) => {
      put(19, [0, sol(L, [[18, 3], [33, 3], [50, 3], [66, 3]])]);
      put(18, [0, sol(L, [[18, 3], [33, 3], [50, 3], [66, 3]])]);

      put(17, [2, '1  2'], [30, 'K'], [58, 'K']);
      put(16, [9, '***'], [40, '***'], [70, '***']);

      /* escalier entrelacé : chacun sa couleur, une marche sur deux */
      put(16, [22, 'CCPP']);
      put(14, [27, 'CCPP']);
      put(12, [32, 'CCPP']);
      put(11, [34, '**']);
      put(10, [37, '______']);

      put(13, [43, 'CCPP']);
      put(11, [48, 'CCPP']);
      put(9, [53, 'CCPP']);
      put(8, [55, 'o']);
      put(7, [58, '______']);
      put(6, [60, '**']);

      put(17, [14, 'E'], [44, 'E'], [63, 'E']);
      put(9, [38, 'E']);

      put(16, [76, 'F']);
      put(17, [74, '#####']);
    }),

  /* ============ 3 ============ */
  monde('L\'atelier',
    'Les tapis roulants poussent, les planches claires s\'effondrent, et la porte demande vos deux plaques.',
    82, (put, L) => {
      put(19, [0, sol(L, [[26, 3], [44, 3], [63, 3]])]);
      put(18, [0, sol(L, [[26, 3], [44, 3], [63, 3]])]);

      put(17, [2, '1  2'], [34, 'K'], [58, 'K']);
      put(16, [10, '***'], [38, '***'], [70, '****']);

      /* tapis roulants au sol */
      put(17, [12, '>>>>>>'], [48, '<<<<<'], [66, '>>>>>>']);

      /* plaques puis porte */
      put(17, [7, 'b'], [21, 'b']);
      put(17, [24, 'D']);
      put(16, [24, 'D']);
      put(15, [24, 'D']);

      /* planches qui s'effondrent */
      put(15, [29, 'xxx'], [53, 'xxx']);
      put(12, [32, 'xxx']);
      put(11, [33, '*']);

      put(15, [39, '______']);
      put(12, [41, '**']);
      put(13, [45, '_____']);
      put(10, [56, '______']);
      put(9, [58, 'o']);

      put(17, [17, 'E'], [40, 'E'], [55, 'E']);
      put(14, [42, 'E']);

      put(16, [78, 'F']);
      put(17, [76, '#####']);
    }),

  /* ============ 4 ============ */
  monde('Les toits de feutre',
    'Les ressorts propulsent très haut. Sautez sur la tête des bestioles pour les aplatir.',
    84, (put, L) => {
      put(19, [0, sol(L, [[20, 3], [37, 3], [55, 3], [70, 3]])]);
      put(18, [0, sol(L, [[20, 3], [37, 3], [55, 3], [70, 3]])]);

      put(17, [2, '1  2'], [32, 'K'], [62, 'K']);
      put(16, [8, '***'], [42, '***'], [74, '***']);

      put(17, [14, 'B'], [45, 'B'], [66, 'B']);

      put(13, [11, '_______']);
      put(12, [13, '**']);
      put(10, [22, 'MMM']);
      put(10, [30, '______']);
      put(9, [32, 'o']);
      put(7, [26, '_____']);
      put(6, [28, '**']);

      put(13, [42, '_______']);
      put(10, [50, 'MMM']);
      put(9, [58, '______']);
      put(8, [60, '**']);
      put(12, [64, '______']);

      put(17, [10, 'E'], [26, 'E'], [49, 'E'], [59, 'E'], [76, 'E']);
      put(12, [15, 'E'], [44, 'E']);
      put(9, [31, 'E']);

      put(16, [80, 'F']);
      put(17, [78, '#####']);
    }),

  /* ============ 5 ============ */
  monde('Le grand ouvrage',
    'Tout à la fois. Il faut être tous les deux sur le fil d\'arrivée. Bonne chance à vous deux.',
    88, (put, L) => {
      put(19, [0, sol(L, [[19, 3], [34, 3], [49, 3], [64, 3], [78, 3]])]);
      put(18, [0, sol(L, [[19, 3], [34, 3], [49, 3], [64, 3], [78, 3]])]);

      put(17, [2, '1  2'], [30, 'K'], [56, 'K'], [74, 'K']);
      put(16, [7, '***'], [37, '***'], [60, '***'], [82, '***']);

      put(17, [12, '>>>>>'], [52, '<<<<<']);
      put(17, [9, 'b'], [24, 'b']);
      put(17, [27, 'D']);
      put(16, [27, 'D']);
      put(15, [27, 'D']);

      put(15, [31, 'xxx']);
      put(14, [36, 'CCPP']);
      put(12, [41, 'CCPP']);
      put(10, [46, '______']);
      put(9, [48, 'o']);

      put(17, [44, 'B'], [70, 'B']);
      put(11, [56, 'MMM']);
      put(13, [62, '______']);
      put(12, [64, '**']);
      put(9, [66, '_____']);
      put(8, [68, 'o']);
      put(13, [72, '______']);

      put(17, [16, 'E'], [40, 'E'], [58, 'E'], [67, 'E'], [80, 'E']);
      put(12, [22, 'E'], [63, 'E']);
      put(13, [37, 'E']);

      put(16, [84, 'F']);
      put(17, [82, '#####']);
    })
];
