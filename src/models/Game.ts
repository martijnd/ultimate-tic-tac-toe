import { Board } from './Board';
import { Cell } from './Cell';
export class Game {
  boards: Board[];
  currentPlayer: 'X' | 'O' = 'X';
  lastBoardIndex?: number;
  availableBoards: Board[];

  constructor(boards?: Board[]) {
    this.boards = boards ?? new Array(9).fill([]).map((_, index) => new Board(index));
    this.availableBoards = this.boards.filter(board => board.active);
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
}

