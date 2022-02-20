import { Cell } from "./Cell";

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

    if (this.WINNING_MOVES.some(move => this.isSame(move, Xcells))) {
      return 'X';
    }

    if (this.WINNING_MOVES.some(move => this.isSame(move, Ocells))) {
      return 'O';
    }

    return null;
  }

  get available() {
    return !this.winner;
  }

  get filled () {
    return this.cells.every(cell => cell.filled);
  }

  setMark(cell: number, mark: string) {
    this.cells[cell].mark = mark;
  }

  isSame(winningMoveArray: number[], playerArray: number[]) {
    return winningMoveArray.every(x => playerArray.includes(x));
  };

  readonly WINNING_MOVES = [
    // horizontal
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    //vertical
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    // diagonal
    [0, 4, 8],
    [2, 4, 6]
  ];
}
