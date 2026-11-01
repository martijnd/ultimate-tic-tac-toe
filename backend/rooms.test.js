const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  Rooms, isRoomCode, createRoom, takeSeat, placeMark, requestRematch, resumeState, MAX_GAMES_PER_ROOM,
} = require('./rooms');

test('room codes are six-digit numbers without a leading zero', () => {
  for (const code of ['100000', '482913', '999999']) assert.ok(isRoomCode(code), code);
  for (const code of ['', '12345', '1234567', '012345', '12a456', ' 123456', 123456, null, undefined]) {
    assert.ok(!isRoomCode(code), String(code));
  }
});

test('the first player is X, the second O, and a third is turned away', () => {
  const room = createRoom();
  assert.deepEqual(takeSeat(room, 'a'), { player: 'X', returning: false });
  assert.deepEqual(takeSeat(room, 'b'), { player: 'O', returning: false });
  assert.equal(takeSeat(room, 'c'), null);
});

test('a returning token gets its own seat back', () => {
  const room = createRoom();
  takeSeat(room, 'a');
  takeSeat(room, 'b');
  assert.deepEqual(takeSeat(room, 'b'), { player: 'O', returning: true });
});

test('legal moves are kept for resuming, illegal ones are refused', () => {
  const room = createRoom();
  assert.equal(placeMark(room, 'X', 0, 4), null);
  assert.equal(placeMark(room, 'X', 4, 0), 'not your turn');
  assert.equal(placeMark(room, 'O', 5, 0), 'not a playable board');
  assert.equal(placeMark(room, 'O', 4, 0), null);
  assert.deepEqual(room.games, [[
    { boardIndex: 0, cellIndex: 4, player: 'X' },
    { boardIndex: 4, cellIndex: 0, player: 'O' },
  ]]);
});

test('a player without a seat cannot move', () => {
  assert.equal(placeMark(createRoom(), undefined, 0, 0), 'not your turn');
});

/** A room whose current game X has just won. */
function finishedRoom() {
  const room = createRoom();
  room.game.winner = 'X';
  return room;
}

test('rematch is ignored while the game is still going', () => {
  const room = createRoom();
  assert.equal(requestRematch(room, 'X'), 'ignored');
  assert.deepEqual(room.rematch, { X: false, O: false });
});

test('a rematch starts once both players ask, with the other player starting', () => {
  const room = finishedRoom();
  assert.equal(requestRematch(room, 'X'), 'waiting');
  assert.deepEqual(resumeState(room, 'O').rematch, { X: true, O: false });
  assert.equal(requestRematch(room, 'O'), 'started');
  assert.equal(room.games.length, 2);
  assert.deepEqual(room.rematch, { X: false, O: false });
  assert.equal(room.game.turn, 'O');
  assert.equal(placeMark(room, 'X', 0, 0), 'not your turn');
  assert.equal(placeMark(room, 'O', 0, 0), null);
});

test('a room stops starting new games at the cap', () => {
  const room = finishedRoom();
  room.games = Array.from({ length: MAX_GAMES_PER_ROOM }, () => []);
  assert.equal(requestRematch(room, 'X'), 'ignored');
});

test('resume state tells whether the other player joined and is online', () => {
  const room = createRoom();
  takeSeat(room, 'a');
  assert.deepEqual(resumeState(room, 'X'), {
    player: 'X', games: [[]], rematch: { X: false, O: false }, otherJoined: false, otherOnline: false,
  });
  takeSeat(room, 'b');
  assert.equal(resumeState(room, 'X').otherJoined, true);
  assert.equal(resumeState(room, 'X').otherOnline, false);
  room.seats.O.socketId = 'socket-b';
  assert.equal(resumeState(room, 'X').otherOnline, true);
});

test('no new rooms past the limit, but existing ones still open', () => {
  const rooms = new Rooms({ maxRooms: 1 });
  const first = rooms.getOrCreate('111111');
  assert.ok(first);
  assert.equal(rooms.getOrCreate('222222'), null);
  assert.equal(rooms.getOrCreate('111111'), first);
});

test('an empty room is forgotten after the TTL, unless someone comes back', async () => {
  const rooms = new Rooms({ ttlMs: 20 });
  takeSeat(rooms.getOrCreate('111111'), 'a');
  takeSeat(rooms.getOrCreate('222222'), 'b');
  rooms.scheduleCleanup('111111');
  rooms.scheduleCleanup('222222');
  rooms.cancelCleanup(rooms.get('222222'));
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(rooms.get('111111'), undefined);
  assert.ok(rooms.get('222222'));
});

test('a room with someone connected is not scheduled for cleanup', async () => {
  const rooms = new Rooms({ ttlMs: 20 });
  const room = rooms.getOrCreate('111111');
  takeSeat(room, 'a');
  room.seats.X.socketId = 'socket-a';
  rooms.scheduleCleanup('111111');
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.ok(rooms.get('111111'));
});
