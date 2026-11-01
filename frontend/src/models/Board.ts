import { Cell } from "./Cell";
import { Game } from "./Game";
import { Player } from "../enums/Player";

export class Board {
  index: number;
  cells: Cell[];

  constructor(index: number, cells?: Cell[]) {
    this.index = index;
    this.cells = cells ?? new Array(9).fill([]).map((_, index) => new Cell(index));
  }

  get active() {
    // If all cells are filled
    if (this.filled) {
      return false;
    }
    // If there is a winner
    if (this.winner) {
      return false;
    }

    return true;
  }

  get XCells() {
    return this.getWonCells(Player.X);
  }

  get OCells() {
    return this.getWonCells(Player.O);
  }

  get winner() {
    if (this.hasWon(this.XCells)) {
      return Player.X;
    }

    if (this.hasWon(this.OCells)) {
      return Player.O;
    }

    return null;
  }

  get filled () {
    return this.cells.every(cell => cell.filled);
  }

  getWonCells(player: Player) {
    return Game.extractSections(this.cells, player, 'mark');
  }

  hasWon(boards: number[]) {
    return Game.WINNING_MOVES.some(move => Game.isSame(move, boards));
  } 
}
