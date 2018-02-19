import React, { PureComponent } from 'react';
import propTypes from 'prop-types';
import Node from '../models/node';
import Modal from './modal';
import EventListener from 'react-event-listener';
import keyBy from 'lodash.keyby';
import Link from '../models/link';
import { append } from 'funcadelic';

import findIndex from 'ramda/src/findIndex';
import propEq from 'ramda/src/propEq';
import lensPath from 'ramda/src/lensPath';
import set from 'ramda/src/set';
import view from 'ramda/src/view';

import { Stage, Layer, Rect, Text, Circle, Group, Arrow } from 'react-konva';

export const SNAP_TO_PADDING = 6;
export const NODE_RADIUS = 30;
export const HIT_TARGET_PADDING = 6;

function create(Type, props) {
  return append(new Type(), props);
}

function closestPoints(a, b) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let scale = Math.sqrt(dx * dx + dy * dy);
  return [a.x + dx * NODE_RADIUS / scale, a.y + dy * NODE_RADIUS / scale];
}

export default class FSM extends PureComponent {
  static propTypes = {
    width: propTypes.number,
    height: propTypes.number,
    chart: propTypes.shape({
      states: propTypes.array,
      transitions: propTypes.array
    }),
    onChange: propTypes.func
  };

  state = {
    movingObject: false,
    originalClick: null,
    shift: false,
    currentLink: null,
    isCaretVisible: false,
    isNameModalOpen: false,
    name: ''
  };

  get states() {
    return this.props.chart.states;
  }

  get transitions() {
    let { statesById } = this;
    return this.props.chart.transitions.map(link => {
      return append(link, {
        get a() {
          return statesById[link.a];
        },
        get b() {
          return statesById[link.b];
        },
        get points() {
          if (this.a && this.b) {
            return [
              ...closestPoints(this.a, this.b),
              ...closestPoints(this.b, this.a)
            ];
          } else {
            return [];
          }
        }
      });
    });
  }

  get statesById() {
    let { states } = this;
    return keyBy(states, 'id');
  }

  setName = name => {
    this.setState({
      name
    });
  };

  openNameModal = () => {
    this.setState({
      isNameModalOpen: true
    });
  };

  closeNameModal = () => {
    this.setState({
      isNameModalOpen: false
    });
  };

  notify({
    states = this.props.chart.states,
    transitions = this.props.chart.transitions
  }) {
    let { onChange } = this.props;
    if (onChange) {
      onChange({ states, transitions });
    }
  }

  draggingNode = (id, { evt }) => {
    let { states } = this.props.chart;
    let index = findIndex(propEq('id', id), states);
    let lens = lensPath([index]);

    this.notify({
      states: set(
        lens,
        append(view(lens, states), { x: evt.x, y: evt.y }),
        states
      )
    });
  };

  addNewNode = ({ x, y, text }) => {
    let { states } = this.props.chart;
    this.notify({
      states: [...states, create(Node, { x, y, text })]
    });
  };

  updateNodeText = (id, text) => {
    let { states } = this.props.chart;

    let index = findIndex(propEq('id', id), states);
    let lens = lensPath([index]);

    this.notify({
      states: set(lens, append(view(lens, states), { text }), states)
    });
  };

  captureShift = e => e.shiftKey && this.setState({ shift: true });
  releaseShift = e =>
    this.state.shift && this.setState({ shift: false, fromState: null });

  whenShift = (withShift = noop, withoutShift = noop) => {
    return () => {
      if (this.state.shift) {
        withShift();
      } else {
        withoutShift();
      }
    };
  };

  addTransition = id => {
    let { fromState } = this.state;
    if (fromState) {
      let { transitions } = this.props.chart;
      this.notify({
        transitions: [...transitions, create(Link, { a: fromState, b: id })],
        fromState: null,
        shift: false
      });
    } else {
      this.setState({
        fromState: id
      });
    }
  };

  isFromState = id => this.state.fromState === id;

  render() {
    let { width, height } = this.props;
    let {
      draggingNode,
      whenShift,
      addTransition,
      isFromState,
      updateNodeText
    } = this;

    return (
      <EventListener
        target="window"
        onKeyDown={this.captureShift}
        onKeyUp={this.releaseShift}
      >
        <Modal>
          {show => (
            <Stage width={width} height={height}>
              <Layer>
                <Rect
                  fill="#F0F8FF"
                  width={width}
                  height={height}
                  ondblclick={({ evt }) => show(evt).then(this.addNewNode)}
                  onClick={this.clearSelected}
                />
                {this.states.map(({ x, y, text, id }) => {
                  return (
                    <Group
                      x={x}
                      y={y}
                      draggable={true}
                      ondragstart={e => draggingNode(id, e)}
                      ondragmove={e => draggingNode(id, e)}
                      key={id}
                      ondblclick={() =>
                        show({ x, y, text }).then(({ text: nextText }) =>
                          updateNodeText(id, nextText)
                        )
                      }
                    >
                      <Circle
                        radius={NODE_RADIUS}
                        fill={isFromState(id) ? 'blue' : 'white'}
                        stroke="black"
                        strokeWidth={1}
                        onClick={whenShift(() => addTransition(id))}
                      />
                      {text ? <Text text={text} /> : null}
                    </Group>
                  );
                })}
                {this.transitions.map(({ id, points }) => {
                  return (
                    <Arrow
                      key={id}
                      x={0}
                      y={0}
                      points={points}
                      pointerLength={10}
                      pointerWidth={10}
                      fill="black"
                      stroke="black"
                      strokeWidth={4}
                    />
                  );
                })}
              </Layer>
            </Stage>
          )}
        </Modal>
      </EventListener>
    );
  }
}

