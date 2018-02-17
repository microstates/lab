import React, { Component } from 'react';
import Link from '../models/link';
import Node from '../models/node';
import SelfLink from '../models/self-link';
import StartLink from '../models/start-link';
import TemporaryLink from '../models/temporary-link';
import { append } from 'funcadelic';

export const SNAP_TO_PADDING = 6;
export const NODE_RADIUS = 30;
export const HIT_TARGET_PADDING = 6;

export default class FSM extends Component {
  state = {
    nodes: [],
    links: [],
    movingObject: false,
    originalClick: null,
    shift: false,
    currentLink: null,
    isCaretVisible: false
  };

  resetCaret() {
    clearInterval(this.caretTimer);

    this.caretTimer = setInterval(
      () =>
        this.setState({
          isCaretVisible: !this.state.isCaretVisible
        }),
      500
    );

    this.setState({
      isCaretVisible: true
    });
  }

  selectObject(x, y) {
    let { nodes, links } = this.state;

    return [...nodes, ...links].find(item => item.containsPoint(x, y));
  }

  snapNode(node) {
    let { nodes } = this.state;

    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i] === node) {
        continue;
      }

      // TODO: should append and set state
      if (Math.abs(node.x - nodes[i].x) < SNAP_TO_PADDING) {
        node.x = nodes[i].x;
      }

      // TODO: should append and set state
      if (Math.abs(node.y - nodes[i].y) < SNAP_TO_PADDING) {
        node.y = nodes[i].y;
      }
    }
  }

  onMouseDown = e => {
    let mouse = crossBrowserRelativeMousePos(e);
    let selectedObject = this.selectObject(mouse.x, mouse.y);

    let { shift } = this.state;

    this.setState({
      selectedObject,
      movingObject: false,
      originalClick: mouse
    });

    if (selectedObject) {
      if (shift && selectedObject instanceof Node) {
        this.setState({
          currentLink: new SelfLink(selectedObject, mouse)
        });
      } else {
        this.setState({
          movingObject: true,
          deltaMouseX: 0,
          deltaMouseY: 0
        });
        if (selectedObject.setMouseStart) {
          selectedObject.setMouseStart(mouse.x, mouse.y);
        }
      }
      this.resetCaret();
    } else if (shift) {
      this.setState({
        currentLink: new TemporaryLink(mouse, mouse)
      });
    }

    return true;
  };

  onDoubleClick = e => {
    let mouse = crossBrowserRelativeMousePos(e);
    let selectedObject = this.selectObject(mouse.x, mouse.y);

    this.setState({
      selectedObject
    });

    let { nodes } = this.state;

    if (!selectedObject) {
      selectedObject = new Node(mouse.x, mouse.y);

      this.setState({
        nodes: [...nodes, selectedObject]
      });

      this.resetCaret();
    } else if (selectedObject instanceof Node) {
      this.setState({
        selectedObject: append(selectedObject, {
          isAcceptState: !selectedObject.isAcceptState
        })
      });
    }
  };

  onMouseMove = e => {
    let mouse = crossBrowserRelativeMousePos(e);

    let {
      currentLink,
      selectedObject,
      originalClick,
      movingObject
    } = this.state;

    if (currentLink) {
      let targetNode = this.selectObject(mouse.x, mouse.y);

      if (!(targetNode instanceof Node)) {
        targetNode = null;
      }

      if (!selectedObject) {
        if (targetNode) {
          currentLink = new TemporaryLink(originalClick, mouse);
        } else {
          currentLink = new StartLink(targetNode, originalClick);
        }
      } else {
        if (targetNode === selectedObject) {
          currentLink = new SelfLink(selectedObject, mouse);
        } else if (targetNode) {
          currentLink = new Link(selectedObject, targetNode);
        } else {
          currentLink = new TemporaryLink(
            selectedObject.closestPointOnCircle(mouse.x, mouse.y),
            mouse
          );
        }
      }
    }

    if (movingObject) {
      selectedObject.setAnchorPoint(mouse.x, mouse.y);
      if (selectedObject instanceof Node) {
        this.snapNode(selectedObject);
      }
    }
  };

  onMouseUp = e => {
    let { currentLink, links } = this.state;

    this.setState({
      movingObject: false
    });

    if (currentLink) {
      if (!(currentLink instanceof TemporaryLink)) {
        this.setState({
          selectedObject: currentLink,
          links: [...links, currentLink]
        });
        this.resetCaret();
      }
      this.setState({
        currentLink: null
      });
    }
  };

  onKeyDown = e => {
    let key = crossBrowserKey(e);
    let { selectedObject, nodes, links } = this.state;

    switch (key) {
      case 16:
        this.setState({
          shift: true
        });
        return true;
      case 8:
        // backspace key
        if (selectedObject && 'text' in selectedObject) {
          selectedObject.text = append(selectedObject, {
            text: selectedObject.text.substr(0, selectedObject.text.length - 1)
          });
          this.resetCaret();
        }
        return false;
      case 46:
        this.setState({
          nodes: nodes.filter(node => selectedObject === node),
          links: links.filter(
            ({ node, nodeA, nodeB }) =>
              node !== selectedObject &&
              nodeA !== selectedObject &&
              nodeB !== selectedObject
          ),
          selectedObject: null
        });
        return false;
      default:
        return true;
    }
  };

  onKeyUp = e => {
    var key = crossBrowserKey(e);

    if (key === 16) {
      this.setState({
        shift: false
      });
    }
  };

  onKeyPress = e => {
    // don't read keystrokes when other things have focus
    let key = crossBrowserKey(e);
    let { selectedObject } = this.state;

    if (
      key >= 0x20 &&
      key <= 0x7e &&
      !e.metaKey &&
      !e.altKey &&
      !e.ctrlKey &&
      selectedObject &&
      'text' in selectedObject
    ) {
      this.setState({
        selectedObject: append(selectedObject, {
          text: selectedObject.text + String.fromCharCode(key)
        })
      });
      this.resetCaret();
    }
  };

  draw(canvas) {
    let {
      selectedObject,
      nodes,
      links,
      currentLink,
      isCaretVisible
    } = this.state;

    let c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    // c.translate(0.5, 0.5);

    [...nodes, ...links].forEach(node => {
      let isSelected = node === selectedObject;
      c.lineWidth = 1;
      c.fillStyle = c.strokeStyle = isSelected ? 'blue' : 'black';
      node.draw(c, { isSelected, isCaretVisible });
    });

    if (currentLink) {
      c.lineWidth = 1;
      c.fillStyle = c.strokeStyle = 'black';
      currentLink.draw(c);
    }
  }

  componentDidMount() {
    this.draw(this.canvas);
  }

  componentWillUpdate() {
    this.draw(this.canvas);
  }

  render() {
    let { width, height } = this.props;

    return (
      <canvas
        height={height}
        width={width}
        ref={canvas => (this.canvas = canvas)}
        onKeyDown={this.onKeyDown}
        onKeyPress={this.onKeyPress}
        onKeyUp={this.onKeyUp}
        onMouseDown={this.onMouseDown}
        onDoubleClick={this.onDoubleClick}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
      />
    );
  }
}

function crossBrowserKey(e) {
  e = e || window.event;
  return e.which || e.keyCode;
}

function crossBrowserElementPos(e) {
  e = e || window.event;
  var obj = e.target || e.srcElement;
  var x = 0,
    y = 0;
  while (obj.offsetParent) {
    x += obj.offsetLeft;
    y += obj.offsetTop;
    obj = obj.offsetParent;
  }
  return { x: x, y: y };
}

function crossBrowserMousePos(e) {
  e = e || window.event;
  return {
    x:
      e.pageX ||
      e.clientX +
        document.body.scrollLeft +
        document.documentElement.scrollLeft,
    y:
      e.pageY ||
      e.clientY + document.body.scrollTop + document.documentElement.scrollTop
  };
}

function crossBrowserRelativeMousePos(e) {
  var element = crossBrowserElementPos(e);
  var mouse = crossBrowserMousePos(e);
  return {
    x: mouse.x - element.x,
    y: mouse.y - element.y
  };
}
