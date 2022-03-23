import { keys, reduce, includes, values, find, concat, each } from "lodash";
import RoundPlayer from "./round_player";

import PokerSolver from "pokersolver";
const Hand = PokerSolver.Hand;

export async function chooseWinners(communityCards, players: RoundPlayer[]) {
  let playerIdToHandMap: { [index: string]: any[] } = {};
  let winners = [];

  players.map((player) => {
    const hand = this.solveHand(concat(player.hand, communityCards));
    playerIdToHandMap[player.id] = hand;
    return hand;
  });

  while (keys(playerIdToHandMap).length > 0) {
    const currentWinners = winnersForHands(players, playerIdToHandMap);
    winners.push(currentWinners);
    currentWinners.forEach((currentWinner) => {
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
    (result, hand, id) => {
      if (includes(winners, hand)) {
        const player = find(players, (player) => player.id == id);
        result.push(player);
      }
      return result;
    },
    []
  );
}

export async function assignPot(communityCards, players: RoundPlayer[], pot: number) {
  const winners = chooseWinners(communityCards, players);
  each(winners, (winner) => {
    const eligibleWinners = winner.filter(({ id }) => this.playerIds.includes(id));
    if (this.total === 0 || eligibleWinners.length === 0) return;

    const amountForEachPlayer = Math.floor(this.total / eligibleWinners.length);
    each(eligibleWinners, (player) => {
      player.giveChips(amountForEachPlayer);
      pot -= amountForEachPlayer;
    });

    each(eligibleWinners, (player) => {
      if (pot === 0) return;

      player.giveChips(1);
      pot -= 1;
    });
  });
}
