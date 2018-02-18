import React, { PureComponent } from 'react';
import propTypes from 'prop-types';
import Node from '../models/node';
import Modal from './modal';

import { Stage, Layer, Rect, Text, Circle, Group } from 'react-konva';

export const SNAP_TO_PADDING = 6;
export const NODE_RADIUS = 30;
export const HIT_TARGET_PADDING = 6;

export default class FSM extends PureComponent {
  static propTypes = {
    width: propTypes.number,
    height: propTypes.number,
    chart: propTypes.shape({
      nodes: propTypes.array,
      links: propTypes.array
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

  get nodes() {
    return this.props.chart.nodes;
  }

  get links() {
    return this.props.chart.links;
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

  update({ nodes = this.nodes, links = this.links, ...state }) {
    this.setState(state);
    let { onChange } = this.props;
    if (onChange) {
      onChange({ nodes, links });
    }
  }

  setSelected(node) {
    this.setState({
      selectedObject: node
    });
  }

  afterDraggingNode(node, { evt }) {
    this.update({
      nodes: [
        ...this.nodes.filter(current => current !== node),
        node.setCoordinates(evt.x, evt.y)
      ]
    });
  }

  clearSelected = () => this.setState({ selectedObject: null });

  addNewNode = ({ x, y, text }) => {
    this.update({
      nodes: [...this.nodes, new Node(x, y, text)]
    });
  };

  render() {
    let { width, height } = this.props;

    let { selectedObject } = this.state;

    let isSelected = node => node === selectedObject;

    return (
      <div>
        <Modal>
          {show => (
            <Stage width={width} height={height}>
              <Layer>
                <Rect
                  width={width}
                  height={height}
                  ondblclick={({ evt }) => show(evt).then(this.addNewNode)}
                  onClick={this.clearSelected}
                />
                {this.nodes.map(node => {
                  return (
                    <Group
                      x={node.x}
                      y={node.y}
                      draggable={true}
                      ondragend={e => this.afterDraggingNode(node, e)}
                      key={node.id}
                    >
                      <Circle
                        radius={NODE_RADIUS}
                        fill={isSelected(node) ? 'blue' : 'white'}
                        stroke="black"
                        strokeWidth={1}
                        onClick={() => this.setSelected(node)}
                      />
                      {node.text ? <Text text={node.text} /> : null}
                    </Group>
                  );
                })}
              </Layer>
            </Stage>
          )}
        </Modal>
      </div>
    );
  }
}

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
