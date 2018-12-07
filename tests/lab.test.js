import { create, valueOf } from '../index';
import expect from 'expect';

describe('Lab', () => {
  class Num {
    get state() {
      let value = valueOf(this);
      return value == null ? 0 : value;
    }
    increment() {
      return this.state + 1;
    }
  }

  class Bool {
    get state() {
      return valueOf(this);
    }

    set(value) {
      return !!value;
    }
  }

  describe('valueOf() a POJO', ()=> {
    it('is the same as the POJO', ()=> {
      let pojo = {};
      expect(valueOf(pojo)).toBe(pojo);
      expect(valueOf(null)).toBe(null);
      expect(valueOf(undefined)).toBe(undefined);
    });
  });


  describe('a simple, global microstate', () => {
    let ms;

    beforeEach(() => {
      ms = create(Num, 0);
    });

    it('creates the microstate', () => {
      expect(ms).toBeInstanceOf(Num);
    });
    it('stores the value', () => {
      expect(valueOf(ms)).toEqual(0);
    });

    describe('invoking a transition', function() {
      let more;
      beforeEach(() => {
        more = ms.increment();
      });
      it('affects the total value', function() {
        expect(valueOf(more)).toEqual(1);
      });
    });
  });

  describe('a nested microstate', function() {
    class Counter {
      count = create(Num, 0);
    }
    let ms;
    beforeEach(() => {
      ms = create(Counter, { count: 5});
    });
    it('initializes things appropriately', function() {
      expect(valueOf(ms.count)).toEqual(5);
    });
  });

  describe('a deeply nested microstate', () => {
    class Counter {
      count = create(Num);

      increment() {
        return this.count.increment();
      }
    }
    class Popup {
      counter = create(Counter);
      isShowing = create(Bool);

      show() {
        return this.isShowing.set(true).counter.increment();
      }
    }

    class App {
      popup = create(Popup);
    }

    let app;
    beforeEach(() => {
      app = create(App, {popup: { counter: { count: 5 } } });
    });
    it('has the right value', function() {
      expect(valueOf(app.popup.counter.count)).toEqual(5);
    });
    describe('transitioning', function() {
      let next;
      beforeEach(function() {
        next = app.popup.counter.count.increment();
      });
      it('returns the right type of microstate', function() {
        expect(next).toBeInstanceOf(App);
      });
      it('has the right value', function() {
        expect(valueOf(next)).toEqual({popup: { counter: { count: 6 } } });
      });
    });

    describe('nested, custom transitions', function() {
      let app;
      beforeEach(function() {
        app = create(App).popup.show();
      });
      it('properly transitions', function() {
        expect(valueOf(app)).toEqual(({
          popup: {
            counter: { count: 1 },
            isShowing: true
          }
        }));
      });
    });

  });
});
