export class Cell {
  index: number;
  mark?: string;

  constructor(index: number, mark?: 'X' | 'O') {
    this.index = index;
    this.mark = mark;
  }

  get filled () {
    return Boolean(this.mark);
  }

  get active () {
    return !this.mark;
  }

}
