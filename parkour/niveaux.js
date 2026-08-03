/* =========================================================
   PARKOUR — les niveaux
   Grille 32 × 18. Les lignes trop courtes sont complétées
   automatiquement, pas besoin de compter les espaces.

   #  bloc solide          ^  piques (mortel)
   C  sol cyan  (solide pour le joueur 1 seulement)
   P  sol rose  (solide pour le joueur 2 seulement)
   =  plateforme mobile    B  trampoline
   b  plaque de pression   D  porte (s'ouvre quand les deux plaques
                              sont pressées, et reste ouverte)
   1  départ joueur 1      2  départ joueur 2
   o  cœur bonus           F  arrivée (il faut y être à deux)

   LIMITES DU MOTEUR, à respecter en dessinant :
   - montée max d'un saut : 3 rangées (2 pour être confortable)
   - vide franchissable  : 3 colonnes
   - un trampoline propulse d'environ 7 rangées
   ========================================================= */

const NIVEAUX = [
  {
    nom: 'Premiers pas',
    aide: 'ZQSD ou les flèches. Rejoignez le drapeau tous les deux.',
    map: [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '                          F',
      '                        #####',
      '                    o',
      '                  #####',
      '            o',
      '            #####',
      ' 1  2 #####',
      '',
      '################################'
    ]
  },
  {
    nom: 'Chacun sa couleur',
    aide: 'Le cyan ne porte que le joueur 1, le rose que le joueur 2. Montez chacun votre escalier.',
    map: [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '                          F',
      '                      ######',
      '                   CCPP',
      '               CCPP',
      '           CCPP',
      '        o',
      ' 1  2  CCPP',
      '',
      '################################'
    ]
  },
  {
    nom: 'À deux mains',
    aide: 'La porte s\'ouvre quand vous êtes tous les deux sur une plaque. Ensuite elle reste ouverte.',
    map: [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '                            F',
      '                          #####',
      '                    o',
      '                    #####',
      '',
      ' 1  2    D    #####',
      '  b   b  D',
      '################################'
    ]
  },
  {
    nom: 'Rebonds',
    aide: 'Les trampolines envoient très haut, et la plateforme bleue bouge.',
    map: [
      '',
      '',
      '',
      '',
      '                           F',
      '                       ######',
      '              o',
      '          ======',
      '                 #####',
      '',
      '        o',
      '           #####',
      '',
      '',
      '     #####',
      ' 1  2      B',
      '',
      '################################'
    ]
  },
  {
    nom: 'Au-dessus des piques',
    aide: 'Les piques tuent. On peut aussi sauter depuis la tête de l\'autre.',
    map: [
      '',
      '',
      '',
      '',
      '',
      '                          F',
      '                      ######',
      '',
      '                     #####',
      '                o',
      '                #####',
      '',
      '           #####',
      '',
      '      #####',
      ' 1  2',
      '            ^^^      ^^^',
      '################################'
    ]
  },
  {
    nom: 'Le grand final',
    aide: 'Tout à la fois. Chacun son escalier de couleur, puis le drapeau. Bonne chance.',
    map: [
      '',
      '                           F',
      '                      ########',
      '',
      '                 CCCCPPPP',
      '',
      '           CCCCPPPP',
      '                        o',
      '     CCCCPPPP',
      '',
      '   #####',
      '            o',
      '        #####',
      '',
      '   #####',
      ' 1  2 B',
      '           ^^^      ^^^',
      '################################'
    ]
  }
];
