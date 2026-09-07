## Testing Principles

Tests are documentation. You can create tests for iteration but they should always be removed when you are done and replaced by minimal tests that document the feature.

- Cover the common paths that represent the 80% of real usage. Add edge-case tests only when the edge case is important or guards against a meaningful regression.
- Test observable features and user stories, not implementation details. Test internals only when an exceptionally difficult case cannot be covered reliably through public behavior.

## Comments

Comments should be concise and relavant to explaining the algorithm or feature. It should not explain changes or a history of the codebase. Comments should serve as documentation. Use simple punctuation. Do not use semicolons or em dashes, for example.

# Const Policy

We want reduce top level const and inline anything that is an explicit hook we need tweak often. Always ask yourself if a const needs to exist before making it. Prefer to inline.
