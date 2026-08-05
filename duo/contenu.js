/* =========================================================
   DUO — les banques de contenu, séparées du moteur
   ========================================================= */

const QUI = [
  'Qui dit « je t\'aime » en premier le matin ?',
  'Qui met le plus de temps à se préparer ?',
  'Qui est le plus jaloux des deux ?',
  'Qui craquerait en premier après une dispute ?',
  'Qui mange le plus ?',
  'Qui est le plus bordélique ?',
  'Qui prend le plus de place dans le lit ?',
  'Qui rigole le plus pour rien ?',
  'Qui est le plus tête en l\'air ?',
  'Qui ferait le plus de bêtises si l\'autre n\'était pas là ?',
  'Qui a le plus de mal à se lever ?',
  'Qui pleure devant les films ?',
  'Qui est le plus rancunier ?',
  'Qui parle le plus au téléphone ?',
  'Qui a le pire goût musical ?',
  'Qui serait le plus perdu sans l\'autre ?',
  'Qui gagnerait à un bras de fer ?',
  'Qui est le meilleur en cuisine ?',
  'Qui râle le plus ?',
  'Qui offre les meilleurs cadeaux ?',
  'Qui a dit « je t\'aime » en premier, au tout début ?',
  'Qui est le plus jaloux de Milo ?',
  'Qui chante le plus faux ?',
  'Qui conduirait le mieux sur un long trajet ?',
  'Qui s\'endort en premier le soir ?',
  'Qui est le plus doué pour consoler l\'autre ?',
  'Qui envoie le plus de messages dans la journée ?',
  'Qui serait incapable de garder un secret ?',
  'Qui passe le plus de temps sur son téléphone ?',
  'Qui est le plus gourmand devant un dessert ?',
  'Qui a le plus de mal à dire non ?',
  'Qui serait le premier à paniquer en cas de problème ?',
  'Qui est le plus tactile ?',
  'Qui aurait le plus peur dans un film d\'horreur ?',
  'Qui oublie le plus souvent où il a posé ses clés ?',
  'Qui ferait le meilleur parent poule ?',
  'Qui prend le plus longtemps sous la douche ?',
  'Qui est le plus doué pour faire semblant d\'aller bien ?',
  'Qui serait le plus nul à un karaoké ?',
  'Qui a le rire le plus reconnaissable ?',
  'Qui est le plus têtu ?',
  'Qui serait capable de manger la même chose tous les jours ?',
  'Qui a le plus de patience ?',
  'Qui craque le plus vite devant un chiot ?',
  'Qui dépense le plus pour l\'autre ?',
  'Qui est le plus organisé ?',
  'Qui a le plus de mal à s\'excuser ?',
  'Qui raconte le mieux les histoires ?',
  'Qui serait le plus doué pour survivre en pleine nature ?',
  'Qui vérifie trois fois que la porte est fermée ?',
  'Qui a le plus d\'imagination ?',
  'Qui ferait le plus de kilomètres pour voir l\'autre ?',
  'Qui garde le plus longtemps la même paire de chaussettes ?',
  'Qui est le plus bavard au réveil ?',
  'Qui aurait le plus honte en public ?',
  'Qui serait le premier à sauter en parachute ?',
  'Qui a la meilleure mémoire des dates ?',
  'Qui met le plus de temps à choisir un film ?',
  'Qui abandonne le premier devant un jeu difficile ?',
  'Qui a le plus de chance dans la vie ?',
  'Qui ronfle ? Vraiment, sans mentir.',
  'Qui est le plus doué pour les câlins ?',
  'Qui aurait le plus de mal à vivre seul ?',
  'Qui pense le plus souvent à l\'autre dans la journée ?',
  'Qui serait le plus fier de présenter l\'autre à ses amis ?',
  'Qui est le plus susceptible ?',
  'Qui finit toujours l\'assiette de l\'autre ?',
  'Qui prend les meilleures décisions sous pression ?',
  'Qui serait le plus insupportable en voyage ?',
  'Qui a la plus belle écriture ?',
  'Qui pardonne le plus vite ?',
  'Qui est le plus doué pour deviner l\'humeur de l\'autre ?',
  'Qui achèterait un animal sur un coup de tête ?',
  'Qui rit à ses propres blagues ?',
  'Qui est le plus rêveur ?',
  'Qui a le plus peur des araignées ?',
  'Qui gagnerait à un concours de grimaces ?',
  'Qui sait le mieux garder son calme ?',
  'Qui serait le plus doué pour mentir au poker ?',
  'Qui est le plus attaché aux souvenirs ?'
];

