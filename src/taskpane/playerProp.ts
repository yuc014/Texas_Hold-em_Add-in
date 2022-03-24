import { Card } from "src/utils/Card";

export default class PlayerProp {
  constructor(public name: string, public status: string, public money: number, public hand: Card[]) {}

  toString() {
    return `[#${this.status}: ${this.money}]`;
  }
}
