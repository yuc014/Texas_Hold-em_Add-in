import { nanoid } from "nanoid";
import { Card } from "./card";

export default class RoundPlayer {
  currentBet: number;
  folded: boolean;
  hand: Card[];
  chips: number;
  name: any;
  id: any;

  constructor(name: string, folded: boolean, hand: Card[], chips: number, currentBet: number) {
    this.id = nanoid();
    this.name = name;
    this.chips = chips; // total chips
    this.folded = folded;
    this.currentBet = currentBet; // chips bet for current round
    this.hand = [];
  }
}
