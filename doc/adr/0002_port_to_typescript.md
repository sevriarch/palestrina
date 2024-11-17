# Port Palestrina to TypeScript

## Status

Accepted

## Context

Palestrina has become a significantly complex piece of software and there are several areas (particularly involving value replacement) where there are complex and unclear requirements for typing of entities. In addition, the parallels between Sequences might strongly benefit from being based on generic interfaces; similarly with testing of Sequences.

It can thus be reasonably expected that refactoring and maintenance of the codebase will hence be easier if we port to TypeScript.

## Decision

- We will port Palestrina to TypeScript.

## Consequences

- Significant additional development time will be required to clarify typing of all parts of the software.
- It is likely that refactoring and development work in future will trip over fewer banana skins.
