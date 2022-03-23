import TablePlayer from "./table_player";

export default class RoundPlayer {
  #currentBet: number;
  folded: boolean;
  hand: any[];
  winnings: number;
  takenAction: boolean;
  tablePlayer: TablePlayer;
  revealed: boolean;
  solvedHand?: any;

  constructor(tablePlayer: TablePlayer) {
    this.tablePlayer = tablePlayer;
    this.folded = false;
    this.hand = [];
    this.winnings = 0;
    this.takenAction = false;
    this.revealed = false;
  }

  get id() {
    return this.tablePlayer.id;
  }

  get chips() {
    return this.tablePlayer.chips;
  }

  get #currentBet() {
    return this.#currentBet;
  }

  resetCurrentBet() {
    this.#currentBet = 0;
  }

  canTakeAction() {
    return !this.folded && this.tablePlayer.chips > 0;
  }

  callTo(amount: number) {
    const diff = Math.max(amount - this.#currentBet, 0);
    this.raiseBet(diff);
  }

  raiseBet(amount: number) {
    const maxAmount = Math.min(this.tablePlayer.chips, amount);

    this.tablePlayer.takeChips(maxAmount);
    this.#currentBet += maxAmount;
  }

  giveChips(amount: number) {
    this.tablePlayer.giveChips(amount);
  }
}
