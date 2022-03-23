import Player from "./player";

export default class TablePlayer extends Player {
  #chips: number = 100;
  #standing: boolean = false;

  get chips() {
    return this.#chips;
  }

  get standing() {
    return this.#standing;
  }

  eligibleForRound(): boolean {
    return this.#chips > 0 && !this.#standing;
  }

  takeChips(amount: number): void {
    this.#chips = Math.max(this.#chips - Math.max(amount, 0), 0);
  }

  giveChips(amount: number) {
    this.#chips += Math.max(amount, 0);
  }

  setChips(amount: number) {
    this.#chips = Math.max(amount, 0);
  }

  sit() {
    this.#standing = false;
  }

  stand() {
    this.#standing = true;
  }
}
