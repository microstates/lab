import Relationship from '../../src/relationship';

export default function linkTo(Type, path) {
  return new Relationship(resolve);

  function resolve(origin, originType, originPath /*, relationshipName */) {

    let target = expandPath(path, originPath);

    return { Type, path: target };
  }
}

export function expandPath(path, context) {
  return path.reduce((path, element) => {
    if (element === '..') {
      return path.slice(0, -1);
    } else if (element === '.') {
      return path;
    } else {
      return path.concat(element);
    }
  }, context);
}
