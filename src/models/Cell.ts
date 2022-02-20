export class Cell {
  index: number;
  mark?: string;

  constructor(index: number, mark?: string) {
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
