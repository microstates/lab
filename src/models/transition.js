import shortid from 'shortid';

export default class Transition {
  id = shortid.generate();
  text = '';

  get center() {
    return { x: (this.a.x + this.b.x) / 2, y: (this.a.y + this.b.y) / 2 };
  }

  get angle() {
    return Math.atan2(this.b.x - this.a.x, this.a.y - this.b.y);
  }
}
