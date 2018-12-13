import { view, set } from './lens';
import { Meta, atomOf } from './meta';

export default function transaction(...args) {
  return new Transaction(...args);
}

/**
 * This strict monadic API is awkward to work with, but it does guarante that
 * everything will be respected.
 */

class Transaction {

  constructor(subject, ...members) {
    this.atom = atomOf(subject);
    this.subject = prune(subject);
    this.members = members.map(member => set(Meta.atom, this.atom, prune(member)));
    return set(Meta.atom, this.atom, this);
  }

  flatMap(fn) {
    let result = fn(this);
    if (result instanceof Transaction) {
      return result;
    } else {
      throw new Error('in Transaction#flatMap(fn), `fn` should return a Transaction, but returned a ' + result);
    }
  }

  log(...msgs) {
    console.log(...msgs, JSON.stringify(atomOf(this), null, 2));
    return this;
  }

  *[Symbol.iterator]() {
    yield* [this.subject].concat(this.members);
  }
}

function prune(object) {
  return set(Meta.owner, view(Meta.location, object), object);
}
