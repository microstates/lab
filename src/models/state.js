import shortid from 'shortid';

export default class State {
  id = shortid.generate();
  text = '';
}
