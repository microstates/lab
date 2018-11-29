import expect from 'expect';

import { create } from '../index';
import { valueOf } from '../src/meta';
import Table from '../examples/table';



class Num {
  get state() {
    let value = valueOf(this);
    return value == null ? 0 : value;
  }
  increment() {
    return this.state + 1;
  }
}

describe('Table', () => {
  let table;
  beforeEach(() => {
    table = create(Table(Num), [
      [1, 2, 3],
      [4, 5, 6]
    ]);
  });
  it('provides access to the cells', function() {
    let [ first ] = table;
    expect(first).toBeDefined();
    expect(valueOf(first)).toEqual(1);
  });
  it('provides access to the cells via the rows', function() {
    let [ , [first, second, third] ] = table.rows;
    expect(first.state).toEqual(4);
    expect(second.state).toEqual(5);
    expect(third.state).toEqual(6);
  });

  it('provides access to the cells via the columns', function() {
    let [ , [top, bottom] ] = table.columns;
    expect(top.state).toEqual(2);
    expect(bottom.state).toEqual(5);
  });

  describe('transitioning a cell directly', function() {
    let next;
    beforeEach(() => {
      let [,,, fourth] = table;
      next = fourth.increment();
    });

    it('increments the number at the right location', function() {
      expect(valueOf(next)).toEqual([
        [1, 2, 3],
        [5, 5, 6]
      ]);
    });
  });

  describe('transitioning from a row', function() {
    let next;
    beforeEach(() => {
      let [, [ row2Column1 ]] = table.rows;
      next = row2Column1.increment();
    });
    it('correctly updates the atom', function() {
      expect(valueOf(next)).toEqual([
        [1, 2, 3],
        [5, 5, 6]
      ]);
    });
  });

  describe('transitioning from a column', function() {
    let next;
    beforeEach(() => {
      let [, [, column2Row2] ] = table.columns;
      next = column2Row2.increment();
    });
    it('properly updates the atom', function() {
      expect(valueOf(next)).toEqual([
        [1, 2, 3],
        [4, 6, 6]
      ]);
    });
  });



});
