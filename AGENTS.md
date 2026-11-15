# nodemailer

The AntelopeJS module that implements `@antelopejs/interface-email` over SMTP with Nodemailer, published as `@antelopejs/nodemailer`.

## Layout

- `src/index.ts` holds the module lifecycle (`construct`, `start`, `stop`, `destroy`). `construct` builds the transporter from the module config and registers the implementation.
- `src/implementations/email/index.ts` implements the interface functions (`Send`, `SendBatch`, `SendTemplate`, `GetCapabilities`).
- `playground/` is a separate AntelopeJS project with its own `package.json` and `pnpm-lock.yaml`. It loads this module with `ethereal: true` and sends real messages to an Ethereal account.

## Versioning

Every `@antelopejs/*` range, in `package.json` and `playground/package.json` alike, stops below the next minor of its floor on 0.x (`>=0.5.1 <0.6.0`) and uses `~` from 1.0 (`~1.23.0`); the `dependency:ranges` step of `pnpm run checks` enforces it. The `@antelopejs/interface-core` range must admit the copy `@antelopejs/core` provides, or `pnpm test` refuses to load the module. When you raise a minimum, raise the same range in `playground/package.json` and the compatibility table in `README.md`, and update both lockfiles. The `version` range of the config example in `README.md` admits the `package.json` version (`readme:version`).

## Tests

- `pnpm test` builds `dist` once, then runs `ajs module test .`. Run the tests through `pnpm test`: the test project has no `installCommand`, so a bare `ajs module test .` loads whatever `dist` already holds. `src/test/antelope.test.ts` (`antelopeJs.test` in `package.json`) loads the built module with a placeholder SMTP config and runs the compiled suites in `dist/test`. The suites stub Nodemailer with sinon, so no SMTP server or network is needed.
- `pnpm run checks` does not run the playground. Run it with `pnpm install --dir playground`, then `pnpm dev`; it needs network access to Ethereal.

<!-- antelopejs-guardrails:start -->
<!-- Managed by @antelopejs/tooling-configs. `antelopejs-sync` rewrites everything between these markers; write repository-specific guidance outside them. -->

## Guardrails

CI runs `pnpm run checks` in full on every pull request and reports what failed. The commit hook formats and lints the staged files. Locally, run only the fast check for what you touched:

- `pnpm run typecheck` after you change types or signatures.
- `pnpm exec oxlint <files>` and `pnpm exec oxfmt <files>` on the files you changed.
- One test file, not the suite. In a module that tests with `ajs module test`: `pnpm run build`, then `pnpm exec ajs module test . -f dist/<path>.test.js`.

Prove a change works with the verification skill in [`.agents/skills/verify-module/SKILL.md`](.agents/skills/verify-module/SKILL.md) before you call it done.

### Comments

Say it in code: a constraint in a type, a lint rule or a test, a public item's contract in TSDoc. Other comments are lint directives naming their rules, `@ts-expect-error <reason>`, `SAFETY: <reason>` above a type assertion, and license or tool directives. A reason states what the code does now.

### Tests

Each test names the wrong implementation it fails on, or is deleted. Drive behaviour through the public interface. An invariant over many files is a lint rule.

### Review

No tool checks these:

- A type guard checks the nested elements and values it claims.
- A no-upward import rule rejects same-tier peers; probe it with an import.
- A finding only an evasion or a patched internal can trigger goes under Attention and never blocks.

### Suppressions

`guardrails.suppressions.json` caps lint directives, `@ts-expect-error`, `SAFETY:` comments and rules a lint config turns off. Over a cap, fix the code or remove another suppression of that kind; only the operator raises a number. After removing suppressions, run `pnpm run suppressions:update` and commit the file.

<!-- antelopejs-guardrails:end -->
