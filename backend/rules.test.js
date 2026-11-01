const { test } = require('node:test');
const assert = require('node:assert/strict');
const { newGame, applyMove, playableBoards, isOver, isDraw, starterFor } = require('./rules');

/** Plays [board, cell] pairs, alternating from the game's starter; fails on any refused move. */
function play(game, moves) {
  for (const [boardIndex, cellIndex] of moves) {
    assert.equal(applyMove(game, { boardIndex, cellIndex, player: game.turn }), null, `move ${boardIndex},${cellIndex}`);
  }
  return game;
}

test('the starter alternates between games', () => {
  assert.deepEqual([0, 1, 2, 3].map(starterFor), ['X', 'O', 'X', 'O']);
});

test('the first move can go anywhere', () => {
  assert.deepEqual(playableBoards(newGame()), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(applyMove(newGame(), { boardIndex: 8, cellIndex: 3, player: 'X' }), null);
});

test('refuses a move out of turn', () => {
  assert.equal(applyMove(newGame('X'), { boardIndex: 0, cellIndex: 0, player: 'O' }), 'not your turn');
  assert.equal(applyMove(newGame('O'), { boardIndex: 0, cellIndex: 0, player: 'X' }), 'not your turn');
});

test('refuses cells that are not on the board', () => {
  for (const [boardIndex, cellIndex] of [[9, 0], [0, -1], [1.5, 0], ['1', 0], [undefined, 0]]) {
    assert.equal(applyMove(newGame(), { boardIndex, cellIndex, player: 'X' }), 'not a cell');
  }
});

test('the cell you play sends the other player to that board', () => {
  const game = play(newGame(), [[0, 4]]);
  assert.deepEqual(playableBoards(game), [4]);
  assert.equal(applyMove(game, { boardIndex: 5, cellIndex: 0, player: 'O' }), 'not a playable board');
});

test('refuses a taken cell and leaves the game untouched', () => {
  const game = play(newGame(), [[4, 4]]); // O must play in board 4, where X holds the middle
  const before = structuredClone(game);
  assert.equal(applyMove(game, { boardIndex: 4, cellIndex: 4, player: 'O' }), 'cell taken');
  assert.deepEqual(game, before);
});

/** A game in the middle of play, set up directly instead of through a long list of moves. */
function gameWith({ cells = {}, boardWinners = {}, turn = 'X', nextBoard = null }) {
  const game = newGame(turn);
  for (const [board, marks] of Object.entries(cells)) {
    [...marks].forEach((mark, cell) => (game.cells[board][cell] = mark === '.' ? null : mark));
  }
  for (const [board, winner] of Object.entries(boardWinners)) game.boardWinners[board] = winner;
  game.nextBoard = nextBoard;
  return game;
}

test('being sent to a won board lets you play in any open board', () => {
  const game = gameWith({ cells: { 0: 'XXXOO....' }, boardWinners: { 0: 'X' }, turn: 'O', nextBoard: 0 });
  assert.deepEqual(playableBoards(game), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(applyMove(game, { boardIndex: 0, cellIndex: 8, player: 'O' }), 'not a playable board');
  assert.equal(applyMove(game, { boardIndex: 7, cellIndex: 8, player: 'O' }), null);
});

test('being sent to a full board lets you play in any open board', () => {
  const game = gameWith({ cells: { 2: 'XOXXOOOXX' }, turn: 'O', nextBoard: 2 });
  assert.deepEqual(playableBoards(game), [0, 1, 3, 4, 5, 6, 7, 8]);
});

test('winning a small board marks it won', () => {
  const game = gameWith({ cells: { 4: 'XX.OO....' }, turn: 'X', nextBoard: 4 });
  assert.equal(applyMove(game, { boardIndex: 4, cellIndex: 2, player: 'X' }), null);
  assert.equal(game.boardWinners[4], 'X');
  assert.equal(game.winner, null);
});

test('three won boards in a row win the game, and then nothing more can be played', () => {
  const game = gameWith({
    cells: { 0: 'XXX......', 1: 'XXX......', 2: 'XX.OO....' },
    boardWinners: { 0: 'X', 1: 'X' },
    turn: 'X',
    nextBoard: 2,
  });
  assert.equal(applyMove(game, { boardIndex: 2, cellIndex: 2, player: 'X' }), null);
  assert.equal(game.winner, 'X');
  assert.ok(isOver(game));
  assert.equal(applyMove(game, { boardIndex: 5, cellIndex: 0, player: 'O' }), 'game is over');
});

test('a game where no board is left to play and nobody has three in a row is a draw', () => {
  // Boards won X O X / X O O / O X X: no line of three for either player.
  const winners = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
  const game = gameWith({ boardWinners: Object.fromEntries(winners.map((w, i) => [i, w])) });
  assert.equal(game.winner, null);
  assert.ok(isDraw(game));
  assert.ok(isOver(game));
});
