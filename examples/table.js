import { create } from '../index';
import { query } from '../src/query';
import { link, ownerOf, pathOf, valueOf, atomOf } from '../src/meta';

export default function Table(T) {
  class Table {
    initialize(value) {
      return Array.isArray(value) ? value : [];
    }

    get rows() {
      return query(function*() {
        let i = -1;
        for (let _ of valueOf(this)) { //eslint-disable-line
          i++;
          yield new Row(this, i);
        }
      }.bind(this));
    }

    get columns() {
      return query(function*() {
        let value = valueOf(this);
        if (value.length === 0 || !value[0].length) {
          return;
        } else {
          // we just use the number of columns in the first row
          // as the number of columns for everything. Maybe a better way?
          let width = value[0].length;
          for (let i = 0; i < width; i++) {
            yield new Column(this, i);
          }
        }


      }.bind(this));
    }

    // iterator over all values.
    *[Symbol.iterator]() {
      let i = -1;
      for (let row of valueOf(this)) {
        i++;
        let j = -1;
        for (let _ of row) { //eslint-disable-line
          j++;
          let owner = ownerOf(this);
          yield link(create(T), T, pathOf(this).concat([i, j]), atomOf(this), owner.Type, owner.path);
        }
      }
    }
  }

  class Row {
    constructor(table, index) {
      this.table = table;
      this.index = index;
    }

    *[Symbol.iterator]() {
      let i = -1;
      let { table, index } = this;
      for (let _ of valueOf(table)[index]) { //eslint-disable-line
        i++;
        let owner = ownerOf(table);
        yield link(create(T), T, pathOf(table).concat([index, i]), atomOf(table), owner.Type, owner.path);
      }
    }
  }

  class Column {
    constructor(table, index) {
      this.table = table;
      this.index = index;
    }

    *[Symbol.iterator]() {
      let i = -1;
      let { table, index } = this;
      for (let _ of valueOf(table)) { //eslint-disable-line
        i++;
        let owner = ownerOf(table);
        yield link(create(T), T, pathOf(table).concat([i, index]), atomOf(table), owner.Type, owner.path);
      }
    }
  }

  return Table;
}
