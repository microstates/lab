import { NODE_RADIUS } from '../components/fsm';
import drawText from '../utils/draw-text';

export default class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.mouseOffsetX = 0;
    this.mouseOffsetY = 0;
    this.isAcceptState = false;
    this.text = '';
  }

  setMouseStart(x, y) {
    this.mouseOffsetX = this.x - x;
    this.mouseOffsetY = this.y - y;
  }

  setAnchorPoint(x, y) {
    this.x = x + this.mouseOffsetX;
    this.y = y + this.mouseOffsetY;
  }

  draw(c, options) {
    // draw the circle
    c.beginPath();
    c.arc(this.x, this.y, NODE_RADIUS, 0, 2 * Math.PI, false);
    c.stroke();

    // draw the text
    drawText(c, this.text, this.x, this.y, null, options);

    // draw a double circle for an accept state
    if (this.isAcceptState) {
      c.beginPath();
      c.arc(this.x, this.y, NODE_RADIUS - 6, 0, 2 * Math.PI, false);
      c.stroke();
    }
  }

  closestPointOnCircle(x, y) {
    let dx = x - this.x;
    let dy = y - this.y;
    let scale = Math.sqrt(dx * dx + dy * dy);
    return {
      x: this.x + dx * NODE_RADIUS / scale,
      y: this.y + dy * NODE_RADIUS / scale
    };
  }

  containsPoint(x, y) {
    return (
      (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) <
      NODE_RADIUS * NODE_RADIUS
    );
  }
}
