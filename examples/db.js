import { append, map, foldl } from 'funcadelic';
import { NumberType, StringType } from './types';
import { create as _create } from '../index';
import { view, At } from '../src/lens';
import { link, valueOf, pathOf, atomOf, typeOf, metaOf, ownerOf } from '../src/meta';

import faker from 'faker';

class Person {
  firstName = StringType;
  lastName = StringType;
}

class Blog {
  title = StringType;
  author = belongsTo(Person, "people");
}

class Comment {}

function Table(Type, factory = {}) {

  return class Table {
    static Type = Type;
    static name = `Table<${Type.name}>`;

    nextId = NumberType;

    get length() { return Object.keys(this.records).length; }

    get latest() { return this.records[this.latestId]; }

    get latestId() { return this.nextId.state - 1; }

    get records() {
      return map((value, key) => ln(Type, pathOf(this).concat(["records", key]), this), this.state.records);
    }

    get state() {
      return valueOf(this) || { nextId: 0, records: {}};
    }

    create(overrides = {}) {
      let id = this.nextId.state;
      let record = createAt(this.nextId.increment(), Type, ["records", id], { id });

      let created = foldl((record, { key, value: attr }) => {
        if (record[key]) {
          let attrFn = typeof attr === 'function' ? attr : () => attr;

          // create a local link of the DB that returns itself. to pass into
          // the factory function.
          let db = link(_create(DB), DB, pathOf(this).slice(0, -1), atomOf(record));

          let result = attrFn(overrides[key], db);

          let next = metaOf(result) ? link(record, Type, pathOf(record), atomOf(result)) : record;

          return next[key].set(result);
        } else {
          return record;
        }
      }, record, append(factory, overrides));

      let owner = ownerOf(this);
      return link(this, typeOf(this), pathOf(this), atomOf(created), owner.Type, owner.path);
    }
  };
}



class DB {
  people = Table(Person, {
    firstName: () => faker.name.firstName(),
    lastName: () => faker.name.lastName()
  });
  blogs = Table(Blog, {
    title: () => faker.random.words(),
    author: (attrs, db) => {
      return db.people.create(attrs)
        .people.latest;
    }
  });
  comments = Table(Comment);
}

function createAt(parent, Type, path, value) {
  return link(_create(Type), Type, pathOf(parent).concat(path), atomOf(parent)).set(value);
}

function ln(Type, path, owner) {
  return link(_create(Type), Type, path, atomOf(owner), typeOf(owner), pathOf(owner));
}

import Relationship from '../src/relationship';

function linkTo(Type, path) {
  return new Relationship(resolve);

  function resolve(origin, originType, originPath /*, relationshipName */) {

    return {
      Type,
      path: path.reduce((path, element) => {
        if (element === '..') {
          return path.slice(0, -1);
        } else if (element === '.') {
          return path;
        } else {
          return path.concat(element);
        }
      }, originPath)
    };
  }
}

function belongsTo(T, tableName) {
  return new Relationship(resolve);

  function BelongsTo(originType, originPath, foreignKey) {
    return class BelongsTo extends T {
      set(value) {
        let origin = ln(originType, originPath, value);
        let id = valueOf(value).id;
        return origin.set(append(valueOf(origin), {
          [foreignKey]: id
        }));
      }
    };
  }

  function resolve(origin, originType, originPath, relationshipName) {
    let foreignKey = `${relationshipName}Id`;
    let id = view(At(foreignKey), valueOf(origin));
    let Type = BelongsTo(originType, originPath, foreignKey);
    let { resolve } = linkTo(Type, ["..", "..", "..", tableName, "records", id]);
    return resolve(origin, originType, originPath, relationshipName);
  }
}

export default _create(DB, {});
