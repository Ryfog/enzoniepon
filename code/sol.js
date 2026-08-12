/* =========================================================
   FEUX ET MARQUAGE AU SOL
   Photos réelles issues de Wikimedia Commons (dossier /photos/).
   Auteurs et licences dans CREDITS_PHOTOS, repris en pied de page.
   Les explications sont rédigées pour ce site.
   ========================================================= */
'use strict';

const SOL = [
  {
    groupe: 'Les feux tricolores',
    intro: 'Le feu prime sur les panneaux, mais l\'agent prime sur le feu. Un feu éteint ou clignotant ne veut pas dire « passe » : il veut dire « on revient aux règles de priorité ».',
    items: [
      { img: 'feu-vert.webp', titre: 'Le feu vert',
        txt: 'Vous pouvez passer — à condition de pouvoir dégager le carrefour. S\'engager sur un vert alors que ça bouchonne derrière, c\'est bloquer l\'intersection, et c\'est verbalisable.' },
      { img: 'feu-orange.webp', titre: 'Le feu orange',
        txt: 'Il impose l\'arrêt. On ne passe que si s\'arrêter ne peut pas se faire dans des conditions de sécurité suffisantes — typiquement si le véhicule de derrière est trop proche.' },
      { img: 'feu-cycliste.webp', titre: 'Les feux cyclistes',
        txt: 'Un petit feu ou un panneau triangulaire jaune autorise les vélos à tourner ou à continuer au rouge, en cédant le passage. En voiture : s\'attendre à voir un cycliste avancer alors que vous êtes arrêté.' },
      { img: 'feu-temporaire.webp', titre: 'Les feux temporaires',
        txt: 'Sur un chantier, ils règlent un alternat : une seule file passe à la fois. On attend le vert même si la voie paraît libre — quelqu\'un peut arriver en face.' }
    ]
  },
  {
    groupe: 'Les lignes',
    intro: 'Une ligne continue ne se franchit pas, ni ne se chevauche. Seule exception admise : dépasser un cycliste, si la visibilité le permet et sans danger.',
    items: [
      { img: 'ligne-annonce.webp', titre: 'La ligne d\'annonce',
        txt: 'Avant une ligne continue, les traits s\'allongent et les espaces se raccourcissent. C\'est un avertissement : terminez votre dépassement maintenant, ou renoncez.' },
      { img: 'fleches-rabattement.svg', titre: 'Les flèches de rabattement',
        txt: 'Trois flèches successives annoncent la fin de votre voie ou l\'arrivée d\'une ligne continue. Dès la première, on se rabat : à la troisième, il est déjà tard.' },
      { img: 'fleche-rabattement-2.webp', titre: 'La flèche au sol',
        txt: 'Peinte sur la chaussée, elle indique qu\'il faut regagner sa file. Elle ne se discute pas : la ligne continue arrive juste derrière.' },
      { img: 'marquages-nantes.webp', titre: 'Les voies affectées',
        txt: 'Le marquage indique quelle voie sert à quoi. On se place tôt : changer de file au dernier moment est la cause classique des accrochages en ville.' }
    ]
  },
  {
    groupe: 'Le stationnement au sol',
    intro: 'Beaucoup d\'interdictions ne sont écrites qu\'au sol. L\'absence de panneau ne veut pas dire que c\'est autorisé.',
    items: [
      { img: 'zigzag-jaune.webp', titre: 'La ligne jaune au bord du trottoir',
        txt: 'Ligne jaune continue : arrêt et stationnement interdits. Ligne jaune discontinue : stationnement interdit, l\'arrêt reste possible. En zigzag : c\'est un arrêt de bus.' },
      { img: 'arret-minute.webp', titre: 'L\'arrêt minute',
        txt: 'Emplacement pour un arrêt très court, le temps de déposer quelqu\'un. On ne quitte pas le véhicule : sinon ce n\'est plus un arrêt, c\'est du stationnement.' }
    ]
  },
  {
    groupe: 'Les autres usagers au sol',
    intro: 'Ces marquages délimitent des espaces où la voiture n\'a rien à faire — ni pour rouler, ni pour se garer « deux minutes ».',
    items: [
      { img: 'piste-cyclable.webp', titre: 'La piste cyclable',
        txt: 'Pictogramme vélo et chevrons au sol. Y circuler ou s\'y arrêter est interdit. C\'est aussi là que passent les cyclistes que vous ne voyez pas dans l\'angle mort.' },
      { img: 'couloir-pieton.webp', titre: 'Le couloir piéton temporaire',
        txt: 'Quand un chantier bloque le trottoir, un couloir est tracé sur la chaussée. Les piétons y marchent au niveau des voitures : on ralentit franchement.' },
      { img: 'ralentisseur.webp', titre: 'Le ralentisseur et le passage piéton',
        txt: 'Un plateau surélevé associé à un passage protégé. On ralentit AVANT, pas dessus. La limitation associée est en général 30 km/h.' }
    ]
  }
];

/* Attribution — obligatoire au titre des licences Creative Commons */
const CREDITS_PHOTOS = [
  ['feu-vert', 'emmanuel Schaffner', 'CC BY 2.0'],
  ['feu-orange', 'Wazouille', 'domaine public'],
  ['feu-cycliste', 'Chabe01', 'CC BY-SA 4.0'],
  ['feu-temporaire', 'Андрей Романенко', 'CC BY-SA 4.0'],
  ['ligne-annonce, flèches', 'Roulex 45', 'CC BY-SA 4.0'],
  ['schéma des flèches', 'Roland45', 'CC BY-SA 3.0'],
  ['marquages Nantes', 'Kamel15', 'CC BY-SA 3.0'],
  ['ligne jaune', 'Tabl-trai', 'CC BY-SA 3.0'],
  ['piste cyclable', 'jean-louis Zimmermann', 'CC BY 2.0'],
  ['couloir piéton', 'PanierAvide', 'CC BY-SA 4.0'],
  ['ralentisseur', 'Mathis Brancquart', 'CC BY-SA 4.0'],
  ['arrêt minute', 'Sebleouf', 'CC BY-SA 4.0']
];
