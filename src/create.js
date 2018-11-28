import { set } from './lens';
import { link, locationOf, metaOf, atomOf, ownerOf } from './meta';
import MicrostateType from './microstate-type';

export default function create(Type, value) {
  let Microstate = MicrostateType(Type, transition);
  return new Microstate(value);
}

function transition(microstate, name, method, ...args) {

  //location of the owner of this transition.
  let owner = ownerOf(microstate);

  //in the context of the transition, the owner will be the same as the microstate.
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
