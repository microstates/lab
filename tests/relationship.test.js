import expect from 'expect';
import Relationship from '../src/relationship';
import { valueOf } from '../src/meta';
import create from '../src/create';

describe('abstract relationships', ()=> {
  class A {
    b = class B {
      c = class C {
        a = root(A);
      }
    }
  }

  function root(Type) {
    return new Relationship(() => ({ Type, path: []}));
  }

  let a;
  let atom;

  beforeEach(()=> {
    atom = { b: { c: 'Hallo' } };
    a = create(A, atom);
  });


  it('allows perfectly circular data structures', ()=> {
    expect(valueOf(a.b.c.a)).toBe(valueOf(a));
    expect(valueOf(a.b.c.a.b.c.a)).toBe(valueOf(a));
    expect(valueOf(a.b.c.a.b.c.a.b.c.a)).toBe(valueOf(a));
    expect(valueOf(a.b.c.a.b.c.a.b.c.a.b.c.a)).toBe(valueOf(a));
  });

  describe('transitioning from deep within the circular structure', ()=> {
    let next;
    beforeEach(()=> {
      next = a.b.c.a.b.c.a.b.c.a.b.c.a.b.c.set('bye now!');
    });
    it('sets the right value', ()=> {
      expect(valueOf(next)).toEqual({
        b: {
          c: 'bye now!'
        }
      });
    });
  });

});
