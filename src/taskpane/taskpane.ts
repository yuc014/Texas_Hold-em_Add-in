import { waitForUserAction, updateUITitle } from "../utils/waitUserAction";

/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global console, document, Excel, Office */

import Dictionary from "./Dictionary";
import PlayerProp from "./playerProp";
import { Card, Suits } from "../utils/card";
import { CardSet } from "./role/CardSet";
import { setCell } from "../utils/setCell";
import RoundPlayer from "../utils/round_player";
import { chooseWinners } from "../utils/rankHand";
import { Banker } from "./role/Banker";

Office.onReady(async (info) => {
  if (info.host === Office.HostType.Excel) {
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";
    document.getElementById("submitName").onclick = submitName;
    document.getElementById("start").onclick = start;
    await registerOnChangeEvent();
  }
});

declare global {
  var gameSheetName: string;
  var scoreTableName: string;
  var cardTableName: string;
  var scoreTableAddr: string;
  var cardTableAddr: string;
  var playerInfoSheetName: string;
  var curPlayerName: string;
  var initMoney: number;
  var playerInfoDict: Dictionary<string, PlayerProp>;
  var smallBlind: number; // start from 1
  var communityCard: Card[];
  var cardSet: CardSet;
}
globalThis.initMoney = 5000;
globalThis.playerInfoDict = new Dictionary();
globalThis.playerInfoSheetName = "playerInfo";
globalThis.smallBlind = 1;
globalThis.gameSheetName = "GameRoom";
globalThis.communityCard = [];

export async function prepareTableAndSheet() {
  globalThis.scoreTableName = "scoreTable";
  globalThis.cardTableName = "cardTable";
  globalThis.scoreTableAddr = "C9:L9";
  globalThis.cardTableAddr = "E18:G18";
  try {
    await Excel.run(async (context) => {
      updatePlayersInfo();
      var sheets = context.workbook.worksheets;
      await createWorksheetIfNotExist(globalThis.gameSheetName);
      await context.sync();
      var gameSheet = sheets.getItem(globalThis.gameSheetName);
      gameSheet.activate();
      gameSheet.position = 1;

      await createTableIfNotExist(
        globalThis.gameSheetName,
        globalThis.scoreTableName,
        globalThis.scoreTableAddr,
        true,
        [["Position", "PlayerName", "Action", "Call number", "Money", "Pre-flop", "Flop", "Turn", "River", "Pot"]]
      );
      await createTableIfNotExist(globalThis.gameSheetName, globalThis.cardTableName, globalThis.cardTableAddr, true, [
        ["PlayerName", "Card1", "Card2"],
      ]);
      await context.sync();

      var scoreTable = gameSheet.tables.getItemOrNullObject(globalThis.scoreTableName);
      var cardTable = gameSheet.tables.getItemOrNullObject(globalThis.cardTableName);
      scoreTable.getHeaderRowRange().format.autofitColumns();
      cardTable.getHeaderRowRange().format.autofitColumns();
      cardTable.autoFilter.clearCriteria();

      await globalThis.playerInfoDict.forEach(async function (key, value) {
        var nameIsInScoreTable = await nameInTable(key, globalThis.scoreTableName, 1);
        var nameIsInCardTable = await nameInTable(key, globalThis.cardTableName, 0);
        await context.sync();
        console.log("boo:" + nameIsInCardTable + "," + nameIsInCardTable);
        if (!nameIsInScoreTable) {
          scoreTable.rows.add(-1, [["", key, "", "", value.money, "", "", "", "", ""]]);
        }
        if (!nameIsInCardTable) {
          cardTable.rows.add(-1, [[key, "", ""]]);
        }
        await context.sync();
      });
      await context.sync();
    });
  } catch (error) {
    console.error(error);
  }
}

