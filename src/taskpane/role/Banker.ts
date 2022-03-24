var rowOffset = 0;
var colOffset = 0;
var smallBlind = 1;
export class Banker {
  private roundNum = 4;
  private _round: number;
  private _currentPlayer: number;
  private _roundStop: boolean;
  private _eventReady;

  public currentPlayers: Array<number>;

  public async startGame() {
    await this.init();
    this.process();
  }

  private async init() {
    if (!this._eventReady) {
      await Excel.run(async (context) => {
        let _this = this;
        let worksheet = context.workbook.worksheets.getActiveWorksheet();
        await context.sync();
        worksheet.onFormatChanged.add(
          (args) =>
            new Promise((resolve, reject) => {
              _this._formatChangedHandler(args);
            })
        );
        this._eventReady = true;
      });
    }
    // scoreTableAddr: C9
    rowOffset = 8;
    colOffset = 3;
    await this.setRound(1);
    this._currentPlayer = smallBlind + 2;
    this._roundStop = false;
    this.currentPlayers = [1, 2, 3, 4];
    // this.currentPlayers =
  }

  private async setRound(round: number) {
    this._round = round;

    let roundName = "Round :";
    switch (round) {
      case 1:
        roundName += "Pre-flop";
        break;
      case 2:
        roundName += "Flop Round";
        break;
      case 3:
        roundName += "Turn Round";
        break;
      case 4:
        roundName += "River Round";
        break;
      default:
        roundName += "Game over";
    }

    await this.printValueToCell("A1", roundName);
    return;
  }

  private async printValueToCell(address: string, value: string) {
    await Excel.run(async (context) => {
      let cell = context.workbook.worksheets.getActiveWorksheet().getRange(address);
      cell.values = [[value]];
      cell.format.autofitColumns();
      await context.sync();
    });

    return;
  }

  private async process() {
    if (this._round > this.roundNum) {
      // finish one game, call main func
      return;
    }

    if (this.getCurrentPlayerOrNull() === null) {
      //current round is finished
      //deal and callback
      (() => {
        this.process();
      })();
    } else {
      this.highLightCell(this._currentPlayer + rowOffset, colOffset);
    }

    return;
  }

  private getCurrentPlayerOrNull() {
    if (this._roundStop) {
      this._currentPlayer = smallBlind;
      this.setRound(this._round + 1);
      this._roundStop = false;
      return null;
    }
    return this._currentPlayer;
  }

  // once the cell is un-highlighted (set the color to no fill)
  private async _formatChangedHandler(args: Excel.WorksheetFormatChangedEventArgs) {
    await Excel.run(async (context) => {
      let nameRange = context.workbook.worksheets.getActiveWorksheet().getRange(args.address);
      // offset = 3 (Action, Call number, Money);
      let valueRange = nameRange.getOffsetRange(0, this._round + 3);
      nameRange.load(["format"]);
      nameRange.format.load("fill");
      valueRange.load('values');
      await context.sync();
      if (nameRange.format.fill.color == "#FFFFFF") {
        let value = parseInt(valueRange.values[0][0]);
        this.afterPlayerAction(value);
      }
    });
    return;
  }

  private async afterPlayerAction(value: number) {
    this._roundStop = await this.checkIsStop(value);
    this._currentPlayer = this.getNextPlayer();

    //this.currentPlayers = get
    if (this.currentPlayers.length < 2) {
      this._round = this.roundNum + 1;
    }

    this.process();
  }

  private async checkIsStop(currentPlayerValue: number) {
    let nextPlayer = this.getNextPlayer();
    let nextPlayerValue = await this.getCellValue(nextPlayer + rowOffset, this._round + colOffset + 3);

    if (currentPlayerValue !== nextPlayerValue) {
      return false;
    }
    if (this._round == 1 && this._currentPlayer == smallBlind) {
      return false;
    }
    return true;
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

  async highLightCell(row, column) {
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

  async getCellValue(row, column) {
    let cellValue;
    await Excel.run(async (context) => {
      let cell = context.workbook.worksheets.getActiveWorksheet().getCell(row, column);
      cell.load("values");
      await context.sync();
      cellValue = parseInt(cell.values[0][0]);
    });
    return cellValue;
  }
}
