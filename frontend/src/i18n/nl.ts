import type { Messages } from './en';

// Nederlandse teksten. Informeel ("je").

const cells = [
  'linksboven',
  'middenboven',
  'rechtsboven',
  'middenlinks',
  'midden',
  'middenrechts',
  'linksonder',
  'middenonder',
  'rechtsonder',
];

// Het middelste bord heet gewoon "het middelste bord", niet "het bord midden".
const boards = cells.map((pos, i) => (i === 4 ? 'Middelste bord' : `Bord ${pos}`));
const inBoard = cells.map((pos, i) => (i === 4 ? 'in het middelste bord' : `in het bord ${pos}`));

const nl: Messages = {
  langName: 'Nederlands',

  title: 'Ultimate boter-kaas-en-eieren',
  documentTitle: 'Ultimate boter-kaas-en-eieren',
  yourTurnTitle: 'Jij bent aan de beurt!',
  skipToGame: 'Naar het spel',
  howToPlay: 'Speluitleg',
  language: 'Taal',
  gameStatus: 'Spelstatus',
  footer: 'Gemaakt door Martijn',
  startNewGame: 'Nieuw spel beginnen',

  notice: {
    leftTitle: 'De andere speler heeft het spel verlaten',
    leftBody: 'Dit spel kan niet verder. Begin een nieuw spel en deel de nieuwe link.',
    fullTitle: 'Dit spel heeft al twee spelers',
    fullBody: 'Begin je eigen spel en nodig iemand anders uit.',
    offlineTitle: 'De spelserver is niet bereikbaar',
    offlineBody: 'Controleer je internetverbinding. We blijven proberen verbinding te maken.',
    connectingTitle: 'Het bord wordt klaargezet…',
    connectingBody: 'Verbinden met de spelserver.',
  },

  announce: {
    otherLeft: 'De andere speler heeft het spel verlaten.',
    otherJoined: 'De andere speler doet mee. Je kunt het spel starten.',
    move: (byYou, cell, board) => `${byYou ? 'Jij speelde' : 'De andere speler speelde'} ${cells[cell]} ${inBoard[board]}.`,
    youWon: 'Je hebt gewonnen!',
    otherWon: 'De andere speler heeft gewonnen.',
    draw: 'Gelijkspel.',
    yourMoveIn: board => `Jouw beurt, ${inBoard[board]}.`,
    yourMoveAnywhere: 'Jouw beurt, in een open bord naar keuze.',
    newGameYouFirst: 'Nieuw spel. Jij begint.',
    newGameOtherFirst: 'Nieuw spel. De andere speler begint.',
  },

  lobby: {
    youArePlaying: player => `Jij speelt ${player}`,
    hostIntro: 'X begint, dus jij doet de eerste zet.',
    guestIntro: 'De andere speler speelt X en doet de eerste zet.',
    sendLink: 'Stuur deze link naar iemand anders',
    copyLink: 'Link kopiëren',
    copied: 'Gekopieerd',
    shareLink: 'Link delen',
    shareTitle: 'Ultimate boter-kaas-en-eieren',
    shareText: 'Speel een potje ultimate boter-kaas-en-eieren met me',
    copiedFeedback: 'Link gekopieerd. Plak hem in een bericht aan degene met wie je wilt spelen.',
    copyFailed: 'Kopiëren lukte niet. Selecteer de link en kopieer hem zelf.',
    otherJoined: 'De andere speler doet mee.',
    waitingForOpen: 'Wachten tot de andere speler de link opent…',
    startGame: 'Spel starten',
    waitingForOther: 'Wachten op de andere speler',
  },

  status: {
    players: 'Spelers',
    you: 'Jij',
    other: 'Andere speler',
    boardsWon: n => `${n} ${n === 1 ? 'bord' : 'borden'}`,
    toMove: 'aan zet',
    youWon: 'Gewonnen!',
    otherWon: 'De andere speler wint',
    draw: 'Gelijkspel',
    yourMove: 'Jouw beurt',
    theirMove: 'Even wachten',
    youWonDetail: 'Drie borden op een rij. Goed gespeeld!',
    otherWonDetail: 'De andere speler had drie borden op een rij.',
    drawDetail: 'Er zijn geen zetten meer en niemand heeft drie borden op een rij.',
    playIn: board => `Speel ${inBoard[board]}.`,
    playAnywhere: 'Speel in een van de gemarkeerde borden.',
    waitingIn: (player, board) => `Wachten tot ${player} speelt ${inBoard[board]}.`,
    waitingAnywhere: player => `Wachten tot ${player} speelt in een van de gemarkeerde borden.`,
    playAgain: 'Nog een keer',
    playAgainNote: 'De andere speler moet ook op Nog een keer drukken.',
    moveCount: n => `Zet ${n}`,
  },

  board: {
    label: 'Speelbord',
    roleDescription: 'ultimate boter-kaas-en-eieren-bord',
    name: board => boards[board],
    wonBy: player => `gewonnen door ${player}`,
    full: 'vol',
    playHere: 'speel hier',
    cell: (cell, mark, isLastMove) =>
      `${cells[cell].charAt(0).toUpperCase()}${cells[cell].slice(1)}: ${mark ?? 'leeg'}${isLastMove ? ', laatste zet' : ''}`,
  },

  help: {
    title: 'Speluitleg',
    close: 'Sluiten',
    lead: 'Negen kleine borden boter-kaas-en-eieren vormen samen één groot bord. Win drie kleine borden op een rij om het spel te winnen.',
    whereHeading: 'Waar je speelt',
    whereBody:
      'X mag overal beginnen. Daarna bepaalt het vakje dat je kiest in welk bord je tegenstander moet spelen. Speel je het vakje rechtsboven van een bord, dan moet je tegenstander spelen in het bord rechtsboven.',
    diagramCaption: 'X speelde het vakje rechtsboven in het middelste bord, dus O moet spelen in het bord rechtsboven.',
    highlightBody:
      'Het bord waarin je moet spelen is gemarkeerd. Is dat bord al gewonnen of vol, dan mag je in elk open bord spelen.',
    winningHeading: 'Winnen',
    winningBody:
      'Maak drie op een rij in een klein bord om het te winnen. Een gewonnen of vol bord is daarna dicht. Win drie borden op een rij, horizontaal, verticaal of diagonaal, om het spel te winnen. Kan niemand meer spelen, dan is het gelijkspel.',
    gotIt: 'Begrepen',
  },
};

export default nl;
