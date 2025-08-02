# Do not support nested .do()/.while() constructs

## Status

Accepted

## Context

The current implementation of .do() and .while() in Collections works correctly for some cases of nesting and not of others. Given that there are no clear use cases for nesting these, the value in a more complex implementation that supports nesting all types of nesting is thus limited.

## Decision

- We will not support nested .do()/.while() constructs.

## Consequences

- Documentation should be updated to make this clear.
- If use cases arise where supporting this becomes valuable, we can re-evaluate the decision.
