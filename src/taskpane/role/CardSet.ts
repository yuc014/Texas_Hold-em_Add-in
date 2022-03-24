export class CardSet {
  private _cards;
  private _cardPointer;
  private _cardNumber = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  private _cardColor = ["♠", "♥", "♣", "■"];

  public deal() {
    let card = this._cards[this._cardPointer++];
    return this._cardColor[card[1]] + this._cardNumber[card[0]];
  }

  public shuffle() {
    for (let i = 51; i >= 0; i--) {
      let random = Math.floor(Math.random() * i);
      let temp = this._cards[random];
      this._cards[random] = this._cards[i];
      this._cards[i] = temp;
    }
  }

  public initCardSet() {
    this._cardPointer = 0;
    this._cards = [];
    let count = 0;
    for (let i = 0; i < 13; i++) {
      for (let j = 0; j < 4; j++) {
        this._cards[count++] = [i, j];
      }
    }
  }
}