const SYNCHRO = [
  'Notre meilleur souvenir, en un mot.',
  'Le tout premier truc qu\'on fait quand on se retrouve ?',
  'Un plat qu\'on mangera ensemble.',
  'Un endroit où on doit absolument aller tous les deux.',
  'Un mot pour décrire l\'autre.',
  'Notre chanson, s\'il fallait en choisir une.',
  'Un animal en plus de Milo, ce serait quoi ?',
  'Le prénom de notre futur chat imaginaire.',
  'Une couleur pour notre futur salon.',
  'Ce qui te manque le plus, là, maintenant.',
  'Un film qu\'on doit revoir ensemble.',
  'Notre pire habitude à tous les deux.',
  'Un pays à visiter en premier.',
  'Le dessert parfait, en un mot.',
  'Une saison pour nous deux.',
  'Un objet qu\'on doit absolument avoir chez nous.',
  'Le surnom que tu me donnes le plus souvent.',
  'Un jour de la semaine qui nous ressemble.',
  'Une odeur qui te fait penser à moi.',
  'Notre boisson du dimanche matin.',
  'Un truc qu\'on devrait arrêter de faire.',
  'Le meilleur moment de la journée.',
  'Une ville où on pourrait vivre.',
  'Un mot qui décrit notre relation.',
  'Le premier film qu\'on a regardé ensemble.',
  'Un défaut qu\'on a en commun.',
  'Une chose qu\'on ferait un dimanche pluvieux.',
  'Notre pizza idéale, une garniture.',
  'Un métier qu\'on aurait pu faire tous les deux.',
  'Le cadeau qu\'on rêverait de recevoir.',
  'Un mot pour Milo.',
  'Une activité qu\'on n\'a jamais faite et qu\'on devrait tenter.',
  'Le prénom le plus moche du monde.',
  'Une série qu\'on regarderait en entier d\'un coup.',
  'Un truc qui te fait rire à tous les coups.',
  'Notre température idéale pour la maison.',
  'Un moyen de transport pour partir loin.',
  'Le petit-déjeuner parfait, en un mot.',
  'Une chose qu\'on garderait toute la vie.',
  'Un souvenir d\'enfance en un mot.'
];

const PREFERE = [
  ['Ne plus jamais manger de dessert', 'Ne plus jamais manger de fromage'],
  ['Vivre à la montagne', 'Vivre au bord de la mer'],
  ['Ne plus jamais avoir froid', 'Ne plus jamais avoir chaud'],
  ['Lire dans les pensées', 'Devenir invisible'],
  ['Un chien qui parle', 'Un chat qui fait le ménage'],
  ['Voyager dans le passé', 'Voyager dans le futur'],
  ['Perdre le goût', 'Perdre l\'odorat'],
  ['Toujours dire la vérité', 'Ne jamais pouvoir mentir'],
  ['Vacances à la neige', 'Vacances au soleil'],
  ['Se lever à 5h tous les jours', 'Se coucher à 3h tous les jours'],
  ['Ne plus jamais écouter de musique', 'Ne plus jamais regarder de film'],
  ['Manger que du sucré', 'Manger que du salé'],
  ['Vivre sans téléphone', 'Vivre sans télévision'],
  ['Avoir une maison immense', 'Avoir un jardin immense'],
  ['Savoir jouer d\'un instrument', 'Parler cinq langues'],
  ['Une semaine sans internet', 'Une semaine sans sortir'],
  ['Être toujours en retard', 'Être toujours trop en avance'],
  ['Un road-trip en van', 'Un hôtel de luxe'],
  ['Ne plus jamais avoir mal', 'Ne plus jamais être fatigué'],
  ['Adopter dix chiens', 'Adopter dix chats'],
  ['Gagner au loto sans le dire', 'Être célèbre sans être riche'],
  ['Un dîner aux chandelles', 'Un pique-nique improvisé'],
  ['Ne plus jamais faire la vaisselle', 'Ne plus jamais faire les courses'],
  ['Dormir 12h par nuit', 'N\'avoir besoin que de 3h'],
  ['Un été qui dure toute l\'année', 'Un automne qui dure toute l\'année'],
  ['Toujours savoir l\'heure exacte', 'Toujours savoir où est ton téléphone'],
  ['Vivre dans une grande ville', 'Vivre dans un village'],
  ['Ne plus jamais te tromper de route', 'Ne plus jamais oublier un prénom'],
  ['Un petit-déjeuner au lit tous les jours', 'Un massage tous les soirs'],
  ['Pouvoir voler', 'Pouvoir respirer sous l\'eau'],
  ['Avoir toujours raison', 'Avoir toujours de la chance'],
  ['Une journée entière sans parler', 'Une journée entière sans t\'asseoir']
];

