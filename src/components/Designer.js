import React, { PureComponent } from 'react';
import propTypes from 'prop-types';
import State from '../models/state';
import NameInput from './NameInput';
import EventListener from 'react-event-listener';
import keyBy from 'lodash.keyby';
import Transition from '../models/transition';
import { append } from 'funcadelic';

import findIndex from 'ramda/src/findIndex';
import propEq from 'ramda/src/propEq';
import lensPath from 'ramda/src/lensPath';
import set from 'ramda/src/set';
import view from 'ramda/src/view';

import { Stage, Layer, Rect, Text, Group, Arrow } from 'react-konva';

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

export default class Designer extends PureComponent {
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
    isNameInputOpen: false,
    nameInputValue: '',
    nameInputType: null
  };

  get states() {
    return this.props.chart.states;
  }

  get transitions() {
    let { statesById } = this;
    return this.props.chart.transitions.map(link => {
      return append(create(Transition, link), {
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

  get transitionsById() {
    let { transitions } = this;
    return keyBy(transitions, 'id');
  }

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

  addNewNode = ({ x, y }) => {
    let { states } = this.props.chart;
    let state = create(State, { x, y });
    this.notify({
      states: [...states, state]
    });
    this.showNameInput('states', state);
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
      let link = create(Transition, { a: fromState, b: id });
      this.notify({
        transitions: [...transitions, link]
      });
      this.showNameInput('transitions', link);
      this.releaseShift();
    } else {
      this.setState({
        fromState: id
      });
    }
  };

  showNameInput = (type, { id, text = '' }) => {
    this.setState({
      nameInputId: id,
      nameInputValue: text,
      nameInputType: type,
      isNameInputOpen: true
    });
  };

  changeNameInputValue = nameInputValue => this.setState({ nameInputValue });

  clearNodeNameInput = () =>
    this.setState({
      nameInputId: null,
      nameInputValue: '',
      isNameInputOpen: false,
      nameInputType: null
    });

  saveNodeNameInput = () => {
    let { nameInputType, nameInputId, nameInputValue } = this.state;

    let destination = this.props.chart[nameInputType];

    let index = findIndex(propEq('id', nameInputId), destination);
    let lens = lensPath([index]);

    this.notify({
      [nameInputType]: set(
        lens,
        append(view(lens, destination), { text: nameInputValue }),
        destination
      )
    });

    this.clearNodeNameInput();
  };

  closeNameInput = () => this.setState({ isNameInputOpen: false });

  isFromState = id => this.state.fromState === id;

  render() {
    let { width, height } = this.props;
    let {
      draggingNode,
      whenShift,
      addTransition,
      isFromState,
      addNewNode,
      changeNameInputValue,
      clearNodeNameInput,
      saveNodeNameInput,
      showNameInput
    } = this;

    let { nameInputValue, nameInputType, nameInputId } = this.state;

    return (
      <EventListener target="window" onKeyDown={this.captureShift}>
        <Stage width={width} height={height}>
          <Layer>
            <Rect
              fill="#F0F8FF"
              width={width}
              height={height}
              ondblclick={({ evt }) => addNewNode({ x: evt.x, y: evt.y })}
            />
            {this.states.map(node => {
              let rect;
              return (
                <Group
                  x={node.x}
                  y={node.y}
                  draggable={true}
                  ondragstart={e => draggingNode(node.id, e)}
                  ondragmove={e => draggingNode(node.id, e)}
                  key={node.id}
                  ondblclick={() => showNameInput('states', node)}
                >
                  <Rect
                    ref={_rect => (rect = _rect)}
                    cornerRadius={5}
                    fill={isFromState(node.id) ? 'blue' : 'white'}
                    stroke="black"
                    strokeWidth={1}
                    onClick={whenShift(() => addTransition(node.id))}
                  />
                  {node.text ? (
                    <Text
                      text={node.text}
                      align="center"
                      ref={text => {
                        if (text) {
                          let th = text.getHeight();
                          let tw = text.getWidth();
                          text.setOffset({
                            x: tw / 2,
                            y: th / 2
                          });
                          if (rect) {
                            let lh = th + 20;
                            let lw = tw + 40;
                            rect.width(lw);
                            rect.height(lh);
                            rect.setOffset({
                              x: lw / 2,
                              y: lh / 2
                            });
                          }
                        }
                      }}
                    />
                  ) : null}
                </Group>
              );
            })}
            {this.transitions.map(node => {
              let { x, y } = node.center;
              return (
                <Group key={node.id}>
                  <Arrow
                    points={node.points}
                    pointerLength={10}
                    pointerWidth={10}
                    fill="black"
                    stroke="black"
                    strokeWidth={1}
                  />
                  {node.text ? (
                    <Text
                      text={node.text}
                      x={x}
                      y={y}
                      ondblclick={() =>
                        showNameInput('transitions', {
                          x,
                          y,
                          id: node.id,
                          text: node.text
                        })
                      }
                      ref={ref =>
                        ref &&
                        ref.setOffset({
                          x: ref.getWidth() / 2,
                          y: ref.getHeight()
                        })
                      }
                    />
                  ) : null}
                </Group>
              );
            })}
          </Layer>
        </Stage>
        {this.state.isNameInputOpen && (
          <NameInput
            position={
              nameInputType === 'states'
                ? this.statesById[nameInputId]
                : this.transitionsById[nameInputId].center
            }
            onChange={changeNameInputValue}
            onAbandon={clearNodeNameInput}
            onSave={saveNodeNameInput}
            value={nameInputValue}
          />
        )}
      </EventListener>
    );
  }
}

function noop() {}
