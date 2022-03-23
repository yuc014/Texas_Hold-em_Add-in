import { nanoid } from "nanoid";

export default class RoundPlayer {
  currentBet: number;
  folded: boolean;
  hand: any[];
  winnings: number;
  takenAction: boolean;
  winner: boolean;
  chips: number;
  name: any;
  id: any;

  constructor(name, folded, hand, chips, currentBet) {
    this.id = nanoid;
    this.name = name;
    this.chips = chips; // total chips
    this.folded = folded;
    this.currentBet = currentBet; // chips bet for current round
    this.hand = [];
  }
}
