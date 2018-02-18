import shortid from 'shortid';

export default class Node {
  id = shortid.generate();
  text = '';
}