export async function submitName() {
  try {
    await Excel.run(async (context) => {
      globalThis.curPlayerName = (<HTMLInputElement>document.getElementById("playerName")).value;
      if (globalThis.curPlayerName == "") {
        return;
      }
      await createWorksheetIfNotExist(globalThis.playerInfoSheetName);
      await context.sync();

      var playerInfoSheet = context.workbook.worksheets.getItem(globalThis.playerInfoSheetName);
      playerInfoSheet.position = -1;

      await createTableIfNotExist(globalThis.playerInfoSheetName, globalThis.playerInfoSheetName, "A1:C1", true, [
        ["PlayerName", "Status", "Money"],
      ]);
      await context.sync();

      var playerInfoTable = playerInfoSheet.tables.getItem(globalThis.playerInfoSheetName);
      var nameInTable = playerInfoTable.columns
        .getItemAt(0)
        .getDataBodyRange()
        .findOrNullObject(globalThis.curPlayerName, {
          completeMatch: true,
          matchCase: true,
        });
      await context.sync();
      if (nameInTable.isNullObject) {
        playerInfoTable.rows.add(-1, [[globalThis.curPlayerName, "", globalThis.initMoney]]);
      }
      playerInfoTable.getHeaderRowRange().format.autofitColumns();
      await context.sync();

      await prepareTableAndSheet();
      await context.sync();

      await createSheetView();
      await context.sync();

      var cardTable = context.workbook.worksheets
        .getItem(globalThis.gameSheetName)
        .tables.getItemOrNullObject(globalThis.cardTableName);
      var view = context.workbook.worksheets
        .getItem(globalThis.gameSheetName)
        .namedSheetViews.getItem(globalThis.curPlayerName);
      view.activate();
      await context.sync();

      var af = cardTable.autoFilter;
      af.apply(cardTable.getDataBodyRange(), 0, {
        filterOn: Excel.FilterOn.values,
        values: [globalThis.curPlayerName],
      });
      await context.sync();

      var range = context.workbook.worksheets.getItem(globalThis.gameSheetName).tables.getItem(globalThis.scoreTableName).rows.getItemAt(0).getRange();
      range.load();
      await context.sync();
      var rangeData = range.values;
      rangeData[0][9] = "=SUM(H10:K10)";
      range.values = rangeData;
      await context.sync();
    });
  } catch (error) {
    console.error(error);
  }
}

async function onHighlight(e) {
  console.log(e);
  let address = e.address;

  let turn = "";
  let playerName = "";
  let shouldIgnore = false;

  try {
    await Excel.run(async (context) => {
      var worksheet = context.workbook.worksheets.getItem(globalThis.gameSheetName);
      let a1 = worksheet.getRange("A1");
      a1.load("values");
      let range = worksheet.getRange(address).getColumnsBefore(1);
      range.load("values");
      let range2 = worksheet.getRange(address);
      range2.load("format/fill/color");
      range.load("values");
      await context.sync();

      // 消除highlight 某玩家完成了操作
      if (range2.format.fill.color == "#FFFFFF") {
        console.log("ignore format change");
        console.log(range2.format.fill.color);
        updateUITitle("");
      }

      if (range2.format.fill.color != "#FFC000") {
        console.log("ignore format change");
        console.log(range2.format.fill.color);
        shouldIgnore = true;
      }

      playerName = range.values[0][0];

      turn = a1.values[0][0];
    });

    if (shouldIgnore) {
      return;
    }

    let isMyTurn = playerName == globalThis.curPlayerName;

    let player1Result = await waitForUserAction(playerName, isMyTurn);
    console.log(player1Result);
    if (isMyTurn) {
      let ua = new UserAction(globalThis.curPlayerName, turn);

      if (player1Result == "call") {
        await ua.call();
      } else if (player1Result == "raise") {
        await ua.raise();
      } else if (player1Result == "check") {
        await ua.check();
      } else if (player1Result == "fold") {
        await ua.fold();
      }

      await Excel.run(async (context) => {
        var worksheet = context.workbook.worksheets.getItem(globalThis.gameSheetName);

        let range = worksheet.getRange(address);
        range.format.fill.clear();
        await context.sync();
      });
    }
  } catch (e) {
    console.log(e);
  }
}

