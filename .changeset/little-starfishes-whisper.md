---
'@backstage/catalog-model': patch
---

Added `stringifyEntityRef`, which always creates a string representation of an entity reference. Also deprecated `serializeEntityRef`, as `stringifyEntityRef` should be used instead.
