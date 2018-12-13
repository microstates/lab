import Relationship from '../../src/relationship';
import linkTo, { expandPath } from './link-to';
import { ln } from '../db';
import { atomOf, pathOf, valueOf } from '../../src/meta';
import { idOf } from './belongs-to';

export default function hasMany(T, tableName) {
  return new Relationship(resolve);

  function resolve(origin, originType, originPath, relationshipName) {
    let dbpath = expandPath(["..", "..", ".."], originPath);
    let Type = HasMany(T, dbpath, tableName);
    let { resolve } = linkTo(Type, [relationshipName]);
    return resolve(origin, originType, originPath, relationshipName);
  }
}

export function HasMany(Type, dbpath, tableName) {
  return class HasMany {
    static name = `HasMany<${Type.name}>`;

    get isHasMany() { return true; }

    get length() {
      return (valueOf(this) || []).length;
    }

    push(record) {
      let value = valueOf(this) || [];
      return this.set(value.concat(idOf(record)));
    }

    *[Symbol.iterator]() {
      let ids = valueOf(this) || [];
      for (let id of ids) {
        let path = dbpath.concat([tableName, "records", id]);
        yield ln(Type, path, this);
      }
    }
  };
}

export function collect(db, tableName) {
  let Type = HasMany(db[tableName].constructor.Type, pathOf(db), tableName);
  return ln(Type, atomOf(db));
}
