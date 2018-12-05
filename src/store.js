import Identity from './identity';

export default function Store(Type, value, observe = x => x) {
  let { get, transition } = Identity(Type, value, (...args) => observe(transition(...args)));
  return get();
}
