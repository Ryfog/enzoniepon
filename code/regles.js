/* =========================================================
   LES RÈGLES ET LES QUESTIONS
   Fiches et questions rédigées pour ce site.
   ========================================================= */
'use strict';

const FICHES = [
  {
    id: 'vitesses', titre: 'Les vitesses', emoji: '🚗',
    lignes: [
      ['En agglomération', '50 km/h', 'Souvent abaissé à 30 dans les centres-villes et près des écoles.'],
      ['Route à double sens, sans séparateur', '80 km/h', 'Certains départements sont remontés à 90 : c\'est le panneau qui fait foi.'],
      ['Route à chaussées séparées', '110 km/h', '100 km/h par temps de pluie.'],
      ['Autoroute', '130 km/h', '110 km/h par temps de pluie.'],
      ['Visibilité inférieure à 50 m', '50 km/h', 'Brouillard, neige, pluie forte : partout, y compris sur autoroute.']
    ],
    note: 'Permis probatoire : 110 sur autoroute, 100 sur voie rapide, 80 sur route — quel que soit le panneau.'
  },
  {
    id: 'priorites', titre: 'Qui passe en premier', emoji: '🔀',
    lignes: [
      ['Aucun panneau, aucun marquage', 'Priorité à droite', 'La règle par défaut, y compris pour une sortie de parking aménagée en voie.'],
      ['Panneau « Cédez le passage »', 'On laisse passer', 'On peut ne pas s\'arrêter si la voie est libre.'],
      ['Panneau « Stop »', 'Arrêt absolu', 'Les roues s\'immobilisent, même sans personne.'],
      ['Rond-point classique', 'Ceux qui tournent', 'Signalé par un « cédez le passage » à chaque entrée.'],
      ['Véhicule d\'urgence en action', 'Il passe', 'On se range et on s\'arrête si nécessaire, sans franchir un feu rouge dangereusement.']
    ],
    note: 'Le feu tricolore et l\'agent priment toujours sur les panneaux, et l\'agent prime sur le feu.'
  },
  {
    id: 'alcool', titre: 'Alcool et stupéfiants', emoji: '🚫',
    lignes: [
      ['Permis classique', '0,5 g/L de sang', 'Soit 0,25 mg/L d\'air expiré.'],
      ['Permis probatoire', '0,2 g/L de sang', 'Soit 0,10 mg/L — en pratique, aucun verre.'],
      ['À partir de 0,8 g/L', 'Délit', 'Jusqu\'à 4 500 € d\'amende, 2 ans de prison, 6 points.'],
      ['Stupéfiants', 'Tolérance zéro', 'La seule présence dans le sang constitue un délit.']
    ],
    note: 'Un verre standard fait monter le taux d\'environ 0,20 à 0,25 g/L. Rien ne fait baisser le taux plus vite : ni café, ni douche.'
  },
  {
    id: 'distances', titre: 'Distances et freinage', emoji: '📏',
    lignes: [
      ['Distance de sécurité', '2 secondes', 'Repérez un point fixe : deux secondes doivent s\'écouler avant d\'y arriver.'],
      ['Distance d\'arrêt', 'Réaction + freinage', 'La distance de réaction, c\'est ce qu\'on parcourt avant même de freiner.'],
      ['Temps de réaction', '1 seconde environ', 'Plus long si l\'on est fatigué, distrait ou sous influence.'],
      ['Sur route mouillée', 'Distance doublée', 'L\'adhérence chute fortement, surtout aux premières gouttes.'],
      ['Dans un tunnel', '2 s ou 150 m', 'Et 100 m à l\'arrêt.']
    ],
    note: 'À 90 km/h on parcourt 25 m pendant la seule seconde de réaction. La vitesse double : la distance de freinage est multipliée par quatre.'
  },
  {
    id: 'papiers', titre: 'Équipement et papiers', emoji: '🦺',
    lignes: [
      ['Gilet de haute visibilité', 'Dans l\'habitacle', 'Il doit être à portée de main sans sortir du véhicule.'],
      ['Triangle de présignalisation', 'À bord', 'Posé à 30 m environ, hors autoroute.'],
      ['Pneus', '1,6 mm minimum', 'Profondeur des sculptures, sur toute la surface.'],
      ['À présenter en contrôle', 'Permis, carte grise, assurance', 'Le défaut de présentation immédiate est verbalisable.']
    ],
    note: 'En cas d\'arrêt d\'urgence : gilet enfilé AVANT de sortir, puis on se met derrière la glissière.'
  },
  {
    id: 'permis', titre: 'Le permis à points', emoji: '🪪',
    lignes: [
      ['Permis probatoire', '6 points', '3 ans, ou 2 ans après une conduite accompagnée.'],
      ['Permis définitif', '12 points', 'Atteints progressivement si aucune infraction.'],
      ['Téléphone tenu en main', '3 points + 135 €', 'Même à l\'arrêt à un feu, moteur tournant.'],
      ['Ceinture non attachée', '3 points + 135 €', 'Pour le conducteur, et pour chaque passager majeur non attaché.'],
      ['Feu rouge grillé', '4 points + 135 €', 'Le feu orange impose déjà l\'arrêt si l\'on peut le faire sans danger.']
    ],
    note: 'Solde à zéro : le permis est invalidé. On repasse le code après un délai, et la conduite dans l\'intervalle est un délit.'
  }
];

