import { At, view, set, over, compose, Path } from './lens';

export function root(microstate, Type, value) {
  return link(microstate, new Location(Type, []), value);
}

export function link(microstate, location, atom, owner = location) {
  return set(Meta.data, new Meta(location, atom, owner), microstate);
}

export function mount(microstate, substate, key) {
  return over(Meta.data, meta => meta.mount(microstate, key), substate);
}

export function valueOf(object) {
  let { lens } = view(Meta.location, object);
  if (lens != null) {
    return view(lens, atomOf(object));
  } else {
    return object;
  }
}

export function metaOf(object) {
  return view(Meta.data, object);
}

export function locationOf(microstate) {
  return view(Meta.location, microstate);
}

export function atomOf(microstate) {
  return view(Meta.atom, microstate);
}

export function ownerOf(microstate) {
  return view(Meta.owner, microstate);
}

export function typeOf(microstate) {
  return view(Meta.Type, microstate);
}

export function pathOf(microstate) {
  return view(Meta.path, microstate);
}

export class Meta {
  static symbol = Symbol('Meta');
  static data = At(Meta.symbol);
  static location = compose(Meta.data, At("location"));
  static atom = compose(Meta.data, At("atom"));
  static owner = compose(Meta.data, At("owner"));
  static Type = compose(Meta.location, At("Type"));
  static path = compose(Meta.location, At("path"));

  constructor(location, atom, owner) {
    this.location = location;
    this.atom = atom;
    this.owner = owner;
  }

  mount(onto, atKey) {
    let location = new Location(this.location.Type, pathOf(onto).concat(atKey));
    return new Meta(location, atomOf(onto), ownerOf(onto));
  }
}

export function location(Type, path) {
  return new Location(Type, path);
}

class Location {
  constructor(Type, path) {
    this.Type = Type;
    this.path =  path;
  }

  get lens() {
    return Path(this.path);
  }
}
