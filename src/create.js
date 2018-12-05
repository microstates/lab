import { set } from './lens';
import { link, mount, locationOf, metaOf, atomOf, ownerOf, valueOf } from './meta';
import MicrostateType from './microstate-type';

export default function create(Type, value) {
  let Microstate = MicrostateType(Type, transition, property);
  return new Microstate(value);
}

function transition(object, Type, path, name, method, ...args) {
  let owner = ownerOf(object);
  let context = link(object, Type, path, atomOf(object));
  let result = method.apply(context, args);

  function patch() {
    if (metaOf(result)) {
      return atomOf(result);
    } else {
      let { lens } = locationOf(object);
      return set(lens, result, atomOf(object));
    }
  }
  return link(create(owner.Type), owner.Type, owner.path, patch());
}

function property(object, Type, path, name, currentValue) {
  let value = valueOf(object);
  let expanded = typeof currentValue === 'function' ? create(currentValue, value) : currentValue;
  let substate = value != null && value[name] != null ? expanded.set(value[name]) : expanded;
  return mount(object, substate, name);
}
