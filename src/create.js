import { set } from './lens';
import { link, locationOf, metaOf, atomOf, ownerOf, typeOf } from './meta';
import MicrostateType from './microstate-type';
import Relationship from './relationship';

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

function property(object, Type, path, name, relationship) {
  let { resolve } = (relationship instanceof Relationship ? relationship : Child(relationship));
  let target = resolve(object, Type, path, name);
  let owner = ownerOf(object);
  return link(create(target.Type), target.Type, target.path, atomOf(object), owner.Type, owner.path);
}

function Child(spec) {
  return new Relationship(resolve);

  function resolve(origin, originType, path, name) {
    let Type = typeof spec === 'function' ? spec : typeOf(spec);
    return { Type, path: path.concat(name) };
  }
}
