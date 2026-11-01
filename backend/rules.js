// The rules of ultimate tic-tac-toe, so the server can refuse moves the client should never
// have sent. Must agree with frontend/src/models/Game.ts and Board.ts.
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];
const BOARDS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const other = (player) => (player === 'X' ? 'O' : 'X');
const isIndex = (n) => Number.isInteger(n) && n >= 0 && n <= 8;
/** X opens game 0, O game 1, X game 2, … */
const starterFor = (gameNumber) => (gameNumber % 2 === 0 ? 'X' : 'O');

function lineWinner(marks) {
  for (const [a, b, c] of LINES) {
    if (marks[a] && marks[a] === marks[b] && marks[a] === marks[c]) return marks[a];
  }
  return null;
}

function newGame(starter = 'X') {
  return {
    cells: BOARDS.map(() => Array(9).fill(null)), // cells[board][cell] = 'X' | 'O' | null
    boardWinners: Array(9).fill(null),
    turn: starter,
    nextBoard: null, // the board the previous move sends the next player to
    winner: null,
  };
}

/** A small board can still be played in: nobody won it and it has an empty cell. */
const boardOpen = (game, board) => !game.boardWinners[board] && game.cells[board].some(cell => !cell);

function playableBoards(game) {
  if (game.nextBoard !== null && boardOpen(game, game.nextBoard)) return [game.nextBoard];
  return BOARDS.filter(board => boardOpen(game, board));
}

const isDraw = (game) => !game.winner && BOARDS.every(board => !boardOpen(game, board));
const isOver = (game) => Boolean(game.winner) || isDraw(game);

/**
 * Plays a move if it's legal. Returns null on success, or the reason it was refused
 * (and then leaves the game untouched).
 */
function applyMove(game, { boardIndex, cellIndex, player }) {
  if (!isIndex(boardIndex) || !isIndex(cellIndex)) return 'not a cell';
  if (isOver(game)) return 'game is over';
  if (player !== game.turn) return 'not your turn';
  if (!playableBoards(game).includes(boardIndex)) return 'not a playable board';
  if (game.cells[boardIndex][cellIndex]) return 'cell taken';

  game.cells[boardIndex][cellIndex] = player;
  game.boardWinners[boardIndex] = lineWinner(game.cells[boardIndex]);
  game.winner = lineWinner(game.boardWinners);
  game.nextBoard = cellIndex;
  game.turn = other(player);
  return null;
}

module.exports = { newGame, applyMove, playableBoards, isOver, isDraw, starterFor, other, isIndex };
