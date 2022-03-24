var rowOffset;
var colOffset;

class Banker {
  private roundNum = 4;
  private _round: number;
  private _currentPlayer: number;
  private _roundStop: boolean;
  private _worksheet: Excel.Worksheet;

  public currentPlayers: Array<number>;

  public async startGame(players: Array<number>) {
    this.currentPlayers = players;
    await this.init();
    this.process();
  }

  private async init() {
    if (!this._worksheet) {
      await Excel.run(async (context) => {
        let _this = this;
        this._worksheet = context.workbook.worksheets.getActiveWorksheet();
        await context.sync();
        this._worksheet.onFormatChanged.add(
          (args) =>
            new Promise((resolve, reject) => {
              _this._formatChangedHandler(args);
            })
        );
      });
    }
    this._round = 1;
    this._currentPlayer = smallBlind + 2;
    this._roundStop = false;
  }

  private async process() {
    if (this._round > this.roundNum) {
      // finish one game, call calculate func
      return;
    }

    if (this.getCurrentPlayerOrNull() === null) {
      //current round is finished
      //deal and callback
      (() => {
        this.process();
      })();
    } else {
      highLightCell(this._currentPlayer + rowOffset, this._round + colOffset);
    }

    return;
  }

  private getCurrentPlayerOrNull() {
    if (this._roundStop) {
      this._currentPlayer = smallBlind;
      this._round++;
      this._roundStop = false;
      return null;
    }
    return this._currentPlayer;
  }

  private getNextPlayer() {
    let currentIndex = this.currentPlayers.indexOf(this._currentPlayer);
    let nextPlayer;

    if (currentIndex == this.currentPlayers.length - 1) {
      nextPlayer = this.currentPlayers[0];
    } else {
      nextPlayer = this.currentPlayers[currentIndex + 1];
    }

    return nextPlayer;
  }

  private async afterPlayerAction(value: number) {
    this._roundStop = await this.checkIsStop(value);
    this._currentPlayer = this.getNextPlayer();
    this.process();
  }

  // once the cell is un-highlighted (set the color to no fill)
  private async _formatChangedHandler(args: Excel.WorksheetFormatChangedEventArgs) {
    await Excel.run(async (context) => {
      let range = context.workbook.worksheets.getActiveWorksheet().getRange(args.address);
      range.load(["format", "values"]);
      range.format.load("fill");
      await context.sync();
      if (range.format.fill.color == "#FFFFFF") {
        let value = parseInt(range.values[0][0]);
        this.afterPlayerAction(value);
      }
    });
    return;
  }

  private async checkIsStop(currentPlayerValue: number) {
    if (this.currentPlayers.length < 2) {
      return true;
    }
    let nextPlayer = this.getNextPlayer();
    let nextPlayerValue = await getCellValue(nextPlayer + rowOffset, this._round + colOffset);

    if (currentPlayerValue !== nextPlayerValue) {
      return false;
    }
    if (this._round == 1 && this._currentPlayer == smallBlind) {
      return false;
    }
    return true;
  }
}

async function highLightCell(row, column) {
  await Excel.run(async (context) => {
    let cell = context.workbook.worksheets.getActiveWorksheet().getCell(row, column);
    cell.load("format");
    cell.format.load("fill");
    await context.sync();
    cell.format.fill.color = "Orange";
    await context.sync();
  });
  return;
}

async function getCellValue(row, column) {
  let cellValue;
  await Excel.run(async (context) => {
    let cell = context.workbook.worksheets.getActiveWorksheet().getCell(row, column);
    cell.load("values");
    await context.sync();
    cellValue = parseInt(cell.values[0][0]);
  });
  return cellValue;
}
