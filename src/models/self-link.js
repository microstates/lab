import { NODE_RADIUS, HIT_TARGET_PADDING } from '../components/fsm';
import drawArrow from '../utils/draw-arrow';
import drawText from '../utils/draw-text';

export default class SelfLink {
  constructor(node, mouse) {
    this.node = node;
    this.anchorAngle = 0;
    this.mouseOffsetAngle = 0;
    this.text = '';

    if (mouse) {
      this.setAnchorPoint(mouse.x, mouse.y);
    }
  }

  setMouseStart(x, y) {
    this.mouseOffsetAngle =
      this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
  }

  setAnchorPoint(x, y) {
    this.anchorAngle =
      Math.atan2(y - this.node.y, x - this.node.x) + this.mouseOffsetAngle;
    // snap to 90 degrees
    var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
    if (Math.abs(this.anchorAngle - snap) < 0.1) {
      this.anchorAngle = snap;
    }
    // keep in the range -pi to pi so our containsPoint() function always works
    if (this.anchorAngle < -Math.PI) {
      this.anchorAngle += 2 * Math.PI;
    }
    if (this.anchorAngle > Math.PI) {
      this.anchorAngle -= 2 * Math.PI;
    }
  }

  getEndPointsAndCircle() {
    var circleX = this.node.x + 1.5 * NODE_RADIUS * Math.cos(this.anchorAngle);
    var circleY = this.node.y + 1.5 * NODE_RADIUS * Math.sin(this.anchorAngle);
    var circleRadius = 0.75 * NODE_RADIUS;
    var startAngle = this.anchorAngle - Math.PI * 0.8;
    var endAngle = this.anchorAngle + Math.PI * 0.8;
    var startX = circleX + circleRadius * Math.cos(startAngle);
    var startY = circleY + circleRadius * Math.sin(startAngle);
    var endX = circleX + circleRadius * Math.cos(endAngle);
    var endY = circleY + circleRadius * Math.sin(endAngle);
    return {
      hasCircle: true,
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      startAngle: startAngle,
      endAngle: endAngle,
      circleX: circleX,
      circleY: circleY,
      circleRadius: circleRadius
    };
  }

  draw(c, options) {
    var stuff = this.getEndPointsAndCircle();
    // draw arc
    c.beginPath();
    c.arc(
      stuff.circleX,
      stuff.circleY,
      stuff.circleRadius,
      stuff.startAngle,
      stuff.endAngle,
      false
    );
    c.stroke();
    // draw the text on the loop farthest from the node
    var textX = stuff.circleX + stuff.circleRadius * Math.cos(this.anchorAngle);
    var textY = stuff.circleY + stuff.circleRadius * Math.sin(this.anchorAngle);
    drawText(c, this.text, textX, textY, this.anchorAngle, options);
    // draw the head of the arrow
    drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle + Math.PI * 0.4);
  }

  containsPoint(x, y) {
    var stuff = this.getEndPointsAndCircle();
    var dx = x - stuff.circleX;
    var dy = y - stuff.circleY;
    var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
    return Math.abs(distance) < HIT_TARGET_PADDING;
  }
}
