import { NODE_RADIUS } from '../components/fsm';
import drawText from '../utils/draw-text';
import { append } from 'funcadelic';
import shortid from 'shortid';

export default class Node {
  id = shortid.generate();
  mouseOffsetX = 0;
  mouseOffsetY = 0;
  isAcceptState = false;

  constructor(x, y, text = '') {
    this.x = x;
    this.y = y;
    this.text = text;
  }

  setMouseStart(x, y) {
    return append(this, {
      mouseOffsetX: this.x - x,
      mouseOffsetY: this.y - y
    });
  }

  setCoordinates(x, y) {
    return append(this, {
      x,
      y
    });
  }

  setAnchorPoint(x, y) {
    return append(this, {
      x: x + this.mouseOffsetX,
      y: y + this.mouseOffsetY
    });
  }

  toggleIsAcceptState() {
    return append(this, {
      isAcceptState: !this.isAcceptState
    });
  }

  setText(text) {
    return append(this, {
      text
    });
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
