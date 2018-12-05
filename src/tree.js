import { append, type } from 'funcadelic';
import { metaOf } from './meta';

export const Tree = type(class Tree {
  visit(object) {
    let visit = this(object).visit || (node => metaOf(node) != null);
    return visit(object);
  }

  treemap(fn, object) {
    if (visit(object)) {
      return this(object).treemap(fn, object);
    } else {
      return object;
    }
  }
});

export const { visit, treemap } = Tree.prototype;

Tree.instance(Object, {
  treemap(fn, object) {
    let next = fn(object);
    let keys = Object.keys(object);
    if (next === object || keys.length === 0) {
      return next;
    } else {
      return append(next, keys.reduce((properties, key) => {
        return append(properties, {
          get [key]() {
            return treemap(fn, object[key]);
          }
        });
      }, {}));
    }
  }
});
