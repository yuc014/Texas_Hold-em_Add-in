import { nanoid } from "nanoid";

export default class Player {
  id: string;
  secret: string;
  name: string;
  ai: boolean;

  constructor(name: string) {
    this.ai = false;
    this.id = nanoid();
    this.secret = nanoid();
    this.name = name;
  }
}
