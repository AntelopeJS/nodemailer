---
covers:
docs:
  - README.md
journeys:
  - module-dev
  - send-through-sink
---

# Smoke

The fixed journey every verdict runs: load the module as `local`, send one message through core and see it reach the SMTP stand-in.

## Sub-features

- `module-dev` is the pack's journey: the project answers, the consumer loads the email interface, Ctrl+C exits 130.
- `send-through-sink`: one `Send` is delivered to the recipient.

## How to get to it (user POV)

- A project with `@antelopejs/nodemailer` and a module that imports `@antelopejs/interface-email`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" smoke
```

## Gotchas

- The smoke feature covers no glob, so it never marks a file as mapped.
