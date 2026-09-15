# @antelopejs/nodemailer

<div align="center">
<a href="https://www.npmjs.com/package/@antelopejs/nodemailer"><img alt="NPM version" src="https://img.shields.io/npm/v/@antelopejs/nodemailer.svg?style=for-the-badge&labelColor=000000"></a>
<a href="./LICENSE"><img alt="License" src="https://img.shields.io/npm/l/@antelopejs/nodemailer.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://discord.gg/sjK28QHrA7"><img src="https://img.shields.io/badge/Discord-18181B?logo=discord&style=for-the-badge&color=000000" alt="Discord"></a>
<a href="https://antelopejs.com"><img src="https://img.shields.io/badge/Docs-18181B?style=for-the-badge&color=000000" alt="Documentation"></a>
</div>

Nodemailer implementation of the AntelopeJS email interface. It sends single
or batched messages through SMTP, supports inline templates and attachments,
and can create an Ethereal test account for local development.

## Installation

```bash
pnpm add @antelopejs/nodemailer
```

The module implements
[`@antelopejs/interface-email`](https://github.com/AntelopeJS/interface-email).

## Configuration

Add the module to `antelope.config.ts`:

```ts
import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "my-app",
  modules: {
    email: {
      source: {
        type: "package",
        package: "@antelopejs/nodemailer",
      },
      config: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        defaults: {
          from: "noreply@example.com",
        },
      },
    },
  },
});
```

When `secure` is omitted, port 465 enables it automatically. Authentication is
optional for SMTP servers that do not require it.

For local development, replace the SMTP options with `ethereal: true`. The
module creates a temporary Ethereal account and logs its address.

## Usage

Use the provider-independent email interface from application modules:

```ts
import { Send } from "@antelopejs/interface-email";

const result = await Send({
  from: "noreply@example.com",
  to: "user@example.com",
  subject: "Welcome",
  text: "Your account is ready.",
  html: "<p>Your account is ready.</p>",
});
```

The implementation also supports `SendBatch`, inline `SendTemplate` calls,
attachments, reply headers, and message priorities. Provider-hosted templates
are not supported by Nodemailer.

## Development

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm test
```

See the organization-wide
[contribution guidelines](https://github.com/AntelopeJS/.github/blob/main/CONTRIBUTING.md)
and [security policy](SECURITY.md).

## License

Apache-2.0
