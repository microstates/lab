import { type } from 'funcadelic';

import { At, view, set, compose, Path } from './lens';

export function root(microstate, Type, value) {
  return set(Meta.data, new Meta(new Location(Type, []), value), microstate);
}

export function link(object, Type, path, atom, Owner = Type, ownerPath = path) {
  return set(Meta.data, new Meta(new Location(Type, path), atom, new Location(Owner, ownerPath)), object);
}

export function valueOf(object) {
  let location = view(Meta.location, object);
  if (location != null) {
    return view(location.lens, atomOf(object));
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

export function ownerOf(microstate) {
  return view(Meta.owner, microstate);
}

export function typeOf(microstate) {
  return view(Meta.Type, microstate);
}

export function pathOf(microstate) {
  return view(Meta.path, microstate) || [];
}

export class Meta {
  static symbol = Symbol('Meta');
  static data = At(Meta.symbol);
  static location = compose(Meta.data, At("location"));
  static atom = compose(Meta.data, At("atom"));
  static owner = compose(Meta.data, At("owner"));
  static Type = compose(Meta.location, At("Type"));
  static path = compose(Meta.location, At("path"));

  constructor(location, atom, owner = location) {
    this.atom = atom;
    this.location = location;
    this.owner = owner;
  }
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

export const AtomOf = type(class AtomOf {
  atomOf(object) {
    return this(object).atomOf(object);
  }
});

AtomOf.instance(Object, {
  atomOf(object) {
    return view(Meta.atom, object);
  }
});

export const { atomOf } = AtomOf.prototype;
