/* =========================================================
   POUR TOI — le grand questionnaire
   Types : 'texte' (réponse libre), 'choix' (une réponse),
   'duo' (l'un ou l'autre), 'echelle' (de 1 à 10).
   ========================================================= */

const BLOCS = [

  { titre: 'Pour commencer', sous: 'Doucement. On se met en route.', qs: [
    { t: 'texte',   q: 'Comment tu te sens, là, maintenant ? En un mot.', ph: 'un seul mot…' },
    { t: 'echelle', q: 'Ta journée, sur 10.', bas: 'horrible', haut: 'parfaite' },
    { t: 'texte',   q: 'Le meilleur moment de ta journée, c\'était quoi ?', ph: 'même un petit truc…' },
    { t: 'choix',   q: 'Sois honnête : tu as bien mangé aujourd\'hui ?', o: ['Oui, correctement', 'Bof, à moitié', 'Non et je sais que c\'est mal'] },
    { t: 'choix',   q: 'Il est quelle heure chez toi ?', o: ['Encore raisonnable', 'Tard', 'Beaucoup trop tard', 'Ne me juge pas'] },
    { t: 'texte',   q: 'Qu\'est-ce qui t\'a fait sourire cette semaine ?' }
  ]},

  { titre: 'Toi', sous: 'La partie qui m\'intéresse le plus.', qs: [
    { t: 'texte',   q: 'De quoi tu es le plus fière, en ce moment ?' },
    { t: 'texte',   q: 'Et qu\'est-ce qui te fatigue le plus ?' },
    { t: 'echelle', q: 'Ta confiance en toi, en ce moment, sur 10.', bas: 'au plus bas', haut: 'invincible' },
    { t: 'texte',   q: 'Si tu pouvais supprimer une corvée de ta vie pour toujours, ce serait laquelle ?' },
    { t: 'texte',   q: 'Ton petit plaisir coupable, celui que tu n\'avoues pas facilement ?' },
    { t: 'duo',     q: 'Tu préfères…', a: 'Une soirée seule au calme', b: 'Une soirée entourée' },
    { t: 'duo',     q: 'Et plutôt…', a: 'Te lever tôt', b: 'Te coucher tard' },
    { t: 'texte',   q: 'Qu\'est-ce que tu aimerais que je remarque plus souvent chez toi ?' },
    { t: 'choix',   q: 'Quand ça ne va pas, tu préfères que je…', o: ['Te demande ce qui se passe', 'Attende que tu viennes', 'Change juste les idées', 'Sois juste là, sans rien dire'] },
    { t: 'texte',   q: 'Une chose que tu as apprise sur toi cette année ?' }
  ]},

  { titre: 'Nous deux', sous: 'Là, tu peux être franche.', qs: [
    { t: 'texte',   q: 'Le tout premier truc que tu as pensé de moi ?' },
    { t: 'texte',   q: 'À quel moment tu t\'es dit que c\'était sérieux ?' },
    { t: 'texte',   q: 'Notre meilleur souvenir, si tu devais n\'en garder qu\'un ?' },
    { t: 'texte',   q: 'Un souvenir de nous que tu gardes et que je ne soupçonne même pas ?' },
    { t: 'texte',   q: 'Qu\'est-ce que je fais qui te rassure ?' },
    { t: 'texte',   q: 'Et qu\'est-ce que je fais qui t\'agace ? Vas-y, franchement.' },
    { t: 'echelle', q: 'Notre couple, aujourd\'hui, sur 10.', bas: 'ça rame', haut: 'au sommet' },
    { t: 'texte',   q: 'Pourquoi cette note ?' },
    { t: 'choix',   q: 'Ce qui te manque le plus quand on est loin ?', o: ['Les câlins', 'Ma voix', 'Les bêtises', 'Le quotidien banal', 'Tout, sans distinction'] },
    { t: 'texte',   q: 'Un truc qu\'on a fait une fois et que tu veux absolument refaire ?' },
    { t: 'duo',     q: 'Dans un couple, le plus important c\'est…', a: 'La confiance', b: 'La complicité' },
    { t: 'texte',   q: 'Décris-moi en trois mots. Les vrais, pas les gentils.' }
  ]},

  { titre: 'Ce qu\'on ne se dit pas', sous: 'Personne ne lira ça, à part moi.', qs: [
    { t: 'texte',   q: 'Un petit mensonge que tu m\'as déjà dit ?' },
    { t: 'texte',   q: 'Une chose que tu n\'oses pas me demander ?' },
    { t: 'choix',   q: 'Tu m\'as déjà regardé dormir ?', o: ['Oui', 'Non', 'Oui et je ne le dirai jamais'] },
    { t: 'echelle', q: 'Combien tu penses à moi dans une journée ?', bas: 'à peine', haut: 'tout le temps' },
    { t: 'texte',   q: 'Qu\'est-ce qui te manque le plus, physiquement ?' },
    { t: 'texte',   q: 'Une peur que tu as, à propos de nous ?' },
    { t: 'texte',   q: 'Et une chose dont tu es absolument sûre, à propos de nous ?' },
    { t: 'choix',   q: 'Si je t\'énerve, tu…', o: ['Le dis tout de suite', 'Boudes un peu d\'abord', 'Gardes pour toi', 'Ça dépend des jours'] }
  ]},

  { titre: 'Devant nous', sous: 'La partie qui fait du bien.', qs: [
    { t: 'texte',   q: 'Dans cinq ans, on habite où ?' },
    { t: 'texte',   q: 'Notre appartement, tu le vois comment ?' },
    { t: 'choix',   q: 'Des enfants ?', o: ['Un', 'Deux', 'Trois ou plus', 'On verra bien', 'Juste des animaux'] },
    { t: 'texte',   q: 'Un animal en plus de Milo, ce serait quoi ?' },
    { t: 'texte',   q: 'Le premier vrai voyage qu\'on fait ensemble ?' },
    { t: 'duo',     q: 'Notre maison idéale…', a: 'À la campagne, au calme', b: 'En ville, dans le mouvement' },
    { t: 'texte',   q: 'Qu\'est-ce que tu veux qu\'on garde toujours, quoi qu\'il arrive ?' },
    { t: 'texte',   q: 'Une tradition à nous que tu aimerais qu\'on invente ?' }
  ]},

  { titre: 'Vite, sans réfléchir', sous: 'Premier réflexe. Ne réfléchis pas.', qs: [
    { t: 'duo', q: 'Vite !', a: 'Sucré', b: 'Salé' },
    { t: 'duo', q: 'Vite !', a: 'Mer', b: 'Montagne' },
    { t: 'duo', q: 'Vite !', a: 'Film à la maison', b: 'Sortie dehors' },
    { t: 'duo', q: 'Vite !', a: 'Été', b: 'Hiver' },
    { t: 'duo', q: 'Vite !', a: 'Chien', b: 'Chat' },
    { t: 'duo', q: 'Vite !', a: 'Appeler', b: 'Écrire' },
    { t: 'duo', q: 'Vite !', a: 'Grasse matinée', b: 'Lever de soleil' },
    { t: 'duo', q: 'Vite !', a: 'Tout prévoir', b: 'Improviser' }
  ]},

  { titre: 'Pour finir', sous: 'Les dernières. Prends ton temps.', qs: [
    { t: 'texte',   q: 'Une chose que je devrais changer ?' },
    { t: 'texte',   q: 'Et une chose que je ne dois jamais changer ?' },
    { t: 'texte',   q: 'Qu\'est-ce que tu veux me dire, là, maintenant ?' },
    { t: 'texte',   q: 'Un message pour moi, à lire demain matin au réveil ?' },
    { t: 'echelle', q: 'Cette page, sur 10 ?', bas: 'bof', haut: 'j\'ai adoré' }
  ]}
];

/* =========================================================
   LES PAUSES — petits jeux glissés entre les questions
   ========================================================= */
const JEUX = ['memo', 'reflexe', 'intrus', 'sequence', 'coeurs', 'ordre'];

/* paires du memory */
const PAIRES = ['🐶', '🌙', '🍓', '🎧', '🌊', '🔑', '🌻', '☕'];

/* couples d'emojis presque identiques, pour l'intrus */
const INTRUS = [
  ['🐶', '🐕'], ['😀', '😃'], ['🍎', '🍏'], ['⭐', '🌟'],
  ['💙', '💜'], ['🌸', '🌺'], ['🐟', '🐠'], ['❤️', '🧡'],
  ['🌙', '🌛'], ['🐻', '🐨'], ['☁️', '🌥️'], ['🍇', '🫐']
];

/* petits mots d'encouragement entre deux blocs */
const PAUSES = [
  'Tu t\'en sors très bien.',
  'Continue, c\'est passionnant à lire.',
  'Encore un peu. Je te promets que ça vaut le coup.',
  'Tu peux souffler deux secondes.',
  'Sérieusement, merci de jouer le jeu.',
  'On approche de la fin.'
];
