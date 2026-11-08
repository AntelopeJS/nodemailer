---
covers:
  - src/implementations/email/template.ts
  - src/implementations/email/index.ts
  - src/implementations/email/responses.ts
docs:
  - README.md
journeys:
  - inline-template
  - literal-template
  - provider-template
---

# Templates

A message is built from an inline template; provider templates are not supported.

## Sub-features

- `inline-template`: every `{{ variable }}` occurrence is replaced and a nested value is written as JSON, as html or as text, with the call's subject.
- `literal-template`: a variable name matches only itself, `$&` in a value stays as written, a value is never scanned for placeholders, and a name such as `(x` is sent instead of rejecting.
- `provider-template`: a template id is answered `NOT_SUPPORTED` and nothing is sent.

## How to get to it (user POV)

- A module that calls `SendTemplate({ to, template, variables })`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" templates
```

## Gotchas

- Only inline templates exist in this provider (the interface's provider templates need a service that stores them).