const MOTS = [
  'chien', 'bague', 'gâteau', 'voiture', 'coeur', 'lune', 'pizza', 'lit',
  'train', 'parapluie', 'café', 'avion', 'fleur', 'étoile', 'chat', 'guitare',
  'vélo', 'montagne', 'plage', 'cadeau', 'clé', 'fantôme', 'robot', 'château',
  'valise', 'lunettes', 'glace', 'soleil', 'maison', 'bateau', 'échelle',
  'ballon', 'couronne', 'dinosaure', 'fusée', 'horloge', 'nuage', 'poisson',
  'sapin', 'tortue', 'ampoule', 'banane', 'bougie', 'canapé', 'chaussure',
  'cheval', 'cactus', 'crayon', 'dauphin', 'escalier', 'fourchette', 'fraise',
  'girafe', 'hamburger', 'hibou', 'igloo', 'lion', 'marteau', 'moustache',
  'oiseau', 'ordinateur', 'ours', 'panda', 'papillon', 'pingouin', 'pomme',
  'pont', 'porte', 'renard', 'requin', 'serpent', 'skateboard', 'tasse',
  'télévision', 'tente', 'tournevis', 'trésor', 'vague', 'volcan', 'zèbre',
  'abeille', 'araignée', 'balançoire', 'bibliothèque', 'carotte', 'chapeau',
  'cloche', 'cerf-volant', 'diamant', 'éléphant', 'enveloppe', 'feu de camp',
  'grenouille', 'kangourou', 'moulin', 'phare', 'pieuvre', 'tambour'
];

