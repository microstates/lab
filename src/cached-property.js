import { stable } from 'funcadelic';

export default function CachedProperty(key, reify) {

  let get = stable(object => reify(object));

  let enumerable = true;
  let configurable = true;
  return {
    enumerable,
    configurable,
    get() {
      return get(this);
    }
  };
}
