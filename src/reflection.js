import { filter } from 'funcadelic';

export function methodsOf(Type) {
  return filter(({ key: name, value: desc }) => {
    return name !== 'constructor' && typeof name === 'string' && typeof desc.value === 'function';
  }, Object.getOwnPropertyDescriptors(Type.prototype));
}

// export function defineProperties(object, descriptors) {
//   return Object.defineProperties(Object.create(object), descriptors);
// }

// export function defineProperty(object, key, descriptor) {
//   return Object.defineProperty(Object.create(object), key, descriptor);
// }