/* quiz éclair — que des faits simples et vérifiables */
const QUIZ = [
  ['Quelle est la capitale de l\'Italie ?', ['Rome', 'Milan', 'Naples', 'Turin'], 0],
  ['Combien de côtés a un hexagone ?', ['6', '5', '7', '8'], 0],
  ['Quelle planète est la plus proche du Soleil ?', ['Mercure', 'Vénus', 'Mars', 'Terre'], 0],
  ['De quelle couleur est le mélange de bleu et jaune ?', ['Vert', 'Orange', 'Violet', 'Marron'], 0],
  ['Combien de jours a une année bissextile ?', ['366', '365', '364', '367'], 0],
  ['Quel est le plus grand océan du monde ?', ['Pacifique', 'Atlantique', 'Indien', 'Arctique'], 0],
  ['Combien de pattes a une araignée ?', ['8', '6', '10', '4'], 0],
  ['Quelle est la capitale du Portugal ?', ['Lisbonne', 'Porto', 'Madrid', 'Séville'], 0],
  ['Quel animal est le plus grand du monde ?', ['La baleine bleue', 'L\'éléphant', 'La girafe', 'Le requin'], 0],
  ['Combien y a-t-il de continents ?', ['7', '5', '6', '8'], 0],
  ['Quelle est la capitale du Japon ?', ['Tokyo', 'Kyoto', 'Osaka', 'Séoul'], 0],
  ['Combien de minutes dans deux heures ?', ['120', '100', '90', '140'], 0],
  ['Quel gaz respirons-nous principalement ?', ['L\'azote', 'L\'oxygène', 'Le CO2', 'L\'hélium'], 0],
  ['Quelle est la monnaie du Royaume-Uni ?', ['La livre', 'L\'euro', 'Le dollar', 'Le franc'], 0],
  ['Combien de cordes a une guitare classique ?', ['6', '4', '5', '7'], 0],
  ['Quel est le plus long fleuve de France ?', ['La Loire', 'La Seine', 'Le Rhône', 'La Garonne'], 0],
  ['Combien de joueurs dans une équipe de foot sur le terrain ?', ['11', '10', '12', '9'], 0],
  ['Quelle est la capitale de l\'Espagne ?', ['Madrid', 'Barcelone', 'Valence', 'Séville'], 0],
  ['Combien font 12 × 12 ?', ['144', '124', '154', '132'], 0],
  ['Quel est l\'animal national de l\'Australie ?', ['Le kangourou', 'Le koala', 'L\'émeu', 'Le dingo'], 0],
  ['Combien de couleurs dans un arc-en-ciel ?', ['7', '6', '8', '5'], 0],
  ['Quelle est la capitale de l\'Allemagne ?', ['Berlin', 'Munich', 'Hambourg', 'Francfort'], 0],
  ['Quel métal est liquide à température ambiante ?', ['Le mercure', 'Le plomb', 'Le fer', 'L\'étain'], 0],
  ['Combien de dents a un adulte en moyenne ?', ['32', '28', '30', '34'], 0],
  ['Quel est le plus petit pays du monde ?', ['Le Vatican', 'Monaco', 'Malte', 'Saint-Marin'], 0],
  ['Combien de secondes dans une heure ?', ['3600', '360', '600', '1800'], 0],
  ['Quelle est la capitale de la Belgique ?', ['Bruxelles', 'Anvers', 'Liège', 'Gand'], 0],
  ['Quel fruit est connu pour éloigner le médecin ?', ['La pomme', 'La banane', 'L\'orange', 'La poire'], 0],
  ['Combien de faces a un dé classique ?', ['6', '4', '8', '12'], 0],
  ['Quel est le sang universel donneur ?', ['O négatif', 'AB positif', 'A positif', 'B négatif'], 0],
  ['Quelle mer borde Nice ?', ['La Méditerranée', 'L\'Atlantique', 'La mer du Nord', 'La Manche'], 0],
  ['Combien de touches a un piano standard ?', ['88', '76', '61', '92'], 0],
  ['Quel est le plus haut sommet du monde ?', ['L\'Everest', 'Le K2', 'Le Mont Blanc', 'Le Kilimandjaro'], 0],
  ['Combien font 15 % de 200 ?', ['30', '15', '25', '35'], 0],
  ['Quelle est la capitale des Pays-Bas ?', ['Amsterdam', 'Rotterdam', 'La Haye', 'Utrecht'], 0],
  ['Quel animal peut dormir debout ?', ['Le cheval', 'Le chien', 'Le chat', 'Le lapin'], 0],
  ['Combien de lettres dans l\'alphabet français ?', ['26', '24', '28', '25'], 0],
  ['Quelle est la plus grande île du monde ?', ['Le Groenland', 'L\'Australie', 'Madagascar', 'Bornéo'], 0],
  ['Quel organe pompe le sang ?', ['Le cœur', 'Le foie', 'Les poumons', 'Les reins'], 0],
  ['Combien de côtés a un octogone ?', ['8', '6', '7', '10'], 0]
];

/* paires du memory */
const PAIRES = ['🐶', '🍕', '🌙', '🎸', '🚗', '🌊', '🎁', '⭐', '🍓', '🐱', '☕', '🏠'];