/* --- les questions : une seule bonne réponse par question --- */
const QUESTIONS = [
  { q: 'Vous abordez une intersection sans aucun panneau ni marquage. Un véhicule arrive à votre droite.',
    r: ['Vous lui cédez le passage', 'Vous passez, vous êtes déjà engagé', 'Le plus rapide passe', 'Vous klaxonnez et vous passez'], b: 0,
    e: 'Sans indication contraire, la priorité à droite s\'applique. C\'est la règle par défaut en France.' },
  { q: 'Un panneau triangulaire à bord rouge annonce quelque chose. Que fait-il ?',
    r: ['Il interdit', 'Il prévient d\'un danger', 'Il oblige', 'Il informe seulement'], b: 1,
    e: 'Le triangle rouge annonce toujours un danger. Le disque rouge interdit, le disque bleu oblige.' },
  { q: 'Sur autoroute, il pleut. Votre vitesse maximale est de :',
    r: ['130 km/h', '110 km/h', '100 km/h', '90 km/h'], b: 1,
    e: 'Par temps de pluie : 110 sur autoroute, 100 sur voie rapide. Et 50 partout si la visibilité tombe sous 50 m.' },
  { q: 'Vous avez le permis depuis un an. Sur autoroute, vous ne devez pas dépasser :',
    r: ['130 km/h', '120 km/h', '110 km/h', '100 km/h'], b: 2,
    e: 'Pendant le permis probatoire : 110 sur autoroute, 100 sur voie rapide, 80 sur route.' },
  { q: 'Le taux d\'alcool maximal pour un conducteur en permis probatoire est de :',
    r: ['0,5 g/L de sang', '0,2 g/L de sang', '0,8 g/L de sang', 'Aucune limite précise'], b: 1,
    e: '0,2 g/L, soit 0,10 mg/L d\'air expiré. En pratique : pas un verre.' },
  { q: 'Le feu passe à l\'orange alors que vous en êtes tout près, à bonne vitesse.',
    r: ['Vous accélérez pour passer', 'Vous freinez brutalement', 'Vous passez si l\'arrêt ne peut se faire sans danger', 'Vous vous arrêtez au milieu du carrefour'], b: 2,
    e: 'L\'orange impose l\'arrêt, sauf si celui-ci ne peut être effectué dans des conditions de sécurité suffisantes.' },
  { q: 'Un panneau « Stop » vous fait face et la route est parfaitement dégagée.',
    r: ['Vous ralentissez fortement puis passez', 'Vous marquez l\'arrêt complet', 'Vous passez sans ralentir', 'Vous cédez seulement à droite'], b: 1,
    e: 'Le Stop impose un arrêt absolu : les roues doivent s\'immobiliser, même si personne n\'arrive.' },
  { q: 'La distance de sécurité minimale avec le véhicule qui précède correspond à :',
    r: ['1 seconde', '2 secondes', '5 mètres', 'La longueur d\'une voiture'], b: 1,
    e: 'Deux secondes. Repérez un point fixe : deux secondes doivent s\'écouler avant que vous y arriviez.' },
  { q: 'Un disque bleu avec une flèche blanche vers la droite signifie :',
    r: ['Direction conseillée', 'Direction obligatoire à droite', 'Interdiction d\'aller à droite', 'Route prioritaire à droite'], b: 1,
    e: 'Le bleu commande. Ici, on doit tourner à droite.' },
  { q: 'Un panneau rond bleu barré d\'une seule diagonale rouge signifie :',
    r: ['Arrêt et stationnement interdits', 'Stationnement interdit', 'Sens interdit', 'Fin de stationnement'], b: 1,
    e: 'Une diagonale : stationnement interdit, l\'arrêt reste possible. Deux diagonales : arrêt interdit aussi.' },
  { q: 'Le losange jaune bordé de blanc indique :',
    r: ['Une route prioritaire', 'Un danger', 'Une zone de travaux', 'Une aire de repos'], b: 0,
    e: 'Route prioritaire : la priorité à droite ne s\'applique plus aux intersections suivantes.' },
  { q: 'Votre véhicule tombe en panne sur la bande d\'arrêt d\'urgence. Vous :',
    r: ['Sortez puis enfilez le gilet', 'Enfilez le gilet avant de sortir', 'Restez au volant', 'Posez le triangle sur l\'autoroute'], b: 1,
    e: 'Le gilet s\'enfile dans l\'habitacle. Ensuite on sort côté opposé au trafic et on se met derrière la glissière.' },
  { q: 'La profondeur minimale des sculptures d\'un pneu est de :',
    r: ['1 mm', '1,6 mm', '2,5 mm', '3 mm'], b: 1,
    e: '1,6 mm sur toute la surface de roulement. En dessous, le pneu est considéré comme lisse.' },
  { q: 'Vous entrez sur un rond-point signalé par un « cédez le passage ».',
    r: ['Vous êtes prioritaire', 'Vous cédez à ceux qui y circulent', 'Priorité à droite', 'Vous devez vous arrêter'], b: 1,
    e: 'La quasi-totalité des ronds-points français fonctionne ainsi : ceux qui tournent déjà sont prioritaires.' },
  { q: 'Téléphone tenu en main au volant, à l\'arrêt à un feu rouge, moteur tournant :',
    r: ['C\'est autorisé, vous êtes à l\'arrêt', 'C\'est verbalisable', 'Seulement si vous téléphonez', 'Autorisé si le frein à main est mis'], b: 1,
    e: 'Le véhicule est toujours en circulation. C\'est 135 € et 3 points.' },
  { q: 'Un triangle rouge pointe vers le bas, sans dessin à l\'intérieur.',
    r: ['Stop', 'Cédez le passage', 'Danger indéterminé', 'Fin de priorité'], b: 1,
    e: 'C\'est le seul panneau triangulaire pointe en bas : cédez le passage.' },
  { q: 'La visibilité tombe sous 50 mètres à cause du brouillard, sur autoroute.',
    r: ['110 km/h', '90 km/h', '70 km/h', '50 km/h'], b: 3,
    e: '50 km/h partout, y compris sur autoroute, dès que la visibilité descend sous 50 m.' },
  { q: 'Vous doublez un cycliste hors agglomération. L\'écart latéral minimal est de :',
    r: ['50 cm', '1 mètre', '1,50 mètre', '2 mètres'], b: 2,
    e: '1,50 m hors agglomération, 1 m en ville. Le franchissement de la ligne continue est toléré si la sécurité le permet.' },
  { q: 'Le permis probatoire compte au départ :',
    r: ['12 points', '8 points', '6 points', '4 points'], b: 2,
    e: '6 points, puis la majoration se fait sur 3 ans — ou 2 ans après une conduite accompagnée.' },
  { q: 'Un disque blanc bordé de rouge avec « 70 » au centre :',
    r: ['Vitesse conseillée', 'Vitesse minimale', 'Vitesse maximale autorisée', 'Distance jusqu\'au danger'], b: 2,
    e: 'Le bord rouge interdit : on ne dépasse pas 70. En bleu, ce serait au contraire une vitesse minimale.' },
  { q: 'À 90 km/h, pendant la seule seconde de temps de réaction, vous parcourez environ :',
    r: ['10 mètres', '25 mètres', '50 mètres', '90 mètres'], b: 1,
    e: 'Environ 25 m — avant même que la pédale de frein ne soit touchée.' },
  { q: 'Un agent règle la circulation et son geste contredit le feu vert.',
    r: ['Le feu prime', 'L\'agent prime', 'Le panneau prime', 'On choisit'], b: 1,
    e: 'L\'ordre est : agent, puis feu, puis panneau, puis marquage au sol.' },
  { q: 'Que veut dire un panneau carré bleu avec un grand « P » ?',
    r: ['Passage piétons', 'Stationnement autorisé', 'Poste de péage', 'Priorité'], b: 1,
    e: 'Stationnement autorisé. Les panonceaux précisent les conditions : durée, jours, zone payante.' },
  { q: 'Sur une route à double sens sans séparateur central, la limite est en général de :',
    r: ['70 km/h', '80 km/h', '100 km/h', '110 km/h'], b: 1,
    e: '80 km/h depuis 2018. Certains départements ont relevé à 90 : c\'est toujours le panneau qui fait foi.' },
  { q: 'La distance de freinage lorsque la vitesse double est :',
    r: ['Doublée', 'Triplée', 'Multipliée par quatre', 'Inchangée'], b: 2,
    e: 'Elle est multipliée par quatre. C\'est pourquoi une petite différence de vitesse change tout à l\'impact.' },
  { q: 'Un piéton attend visiblement au bord d\'un passage protégé.',
    r: ['Il doit attendre que la voie soit libre', 'Vous devez lui céder le passage', 'Seulement s\'il est déjà engagé', 'Vous klaxonnez'], b: 1,
    e: 'Depuis 2018, il suffit que le piéton manifeste l\'intention de traverser. C\'est 135 € et 6 points.' },
  { q: 'Le panneau rond blanc bordé de noir, barré de deux traits obliques :',
    r: ['Interdiction de dépasser', 'Fin de toutes les interdictions', 'Fin d\'agglomération', 'Route prioritaire'], b: 1,
    e: 'Toutes les interdictions précédemment signalées cessent de s\'appliquer.' },
  { q: 'Vous conduisez fatigué sur un long trajet. La bonne conduite est :',
    r: ['Boire un café et continuer', 'Ouvrir la fenêtre', 'S\'arrêter et dormir 15 à 20 minutes', 'Monter le son'], b: 2,
    e: 'Seul le sommeil récupère. Une pause de 15 à 20 minutes toutes les deux heures est la règle.' },
  { q: 'Le taux d\'alcool à partir duquel l\'infraction devient un délit est de :',
    r: ['0,5 g/L', '0,8 g/L', '1,2 g/L', '2 g/L'], b: 1,
    e: 'À partir de 0,8 g/L de sang, c\'est un délit : jusqu\'à 4 500 € d\'amende et 2 ans de prison.' },
  { q: 'Un triangle rouge avec deux enfants dessinés signifie :',
    r: ['École obligatoire', 'Endroit fréquenté par des enfants', 'Interdit aux enfants', 'Aire de jeux'], b: 1,
    e: 'C\'est un danger : sortie d\'école, aire de jeux. On lève le pied et on surveille les trottoirs.' },
  { q: 'Sur autoroute, la bande d\'arrêt d\'urgence sert à :',
    r: ['Doubler par la droite', 'S\'arrêter en cas d\'urgence seulement', 'Se reposer', 'Téléphoner'], b: 1,
    e: 'Uniquement l\'urgence. S\'y arrêter sans motif est verbalisé, et y circuler est très dangereux.' },
  { q: 'Vous croisez un panneau bleu rectangulaire avec une flèche blanche horizontale :',
    r: ['Sens unique', 'Direction obligatoire', 'Route prioritaire', 'Voie de détresse'], b: 0,
    e: 'Sens unique : on circule dans le sens de la flèche, et il est interdit de revenir en arrière.' }
];
