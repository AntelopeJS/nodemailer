---
covers:
  - src/implementations/email/mail-options.ts
  - src/implementations/email/responses.ts
  - src/implementations/email/index.ts
docs:
  - README.md
journeys:
  - send-message
  - send-failure
---

# Send

An application module calls `Send` of the email interface; the module turns it into one SMTP message and maps the server's answer back.

## Sub-features

- `send-message`: to, cc, bcc, reply-to, subject and both bodies reach the SMTP server; the envelope holds every recipient, the headers hold the configured sender and no bcc.
- `send-failure`: a recipient the server refuses with 550 makes a failed `SEND_FAILED` answer carrying the server's text, and nothing is delivered.

## How to get to it (user POV)

- A module that imports `@antelopejs/interface-email` and calls `Send({ to, subject, text | html, ... })`; the project config holds the SMTP `host`, `port` and `defaults.from`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" send
```

## Gotchas

- The SMTP server is stood in for by `smtp-sink.ts`, a local server that records every message and refuses recipients that contain `reject`. Journeys read what it recorded through its `/__log` endpoint.
