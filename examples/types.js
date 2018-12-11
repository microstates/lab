import { valueOf } from '../index';

export class NumberType {

  get state() {
    return valueOf(this) || 0;
  }

  initialize(value) {
    if (value == null) {
      return 0;
    } else if (isNaN(value)) {
      return this;
    } else {
      return Number(value);
    }
  }

  increment() {
    return this.state + 1;
  }
}

export class StringType {
  get state() {
    return valueOf(this) || '';
  }
}
