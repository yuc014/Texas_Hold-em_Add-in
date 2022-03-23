import { waitForUserAction } from "../utils/waitUserAction";

/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global console, document, Excel, Office */

import Dictionary from "./Dictionary";
import PlayerProp from "./playerProp";

Office.onReady((info) => {
  if (info.host === Office.HostType.Excel) {
    document.getElementById("sideload-msg").style.display = "none";
    document.getElementById("app-body").style.display = "flex";
    document.getElementById("submitName").onclick = submitName;
    document.getElementById("start").onclick = start;
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
  var smallBlind: number;
}
globalThis.initMoney = 5000;
globalThis.playerInfoDict = new Dictionary();
globalThis.playerInfoSheetName = "playerInfo";
globalThis.smallBlind = 0;

export async function prepareTableAndSheet() {
  globalThis.gameSheetName = "GameRoom";
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
    });
  } catch (error) {
    console.error(error);
  }
}

export async function start() {
  try {
    await Excel.run(async (context) => {
      // do the process
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
      var player = new PlayerProp(name, status, money);
      globalThis.playerInfoDict.set(name, player);
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

    let player1Result = await waitForUserAction("Player1");
    console.log(player1Result);
    let player2Result = await waitForUserAction("Player2");
    console.log(player2Result);
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

  async call(amount: number) {
    await changeScoreTableDataFromAction(this, "check", amount);
    await changeInfoTableDataFromAction(this, "check", amount);
  }

  async raise(raiseAmount: number) {
    await changeScoreTableDataFromAction(this, "check", raiseAmount);
    await changeInfoTableDataFromAction(this, "check", raiseAmount);
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

      var updateAddress = actionRange.getColumnsAfter(skipCount);
      var potAddress = actionRange.getColumnsAfter(7);
      var moneyAddress = actionRange.getColumnsAfter(2);
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
