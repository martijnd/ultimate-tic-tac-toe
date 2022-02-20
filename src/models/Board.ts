import { Cell } from "./Cell";
import { Game } from "./Game";

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

  get winner() {
    const Xcells = Object.entries(this.cells).filter(([_, cell]) => cell.mark === 'X').map(([key]) => parseInt(key));
    const Ocells = Object.entries(this.cells).filter(([_, cell]) => cell.mark === 'O').map(([key]) => parseInt(key));

    if (Game.WINNING_MOVES.some(move => Game.isSame(move, Xcells))) {
      return 'X';
    }

    if (Game.WINNING_MOVES.some(move => Game.isSame(move, Ocells))) {
      return 'O';
    }

    return null;
  }

  get filled () {
    return this.cells.every(cell => cell.filled);
  }
}
