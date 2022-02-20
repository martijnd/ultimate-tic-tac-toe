import { Board } from './Board';
import { Cell } from './Cell';
export class Game {
  boards: Board[];
  currentPlayer: 'X' | 'O' = 'X';
  lastBoardIndex?: number;

  constructor(boards?: Board[], currentPlayer?: 'X' | 'O', lastBoardIndex?: number) {
    this.boards = boards ?? new Array(9).fill([]).map((_, index) => new Board(index));
    this.currentPlayer = currentPlayer ?? 'X';
    this.lastBoardIndex = lastBoardIndex;
  }

  placeMark(cell: Cell, board: Board) {
    // if the board is not the one that should be picked from
    if (this.lastBoardIndex !== undefined && board.index !== this.lastBoardIndex) {
      return;
    }

    // if the cell is already filled or if the board has already been won
    if (cell.filled || !board.active) {
      return;
    }

    this.lastBoardIndex = cell.index;
    cell.mark = this.currentPlayer;
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
  }

  get wonBoards() {
    return this.boards.filter(board => board.winner);
  }

  get availableBoards() {
    if (this.lastBoardIndex) {
      // if the chosen cell index points to a won board OR
      if (this.wonBoards.map(board => board.index).includes(this.lastBoardIndex)
      // if the chosen cell index points to a filled board
      || this.boards.find(board => board.filled)) {
        // display all the boards that are not won and not filled 
        return this.boards.filter(board => board.active);
      }
      
      // Otherwise, only activate the board that was chosen
      return this.boards.filter(board => board.index === this.lastBoardIndex);
    }
    return this.boards.filter(board => board.index !== this.lastBoardIndex);
  }
}

