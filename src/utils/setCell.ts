export enum Suits {
  Heart,
  Spade,
  Diamond,
  Club,
}

export async function setCell(context, cell, suit: Suits, card: any) {
  var value = "";
  var color = "";
  if (suit == Suits.Heart || suit == Suits.Diamond) {
    if (suit == Suits.Heart) {
      value = "♥";
    } else {
      value = "♦";
    }
    color = "red";
  } else {
    if (suit == Suits.Club) {
      value = "♣";
    } else {
      value = "♠";
    }
    color = "black";
  }

  value += card;

  cell.values = [[value]];
  cell.format.font.color = color;
  cell.format.font.size = 25;
}
