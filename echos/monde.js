/* =========================================================
   ÉCHOS — les niveaux
   Une seule architecture, vécue à deux époques.

   La grille de base décrit la PIERRE, commune aux deux époques.
   Les objets « causaux » n'existent que dans le passé ; leur
   conséquence apparaît dans le présent, trois siècles plus tard.

   GRILLE
   #  pierre          _  corniche (traversable par le dessous)
   1  départ passé    2  départ présent
   *  jeton           F  sortie (les deux doivent y être)
   ^  danger

   OBJETS CAUSAUX (posés dans le passé)
   G  pot à graine   → PRÉSENT : un arbre a poussé, on grimpe dessus
   P  pilier         → PRÉSENT : le pilier s'est écroulé en éboulis
   V  vanne          → PRÉSENT : le bassin s'est vidé, le fond est praticable

   PORTÉES DU MOTEUR : montée 3 rangées, vide 3 colonnes.
   ========================================================= */

const HAUT = 18;

function ligne(larg, ...blocs) {
  const a = Array(larg).fill(' ');
  for (const [x, s] of blocs)
    for (let i = 0; i < s.length; i++)
      if (x + i >= 0 && x + i < larg) a[x + i] = s[i];
  return a.join('');
}

function sol(larg, trous) {
  const a = Array(larg).fill('#');
  trous.forEach(([x, w]) => { for (let i = 0; i < w; i++) a[x + i] = ' '; });
  return a.join('');
}

function niveau(nom, aide, larg, f) {
  const rows = Array.from({ length: HAUT }, () => ligne(larg));
  const put = (y, ...blocs) => { rows[y] = ligne(larg, [0, rows[y]], ...blocs); };
  f(put, larg);
  return { nom, aide, larg, map: rows };
}

const NIVEAUX = [

  niveau('La Cité Basse',
    'Chacun son époque. Le passé plante, le présent récolte.',
    64, (put, L) => {
      /* le sol, commun aux deux époques */
      put(17, [0, sol(L, [[21, 3], [38, 3], [55, 3]])]);
      put(16, [0, sol(L, [[21, 3], [38, 3], [55, 3]])]);

      put(15, [2, '1'], [5, '2']);

      /* --- apprentissage : simples corniches --- */
      put(13, [8, '____']);
      put(12, [9, '**']);
      put(11, [14, '____']);

      /* --- 1re graine : le présent ne peut pas monter sans l'arbre --- */
      put(15, [19, 'G']);
      put(10, [24, '______']);
      put(9, [26, '**']);

      /* --- le pilier : le passé le brise, le présent grimpe sur l'éboulis --- */
      put(15, [30, 'P']);
      put(14, [30, 'P']);
      put(13, [30, 'P']);
      put(11, [33, '_____']);
      put(10, [35, '*']);

      /* --- la vanne : vide le bassin du présent --- */
      put(15, [43, 'V']);
      put(13, [46, '_____']);
      put(12, [48, '**']);

      /* --- 2e graine, plus haut --- */
      put(15, [51, 'G']);
      put(9, [50, '______']);
      put(8, [52, '**']);

      /* --- la sortie --- */
      put(12, [58, '______']);
      put(11, [60, 'F']);
    })
];

/* décor du bassin : dans le PRÉSENT il est plein tant que la vanne
   n'est pas ouverte dans le passé. Colonnes concernées, par niveau. */
const BASSINS = [
  [{ x0: 40, x1: 48, y: 15 }]
];
