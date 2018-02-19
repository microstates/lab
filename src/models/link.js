import shortid from 'shortid';

export default class Link {
  id = shortid.generate();
  text = '';
}
