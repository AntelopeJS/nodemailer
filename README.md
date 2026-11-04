# `@antelopejs/nodemailer`

<div align="center">
<a href="https://www.npmjs.com/package/@antelopejs/nodemailer"><img data-illustration alt="npm" src="https://img.shields.io/npm/v/@antelopejs/nodemailer?style=for-the-badge&labelColor=000000&color=000000"></a>
<a href="./LICENSE"><img data-illustration alt="License" src="https://img.shields.io/npm/l/@antelopejs/nodemailer?style=for-the-badge&labelColor=000000&color=000000"></a>
<a href="https://discord.gg/g4pFt6eXqu"><img data-illustration alt="Discord" src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000"></a>
<a href="https://github.com/AntelopeJS/interface-email/tree/main/docs"><img data-illustration alt="Documentation" src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000"></a>
</div>

The AntelopeJS Nodemailer module sends the email interface's messages over SMTP with [Nodemailer](https://nodemailer.com).

## Interfaces

| Interface                                                                      | Documentation                                                         |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| [`@antelopejs/interface-email`](https://github.com/AntelopeJS/interface-email) | [Email](https://github.com/AntelopeJS/interface-email/tree/main/docs) |

The module implements `Send`, `SendBatch`, `SendTemplate`, and `GetCapabilities`. It supports inline templates, attachments, `replyTo`, and priorities. It does not support provider-hosted templates, so `SendTemplate` with a template ID returns a `NOT_SUPPORTED` error.

## Install

```bash
ajs project modules add @antelopejs/nodemailer
```

The module ships no default configuration. Add a `config` block before you start the project.

## Configuration

```typescript [antelope.config.ts]
import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "my-project",
  modules: {
    nodemailer: {
      source: {
        type: "package",
        package: "@antelopejs/nodemailer",
        version: "^0.0.7",
      },
      config: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: { user: "smtp-user", pass: "smtp-password" },
        defaults: { from: "noreply@example.com" },
      },
    },
  },
  envOverrides: {
    SMTP_PASSWORD: "modules.nodemailer.config.auth.pass",
  },
});
```

| Key             | Description                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `host`          | SMTP host. Required unless `ethereal` is `true`.                                                                                             |
| `port`          | SMTP port, as a number. Required unless `ethereal` is `true`.                                                                                |
| `secure`        | Use TLS from the start of the connection. Defaults to `true` on port 465 and `false` otherwise.                                              |
| `requireTLS`    | Require STARTTLS. Defaults to `true` when `auth` is set and `secure` resolves to `false`. Set to `false` to allow clear-text authentication. |
| `auth`          | Optional SMTP credentials, `{ user, pass }`. Both must be non-empty when set.                                                                |
| `defaults.from` | Sender used when a message has no `from`.                                                                                                    |
| `ethereal`      | Set to `true` in development to send through a temporary [Ethereal](https://ethereal.email) account instead.                                 |

With `ethereal: true`, the module ignores the other keys, creates an account at startup, logs its address and uses it as the default sender. Each sent message logs a preview URL where you can read it.

## Quick start

In the module that sends email, add the interface:

```bash
pnpm add @antelopejs/interface-email
```

```typescript
import { Send } from "@antelopejs/interface-email";

const result = await Send({
  to: "user@example.com",
  subject: "Welcome",
  text: "Your account is ready.",
  html: "<p>Your account is ready.</p>",
});
```

`result.success` tells you whether the SMTP server accepted the message. On a failure, `result.error` holds the error code and message.

## Documentation

- [Email](https://github.com/AntelopeJS/interface-email/tree/main/docs): the `@antelopejs/interface-email` contract this module implements.
- [Configuration](https://framework.antelopejs.com/docs/concepts/configuration): module sources, `config` blocks, and config variables in `antelope.config.ts`.

## Compatibility

<!-- antelopejs-docs-compat:start -->

| Package                       | Supported        | Tested with |
| ----------------------------- | ---------------- | ----------- |
| `@antelopejs/interface-core`  | `>=0.2.4 <1.0.0` | `0.2.4`     |
| `@antelopejs/interface-email` | `>=0.1.0 <0.2.0` | `0.1.0`     |

<!-- antelopejs-docs-compat:end -->

## Contributing

Use the Node.js version in `.nvmrc` and the pnpm version in the `packageManager` field of `package.json`:

```bash
pnpm install
pnpm dev            # run the playground/ project with an Ethereal account
pnpm lint
pnpm format:check
pnpm knip
pnpm test           # build, then ajs module test
```

Read the [contribution guidelines](CONTRIBUTING.md) before opening a pull request.

## License

[Apache-2.0](LICENSE)
