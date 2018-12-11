import expect from 'expect';

import db from '../examples/db';
import { valueOf } from '../index';

describe('a referential DB', ()=> {
  it('starts out empty', ()=> {
    expect(db.people.length).toEqual(0);
    expect(db.blogs.length).toEqual(0);
    expect(db.comments.length).toEqual(0);
  });

  describe('creating a person with static attributes', ()=> {
    let next;
    let person;
    beforeEach(()=> {
      next = db.people.create({
        firstName: 'Bob',
        lastName: 'Dobalina'
      });
      person = next.people.latest;
    });
    it('contains the newly created person', ()=> {
      expect(next.people.length).toEqual(1);
      expect(person).toBeDefined();
      expect(person.firstName.state).toEqual('Bob');
      expect(person.lastName.state).toEqual('Dobalina');
    });
  });

  describe('creating a person with higher order attributes', ()=> {
    let next;
    let person;
    beforeEach(()=> {
      next = db.people.create();
      person = next.people.latest;
    });

    it('creates them with generated attributes', ()=> {
      expect(person.firstName.state).not.toBe('');
      expect(person.lastName.state).not.toBe('');
    });
  });

  describe('creating a blog post with related author', ()=> {
    let next;
    let blog;

    beforeEach(()=> {
      next = db.blogs.create();
      blog = next.blogs.latest;
    });
    it('has a related author', ()=> {
      expect(blog.author).toBeDefined();
    });
    it('is the same as a person created in the people table', ()=> {
      expect(next.people.latest).toBeDefined();
      expect(valueOf(next.people.latest)).toBe(valueOf(next.blogs.latest.author));
    });
  });

});