async function registerOnChangeEvent() {
  await Excel.run(async (context) => {
    var worksheet = context.workbook.worksheets.getItem(globalThis.gameSheetName);
    worksheet.onFormatChanged.add(onHighlight);
  });
}

export async function start() {
  try {
    await Excel.run(async (context) => {
      // do the process
      var banker = new Banker();
      banker.startGame();
      await context.sync();
    });
  } catch (error) {
    console.error(error);
  }
}

async function createSheetView() {
  try {
    await Excel.run(async (context) => {
      var views = context.workbook.worksheets.getItem(globalThis.gameSheetName).namedSheetViews;
      views.add(globalThis.curPlayerName);
    });
  } catch (error) {
    console.error(error);
  }
}

async function nameInTable(name: string, tablename: string, nameColIdx: number): Promise<boolean> {
  try {
    return await Excel.run(async (context) => {
      var sheet = context.workbook.worksheets.getItem(globalThis.playerInfoSheetName);
      var table = sheet.tables.getItem(tablename);
      var nameInTable = table.columns.getItemAt(nameColIdx).getDataBodyRange().findOrNullObject(name, {
        completeMatch: true,
        matchCase: true,
      });
      await context.sync();
      if (nameInTable.isNullObject) {
        return false;
      }
      return true;
    });
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function updatePlayersInfo() {
  try {
    await Excel.run(async (context) => {
      var sheet = context.workbook.worksheets.getItem(globalThis.playerInfoSheetName);
      var table = sheet.tables.getItem(globalThis.playerInfoSheetName);
      var dataRange = table.getDataBodyRange();
      dataRange.load("text");
      await context.sync();
      var playerData = dataRange.text;
      for (let index = 0; index < playerData.length; index++) {
        const element = playerData[index];
        updatePlayerInfo(element[0], element[1], +element[2]);
      }
      console.log(globalThis.playerInfoDict);
    });
  } catch (error) {
    console.error(error);
  }
}

async function updatePlayerInfo(name: string, status: string, money: number) {
  try {
    await Excel.run(async () => {
      if (!globalThis.playerInfoDict.hasKey(name)) {
        var player = new PlayerProp(name, status, money, null);
        globalThis.playerInfoDict.set(name, player);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

async function createWorksheetIfNotExist(worksheetName: string) {
  try {
    await Excel.run(async (context) => {
      var sheets = context.workbook.worksheets;
      var sheet = sheets.getItemOrNullObject(worksheetName);
      await context.sync();
      if (sheet.isNullObject) {
        sheet = sheets.add(worksheetName);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

async function createTableIfNotExist(
  worksheetName: string,
  tableName: string,
  tableAddr: string,
  hasHeader: boolean,
  header: string[][]
) {
  try {
    await Excel.run(async (context) => {
      var tables = context.workbook.worksheets.getItemOrNullObject(worksheetName).tables;
      var table = tables.getItemOrNullObject(tableName);
      await context.sync();
      if (table.isNullObject) {
        table = tables.add(tableAddr, hasHeader);
        if (hasHeader) {
          table.getHeaderRowRange().values = header;
        }
        table.name = tableName;
      }
    });
  } catch (error) {
    console.error(error);
  }
}

export class UserAction {
  constructor(public playerName: string, public turn: string) {}

  async check() {
    await changeScoreTableDataFromAction(this, "check", 0);
    await changeInfoTableDataFromAction(this, "check", 0);
  }

  async call() {
    var amount = await calCallAmt(this.playerName, 0);
    await changeScoreTableDataFromAction(this, "call", amount);
    await changeInfoTableDataFromAction(this, "call", amount);
  }

  async raise() {
    var amount = await calCallAmt(this.playerName, 1);
    await changeScoreTableDataFromAction(this, "raise", amount);
    await changeInfoTableDataFromAction(this, "raise", amount);
  }

  // will not update actions for fold user
  async fold() {
    await changeScoreTableDataFromAction(this, "fold", 0);
    await changeInfoTableDataFromAction(this, "fold", 0);
  }
}

async function changeScoreTableDataFromAction(_userAction: UserAction, action: string, _raiseAmount: number) {
  try {
    await Excel.run(async (context) => {
      var tables = context.workbook.worksheets.getItemOrNullObject(globalThis.gameSheetName).tables;
      var table = tables.getItem(globalThis.scoreTableName);
      await context.sync();
      var range = table.columns.getItemAt(1).getDataBodyRange().findOrNullObject(_userAction.playerName, {
        completeMatch: true,
        matchCase: true,
      });
      var actionRange = range.getColumnsAfter(1);
      actionRange.values = [[action]];

      var skipCount;
      switch (_userAction.turn) {
        case "pre-flop":
          skipCount = 3;
          break;
        case "flop":
          skipCount = 4;
          break;
        case "turn":
          skipCount = 5;
          break;
        case "river":
          skipCount = 6;
          break;
        default:
          break;
      }

      var updateAddress = actionRange.getOffsetRange(0, skipCount);
      var potAddress = actionRange.getOffsetRange(0, 7);
      var moneyAddress = actionRange.getOffsetRange(0, 2);
      updateAddress.load("address");
      potAddress.load("address");
      moneyAddress.load("address");
      await context.sync();

      switch (action) {
        case "check":
          break;
        case "call":
          await updatePotAndData(updateAddress.address, potAddress.address, _raiseAmount);
          await updateCurMoney(moneyAddress.address, _raiseAmount, globalThis.gameSheetName);
          break;
        case "raise":
          await updatePotAndData(updateAddress.address, potAddress.address, _raiseAmount);
          await updateCurMoney(moneyAddress.address, _raiseAmount, globalThis.gameSheetName);
          break;
        case "fold":
          break;
        default:
          break;
      }
    });
  } catch (error) {
    console.error(error);
  }
}

async function changeInfoTableDataFromAction(_userAction: UserAction, action: string, _raiseAmount: number) {
  try {
    await Excel.run(async (context) => {
      var tables = context.workbook.worksheets.getItemOrNullObject(globalThis.playerInfoSheetName).tables;
      var table = tables.getItem(globalThis.playerInfoSheetName);
      await context.sync();
      var range = table.columns.getItemAt(0).getDataBodyRange().findOrNullObject(_userAction.playerName, {
        completeMatch: true,
        matchCase: true,
      });
      var actionRange = range.getColumnsAfter(1);
      actionRange.values = [[action]];
      var moneyAddress = actionRange.getColumnsAfter(1);
      moneyAddress.load("address");
      await context.sync();
      switch (action) {
        case "check":
          break;
        case "call":
          await updateCurMoney(moneyAddress.address, _raiseAmount, globalThis.playerInfoSheetName);
          break;
        case "raise":
          await updateCurMoney(moneyAddress.address, _raiseAmount, globalThis.playerInfoSheetName);
          break;
        case "fold":
          break;
        default:
          break;
      }
    });
  } catch (error) {
    console.error(error);
  }
}

async function updatePotAndData(updateRange: string, potRange: string, addAmount: number) {
  try {
    await Excel.run(async (context) => {
      var sheet = context.workbook.worksheets.getItemOrNullObject(globalThis.gameSheetName);
      var updateR = sheet.getRange(updateRange);
      var potR = sheet.getRange(potRange);
      updateR.load("values");
      potR.load("values");
      await context.sync();
      var newAmount = +updateR.values + addAmount;
      var newPotAmount = +potR.values + addAmount;
      updateR.values = [[newAmount]];
      potR.values = [[newPotAmount]];
      await context.sync();
    });
  } catch (error) {
    console.error(error);
  }
}

async function updateCurMoney(updateRange: string, addAmount: number, sheetname: string) {
  try {
    await Excel.run(async (context) => {
      var sheet = context.workbook.worksheets.getItemOrNullObject(sheetname);
      var range = sheet.getRange(updateRange);
      range.load("values");
      await context.sync();
      var newAmount = +range.values - addAmount;
      range.values = [[newAmount]];
      await context.sync();
    });
  } catch (error) {
    console.error(error);
  }
}

export async function initCardSet() {
  globalThis.cardSet = new CardSet();
  globalThis.cardSet.initCardSet();
  globalThis.cardSet.shuffle();
}

export async function prepareCard(turn: number) {
  try {
    await Excel.run(async (context) => {
      var turn = 1;
      switch (turn) {
        case 1:
          await prepardHands();
          break;
        case 2:
          globalThis.communityCard.push(parseCard(globalThis.cardSet.deal()));
          globalThis.communityCard.push(parseCard(globalThis.cardSet.deal()));
          globalThis.communityCard.push(parseCard(globalThis.cardSet.deal()));
          await showCommunityCards();
          break;
        case 3:
          globalThis.communityCard.push(parseCard(globalThis.cardSet.deal()));
          await showCommunityCards();
          break;
        case 4:
          globalThis.communityCard.push(parseCard(globalThis.cardSet.deal()));
          await showCommunityCards();
          break;
        default:
          break;
      }
      console.log(globalThis.playerInfoDict);
      await context.sync();
    });
  } catch (error) {
    console.error(error);
  }
}

function parseCard(cardName: string): Card {
  var suit, rank;
  switch (cardName.charAt(0)) {
    case "♠":
      suit = Suits.Spade;
      break;
    case "♥":
      suit = Suits.Heart;
      break;
    case "♣":
      suit = Suits.Club;
      break;
    case "■":
      suit = Suits.Diamond;
      break;
    default:
      break;
  }
  if (cardName.length == 3) {
    rank = "T";
  } else {
    rank = cardName.substring(1);
  }

  return new Card(rank, suit);
}

async function showCommunityCards() {
  try {
    await Excel.run(async (context) => {
      var sheet = context.workbook.worksheets.getItem(globalThis.gameSheetName);
      var range = sheet.getRange("D4");
      range.values = [["ComCards:"]];
      range = range.getOffsetRange(0, 1);
      for (let index = 0; index < globalThis.communityCard.length; index++) {
        var card = globalThis.communityCard[index];
        setCell(context, range, card);
        range = range.getOffsetRange(0, 1);
      }
      await context.sync();
    });
  } catch (error) {
    console.error(error);
  }
}

async function prepardHands() {
  try {
    await Excel.run(async (context) => {
      await updatePlayersInfo();
      await context.sync();

      await globalThis.playerInfoDict.forEach(async function (key, value) {
        value.hand = [];
        value.hand.push(parseCard(globalThis.cardSet.deal()));
        value.hand.push(parseCard(globalThis.cardSet.deal()));
        await context.sync();
      });

      await showHands();
      await context.sync();
    });
  } catch (error) {
    console.error(error);
  }
}

async function showHands() {
  try {
    await Excel.run(async (context) => {
      var sheet = context.workbook.worksheets.getItem(globalThis.gameSheetName);
      var table = sheet.tables.getItem(globalThis.cardTableName);
      table.autoFilter.clearCriteria();
      await globalThis.playerInfoDict.forEach(function (key, value) {
        var nameInTable = table.columns.getItemAt(0).getDataBodyRange().findOrNullObject(value.name, {
          completeMatch: true,
          matchCase: true,
        });
        nameInTable.load();
        var range = nameInTable.getOffsetRange(0, 1);
        setCell(context, range, value.hand[0]);
        range = nameInTable.getOffsetRange(0, 2);
        setCell(context, range, value.hand[1]);
      });
      await context.sync();
      var af = table.autoFilter;
      af.apply(table.getDataBodyRange(), 0, {
        filterOn: Excel.FilterOn.values,
        values: [globalThis.curPlayerName],
      });
      await context.sync();
    });
  } catch (error) {
    console.error(error);
  }
}

async function calCallAmt(name: string, callOrRaise: number): Promise<number> {
  try {
    return await Excel.run(async (context) => {
      var sheet = context.workbook.worksheets.getItem(globalThis.gameSheetName);
      var table = sheet.tables.getItem(globalThis.scoreTableName);
      var a1Range = sheet.getRange("A1");
      a1Range.load();
      await context.sync();
      var turn = a1Range.values[0][0];
      var newturn = turn.trim().split(":")[1];
      console.log(newturn);

      var nameInTable = table.columns.getItemAt(1).getDataBodyRange().findOrNullObject(name, {
        completeMatch: true,
        matchCase: true,
      });

      var offset;
      switch (newturn) {
        case "Pre-flop":
          offset = 4;
          break;
        case "Flop round":
          offset = 5;
          break;
        case "Turn round":
          offset = 6;
          break;
        case "River round":
          offset = 7;
          break;
        default:
          break;
      }
      var curPotAddr = nameInTable.getOffsetRange(0, offset);
      curPotAddr.load();
      await context.sync();
      var [[curPot]] = curPotAddr.values;
      var colRange = table.columns.getItemAt(1 + offset).getDataBodyRange();
      colRange.load();
      await context.sync();

      var maxPotRange = sheet.getRange("T1");
      maxPotRange.values = [["=MAX(" + colRange.address + ")"]];
      maxPotRange.load();
      await context.sync();
      var [[maxPot]] = maxPotRange.values;

      if (curPot == "") {
        curPot = "0";
      }
      var callAmt = +maxPot - +curPot;
      maxPotRange.clear();
      if (callOrRaise == 0) {
        nameInTable.getOffsetRange(0, 2).values = [[callAmt]];
      } else {
        nameInTable.getOffsetRange(0, 2).values = [[2 * callAmt]];
      }
      return callAmt;
    });
  } catch (error) {
    console.error(error);
  }
}

export async function getCurrentPlayers(): Promise<Array<number>> {
  try {
    return await Excel.run(async (context) => {
      var sheet = context.workbook.worksheets.getItem(globalThis.playerInfoSheetName);
      var table = sheet.tables.getItem(globalThis.playerInfoSheetName);
      var dataRange = table.getDataBodyRange();
      var resIdx = [];
      dataRange.load();
      await context.sync();
      var data = dataRange.values;
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        if (element[1] != "fold") {
          resIdx.push(index + 1);
        }
      }
      console.log(resIdx);
      await context.sync();
      return resIdx;
    });
  } catch (error) {
    console.error(error);
  }
}

export async function gameFinish() {
  try {
    return await Excel.run(async (context) => {
      var roundPlayers;
      var table = context.workbook.worksheets
        .getItem(globalThis.gameSheetName)
        .tables.getItem(globalThis.scoreTableName);
      await globalThis.playerInfoDict.forEach(function (key, value) {
        var nameInTable = table.columns.getItemAt(1).getDataBodyRange().findOrNullObject(value.name, {
          completeMatch: true,
          matchCase: true,
        });
        nameInTable.load();
        var range = nameInTable.getOffsetRange(0, 8);
        range.load("values");
        var player = new RoundPlayer(key, value.status == "fold", value.hand, value.money, +range.values[0][0]);
        roundPlayers.push(player);
      });

      var winners = chooseWinners(globalThis.communityCard, roundPlayers);

      await winners.forEach(function (element) {
        var nameInTable = table.columns.getItemAt(1).getDataBodyRange().findOrNullObject(element.name, {
          completeMatch: true,
          matchCase: true,
        });
        nameInTable.load();
        nameInTable.format.fill.color = "Green";
        var Potrange = nameInTable.getOffsetRange(0, 3);
        Potrange.values = [[element.chips]];
      });

      globalThis.playerInfoDict = new Dictionary();
      globalThis.smallBlind += 1;
      globalThis.communityCard = [];
    });
  } catch (error) {
    console.error(error);
  }
}
