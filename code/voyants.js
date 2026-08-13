/* =========================================================
   LES VOYANTS DU TABLEAU DE BORD
   Pictogrammes réels issus de Wikimedia Commons (dossier /voy/).
   Domaine public, CC0 ou licence libre — auteurs dans CREDITS_VOYANTS.
   Les explications sont rédigées pour ce site.
   ========================================================= */
'use strict';

const VOYANTS = [
  {
    groupe: 'Rouge — on s\'arrête',
    ton: 'rouge',
    intro: 'Un voyant rouge qui s\'allume en roulant n\'attend pas la prochaine station-service. On se range dès que c\'est possible, en sécurité, et on coupe le moteur.',
    items: [
      { id: 'frein-parking', nom: 'Freins', quoi: 'Frein à main serré, ou niveau de liquide de frein trop bas.',
        faire: 'S\'il reste allumé frein desserré, le freinage n\'est plus garanti : on s\'arrête. C\'est le voyant le plus dangereux à ignorer.' },
      { id: 'huile', nom: 'Pression d\'huile', quoi: 'Le moteur n\'est plus correctement lubrifié.',
        faire: 'On se range et on coupe immédiatement. Continuer, c\'est casser le moteur en quelques minutes. Il est normal qu\'il s\'allume une seconde au démarrage.' },
      { id: 'batterie', nom: 'Charge de la batterie', quoi: 'L\'alternateur ne recharge plus la batterie.',
        faire: 'Le moteur s\'arrêtera quand la batterie sera vide. On coupe tout ce qui consomme (clim, radio, dégivrage) et on rejoint un garage.' },
      { id: 'airbag', nom: 'Airbag', quoi: 'Défaut du système de retenue.',
        faire: 'Les airbags peuvent ne pas se déclencher en cas de choc. Passage au garage : c\'est une sécurité, pas un confort.' },
      { id: 'ceinture', nom: 'Ceinture non bouclée', quoi: 'Un occupant n\'est pas attaché.',
        faire: 'On boucle. Non bouclée : 135 € et 3 points. Le conducteur est responsable des passagers de moins de 18 ans.' },
      { id: 'porte', nom: 'Porte ou coffre ouvert', quoi: 'Une ouverture n\'est pas verrouillée.',
        faire: 'On ne roule pas comme ça. Une porte qui s\'ouvre en virage, c\'est un occupant éjecté.' }
    ]
  },
  {
    groupe: 'Orange — on surveille',
    ton: 'orange',
    intro: 'Anomalie non bloquante : la voiture roule encore, mais une sécurité est hors service ou un entretien est nécessaire. On peut rejoindre un garage sans paniquer — mais on y va.',
    items: [
      { id: 'moteur', nom: 'Moteur', quoi: 'Défaut d\'allumage, d\'injection ou de dépollution.',
        faire: 'Fixe : on roule doucement jusqu\'au garage. Clignotant : on ralentit tout de suite, le catalyseur est en train de se détruire.' },
      { id: 'abs', nom: 'ABS', quoi: 'L\'anti-blocage des roues est hors service.',
        faire: 'La voiture freine toujours, mais les roues peuvent se bloquer et vous perdez la direction en freinage d\'urgence. On allonge les distances.' },
      { id: 'esp2', nom: 'ESP — antidérapage', quoi: 'Contrôle électronique de trajectoire.',
        faire: 'Clignotant : le système corrige, vous êtes en train de glisser — on lève le pied. Fixe : il est en panne.' },
      { id: 'antipatinage', nom: 'Antipatinage', quoi: 'Empêche les roues de patiner à l\'accélération.',
        faire: 'Avec la mention OFF, il a été désactivé volontairement. Sur route mouillée ou verglacée, on le réactive.' },
      { id: 'esp', nom: 'Alerte générale', quoi: 'Un défaut est signalé, sans plus de précision.',
        faire: 'Le détail s\'affiche sur l\'écran de bord. Ce triangle ne s\'ignore pas : il peut cacher n\'importe quoi.' },
      { id: 'pression-pneus', nom: 'Pression des pneus', quoi: 'Au moins un pneu est sous-gonflé.',
        faire: 'On contrôle à froid, aux pressions indiquées sur l\'étiquette de la portière. Un pneu sous-gonflé chauffe, s\'use, allonge les distances et consomme davantage.' },
      { id: 'plaquettes', nom: 'Usure des plaquettes', quoi: 'Les plaquettes de frein arrivent en fin de vie.',
        faire: 'Rendez-vous au garage rapidement. Rouler dessus jusqu\'au métal abîme les disques et coûte bien plus cher.' },
      { id: 'filtre-particules', nom: 'Filtre à particules', quoi: 'Diesel : le filtre est encrassé.',
        faire: 'Souvent la faute aux petits trajets en ville. Un trajet soutenu sur route permet en général la régénération.' },
      { id: 'direction', nom: 'Direction assistée', quoi: 'L\'assistance du volant est défaillante.',
        faire: 'Le volant devient très dur, surtout à basse vitesse et en manœuvre. Orange : défaut partiel. Rouge : on s\'arrête.' },
      { id: 'antidemarrage', nom: 'Antidémarrage', quoi: 'La voiture ne reconnaît pas la clé.',
        faire: 'Le moteur ne démarrera pas. Souvent la pile de la clé, parfois la puce.' },
      { id: 'carburant', nom: 'Réserve de carburant', quoi: 'Le niveau est au minimum.',
        faire: 'Il reste en général 50 à 80 km. Tomber en panne sèche sur autoroute, c\'est une immobilisation dangereuse — et une amende.' },
      { id: 'lave-glace', nom: 'Lave-glace vide', quoi: 'Le réservoir de liquide est vide.',
        faire: 'À remplir. Ne plus pouvoir nettoyer son pare-brise face au soleil ou derrière un camion, c\'est un vrai défaut de visibilité.' }
    ]
  },
  {
    groupe: 'Les feux — vert, bleu, et l\'exception orange',
    ton: 'vert',
    intro: 'Ces voyants ne signalent aucune panne : ils disent simplement qu\'un feu est allumé. Le piège de l\'examen est en bas de cette liste.',
    items: [
      { id: 'feux-position', nom: 'Feux de position', quoi: 'Les petites veilleuses sont allumées.',
        faire: 'Elles servent à être vu à l\'arrêt. Elles n\'éclairent pas la route : insuffisantes pour rouler.' },
      { id: 'feux-croisement', nom: 'Feux de croisement', quoi: 'Les codes sont allumés.',
        faire: 'Obligatoires la nuit, sous la pluie, dans un tunnel, et par visibilité réduite. C\'est la position normale.' },
      { id: 'feux-route', nom: 'Feux de route', quoi: 'Les pleins phares sont allumés.',
        faire: 'Le seul voyant bleu du tableau de bord. On repasse en codes dès qu\'un véhicule apparaît devant ou en face.' },
      { id: 'brouillard-avant', nom: 'Antibrouillard avant', quoi: 'Les feux de brouillard avant sont allumés.',
        faire: 'Par brouillard, neige ou pluie forte. Toujours avec les codes, jamais seuls.' },
      { id: 'brouillard-arriere', nom: 'Antibrouillard arrière', quoi: 'Le feu de brouillard arrière est allumé.',
        faire: 'Voyant ORANGE, et pourtant ce n\'est pas une panne : c\'est l\'exception. Autorisé par brouillard ou neige uniquement — interdit sous la simple pluie, car il éblouit celui qui vous suit.' },
      { id: 'clignotants', nom: 'Clignotants', quoi: 'Un indicateur de direction fonctionne.',
        faire: 'S\'il clignote deux fois plus vite que d\'habitude, une ampoule est grillée.' },
      { id: 'clignotants-remorque', nom: 'Clignotants de la remorque', quoi: 'La remorque est attelée et branchée.',
        faire: 'Il permet de vérifier que la signalisation de la remorque suit bien.' },
      { id: 'correcteur-phares', nom: 'Correcteur de phares', quoi: 'Réglage de la hauteur du faisceau.',
        faire: 'À ajuster quand la voiture est chargée ou tracte : sinon les phares pointent vers le ciel et éblouissent.' }
    ]
  },
  {
    groupe: 'Confort et assistance',
    ton: 'vert',
    intro: 'Aucune urgence ici : ces voyants indiquent qu\'une fonction est en service.',
    items: [
      { id: 'freins', nom: 'Appuyer sur la pédale', quoi: 'Le système demande d\'enfoncer le frein.',
        faire: 'Vert — donc une information. Sur boîte automatique, le frein est obligatoire pour démarrer et pour quitter la position P.' },
      { id: 'regulateur', nom: 'Régulateur de vitesse', quoi: 'Le régulateur est actif.',
        faire: 'À éviter sur chaussée glissante, en ville et par fort trafic : il retarde votre réaction.' },
      { id: 'prechauffage', nom: 'Préchauffage diesel', quoi: 'Les bougies de préchauffage chauffent.',
        faire: 'On attend qu\'il s\'éteigne avant de lancer le démarreur. Par grand froid, cela prend quelques secondes de plus.' },
      { id: 'desembuage', nom: 'Désembuage arrière', quoi: 'La lunette arrière est en train de chauffer.',
        faire: 'À couper une fois la buée partie : c\'est un gros consommateur d\'électricité.' }
    ]
  }
];

/* Attribution — obligatoire au titre des licences */
const CREDITS_VOYANTS = 'Pictogrammes des voyants : Wikimedia Commons — Chris828 (domaine public, CC0 et licence libre) et Stefan-Xp (CC BY-SA 3.0). Fichiers non modifiés.';
