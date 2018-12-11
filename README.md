[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Created by The Frontside](https://img.shields.io/badge/created%20by-frontside.io-blue.svg)](https://frontside.io)
[![Build Status](https://travis-ci.org/microstates/lab.svg?branch=master)](https://travis-ci.org/microstates/lab)
[![Coverage Status](https://coveralls.io/repos/github/microstates/lab/badge.svg?branch=master)](https://coveralls.io/github/microstates/lab?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/microstates/lab.svg)](https://greenkeeper.io/)


# ❤ @microstate/lab ❤️

Dangerous experiments with subatomic particles.


## Linked Microstates

In this lab experiment, we're seeking to enable linking from one part
of the microstate graph to a _completely_ separate part. This will
allows us to do things, like share a store between multiple instances
of a microstate. See
https://beta.observablehq.com/@cowboyd/microstate-variables for a
statement of the problem.


The approach is to make microstates pass around the entire _atom_ in
which they are participating every time, and then treat themselves not
as a Type and a value, but rather as a _Type and a pointer_ into the
atom. That way, if a graph of microstates all share the same atom,
then they can reference other microstates with only a Type and a path into
that atom. Transitions on the linked microstate will happen at that
location in the atom (wherever in the atom that location happens to
be). Because all operations anywhere in the graph happen on the atom,
then they will be immediately visible to operations.

Let's see some concrete examples to see what that means. We won't use
any new functionality that this scheme enables, only existing
functionality. That way we can see the difference in representation.

the example of an `App` which contains a `Popup`. The popup has a
counter that it uses to track internally how many times it has been shown.



``` javascript
class App {
  popup = Popup;
}

class Popup {
  isOpen = Boolean;
  count = Number;

  show() {
    return this
      .isOpen.set(true)
      .count.increment();
  }
}
```

In the old way, each microstate kept a reference to its very own
value:

``` javascript
let app = create(App, {popup: { isOpen: false, count: 0}});
metaOf(app).value //=> {popup: { isOpen: false, count: 0}}
metaOf(app.popup).value //=> { isOpen: false, count: 0 };
metaOf(app.popup.count).value //=> 0;
```

In the new way, notice how the `app` and `app.popup`, and
`app.popup.count` all share the _exact same atom_

``` javascript
let app = create(App, {popup: { isOpen: false, count: 0}});
metaOf(app).atom //=> {popup: { isOpen: false, count: 0}}
metaOf(app.popup).atom //=> {popup: { isOpen: false, count: 0}}
metaOf(app.popup.count).atom //=> {popup: { isOpen: false, count: 0}}
```

The way they achieve a unique value is to lookup their path within
the atom.


``` javascript
valueOf(app.popup.count) //=> 0
```

That way, value lookup works as expected.

#### Ownership of microstates

Before, every transition started effectively at its own root of
the tree. (the transition context was a microstate of the type used
created from scratch). Now, there is a problem of where to mark the
boundary of a transition, or What is the _return value_ of a
transition.

As we can see from our class `Popup`, there are a couple places
where even though the transition is on a substate, it returns an
instance of `Popup`. Which type and path to return is known in this
experiment as "ownership". Every microstate has an owner, where the
owner is the `Type` + `path` of the parent microstate in which it
appears, and the target for which transitions should resolve to.

A microstate _can_ be its own owner.

As you can see, all of the objects you reach from the `app` object
have the same owner

``` javascript
ownerOf(app) //> { Type: App, path: [] }
locationOf(app) //> { Type: App, path: [] }
ownerOf(app.popup) //=> { Type: App, path: [] }
locationOf(app.popup) //=> { Type: Popup, path: ['popup'] }
ownerOf(app.popup.count) //=> { Type: App, path: [] }
locationOf(app.popup.count) //=> { Type: Number, path: ['popup', 'count'] }
```

That means that any transition invoked by any of these objects will
result in an `App` object that points to path `[]` in the resulting
atom.

By contrast, within the `show()` transition of the popup, the owner
will have shifted down to be the `Popup`. But notice that the location
is still an absolute path within the total atom and not a relative path.

``` javascript
show() {
  ownerOf(this) //=> { Type: Popup, path: ['popup']}
  locationOf(this) //=> { Type: Popup, path: ['popup']}
  ownerOf(this.isOpen) //=> { Type: Popup, path: ['popup']}
  locationOf(this.isOpen) //=> { Type: Boolean, path: ['popup', 'isOpen']}
  ownerOf(this.count) //=> { Type: Popup, path: ['popup']}
  locationOf(this.count) //=> { Type: Number, path: ['popup', count']}
  return this
    .isOpen.set(true)
    .count.increment();
}
```

#### What it enables.

Since a microstate can point to _anywhere_ in the atom, and it can be
_owned_ by any microstate, this lets us embed any microstate pointing
to anywhere that can be owned by anything. So, for example, imagine we
have as part of our application a list of layers for a popup that
lived at the path ['rendering', 'stack', 'layers']. We could create a
popup that linked to this location even though the ['popup'] is not a
descendant of this path.

Now, we can have a `layers` property that is _ownned_ by the popup,
but is _located_ outside:

``` javascript
class Popup {
  show() {
    ownerOf(this.layers) //=> { Type: Popup, path: ['popup'] }
    locationOf(this.layers) //=> { Type: LayerStack, path: ['rendering', 'stack', 'layers']}
    return this
     .layers.allocate()
     .isOpen.set(true)
     .count.increment();
  }
}
```

The mechanism to declare this is still a work in progress, but the
test cases in `lab.test.js` have a proof of concept in which one hand
claps the other.

``` javascript
// clap transition on hand look like this. It claps itself, and then
// claps the other. (other will be a link to the other hand)
clap() {
  return this
    .other.claps.increment()
    .claps.increment()
}

// a person has a left hand and a right hand:
let person = create(Person, { left: { claps: 1 }, right: { claps: 1 } });
let clapped = person.right.clap();

// we clapped the right hand, but the left count incremented too.
clapped.left.claps.state //=> 2
```

##### Table

Using the ability to "link into" a data structure anywhere inside the
atom, we can use this to implement one of the holy grails of data
structures: a [Table](examples/table.js)

The cells are just a lazy enumeration that returns the cell type of
the table. The rows are a lazy enumeration of rows, that lazily
enumerate cells of the same type within the table. And, not
suprisingly, the columns are a lazy enumeration of column objects that
lazily enumerate the cells in that column.

See the [testcases](tests/table.test.js) for example usage.
