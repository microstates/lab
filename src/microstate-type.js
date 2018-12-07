import { append, map } from 'funcadelic';

import CachedProperty from './cached-property';
import { root, pathOf } from './meta';
import { methodsOf } from './reflection';

export default function MicrostateType(Type, transitionFn, propertyFn) {
  let Microstate = class extends Type {
    static Type = Type;
    static name = `Microstate<${Type.name}>`;

    constructor(value) {
      super(value);
      Object.defineProperties(this, map((slot, key) => {
        return CachedProperty(key, self => propertyFn(self, Type, pathOf(self), key, slot));
      }, this));
      return root(this, Type, value);
    }
  };

  Object.defineProperties(Microstate.prototype, map((descriptor, name) => {
    return {
      value(...args) {
        return transitionFn(this, Type, pathOf(this), name, descriptor.value, ...args);
      }
    };
  }, append({ set: { value: x => x} }, methodsOf(Type))));
  return Microstate;
}
