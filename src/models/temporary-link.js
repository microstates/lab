import drawArrow from '../utils/draw-arrow';

class TemporaryLink {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }

  draw(c) {
    // draw the line
    c.beginPath();
    c.moveTo(this.to.x, this.to.y);
    c.lineTo(this.from.x, this.from.y);
    c.stroke();

    // draw the head of the arrow
    drawArrow(
      c,
      this.to.x,
      this.to.y,
      Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x)
    );
  }
}

export default TemporaryLink;
