import { StringType } from '../types';
import Relationship from '../../src/relationship';
import { view, At } from '../../src/lens';
import { valueOf } from '../../src/meta';
import linkTo from './link-to';
import { ln } from '../db';

export default function belongsTo(T, tableName) {
  return new Relationship(resolve);

  function BelongsTo(originType, originPath, foreignKey) {

    return class BelongsTo extends T {
      static name = `BelongsTo<${T.name}>`;

      get isBelongsTo() { return true; }

      set(record) {
        let path = originPath.concat(foreignKey);
        return ln(StringType, path, this).set(idOf(record));
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

export function idOf(record) {
  return view(At("id"), valueOf(record));
}
