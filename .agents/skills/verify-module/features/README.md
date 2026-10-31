# Feature map

One file per feature. `covers:` lists the source globs it owns, `docs:` the pages a verdict judges, `journeys:` the journeys it runs, and `seeded-breaks/<feature>.patch` the break its journeys must catch. `pnpm exec antelopejs-verify map` checks that every user-facing file is covered.

The module talks SMTP to the host the operator configures. Journeys point it at a local stand-in (`smtp-sink.ts`) that speaks enough SMTP (EHLO, AUTH PLAIN and LOGIN, MAIL, RCPT, DATA) to record every message. No real mail server is involved.

| Feature | What the user does | Journeys |
|---|---|---|
| [send](send.md) | An application module calls `Send` and gets the server's answer mapped. | send-message, send-failure |
| [batch](batch.md) | Many messages go out one after the other. | batch-continues, batch-stops |
| [templates](templates.md) | A message is built from an inline template. | inline-template, provider-template |
| [transport](transport.md) | The operator configures the SMTP connection; a consumer asks what is supported. | capabilities, auth-credentials |
| [smoke](smoke.md) | The fixed journey every verdict runs. | module-dev, send-through-sink |
