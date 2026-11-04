---
covers:
  - src/implementations/email/template.ts
docs:
  - README.md
journeys:
  - inline-template
  - provider-template
---

# Templates

A message is built from an inline template; provider templates are not supported.

## Sub-features

- `inline-template`: every `{{ variable }}` occurrence is replaced and a nested value is written as JSON, as html or as text, with the call's subject.
- `provider-template`: a template id is answered `NOT_SUPPORTED` and nothing is sent.

## How to get to it (user POV)

- A module that calls `SendTemplate({ to, template, variables })`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" templates
```

## Gotchas

- Only inline templates exist in this provider (the interface's provider templates need a service that stores them).
