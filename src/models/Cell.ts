export class Cell {
  index: number;
  mark?: string;

  constructor(index: number) {
    this.index = index;
  }

  get filled () {
    return Boolean(this.mark);
  }

  get active () {
    return !this.mark;
  }

}
