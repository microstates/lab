import { append, map, foldl } from 'funcadelic';
import { NumberType, StringType } from './types';
import { create as _create } from '../index';
import { link, valueOf, pathOf, atomOf, typeOf, metaOf, ownerOf } from '../src/meta';
import Txn from '../src/transaction';
import belongsTo from './db/belongs-to';
import hasMany from './db/has-many';

import faker from 'faker';

class Person {
  firstName = StringType;
  lastName = StringType;
}

class Blog {
  title = StringType;
  author = belongsTo(Person, "people");
  comments = hasMany(Comment, "comments");
}

class Comment {
  title = StringType;
}

function Id(record) {
  return ln(StringType, pathOf(record).concat("id"), record);
}

function Table(Type, factory = {}) {

  return class Table {
    static Type = Type;
    static name = `Table<${Type.name}>`;

    nextId = NumberType;

    get length() { return Object.keys(this.records).length; }

    get latest() { return this.records[this.latestId]; }

    get latestId() { return this.nextId.state - 1; }

    get records() {
      return map((value, key) => ln(Type, pathOf(this).concat(["records", key]), this), this.state.records || {});
    }

    get state() {
      return valueOf(this) || { nextId: 0, records: {}};
    }

    create(overrides = {}) {
      let id = this.nextId.state;
      let path = pathOf(this).concat(["records", id]);
      let record = Txn(this.nextId.increment(), ln(Type, path))
          .flatMap(([, record]) => Txn(Id(record).set(id)));

      return foldl((txn, { key, value: attr }) => {
        return txn
          .flatMap(txn => {
            let [ record ] = txn;
            if (record[key]) {
              return txn
                .flatMap(([ record ]) => Txn(record[key], ln(DB, pathOf(this).slice(0, -1))))
                .flatMap(([ relationship, db ]) => {

                  function attrFn() {
                    if (relationship.isBelongsTo || relationship.isHasMany) {
                      let build = factory[key];
                      if (build) {
                        let empty = relationship.isHasMany ? [] : {};
                        return build(relationship, db, overrides[key] || empty);
                      } else {
                        return null;
                      }
                    } else {
                      return typeof attr === 'function' ? attr(id) : attr;
                    }
                  }

                  let result = attrFn();

                  if (metaOf(result)) {
                    return Txn(result, record);
                  } else {
                    return Txn(relationship.set(result), record);
                  }
                })
                .flatMap(([, record]) => Txn(record));
            } else {
              return txn;
            }
          });
      }, record, append(factory, overrides));
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
    author: (author, db, attrs = {}) => Txn(db.people)
      .flatMap(([ people ]) => Txn(people.create(attrs).latest, author))
      .flatMap(([ person, author ]) => Txn(author.set(person))),
    comments: (comments, db, list = []) => list.reduce((txn, attrs) => {
      return txn
        .flatMap(([ db ]) => Txn(db.comments.create(attrs), comments))
        .flatMap(([ db, comments ]) => Txn(comments.push(db.comments.latest), db))
        .flatMap(([, db ]) => Txn(db));
    }, Txn(db))
  });

  comments = Table(Comment);
}

export function ln(Type, path, owner = _create(Type)) {
  return link(_create(Type), Type, path, atomOf(owner), typeOf(owner), pathOf(owner));
}

// function DB(tables) {
//   return class DB {
//     constructor() {
//       Object.keys(tables).forEach(key => {
//         this[key] = tables[key]
//       });
//     }
//   }
// }

export default _create(DB, {});
