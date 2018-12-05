import expect from 'expect';

import { create, Identity, valueOf } from '../index';


class Str {
  get state() {
    return valueOf(this);
  }
}

class Person {
  firstName = Str;
  lastName = Str;
}

describe('identity', function() {
  let t;
  let id;
  let initial;
  let initialFirstName;
  let initialLastName;
  let value = { firstName: "Charles", lastName: "Lowell" };
  beforeEach(function() {
    id = Identity(create(Person, value), (...args) => t = args);
    initial = id.get();
    initialFirstName = initial.firstName;
    initialLastName = initial.lastName;
  });

  it('is an instance of Person', () => {
    expect(initial).toBeInstanceOf(Person);
    expect(initial.firstName).toBeInstanceOf(Str);
  });

  it('has the right properties', function() {
    expect(valueOf(initial)).toBe(value);
    expect(initial.firstName.state).toEqual('Charles');
    expect(initial.lastName.state).toEqual('Lowell');
  });

  describe('invoking a transition', function() {
    beforeEach(()=> {
      id.get().firstName.set('Carlos');
    });
    it('invokes the transition callback to capture the location of the the transition', ()=> {
      expect(t).toEqual([Str, 'set', ['firstName'], ['Carlos']]);
    });
    it('does not actually perform the transition yet', ()=> {
      expect(id.get()).toBe(initial);
    });

    describe('calling the id.transition function with the supplied arguments ', ()=> {
      beforeEach(()=> {
        id.transition(...t);
      });
      it('updates the root reference to a new instance of the same type', ()=> {
        expect(initial).toBeInstanceOf(Person);
        expect(id.get()).not.toBe(initial);
      });
      it('changes the child node that changed, but not the child node that did not', () => {
        expect(id.get().firstName).not.toBe(initialFirstName);
        expect(id.get().lastName).not.toBe(initialLastName);
      });
    });
  });
});
