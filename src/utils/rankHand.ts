import { keys, reduce, includes, values, find, concat, each } from "lodash";
import RoundPlayer from "./round_player";

import PokerSolver from "pokersolver";
import { Card } from "./card";
const Hand = PokerSolver.Hand;

export function chooseWinners(communityCards: Card[], players: RoundPlayer[]) {
  let playerIdToHandMap: { [index: string]: any[] } = {};
  let winners = [];

  players.map((player) => {
    const hand = solveHand(concat(player.hand, communityCards));
    playerIdToHandMap[player.id] = hand;
    return hand;
  });

  while (keys(playerIdToHandMap).length > 0) {
    const currentWinners = winnersForHands(players, playerIdToHandMap);
    winners.push(currentWinners);
    currentWinners.forEach((currentWinner: { id: string | number; }) => {
      delete playerIdToHandMap[currentWinner.id];
    });
  }

  return winners;
}

// Returns the winning players for a set of hands
function winnersForHands(players: RoundPlayer[], playerIdToHandMap: { [index: string]: any[] }) {
  const winners = Hand.winners(values(playerIdToHandMap));
  return reduce(
    playerIdToHandMap,
    (result: any[], hand: any, id: any) => {
      if (includes(winners, hand)) {
        const player = find(players, (player: { id: any; }) => player.id == id);
        result.push(player);
      }
      return result;
    },
    []
  );
}

function solveHand(cards: any[]) {
  return Hand.solve(shuffleToPokerSolve(cards));
}

function shuffleToPokerSolve(cards: any[]) {
  return cards.map((card) => {
    return card.rank + card.suit;
  });
}

export function assignPot(communityCards: Card[], players: RoundPlayer[], pot: number) {
  const winners = chooseWinners(communityCards, players);
  const playerIds: any[] = [];

  each(players, (player: RoundPlayer) => {
    if (player.folded === false) {
      playerIds.push(player.id);
    }
  });

  each(winners, (winner: any[]) => {
    const eligibleWinners = winner.filter(({ id }) => playerIds.includes(id));
    if (eligibleWinners.length === 0) return;

    const amountForEachPlayer = Math.floor(pot / eligibleWinners.length);
    each(eligibleWinners, (winner: RoundPlayer) => {
      winner.chips += amountForEachPlayer;
      pot -= amountForEachPlayer;
    });
    each(eligibleWinners, (winner: RoundPlayer) => {
      if (pot === 0) return;
      winner.chips += 1;
      pot -= 1;
    });
  });
}
