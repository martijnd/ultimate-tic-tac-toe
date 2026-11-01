// Room state, kept apart from Socket.IO so it can be tested directly.
//
// Each room (the session code in the URL) holds at most two players: the first is X, the
// second is O. A player who drops (refresh, flaky network, phone asleep) rejoins with the same
// token, gets their seat back and receives the moves to rebuild the board.
// Everything lives in memory; a server restart forgets it. That's fine for a casual game.
const { randomUUID } = require('crypto');
const { newGame, applyMove, isOver, starterFor, other } = require('./rules');

const PLAYERS = ['X', 'O'];
/** Room codes are six-digit numbers without a leading zero; keep in sync with frontend/src/App.vue. */
const isRoomCode = (code) => typeof code === 'string' && /^[1-9]\d{5}$/.test(code);
// One game has at most 81 moves; this caps how many games a room keeps.
const MAX_GAMES_PER_ROOM = 500;

function createRoom() {
  return {
    seats: { X: null, O: null }, // { token, socketId } once someone sits down
    games: [[]], // the moves of every game so far; the last one is being played
    game: newGame(starterFor(0)), // the current game's board, rebuilt from those moves
    rematch: { X: false, O: false },
    cleanup: null,
  };
}

/**
 * Gives `token` its seat back, or the first free one. Returns { player, returning },
 * or null when both seats belong to other tokens.
 */
function takeSeat(room, token) {
  const returningPlayer = PLAYERS.find(p => room.seats[p]?.token === token);
  if (returningPlayer) return { player: returningPlayer, returning: true };
  const player = PLAYERS.find(p => !room.seats[p]);
  if (!player) return null;
  room.seats[player] = { token, socketId: null };
  return { player, returning: false };
}

/** Records a move. Returns null on success, or why it was refused. */
function placeMark(room, player, boardIndex, cellIndex) {
  const move = { boardIndex, cellIndex, player };
  const error = applyMove(room.game, move);
  if (error) return error;
  room.games[room.games.length - 1].push(move);
  return null;
}

/**
 * "Play again" from `player`. Returns 'ignored' (the game isn't over yet), 'waiting'
 * (for the other player) or 'started' (both asked, a new game began).
 */
function requestRematch(room, player) {
  if (!isOver(room.game) || room.games.length >= MAX_GAMES_PER_ROOM) return 'ignored';
  room.rematch[player] = true;
  if (!room.rematch[other(player)]) return 'waiting';
  room.games.push([]);
  room.game = newGame(starterFor(room.games.length - 1));
  room.rematch = { X: false, O: false };
  return 'started';
}

/** What a (re)joining player needs to rebuild the screen. */
function resumeState(room, player) {
  const opponent = room.seats[other(player)];
  return {
    player,
    games: room.games,
    rematch: room.rematch,
    otherJoined: Boolean(opponent),
    otherOnline: Boolean(opponent?.socketId),
  };
}

/** All rooms, with a cap on how many exist and cleanup once everyone has left. */
class Rooms {
  constructor({ maxRooms = 10_000, ttlMs = 30 * 60 * 1000 } = {}) {
    this.maxRooms = maxRooms;
    this.ttlMs = ttlMs;
    this.map = new Map();
  }

  get(code) {
    return this.map.get(code);
  }

  /** The room for `code`, created if needed. Null when the server is at its room limit. */
  getOrCreate(code) {
    let room = this.map.get(code);
    if (!room) {
      if (this.map.size >= this.maxRooms) return null;
      room = createRoom();
      this.map.set(code, room);
    }
    return room;
  }

  /** Someone is back in the room: keep it. */
  cancelCleanup(room) {
    clearTimeout(room.cleanup);
    room.cleanup = null;
  }

  /** Forget the room once both players have been gone for `ttlMs`. */
  scheduleCleanup(code) {
    const room = this.map.get(code);
    if (!room || room.seats.X?.socketId || room.seats.O?.socketId) return;
    clearTimeout(room.cleanup);
    room.cleanup = setTimeout(() => this.map.delete(code), this.ttlMs);
    room.cleanup.unref();
  }

  get size() {
    return this.map.size;
  }
}

/** Seat tokens come from the client; this one is for old clients that don't send any. */
const randomToken = () => randomUUID();

module.exports = { Rooms, isRoomCode, createRoom, takeSeat, placeMark, requestRematch, resumeState, randomToken, MAX_GAMES_PER_ROOM };
