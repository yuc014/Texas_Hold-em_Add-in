export default class PlayerProp {
  constructor(public name: string, public status: string, public money: number) {}

  toString() {
    return `[#${this.status}: ${this.money}]`;
  }
}