/* ---------- petit bac : une lettre + une catégorie ---------- */
const LETTRES = 'ABCDEFGILMNOPRSTV'.split('');
const CATEGORIES = [
  'un animal', 'un plat', 'une ville', 'un pays', 'un prénom',
  'une couleur', 'un métier', 'un objet de la maison', 'un fruit ou légume',
  'un sport', 'un vêtement', 'un instrument de musique', 'quelque chose de froid',
  'quelque chose qui fait du bruit', 'une partie du corps', 'un film',
  'quelque chose qu\'on trouve dans une cuisine', 'un moyen de transport',
  'quelque chose de rond', 'un mot doux'
];

/* ---------- tape vite : phrases à recopier au clavier ---------- */
const PHRASES = [
  'On se retrouve bientôt et ça change tout',
  'Le chien dort déjà sur le canapé',
  'Je pense à toi plus souvent que je ne le dis',
  'Il reste encore quelques semaines à tenir',
  'Un jour on aura notre propre cuisine',
  'La distance ne dure pas toujours',
  'Tu as encore gagné et je ne suis pas surpris',
  'On devrait vraiment partir en vacances',
  'Personne ne fait le café aussi mal que moi',
  'Ce soir on regarde un film et rien d\'autre',
  'Je te ramènerai des gâteaux la prochaine fois',
  'Il fait toujours meilleur quand tu es là',
  'On a encore parlé jusqu\'à deux heures du matin',
  'Rien ne vaut un appel qui ne finit jamais',
  'Tu es la meilleure partie de ma journée'
];

/* ---------- mot de passe : à faire deviner par des indices ---------- */
const SECRETS = [
  'plage', 'orage', 'valise', 'guitare', 'chocolat', 'montagne', 'facteur',
  'bougie', 'miroir', 'chaussette', 'ascenseur', 'parapluie', 'boulangerie',
  'aquarium', 'trampoline', 'cheminée', 'moustique', 'bibliothèque', 'confiture',
  'télésiège', 'cactus', 'brouillard', 'cerf-volant', 'escargot', 'tondeuse',
  'oreiller', 'chaussure', 'dentifrice', 'toboggan', 'girafe'
];

/* ---------- désamorçage : couleurs de fils + règles du manuel ----------
   Chaque règle reçoit la liste des 4 fils et renvoie l'index à couper.
   Toutes ont un cas de repli, elles renvoient donc toujours 0 à 3.      */
const COULEURS_FILS = ['rouge', 'bleu', 'jaune', 'vert'];

const REGLES = [
  {
    texte: 'Coupe le fil dont la couleur n\'apparaît qu\'UNE SEULE fois. S\'il y en a plusieurs, prends le plus à gauche. Si toutes les couleurs se répètent, coupe le premier.',
    calcule: f => {
      const i = f.findIndex(c => f.filter(x => x === c).length === 1);
      return i === -1 ? 0 : i;
    }
  },
  {
    texte: 'Coupe le DERNIER fil rouge. S\'il n\'y a aucun rouge, coupe le tout premier fil.',
    calcule: f => {
      const i = f.lastIndexOf('rouge');
      return i === -1 ? 0 : i;
    }
  },
  {
    texte: 'S\'il y a deux fils de la MÊME couleur côte à côte, coupe le second des deux. Sinon, coupe le troisième fil.',
    calcule: f => {
      for (let i = 0; i < f.length - 1; i++) if (f[i] === f[i + 1]) return i + 1;
      return 2;
    }
  },
  {
    texte: 'Compte les fils BLEUS. Coupe le fil qui se trouve à cette position (1 = le premier). S\'il n\'y a aucun bleu, coupe le dernier.',
    calcule: f => {
      const n = f.filter(c => c === 'bleu').length;
      return n === 0 ? f.length - 1 : n - 1;
    }
  },
  {
    texte: 'Si le premier et le dernier fil sont de la même couleur, coupe le deuxième. Sinon, coupe le fil juste avant le dernier.',
    calcule: f => (f[0] === f[f.length - 1]) ? 1 : f.length - 2
  },
  {
    texte: 'Coupe le fil VERT s\'il y en a exactement un. S\'il y en a zéro ou plusieurs, coupe le dernier fil jaune, et s\'il n\'y a pas de jaune, le premier fil.',
    calcule: f => {
      const verts = f.map((c, i) => c === 'vert' ? i : -1).filter(i => i >= 0);
      if (verts.length === 1) return verts[0];
      const j = f.lastIndexOf('jaune');
      return j === -1 ? 0 : j;
    }
  }
];

