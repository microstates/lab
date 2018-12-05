import MicrostateType from './microstate-type';
import { At, view, compose, Path } from './lens';
import { typeOf, valueOf, pathOf, link2, AtomOf } from './meta';
import { treemap } from './tree';
import create from './create';

class Id {
  static symbol = Symbol('@id');
  static data = At(Id.symbol);
  static ref = compose(Id.data, At('ref'));
  static value = compose(Id.data, At('value'));
  static Type = compose(Id.data, At('Type'));

  constructor(Type, path, value, ref) {
    this.Type = Type;
    this.path = path;
    this.value = value;
    this.ref = ref;
  }
}

export default function Identity(microstate, fn) {

  let paths = identify(microstate, {});

  return { get, transition };

  function get() {
    return view(Id.ref, paths);
  }

  function transition(Type, name, path, args) {
    let atom = view(Id.value, paths);
    let Root = view(Id.Type, paths);
    let local = link2(create(Type), Type, path, atom, Root, []);
    let next = local[name](...args);
    return paths = identify(next, paths);
  }

  function identify(microstate, pathmap) {
    return treemap(node => {
      let path = pathOf(node);
      let id = view(compose(Path(path), Id.data), pathmap);
      if (id != null && id.Type === typeOf(node) && id.value === valueOf(node)) {
        return id;
      } else {
        return proxy(node, path);
      }
    }, microstate);

    function proxy(microstate, path) {
      let Type = typeOf(microstate);
      let Proxy = MicrostateType(Type, transitionFn, propertyFn);
      Proxy.name = `Id<${Type.name}>`;
      AtomOf.instance(Proxy, { atomOf: () => view(Id.value, paths) });

      let value = valueOf(microstate);

      let ref = link2(new Proxy(value), Type, path, 'polymorphic', view(Id.Type, paths), []);

      return {
        [Id.symbol]: new Id(Type, path, value, ref)
      };
    }
  }

  function transitionFn(object, Type, path, name, method, ...args) {
    return fn(Type, name, path, args);
  }

  function propertyFn(object, Type, path, /* name, currentValue */) {
    let location = compose(Path(path), Id.ref);
    return view(location, paths);
  }
}
