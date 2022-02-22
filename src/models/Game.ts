import { Board } from './Board';
import { Cell } from './Cell';
import confetti from 'canvas-confetti';
import { Player } from '../enums/Player';

export class Game {
  boards: Board[];
  currentPlayer: Player;
  activePlayer: Player = Player.X;
  lastBoardIndex?: number;
  moveCount = 0;

  constructor(currentPlayer: Player, boards?: Board[], activePlayer?: Player, lastBoardIndex?: number) {
    this.currentPlayer = currentPlayer;
    this.boards = boards ?? new Array(9).fill([]).map((_, index) => new Board(index));
    this.activePlayer = activePlayer ?? Player.X;
    this.lastBoardIndex = lastBoardIndex;
  }

  placeMark(board: Board, cell: Cell, player: Player) {
    // if the board is not the one that should be picked from
    if (!this.availableBoards.map(board => board.index).includes(board.index)) {
      return;
    }

    // if the cell is already filled or if the board has already been won
    if (cell.filled || !board.active) {
      return;
    }

    this.lastBoardIndex = cell.index;
    cell.mark = player;
    this.activePlayer = this.activePlayer === Player.X ? Player.O : Player.X;
    this.moveCount++;
  }

  get wonBoards() {
    return this.boards.filter(board => board.winner);
  }

  get filledBoards() {
    return this.boards.filter(board => board.filled);
  }

  get availableBoards() {
    if (this.lastBoardIndex !== undefined) {
      const boardIsWon = this.wonBoards.find(board => board.index === this.lastBoardIndex);
      const boardIsFilled = this.filledBoards.find(board => board.index === this.lastBoardIndex);
      if (boardIsWon || boardIsFilled) {
        // display all the boards that are not won and not filled 
        return this.boards.filter(board => board.active);
      }

      // Otherwise, only activate the board that was chosen
      return this.boards.filter(board => board.index === this.lastBoardIndex);
    }

    return this.boards;
  }

  get Xboards() {
    return this.getWonBoards(Player.X);
  }

  get Oboards() {
    return this.getWonBoards(Player.O);
  }

  get winner() {
    if (this.hasWon(Player.X, this.Xboards)) {
      return Player.X;
    }

    if (this.hasWon(Player.O, this.Oboards)) {
      return Player.O;
    }

    return null;
  }

  getWonBoards(player: Player) {
    return Game.extractSections(this.boards, player);
  }

  static extractSections(sections: Cell[] | Board[], player: Player) {
    return Object.entries(sections)
    .filter(([_, section]) => section.winner === player)
    .map(([key]) => parseInt(key))
  }

  hasWon(player: Player, boards: number[]) {
    if (Game.WINNING_MOVES.some(move => Game.isSame(move, boards))) {
      if (this.currentPlayer === player) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      return true;
    }

    return false;
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

