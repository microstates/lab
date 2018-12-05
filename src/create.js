import { set } from './lens';
import { link, mount, locationOf, metaOf, atomOf, ownerOf, valueOf } from './meta';
import MicrostateType from './microstate-type';

export default function create(Type, value) {
  let Microstate = MicrostateType(Type, transition, property);
  // return root(Type, value, () => new Microstate(value))
  return new Microstate(value);
}

function transition(microstate, Type, path, name, method, ...args) {
  let owner = ownerOf(microstate);
  let context = link(microstate, locationOf(microstate), atomOf(microstate));
  let result = method.apply(context, args);

  function patch() {
    if (metaOf(result)) {
      return atomOf(result);
    } else {
      let { lens } = locationOf(microstate);
      return set(lens, result, atomOf(microstate));
    }
  }

  return link(create(owner.Type), owner, patch());
}

export function property(microstate, slot, key) {
  let value = valueOf(microstate);
  let expanded = typeof slot === 'function' ? create(slot, value) : slot;
  let substate = value != null && value[key] != null ? expanded.set(value[key]) : expanded;
  return mount(microstate, substate, key);
}
