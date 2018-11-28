import { append, map } from 'funcadelic';

import CachedProperty from './cached-property';
import { mount, valueOf, root } from './meta';
import { methodsOf } from './reflection';
import create from './create';

export default function MicrostateType(Type, transition) {
  let Microstate = class extends Type {
    static Type = Type;
    static name = `Microstate<${Type.name}>`;

    constructor(value) {
      super(value);
      Object.defineProperties(this, map((slot, key) => {
        return CachedProperty(key, self => {
          let value = valueOf(self);
          let expanded = typeof slot === 'function' ? create(slot, value) : slot;
          let substate = value != null && value[key] != null ? expanded.set(value[key]) : expanded;
          return mount(self, substate, key);
        });
      }, this));

      return root(this, Type, value);
    }
  };

  Object.defineProperties(Microstate.prototype, map((descriptor, name) => {
    return {
      value(...args) {
        return transition(this, name, descriptor.value, ...args);
      }
    };
  }, append({ set: { value: x => x} }, methodsOf(Type))));

  return Microstate;
}
