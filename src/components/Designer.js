import React, { PureComponent } from 'react';
import propTypes from 'prop-types';
import NameInput from './NameInput';
import EventListener from 'react-event-listener';
import keyBy from 'lodash.keyby';
import joint from 'jointjs';

import { append } from 'funcadelic';

import findIndex from 'ramda/src/findIndex';
import propEq from 'ramda/src/propEq';
import lensPath from 'ramda/src/lensPath';
import set from 'ramda/src/set';
import view from 'ramda/src/view';
import camelCase from 'lodash.camelcase';

import { Stage, Layer, Rect, Text, Group, Arrow } from 'react-konva';

import Transition from '../models/transition';
import State from '../models/state';

export const SNAP_TO_PADDING = 6;
export const NODE_RADIUS = 30;
export const HIT_TARGET_PADDING = 6;

function create(Type, props) {
  return append(new Type(), props);
}

function linePoints(a, b) {
  let aRect = joint.g.rect(a);
  let bRect = joint.g.rect(b);

  let abPoint = aRect.intersectionWithLineFromCenterToPoint(b);
  let baPoint = bRect.intersectionWithLineFromCenterToPoint(a);

  if (abPoint && baPoint) {
    let { x: xa, y: ya } = aRect.intersectionWithLineFromCenterToPoint(b);
    let { x: xb, y: yb } = bRect.intersectionWithLineFromCenterToPoint(a);

    return [xa, ya, xb, yb];
  } else {
    return null;
  }
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
    shift: false,
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
    this.showNameInput('states', state).catch(() =>
      this.notify({
        states: states.filter(node => state.id !== node.id)
      })
    );
  };

  captureKeys = e => {
    let { fromState } = this.state;
    if (e.shiftKey) {
      this.setState({ shift: true });
    } else if (e.keyCode === 27 && fromState) {
      this.setState({ fromState: null });
    }
  };

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

      let exists = transitions.find(
        node => node.a === fromState && node.b === id
      );
      if (!exists) {
        let transition = create(Transition, { a: fromState, b: id });
        this.notify({
          transitions: [...transitions, transition]
        });
        this.releaseShift();
        this.showNameInput('transitions', transition).catch(() => {
          this.notify({
            transitions: transitions.filter(node => transition.id !== node.id)
          });
        });
      }
    } else {
      this.setState({
        fromState: id
      });
    }
  };

  showNameInput = (type, node) => {
    return new Promise((resolve, reject) => {
      this.setState({
        nameInputId: node.id,
        nameInputValue: node.text,
        nameInputType: type,
        isNameInputOpen: true,
        onSave: () => resolve(node),
        onAbandon: reject
      });
    })
      .then(() => {
        let { nameInputType, nameInputId, nameInputValue } = this.state;

        if (!nameInputValue) {
          throw new Error("Name can't be empty");
        }

        let text = camelCase(nameInputValue);
        if (type === 'states') {
          text = text.charAt(0).toUpperCase() + text.slice(1);
        }

        let destination = this.props.chart[nameInputType];

        let index = findIndex(propEq('id', nameInputId), destination);
        let lens = lensPath([index]);

        this.notify({
          [nameInputType]: set(
            lens,
            append(view(lens, destination), { text }),
            destination
          )
        });
      })
      .finally(() =>
        this.setState({
          nameInputId: null,
          nameInputValue: '',
          isNameInputOpen: false,
          nameInputType: null,
          onSave: null,
          onAbandon: null
        })
      );
  };

  changeNameInputValue = nameInputValue => this.setState({ nameInputValue });

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
      showNameInput
    } = this;

    let {
      nameInputValue,
      nameInputType,
      nameInputId,
      onAbandon,
      onSave
    } = this.state;

    let layer;

    return (
      <EventListener target="window" onKeyDown={this.captureKeys}>
        <Stage width={width} height={height}>
          <Layer ref={_layer => (layer = _layer)}>
            <Rect
              fill="#EFF2F9"
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
                    name={node.id}
                    ref={_rect => (rect = _rect)}
                    cornerRadius={5}
                    fill={isFromState(node.id) ? '#E1E9F4' : 'white'}
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
                          let th = text.height();
                          let tw = text.width();

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
                    name={node.id}
                    points={node.points}
                    pointerLength={10}
                    pointerWidth={10}
                    fill="black"
                    stroke="black"
                    strokeWidth={1}
                  />
                  {node.text ? (
                    <Text
                      name={`${node.id}-text`}
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
                      ref={ref => {
                        if (layer) {
                          /**
                           * calculating where the transition line should touch the node.
                           * since height and width of the nodes is calculated at run time,
                           * we need to measure the containers to calculate the points for
                           * the transition.
                           */
                          let aClientRect = layer
                            .findOne(`.${node.a.id}`)
                            .getClientRect();
                          let bClientRect = layer
                            .findOne(`.${node.b.id}`)
                            .getClientRect();
                          let points = linePoints(aClientRect, bClientRect);
                          if (points) {
                            let arrow = layer.findOne(`.${node.id}`);
                            arrow.setAttrs({ points });
                            let text = layer.findOne(`.${node.id}-text`);
                            if (text) {
                              let [xa, ya, xb, yb] = points;
                              let angle =
                                Math.atan2(xb - xa, ya - yb) * 180 / Math.PI -
                                90;
                              text.rotation(angle);
                              text.setOffset({
                                x: text.width() / 2,
                                y: text.height() + 3
                              });
                            }
                          }
                        }
                      }}
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
            onAbandon={onAbandon}
            onSave={onSave}
            value={nameInputValue}
          />
        )}
      </EventListener>
    );
  }
}

function noop() {}