/* =========================================================
   MODE PIMENT — versions coquines, réservées au couple.
   Désactivé par défaut, à cocher dans les options.
   ========================================================= */
const PIMENT = {
  qui: [
    'Qui a le plus envie de faire l\'amour, là, maintenant ?',
    'Qui prend le plus souvent l\'initiative ?',
    'Qui aime le plus faire durer les préliminaires ?',
    'Qui est le plus bruyant des deux ?',
    'Qui a le plus de fantasmes non avoués ?',
    'Qui oserait le faire ailleurs que dans un lit ?',
    'Qui aime le plus prendre le contrôle ?',
    'Qui aime le plus se laisser faire ?',
    'Qui pense le plus souvent au sexe dans la journée ?',
    'Qui est le plus difficile à rassasier ?',
    'Qui craquerait le premier après une semaine sans rien ?',
    'Qui est le plus doué avec ses mains ?',
    'Qui embrasse le mieux ?',
    'Qui a le plus de mal à dire ce dont il a envie ?',
    'Qui proposerait un plan coquin à distance ce soir ?',
    'Qui a le regard le plus troublant ?',
    'Qui sait le mieux faire monter la tension ?',
    'Qui est le plus gourmand des deux ?',
    'Qui aime le plus être regardé ?',
    'Qui fait le plus semblant de ne pas avoir envie ?',
    'Qui envoie les messages les plus osés ?',
    'Qui a la voix la plus troublante au téléphone ?',
    'Qui serait le plus gêné si quelqu\'un entrait au mauvais moment ?',
    'Qui est le plus câlin une fois que c\'est fini ?',
    'Qui parle le plus pendant ?',
    'Qui s\'endort le premier après ?',
    'Qui aurait le plus de mal à rester habillé une soirée entière ?',
    'Qui rougit le plus vite quand on parle de ça ?',
    'Qui aime le plus les marques du lendemain ?',
    'Qui serait prêt à essayer absolument tout ?'
  ],
  pre: [
    ['Que je te domine', 'Que tu me domines'],
    ['Vite et intense', 'Lent et interminable'],
    ['Dans le noir complet', 'En pleine lumière'],
    ['Que je te regarde', 'Que tu me regardes'],
    ['Que je te déshabille lentement', 'Que tu m\'arraches tout'],
    ['Des préliminaires sans fin', 'Passer directement au vif'],
    ['Le matin au réveil', 'En pleine nuit'],
    ['Sous la douche', 'Sur le canapé'],
    ['Une fois très longue', 'Trois fois dans la journée'],
    ['Que tu me dises tout à voix haute', 'Que tu me le montres sans un mot'],
    ['Un endroit où on pourrait nous entendre', 'Un endroit totalement isolé'],
    ['Me faire attendre une heure', 'Me sauter dessus à la seconde'],
    ['Que je te raconte mon fantasme', 'Que tu me racontes le tien'],
    ['Que tu portes quelque chose que j\'ai choisi', 'Que tu ne portes rien du tout'],
    ['Un week-end entier enfermés', 'Une nuit dans un hôtel'],
    ['Essayer quelque chose de nouveau', 'Refaire ce qu\'on sait déjà très bien faire'],
    ['Que ce soit tendre', 'Que ce soit sauvage'],
    ['Les yeux bandés', 'Les mains attachées'],
    ['Un massage qui dégénère', 'Un bain qui dégénère'],
    ['Que je te laisse mener', 'Que je ne te laisse aucun choix']
  ],
  /* action ou vérité : [type, texte]  — type 'v' = vérité, 'a' = action */
  osa: [
    ['v', 'Décris précisément ce que tu veux qu\'on fasse la prochaine fois.'],
    ['v', 'Quel est le fantasme que tu n\'as jamais osé m\'avouer ?'],
    ['v', 'Qu\'est-ce qui te fait perdre la tête à tous les coups ?'],
    ['v', 'Quelle position tu préfères, et pourquoi celle-là ?'],
    ['v', 'Où aimerais-tu qu\'on le fasse, en dehors d\'un lit ?'],
    ['v', 'Quelle a été ta meilleure fois avec moi ? Raconte.'],
    ['v', 'Combien de fois par jour tu penses à ça ?'],
    ['v', 'Qu\'est-ce que je fais qui te rend complètement fou ?'],
    ['v', 'Quelle partie de mon corps te plaît le plus ?'],
    ['v', 'Y a-t-il quelque chose que tu veux essayer et dont tu n\'oses pas parler ?'],
    ['v', 'Quel est le moment où tu as eu le plus envie de moi ?'],
    ['v', 'Raconte la dernière fois où tu as pensé à moi de façon pas très sage.'],
    ['v', 'Qu\'est-ce que tu aimerais que je te fasse beaucoup plus souvent ?'],
    ['v', 'Tu préfères qu\'on prenne notre temps ou qu\'on soit pressés ? Explique.'],
    ['v', 'Qu\'est-ce qui te met dans l\'ambiance en deux secondes ?'],
    ['a', 'Décris-moi en détail ce que tu me ferais si j\'étais là maintenant.'],
    ['a', 'Dis-moi à voix haute ce dont tu as envie, sans rien censurer.'],
    ['a', 'Enlève un vêtement.'],
    ['a', 'Envoie-moi une photo un peu osée.'],
    ['a', 'Raconte-moi ton dernier rêve un peu chaud.'],
    ['a', 'Murmure mon prénom comme si j\'étais contre toi.'],
    ['a', 'Dis-moi les trois choses que tu veux qu\'on fasse dès qu\'on se retrouve.'],
    ['a', 'Regarde-moi dans les yeux dix secondes sans rien dire.'],
    ['a', 'Décris ta tenue actuelle, pièce par pièce.'],
    ['a', 'Raconte-moi un fantasme en trois phrases, pas une de plus.'],
    ['a', 'Dis-moi ce que tu penses de mon corps, sans être poli.']
  ],

  /* je n'ai jamais : les deux répondent « moi si » ou « moi jamais » */
  jam: [
    'Je n\'ai jamais pensé à toi sous la douche.',
    'Je n\'ai jamais eu envie de toi en pleine journée sans rien dire.',
    'Je n\'ai jamais gardé un message très osé sans oser l\'envoyer.',
    'Je n\'ai jamais fait un rêve chaud avec toi dedans.',
    'Je n\'ai jamais eu envie de le faire dans un endroit risqué.',
    'Je n\'ai jamais menti sur mon niveau d\'envie du moment.',
    'Je n\'ai jamais fait semblant d\'être fatigué pour aller au lit plus tôt.',
    'Je n\'ai jamais pensé à toi pendant que j\'étais censé travailler.',
    'Je n\'ai jamais regardé une photo de toi bien plus longtemps que nécessaire.',
    'Je n\'ai jamais eu envie de tout plaquer pour te rejoindre le jour même.',
    'Je n\'ai jamais fantasmé sur une situation qu\'on n\'a jamais vécue.',
    'Je n\'ai jamais eu du mal à me concentrer juste parce que tu étais là.',
    'Je n\'ai jamais choisi une tenue en pensant à ta réaction.',
    'Je n\'ai jamais gardé un souvenir de nous que tu ne connais pas.',
    'Je n\'ai jamais fait exprès de te chercher pour voir ce que tu ferais.',
    'Je n\'ai jamais été jaloux sans jamais te le dire.',
    'Je n\'ai jamais eu envie qu\'on soit interrompus juste pour le frisson.',
    'Je n\'ai jamais compté les jours avant de te revoir.'
  ],

  syn: [
    'Un endroit où tu aimes qu\'on t\'embrasse.',
    'Le premier mot qui te vient quand tu penses à nous deux, la nuit.',
    'Une chose que tu veux qu\'on fasse dès qu\'on se retrouve.',
    'Un moment de nous deux que tu revois souvent.',
    'Une pièce de la maison, au hasard.',
    'Un mot pour décrire ce que tu ressens quand je te prends dans mes bras.',
    'Une heure de la journée, celle que tu préfères pour ça.',
    'Une tenue que tu aimerais me voir porter.',
    'Un mot qu\'on se dit et que personne d\'autre ne comprendrait.',
    'Le truc qui te fait craquer à tous les coups.',
    'Une odeur qui te fait penser à moi.',
    'Un endroit improbable où tu aimerais qu\'on s\'embrasse.',
    'Ce que tu veux entendre en premier quand on se retrouve.',
    'Un mot pour notre toute première fois.',
    'Une chose que tu n\'as jamais osé me demander.',
    'La durée idéale d\'un câlin.'
  ]
};

