import { Player } from "./Player";

export class Cell {
  index: number;
  mark?: string;

  constructor(index: number, mark?: Player) {
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
