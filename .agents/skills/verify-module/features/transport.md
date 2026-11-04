---
covers:
  - src/index.ts
  - src/implementations/email/config.ts
  - src/implementations/email/transporter.ts
docs:
  - README.md
journeys:
  - capabilities
  - auth-credentials
---

# Transport

The SMTP connection the operator configures, and what the module tells consumers it supports.

## Sub-features

- `capabilities`: `GetCapabilities` names `nodemailer` and exactly the supported features.
- `auth-credentials`: the configured `auth` user and password reach the SMTP server, and an explicit `from` replaces `defaults.from`.

## How to get to it (user POV)

- The module's config block in `antelope.config.ts`: `host`, `port`, `secure`, `auth`, `defaults.from`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" transport
```

## Gotchas

- `ethereal: true` creates a throwaway account at smtp.ethereal.email, which needs the internet; no journey uses it. An invalid config stops the project at start, which `context.dev` cannot start, so no journey covers the config errors.
