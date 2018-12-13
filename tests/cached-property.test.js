import expect from 'expect';

import { set, At } from '../src/lens';

import CachedProperty from '../src/cached-property';

describe('cached properties', ()=> {
  let object;

  beforeEach(()=> {
    object = Object.defineProperty({}, 'cached', CachedProperty('cached', () => ({})));
  });

  it('returns the same object upon multiple invocations', ()=> {
    expect(object.cached).toBeDefined();
    expect(object.cached).toBe(object.cached);
  });

  describe('deriving a new object from old one', ()=> {
    let derived;
    let cached;
    beforeEach(()=> {
      derived = set(At("other"), "thing", object);
      cached = object.cached;
    });
    it('recomputes the cached property', ()=> {
      expect(derived.cached).toBeDefined();
      expect(derived.cached).not.toBe(cached);
      expect(derived.cached).toBe(derived.cached);
    });
  });

});
