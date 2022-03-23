import { Card, Suits } from "./card";

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
