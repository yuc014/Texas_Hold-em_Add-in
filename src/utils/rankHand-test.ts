import { Card, Suits } from "./card";
import { assignPot, chooseWinners } from "./rankHand";
import RoundPlayer from "./round_player";

var communityCards = [
  new Card("T", Suits.Diamond),
  new Card("2", Suits.Spade),
  new Card("3", Suits.Diamond),
  new Card("4", Suits.Diamond),
  new Card("5", Suits.Diamond),
];

var players = [
  new RoundPlayer("abc", true, [], 100, 20),
  new RoundPlayer("def", false, [], 100, 20),
  new RoundPlayer("fas", false, [], 100, 20),
];
players[0].hand = [new Card("A", Suits.Club), new Card("A", Suits.Heart)];
players[1].hand = [new Card("3", Suits.Club), new Card("6", Suits.Heart)];
players[2].hand = [new Card("4", Suits.Club), new Card("6", Suits.Heart)];

assignPot(communityCards, players, 100);


//console.log(players);