/* =========================================================
   LES QUESTIONS
   Un seul écran pour deux : la question s'affiche en grand,
   vous répondez chacun à voix haute, puis on passe.
   ========================================================= */
'use strict';

const JEUX = {

  doux: {
    nom: 'Doux', emoji: '🤍', couleur: '#f4a0bd',
    q: [
      'Quel est le premier truc que tu as remarqué chez moi ?',
      'À quel moment exact tu as su que tu m\'aimais ?',
      'Quel souvenir de nous tu revois le plus souvent ?',
      'Qu\'est-ce que je fais qui te rassure sans que je le sache ?',
      'Quelle est la chose la plus mignonne que j\'ai faite pour toi ?',
      'Si tu devais garder une seule de nos photos, laquelle ?',
      'Qu\'est-ce qui te manque le plus quand on n\'est pas ensemble ?',
      'Quel surnom tu préfères que je te donne ?',
      'Quelle est ta version préférée de moi : le matin, le soir, ou en pleine nuit ?',
      'À quoi tu penses quand tu vois mon prénom s\'afficher ?',
      'Qu\'est-ce que tu aimes chez moi que personne d\'autre ne remarque ?',
      'Quel est le compliment que je t\'ai fait et que tu n\'as jamais oublié ?',
      'Si on pouvait revivre une seule journée ensemble, laquelle ?',
      'Qu\'est-ce qui te fait sourire tout seul en pensant à moi ?',
      'Quelle est la chose que je dis tout le temps et qui te fait rire ?',
      'Comment tu décrirais notre histoire à quelqu\'un qui ne nous connaît pas ?',
      'Quel geste tout bête te rend heureux ?',
      'Qu\'est-ce que tu voudrais qu\'on garde toujours, quoi qu\'il arrive ?',
      'Si tu devais m\'offrir une chose impossible, ce serait quoi ?',
      'Quelle chanson te fait penser à nous, même si elle n\'a rien à voir ?',
      'Quel est le plus beau message que je t\'ai envoyé ?',
      'À quoi ressemble une journée parfaite avec moi ?',
      'Qu\'est-ce que tu as gardé de moi, un objet, un truc ?',
      'Quand est-ce que tu t\'es senti le plus aimé par moi ?',
      'Quelle habitude j\'ai prise à cause de toi ?',
      'Qu\'est-ce que tu me dirais si tu savais que je ne me souviendrais que d\'une phrase ?'
    ]
  },

  nous: {
    nom: 'Qui de nous deux', emoji: '⚖️', couleur: '#8ec9e8',
    duo: true,
    q: [
      'Qui dit « je t\'aime » en premier le matin ?',
      'Qui met le plus de temps à se préparer ?',
      'Qui est le plus jaloux ?',
      'Qui pardonne le plus vite ?',
      'Qui a le pire sens de l\'orientation ?',
      'Qui chante le plus faux ?',
      'Qui parle le plus au chien ?',
      'Qui craquerait le premier après une dispute ?',
      'Qui dépense le plus sans réfléchir ?',
      'Qui rit le plus fort ?',
      'Qui a le plus de mal à se lever ?',
      'Qui raconte le mieux une histoire ?',
      'Qui est le plus têtu ?',
      'Qui envoie le plus de messages ?',
      'Qui a le plus de mal à dire non ?',
      'Qui serait le plus perdu sans son téléphone ?',
      'Qui prend le plus de photos ?',
      'Qui est le plus rancunier ?',
      'Qui mange le plus vite ?',
      'Qui gagnerait à un bras de fer ?',
      'Qui tiendrait le plus longtemps sans sucre ?',
      'Qui est le plus doué en cuisine ?',
      'Qui ment le moins bien ?',
      'Qui s\'endort le premier devant un film ?',
      'Qui est le plus câlin ?',
      'Qui a le plus besoin de l\'autre ?',
      'Qui râle le plus ?',
      'Qui ferait le meilleur parent ?',
      'Qui est le plus stressé des deux ?',
      'Qui a le plus changé depuis qu\'on se connaît ?'
    ]
  },

  drole: {
    nom: 'Drôle', emoji: '😄', couleur: '#f7c873',
    q: [
      'Quel est le truc le plus gênant que tu aies fait devant moi ?',
      'Si j\'étais un animal, je serais quoi ?',
      'Quelle est ta plus grosse honte d\'enfance ?',
      'Qu\'est-ce que tu ferais si tu te réveillais dans mon corps demain ?',
      'Quel est le pire film que tu m\'as forcé à regarder ?',
      'Si on devait braquer une banque, qui fait quoi ?',
      'Quel est ton pire défaut que tu assumes complètement ?',
      'Quelle est la chose la plus stupide pour laquelle on s\'est disputés ?',
      'Si tu devais me vendre à quelqu\'un, tu dirais quoi ?',
      'Quel serait notre nom de couple le plus ridicule ?',
      'Qu\'est-ce que tu ferais avec 24 heures d\'invisibilité ?',
      'Quel est le mensonge le plus bête que tu m\'aies dit ?',
      'Si notre vie était une série, ce serait quoi le titre ?',
      'Quelle est ta danse la plus honteuse ?',
      'Qu\'est-ce que tu ne veux surtout PAS que je raconte à tes potes ?',
      'Quel talent complètement inutile tu as ?',
      'Si tu devais manger un seul plat toute ta vie ?',
      'Quel est le truc le plus cher que tu aies cassé ?',
      'Quelle est la chose la plus bizarre que tu aies cherchée sur internet ?',
      'Si on était deux méchants de film, on ferait quoi ?',
      'Quel est ton plaisir coupable que tu caches ?',
      'Raconte la fois où tu t\'es le plus ridiculisé.',
      'Quel emoji me représente le mieux, et pourquoi ?',
      'Si tu pouvais m\'interdire une seule chose, ce serait quoi ?',
      'Quel est le pire cadeau que tu aies reçu ?'
    ]
  },

  profond: {
    nom: 'Profond', emoji: '🌊', couleur: '#a89bd8',
    q: [
      'De quoi tu as le plus peur, vraiment ?',
      'Qu\'est-ce que tu n\'as jamais dit à personne ?',
      'Quel est le moment qui t\'a le plus changé ?',
      'Qu\'est-ce que tu te reproches encore aujourd\'hui ?',
      'À quoi ressemble ta vie idéale dans dix ans ?',
      'Qu\'est-ce qui te rend le plus fier de toi ?',
      'Quelle est la chose la plus dure que tu aies traversée ?',
      'Qu\'est-ce que tu aimerais qu\'on dise de toi ?',
      'Qu\'est-ce que tu voudrais pardonner mais que tu n\'arrives pas à pardonner ?',
      'Qu\'est-ce qui te manque dans ta vie en ce moment ?',
      'De quoi tu as besoin quand tu vas mal, exactement ?',
      'Quelle est la chose que je pourrais faire qui te blesserait le plus ?',
      'Qu\'est-ce que tu attends de nous, honnêtement ?',
      'Y a-t-il quelque chose que tu me caches par peur de ma réaction ?',
      'Qu\'est-ce que tu voudrais que je comprenne mieux sur toi ?',
      'Quel est ton rêve que tu n\'oses pas dire à voix haute ?',
      'Qu\'est-ce que tu ferais si tu savais que tu ne peux pas échouer ?',
      'Est-ce que tu te sens toi-même avec moi ?',
      'Qu\'est-ce que tu aimerais changer chez toi ?',
      'Quel conseil tu donnerais à toi il y a cinq ans ?',
      'Qu\'est-ce qui te rassure le plus dans notre relation ?',
      'Qu\'est-ce qui t\'inquiète le plus dans notre relation ?',
      'Quel est le silence le plus lourd qu\'on ait eu ?',
      'Qu\'est-ce que tu veux qu\'on fasse différemment maintenant ?',
      'Qu\'est-ce que je peux faire pour toi que je ne fais pas assez ?'
    ]
  },

  jamais: {
    nom: 'Je n\'ai jamais', emoji: '✋', couleur: '#8fd6c1',
    duo: true,
    q: [
      'Je n\'ai jamais menti sur mon âge.',
      'Je n\'ai jamais fait semblant d\'aimer un cadeau.',
      'Je n\'ai jamais espionné le téléphone de quelqu\'un.',
      'Je n\'ai jamais séché les cours.',
      'Je n\'ai jamais pleuré devant un film d\'animation.',
      'Je n\'ai jamais dit « je t\'aime » sans le penser.',
      'Je n\'ai jamais fait semblant de dormir pour éviter quelqu\'un.',
      'Je n\'ai jamais relu une conversation entière avec toi.',
      'Je n\'ai jamais eu un coup de cœur pour un inconnu dans la rue.',
      'Je n\'ai jamais fait exprès de ne pas répondre.',
      'Je n\'ai jamais menti pour ne pas blesser quelqu\'un.',
      'Je n\'ai jamais regretté un message envoyé.',
      'Je n\'ai jamais eu peur de te perdre.',
      'Je n\'ai jamais gardé un secret trop longtemps.',
      'Je n\'ai jamais changé d\'avis sur quelqu\'un du jour au lendemain.',
      'Je n\'ai jamais chanté à tue-tête tout seul en voiture.',
      'Je n\'ai jamais parlé de toi à quelqu\'un qui ne te connaît pas.',
      'Je n\'ai jamais compté les jours avant de te revoir.',
      'Je n\'ai jamais été jaloux sans le dire.',
      'Je n\'ai jamais gardé une capture d\'écran de nos messages.'
    ]
  },

  futur: {
    nom: 'Nous demain', emoji: '🔮', couleur: '#7fc99b',
    q: [
      'On habite où, dans cinq ans ?',
      'Notre appartement, il ressemble à quoi ?',
      'Un chien, un chat, les deux, ou rien ?',
      'Quel est le premier voyage qu\'on fait ensemble ?',
      'Quelle tradition on invente rien que pour nous ?',
      'Qu\'est-ce qu\'on fera tous les dimanches ?',
      'Qui fait la cuisine, qui fait la vaisselle ?',
      'Quel est le premier meuble qu\'on achète ?',
      'Comment on s\'imagine à soixante ans ?',
      'Qu\'est-ce que tu veux absolument vivre avec moi ?',
      'Si on avait un mois libre, on part où ?',
      'Quel est le rêve qu\'on pourrait réaliser à deux ?',
      'Qu\'est-ce qu\'on ne veut plus jamais refaire ?',
      'Quelle promesse on se fait pour l\'année qui vient ?',
      'Si on écrivait nos règles à nous, ce serait quoi les trois premières ?',
      'Qu\'est-ce que tu veux qu\'on apprenne ensemble ?',
      'On fête quoi, et comment ?',
      'Quel est le prochain truc qu\'on coche sur la liste ?'
    ]
  },

  piment: {
    nom: 'Piment', emoji: '🌶️', couleur: '#e8628f', chaud: true,
    q: [
      'Qu\'est-ce qui te fait craquer chez moi, physiquement ?',
      'Quel est ton meilleur souvenir avec moi, dans ce registre ?',
      'Qu\'est-ce que tu voudrais qu\'on essaie et que tu n\'as jamais dit ?',
      'Où est ton endroit préféré pour être embrassé ?',
      'Qu\'est-ce que je fais qui te rend fou ?',
      'Tu préfères prendre le contrôle ou te laisser faire ?',
      'Quelle tenue tu aimerais me voir porter ?',
      'À quel moment de la journée tu as le plus envie ?',
      'Qu\'est-ce que tu veux entendre juste avant ?',
      'Quel est ton fantasme le plus avouable ?',
      'Et le moins avouable ?',
      'Qu\'est-ce qui te met dans l\'ambiance en deux secondes ?',
      'Vite et intense, ou lent et interminable ?',
      'Quelle partie de mon corps tu préfères ?',
      'Qu\'est-ce que tu aimerais que je fasse beaucoup plus souvent ?',
      'Combien de fois par jour tu y penses ?',
      'Quel est l\'endroit le plus improbable où tu voudrais qu\'on le fasse ?',
      'Tu préfères les préliminaires ou le câlin d\'après ?',
      'Qu\'est-ce que tu n\'oserais jamais me demander ?',
      'Décris la dernière fois où tu as eu envie de moi.',
      'Qu\'est-ce qui te fait le plus d\'effet : ma voix, mes mains ou mon regard ?',
      'Y a-t-il une limite que tu voudrais qu\'on dépasse ?',
      'Qu\'est-ce que tu ferais si j\'étais là, tout de suite ?',
      'Le matin au réveil ou en pleine nuit ?',
      'Qu\'est-ce que tu penses de mon corps, sans être poli ?'
    ]
  }
};

/* petits défis à faire ensemble, tirés au sort de temps en temps */
const DEFIS = [
  'Regardez-vous dans les yeux dix secondes sans rien dire.',
  'Dites en même temps le prénom de la personne à qui vous pensez le plus.',
  'Faites-vous un compliment que vous n\'avez jamais fait.',
  'Racontez votre premier souvenir de l\'autre, chacun votre tour.',
  'Écrivez chacun un mot sur un papier et comparez.',
  'Prenez-vous dans les bras pendant vingt secondes.',
  'Dites une chose que vous appréciez et qui n\'a rien à voir avec le physique.',
  'Imitez l\'autre pendant dix secondes.',
  'Dites chacun un truc que vous voulez faire cette semaine à deux.',
  'Fermez les yeux et dites la première image qui vous vient en pensant à l\'autre.'
];
