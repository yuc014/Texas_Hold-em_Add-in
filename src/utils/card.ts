export enum Suits {
  Heart = "h",
  Spade = "s",
  Diamond = "d",
  Club = "c",
}

export class Card {
  public constructor(rank: any, suit: any) {
    this.suit = suit;
    this.rank = rank;
  }
  public suit: Suits;
  public rank: any;

  // return two letter to PokerSolver for ranking purpose
  public toPokerSolver() {
    return this.rank + this.suit;
  }
}
