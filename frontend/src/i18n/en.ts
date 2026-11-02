// English messages. This file defines the shape every other language must match (see `Messages`).

// The nine spots of a 3×3 grid, in reading order. Used for cells.
const cells = [
  'top left',
  'top middle',
  'top right',
  'middle left',
  'centre',
  'middle right',
  'bottom left',
  'bottom middle',
  'bottom right',
];

// Local boards, as a standalone label and inside a sentence.
const boards = cells.map(pos => `${pos.charAt(0).toUpperCase()}${pos.slice(1)} board`);
const inBoard = cells.map(pos => `in the ${pos} board`);

const en = {
  langName: 'English',

  title: 'Ultimate tic-tac-toe',
  documentTitle: 'Ultimate Tic Tac Toe',
  yourTurnTitle: "It's your turn!",
  skipToGame: 'Skip to game',
  howToPlay: 'How to play',
  language: 'Language',
  gameStatus: 'Game status',
  footer: 'Made by Martijn',
  startNewGame: 'Start a new game',

  notice: {
    replacedTitle: 'This game is open somewhere else',
    replacedBody: 'You opened this game in another tab or window. Carry on there, or play here instead.',
    playHere: 'Play here',
    fullTitle: 'This game already has two players',
    fullBody: 'Start your own game and invite someone else to play.',
    offlineTitle: "Can't reach the game server",
    offlineBody: "Check your internet connection. We'll keep trying to connect.",
    connectingTitle: 'Setting up the board…',
    connectingBody: 'Connecting to the game server.',
  },

  announce: {
    otherOffline: 'The other player lost their connection.',
    otherBack: 'The other player is back.',
    reconnected: 'Reconnected.',
    otherJoined: 'The other player has joined. You can start the game.',
    move: (byYou: boolean, cell: number, board: number) =>
      `${byYou ? 'You' : 'The other player'} played ${cells[cell]} ${inBoard[board]}.`,
    youWon: 'You won the game!',
    otherWon: 'The other player won the game.',
    draw: "It's a draw.",
    yourMoveIn: (board: number) => `Your move, ${inBoard[board]}.`,
    yourMoveAnywhere: 'Your move, in any open board.',
    newGameYouFirst: 'New game. Your move.',
    newGameOtherFirst: 'New game. The other player moves first.',
    otherWantsRematch: 'The other player wants to play again.',
    otherReacted: (name: string) => `The other player reacted: ${name}.`,
  },

  connection: {
    youOffline: 'Connection lost. Reconnecting…',
    otherOffline: 'The other player lost their connection. Waiting for them to come back…',
    otherGone: "The other player hasn't come back yet. You can keep waiting or start a new game.",
  },

  lobby: {
    youArePlaying: (player: string) => `You're playing ${player}`,
    hostIntro: 'X goes first, so you make the opening move.',
    guestIntro: 'The other player plays X and makes the opening move.',
    sendLink: 'Send this link to someone else',
    copyLink: 'Copy link',
    copied: 'Copied',
    shareLink: 'Share link',
    shareTitle: 'Ultimate tic-tac-toe',
    shareText: 'Play a game of ultimate tic-tac-toe with me',
    copiedFeedback: 'Link copied. Paste it in a message to the person you want to play with.',
    copyFailed: "Couldn't copy automatically. Select the link and copy it yourself.",
    otherJoined: 'The other player has joined.',
    waitingForOpen: 'Waiting for the other player to open the link…',
    startGame: 'Start game',
    waitingForOther: 'Waiting for the other player',
  },

  status: {
    players: 'Players',
    you: 'You',
    other: 'Other player',
    boardsWon: (n: number) => `${n} ${n === 1 ? 'board' : 'boards'}`,
    toMove: 'to move',
    youWon: 'You won!',
    otherWon: 'The other player won',
    draw: "It's a draw",
    yourMove: 'Your move',
    theirMove: 'Their move',
    youWonDetail: 'Three boards in a row. Nicely played.',
    otherWonDetail: 'They got three boards in a row.',
    drawDetail: 'No moves left and no three boards in a row.',
    playIn: (board: number) => `Play ${inBoard[board]}.`,
    playAnywhere: 'Play in any highlighted board.',
    waitingIn: (player: string, board: number) => `Waiting for ${player} to play ${inBoard[board]}.`,
    waitingAnywhere: (player: string) => `Waiting for ${player} to play in any highlighted board.`,
    playAgain: 'Play again',
    playAgainNote: 'The other player needs to press Play again too.',
    waitingForRematch: 'Waiting for the other player…',
    otherWantsRematch: 'The other player wants to play again.',
    nextYouFirst: 'You go first next game.',
    nextOtherFirst: 'The other player goes first next game.',
    score: 'Score',
    draws: (n: number) => `${n} ${n === 1 ? 'draw' : 'draws'}`,
    scoreSpoken: (you: number, them: number, draws: number) =>
      `Score: you ${you}, the other player ${them}${draws ? `, ${draws} ${draws === 1 ? 'draw' : 'draws'}` : ''}.`,
    moveCount: (n: number) => `Move ${n}`,
  },

  reactions: {
    label: 'Send a reaction',
    open: 'React',
    // Same order as REACTIONS in src/reactions.ts
    names: ['Applause', 'Laughing', 'Surprised', 'Grimacing', 'Fire'],
  },

  board: {
    label: 'Game board',
    roleDescription: 'ultimate tic-tac-toe board',
    name: (board: number) => boards[board],
    wonBy: (player: string) => `won by ${player}`,
    full: 'full',
    playHere: 'play here',
    zoomOut: 'Zoom out',
    cell: (cell: number, mark: string | undefined, isLastMove: boolean) =>
      `${cells[cell].charAt(0).toUpperCase()}${cells[cell].slice(1)}: ${mark ?? 'empty'}${isLastMove ? ', last move' : ''}`,
  },

  help: {
    title: 'How to play',
    close: 'Close',
    lead: 'Nine small tic-tac-toe boards sit inside one big one. Win three small boards in a row to win the game.',
    whereHeading: 'Where you play',
    whereBody:
      'X opens anywhere. After that, the cell you pick decides which board your opponent plays in next. Play the top right cell of any board, and your opponent has to play in the top right board.',
    diagramCaption: 'X played the top right cell of the centre board, so O has to play in the top right board.',
    highlightBody:
      'The board you have to play in is highlighted. If that board is already won or full, you can play in any open board instead.',
    winningHeading: 'Winning',
    winningBody:
      "Get three in a row in a small board to win it. Once a board is won or full, nobody can play there again. Win three boards in a row, across, down or diagonally, to win the game. If there's nowhere left to play, it's a draw.",
    gotIt: 'Got it',
  },
};

export type Messages = typeof en;
export default en;
