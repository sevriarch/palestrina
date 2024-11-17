# Object creation patterns

## Status

Accepted

## Context

Currently, this software recreates a lot of immutable objects that do not need to be recreated, by passing them to constructors. This is a waste of resources and makes the constructor signature more complicated than necessary.

We should therefore ensure that a consistent pattern exists for creating objects that allows for the reuse of existing objects where this would not be problematical.

## Decision

For any class T that might be reused, we will implement the following creation methods:

static from(arg: T | TConstructorArg): T;
constructor(arg: TConstructorArg);

In most cases the static from() method will merely check if its argument is a T and if so return the argument, otherwise create a new object, but there may be additional optimisations (eg: if empty arguments can be expected to appear often, we could cache a value corresponding to those).


## Consequences

- We should experience some performance improvements.
- Existing code will need to be adjusted to create using T.from() rather than new T() in cases where an instance of T might be passed, but this should not be a major change.
- The code base should be more consistent
- Constructor methods should be simplified somewhat.
