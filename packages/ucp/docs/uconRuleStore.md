# Usage Control Rule Storage

## Abstraction

There is an abstraction provided such that multiple implementations for a storage can provided.
This abstraction is given by the interface `UCRulesStorage` :

```ts
interface UCRulesStorage {
    getStore: () => Promise<Store>;

    addRule: (rule: Store) => Promise<void>;

    getRule: (identifier: string) => Promise<Store>;

    deleteRule: (identifier: string) => Promise<void>;
}
```
<!-- TODO: rewrite sentence below -->
Multiple implementations allow for having a dynamic storage. 
In the Usage Control Decision engine implementation (`UcpPatternEnforcement`) of `UconEnforcementDecision`, an `UCRulesStorage` is provided, such that when used in a server (such as an Authorization Server (AS) as defined by the UMA protocol) the rule set can be changed dynamically. This allows for requests to be immediately evaluated against the new rule set.


Why does it use an N3 store and not `UCPPolicy` interface. Because the uconEgine implementation is built to work with RDF an not with a Typescript interface (see the N3 rules).

<!-- TODO: provide a code example of how to interact with it -->

## Different implementations

### Memory based

Allows for manipulation of the set of Usage Control Rules without requiring a physical storage.
A disadvantage is that if this type of `UCRulesStorage` would be used in production, all the rules would be gone after exiting the program.

<!-- TODO: add instantiation -->

### LDP Container based

Allows to use a Linked Data Platform (LDP) Container as a storage for the Usage Control Rules.
Other systems can then use LDP operations to add or delete Usage Control Rules.

Since LDP uses HTTP to transfer data, this might be slower than the other options.

An advantage is that when the this type of `UCRulesStorage` would be used in production, all the rules would still be there after exiting the program.

<!-- TODO: add instantiation -->

### Directory based

Allows to use a directory as a storage for the Usage Control Rules.
Other systems can then use IO operations to the directory to add or delete Usage Control Rules.

An advantage is that when the this type of `UCRulesStorage` would be used in production, all the rules would still be there after exiting the program.

<!-- TODO: add instantiation -->
