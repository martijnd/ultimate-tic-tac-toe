import { Board } from './Board';
import { Cell } from './Cell';
export class Game {
  boards: Board[];
  currentPlayer: 'X' | 'O';
  activePlayer: 'X' | 'O' = 'X';
  lastBoardIndex?: number;

  constructor(currentPlayer: 'X' | 'O', boards?: Board[], activePlayer?: 'X' | 'O', lastBoardIndex?: number) {
    this.currentPlayer = currentPlayer;
    this.boards = boards ?? new Array(9).fill([]).map((_, index) => new Board(index));
    this.activePlayer = activePlayer ?? 'X';
    this.lastBoardIndex = lastBoardIndex;
  }

  placeMark(board: Board, cell: Cell, player: 'X' | 'O') {
    console.log(board, cell,`Placing mark on board ${board.index} at cell ${cell.index}`);
    // if the board is not the one that should be picked from
    if (!this.availableBoards.map(board => board.index).includes(board.index)) {
      console.log('the board is not the one that should be picked from')
      return;
    }
    
    // if the cell is already filled or if the board has already been won
    if (cell.filled || !board.active) {
      console.log('the cell is already filled or if the board has already been won', cell, board)
      return;
    }
    
    console.log('here3')
    this.lastBoardIndex = cell.index;
    cell.mark = player;
    this.activePlayer = this.activePlayer === 'X' ? 'O' : 'X';
  }

  get wonBoards() {
    return this.boards.filter(board => board.winner);
  }

  get availableBoards() {
    if (this.lastBoardIndex !== undefined) {
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

  get winner () {
    const Xboards = Object.entries(this.boards).filter(([_, cell]) => cell.winner === 'X').map(([key]) => parseInt(key));
    const Oboards = Object.entries(this.boards).filter(([_, cell]) => cell.winner === 'O').map(([key]) => parseInt(key));

    if (Game.WINNING_MOVES.some(move => Game.isSame(move, Xboards))) {
      return 'X';
    }

    if (Game.WINNING_MOVES.some(move => Game.isSame(move, Oboards))) {
      return 'O';
    }

    return null;
  }

  static readonly WINNING_MOVES = [
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

  static isSame(winningMoveArray: number[], playerArray: number[]) {
    return winningMoveArray.every(x => playerArray.includes(x));
  };
}