function noop() {}

// selectObject(x, y) {
//   let { nodes, links } = this.state;

//   return [...nodes, ...links].find(item => item.containsPoint(x, y));
// }

// snapNode(node) {
//   let { nodes } = this.state;

//   for (let i = 0; i < nodes.length; i++) {
//     if (nodes[i] === node) {
//       continue;
//     }

//     // TODO: should append and set state
//     if (Math.abs(node.x - nodes[i].x) < SNAP_TO_PADDING) {
//       node.x = nodes[i].x;
//     }

//     // TODO: should append and set state
//     if (Math.abs(node.y - nodes[i].y) < SNAP_TO_PADDING) {
//       node.y = nodes[i].y;
//     }
//   }
// }

// onMouseDown = e => {
//   let mouse = crossBrowserRelativeMousePos(e);
//   let selectedObject = this.selectObject(mouse.x, mouse.y);

//   let { shift } = this.state;

//   this.setState({
//     selectedObject,
//     movingObject: false,
//     originalClick: mouse
//   });

//   if (selectedObject) {
//     if (shift && selectedObject instanceof Node) {
//       this.setState({
//         currentLink: new SelfLink(selectedObject, mouse)
//       });
//     } else {
//       this.setState({
//         movingObject: true,
//         deltaMouseX: 0,
//         deltaMouseY: 0
//       });
//       if (selectedObject.setMouseStart) {
//         selectedObject.setMouseStart(mouse.x, mouse.y);
//       }
//     }
//   } else if (shift) {
//     this.setState({
//       currentLink: new TemporaryLink(mouse, mouse)
//     });
//   }

//   return true;
// };

// onMouseMove = e => {
//   let mouse = crossBrowserRelativeMousePos(e);

//   let {
//     currentLink,
//     selectedObject,
//     originalClick,
//     movingObject
//   } = this.state;

//   if (currentLink) {
//     let targetNode = this.selectObject(mouse.x, mouse.y);

//     if (!(targetNode instanceof Node)) {
//       targetNode = null;
//     }

//     if (!selectedObject) {
//       if (targetNode) {
//         currentLink = new TemporaryLink(originalClick, mouse);
//       } else {
//         currentLink = new StartLink(targetNode, originalClick);
//       }
//     } else {
//       if (targetNode === selectedObject) {
//         currentLink = new SelfLink(selectedObject, mouse);
//       } else if (targetNode) {
//         currentLink = new Link(selectedObject, targetNode);
//       } else {
//         currentLink = new TemporaryLink(
//           selectedObject.closestPointOnCircle(mouse.x, mouse.y),
//           mouse
//         );
//       }
//     }
//   }

//   if (movingObject) {
//     selectedObject.setAnchorPoint(mouse.x, mouse.y);
//     if (selectedObject instanceof Node) {
//       this.snapNode(selectedObject);
//     }
//   }
// };

// onMouseUp = e => {
//   let { currentLink, links } = this.state;

//   this.setState({
//     movingObject: false
//   });

//   if (currentLink) {
//     if (!(currentLink instanceof TemporaryLink)) {
//       this.setState({
//         selectedObject: currentLink,
//         links: [...links, currentLink]
//       });
//     }
//     this.setState({
//       currentLink: null
//     });
//   }
// };

// onKeyDown = e => {
//   let key = crossBrowserKey(e);
//   let { selectedObject, nodes, links } = this.state;

//   switch (key) {
//     case 16:
//       this.setState({
//         shift: true
//       });
//       return true;
//     case 8:
//       // backspace key
//       if (selectedObject && 'text' in selectedObject) {
//         selectedObject.text = append(selectedObject, {
//           text: selectedObject.text.substr(0, selectedObject.text.length - 1)
//         });
//       }
//       return false;
//     case 46:
//       this.setState({
//         nodes: nodes.filter(node => selectedObject === node),
//         links: links.filter(
//           ({ node, nodeA, nodeB }) =>
//             node !== selectedObject &&
//             nodeA !== selectedObject &&
//             nodeB !== selectedObject
//         ),
//         selectedObject: null
//       });
//       return false;
//     default:
//       return true;
//   }
// };

// onKeyUp = e => {
//   var key = crossBrowserKey(e);

//   if (key === 16) {
//     this.setState({
//       shift: false
//     });
//   }
// };

// onKeyPress = e => {
//   // don't read keystrokes when other things have focus
//   let key = crossBrowserKey(e);
//   let { selectedObject } = this.state;

//   if (
//     key >= 0x20 &&
//     key <= 0x7e &&
//     !e.metaKey &&
//     !e.altKey &&
//     !e.ctrlKey &&
//     selectedObject &&
//     'text' in selectedObject
//   ) {
//     this.setState({
//       selectedObject: append(selectedObject, {
//         text: selectedObject.text + String.fromCharCode(key)
//       })
//     });
//   }
// };

// draw(canvas) {
//   let {
//     selectedObject,
//     nodes,
//     links,
//     currentLink,
//     isCaretVisible
//   } = this.state;

//   let c = canvas.getContext('2d');
//   c.clearRect(0, 0, canvas.width, canvas.height);
//   c.save();
//   // c.translate(0.5, 0.5);

//   [...nodes, ...links].forEach(node => {
//     let isSelected = node === selectedObject;
//     c.lineWidth = 1;
//     c.fillStyle = c.strokeStyle = isSelected ? 'blue' : 'black';
//     node.draw(c, { isSelected, isCaretVisible });
//   });

//   if (currentLink) {
//     c.lineWidth = 1;
//     c.fillStyle = c.strokeStyle = 'black';
//     currentLink.draw(c);
//   }
// }