/* ---------- devine l'emoji : une suite d'images, un mot ---------- */
const EMOJIS = [
  ['🎂🕯️🎁', 'anniversaire'],
  ['🎬🍿🪑', 'cinema'],
  ['✈️🧳🗺️', 'voyage'],
  ['❄️⛄🧣', 'hiver'],
  ['🌊🏖️☀️', 'plage'],
  ['📚🎓✏️', 'ecole'],
  ['🍳🥓☕', 'petit dejeuner'],
  ['💍👰🤵', 'mariage'],
  ['🌙⭐😴', 'nuit'],
  ['🎃👻🕷️', 'halloween'],
  ['🎄🎁⛄', 'noel'],
  ['🩺💊🏥', 'hopital'],
  ['⚽🥅🏆', 'football'],
  ['🐕🦴🐾', 'chien'],
  ['🌧️☂️💧', 'pluie'],
  ['🔥🚒👨‍🚒', 'pompier'],
  ['🍕🧀🍅', 'pizza'],
  ['🚿🧼🛁', 'douche'],
  ['💤🛏️🌜', 'dormir'],
  ['🎸🎤🥁', 'musique'],
  ['🌻🌱💧', 'jardin'],
  ['🚂🛤️🎫', 'train'],
  ['🦷🪥😁', 'dentiste'],
  ['📷🖼️😊', 'photo'],
  ['☕🥐🇫🇷', 'cafe'],
  ['🐟🎣🌊', 'peche'],
  ['🧗⛰️🥾', 'montagne'],
  ['🍎🍏🌳', 'pomme'],
  ['🚲🛞🛣️', 'velo'],
  ['🐝🍯🌸', 'abeille'],
  ['🌵🏜️🐫', 'desert'],
  ['🎨🖌️🖼️', 'peinture'],
  ['🔑🚪🏠', 'maison'],
  ['🌈☀️🌧️', 'arc en ciel'],
  ['🍦🍨🥶', 'glace'],
  ['👻🏚️😱', 'fantome']
];

/* ---------- le mot le plus long : tirages de 9 lettres ---------- */
const VOYELLES = 'AAAEEEEIIOOUU'.split('');
const CONSONNES = 'BCDFGLMNPRSTV'.split('');

/* pour trouve-l'intrus : des couples d'emojis qui se ressemblent */
const INTRUS = [
  ['🐶', '🐕'], ['😀', '😃'], ['🍎', '🍏'], ['⭐', '🌟'], ['💙', '💜'],
  ['🐻', '🐨'], ['🌸', '🌺'], ['🥐', '🥖'], ['🚗', '🚙'], ['⚽', '🏐'],
  ['🌙', '🌛'], ['🐟', '🐠'], ['🍋', '🍈'], ['❤️', '🧡'], ['🎈', '🎀'],
  ['🐸', '🐢'], ['🍇', '🫐'], ['☁️', '🌥️'], ['🦊', '🐱'], ['🌵', '🌲']
];
