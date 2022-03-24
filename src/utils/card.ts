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
  toPokerSolver() {
    return this.rank + this.suit;
  }

  toDisplayString() {
    switch (this.suit) {
      case Suits.Heart:
        return "♥" + this.rank;
      case Suits.Club:
        return "♣" + this.rank;
      case Suits.Diamond:
        return "♦" + this.rank;
      case Suits.Spade:
        return "♠" + this.rank;
    }
  }
}
