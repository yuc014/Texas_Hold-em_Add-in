export enum Suits {
  Heart = "H",
  Spade = "S",
  Diamond = "D",
  Club = "C",
}

export class Card {
  public constructor(rank: any, suit: any) {
    this.suit = suit;
    this.rank = rank;
  }
  public suit: Suits;
  public rank: any;
}

export async function setCell(context, cell, card: Card) {
  var value = "";
  var color = "";
  if (card.suit == Suits.Heart || card.suit == Suits.Diamond) {
    if (card.suit == Suits.Heart) {
      value = "♥";
    } else {
      value = "♦";
    }
    color = "red";
  } else {
    if (card.suit == Suits.Club) {
      value = "♣";
    } else {
      value = "♠";
    }
    color = "black";
  }

  value += card.rank;

  cell.values = [[value]];
  cell.format.font.color = color;
  cell.format.font.size = 25;
}
