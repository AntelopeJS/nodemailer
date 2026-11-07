---
covers:
  - src/index.ts
  - src/implementations/email/config.ts
  - src/implementations/email/transporter.ts
  - src/implementations/email/index.ts
  - src/implementations/email/mail-options.ts
  - src/implementations/email/responses.ts
docs:
  - README.md
journeys:
  - capabilities
  - auth-credentials
  - auth-requires-tls
---

# Transport

The SMTP connection the operator configures, and what the module tells consumers it supports.

## Sub-features

- `capabilities`: `GetCapabilities` names `nodemailer` and exactly the supported features.
- `auth-credentials`: with `requireTLS: false`, the configured `auth` user and password reach the SMTP server, an explicit `from` replaces `defaults.from` and the priority reaches the message.
- `auth-requires-tls`: with `auth` and `requireTLS` unset on a connection whose `secure` resolves to `false`, the module sends nothing to a server that refuses STARTTLS.

## How to get to it (user POV)

- The module's config block in `antelope.config.ts`: `host`, `port`, `secure`, `auth`, `requireTLS`, `defaults.from`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" transport
```

## Gotchas

- `ethereal: true` creates a throwaway account at smtp.ethereal.email, which needs the internet; no journey uses it. An invalid config stops the project at start, which `context.dev` cannot start, so no journey covers the config errors.
- The SMTP stand-in offers no STARTTLS and answers `STARTTLS` with 502. When `auth` is set and `secure` resolves to `false`, the module requires STARTTLS by default, so a journey that expects the credentials to arrive sets `requireTLS: false`.
