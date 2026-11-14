# Changelog

## v0.0.12

[compare changes](https://github.com/AntelopeJS/nodemailer/compare/v0.0.11...v0.0.12)

### 📖 Documentation

- **readme:** Adopt the AntelopeJS framework README style ([#66](https://github.com/AntelopeJS/nodemailer/pull/66))

### 📦 Build

- **deps:** ⚠️  Cap @antelopejs ranges below the next minor on tooling-configs 0.6.0 ([#68](https://github.com/AntelopeJS/nodemailer/pull/68))

### 🤖 CI

- Run the checks on Windows beside Linux ([#67](https://github.com/AntelopeJS/nodemailer/pull/67))

#### ⚠️ Breaking Changes

- **deps:** ⚠️  Cap @antelopejs ranges below the next minor on tooling-configs 0.6.0 ([#68](https://github.com/AntelopeJS/nodemailer/pull/68))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.0.11

[compare changes](https://github.com/AntelopeJS/nodemailer/compare/v0.0.10...v0.0.11)

### 🩹 Fixes

- **email:** Bound the Ethereal account call so startup never hangs ([#65](https://github.com/AntelopeJS/nodemailer/pull/65))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.0.10

[compare changes](https://github.com/AntelopeJS/nodemailer/compare/v0.0.9...v0.0.10)

### 🔥 Performance

- **email:** Reuse pooled SMTP connections across sends ([#64](https://github.com/AntelopeJS/nodemailer/pull/64))

### 📦 Build

- **deps:** Bump @antelopejs/tooling-configs to 0.5.0 ([#62](https://github.com/AntelopeJS/nodemailer/pull/62))
- **deps:** Bump @antelopejs/tooling-configs to 0.5.1 ([#63](https://github.com/AntelopeJS/nodemailer/pull/63))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.0.9

[compare changes](https://github.com/AntelopeJS/nodemailer/compare/v0.0.8...v0.0.9)

### 🔥 Performance

- **build:** Skip the lib check in build, keep it in typecheck ([#54](https://github.com/AntelopeJS/nodemailer/pull/54))

### 🩹 Fixes

- **verify:** Stop the auth-credentials journey hanging on STARTTLS ([#53](https://github.com/AntelopeJS/nodemailer/pull/53))
- **verify:** Cover the files each feature's journeys assert on ([#55](https://github.com/AntelopeJS/nodemailer/pull/55))
- **email:** Require STARTTLS only when auth holds credentials ([#56](https://github.com/AntelopeJS/nodemailer/pull/56))
- **email:** Resolve Send to SEND_FAILED for any rejection value ([#58](https://github.com/AntelopeJS/nodemailer/pull/58))
- **email:** Match template placeholders literally and insert values verbatim ([#57](https://github.com/AntelopeJS/nodemailer/pull/57))
- **email:** Report provider-hosted templates as unsupported ([#60](https://github.com/AntelopeJS/nodemailer/pull/60))

### 📖 Documentation

- **readme:** Link the package to AntelopeJS and AntelopeJS DMS ([50d54a4](https://github.com/AntelopeJS/nodemailer/commit/50d54a4))

### 📦 Build

- **deps:** Bump @antelopejs packages to the 2026-11-06 releases ([#51](https://github.com/AntelopeJS/nodemailer/pull/51))
- **deps:** Bump @antelopejs/tooling-configs to 0.3.4 ([#52](https://github.com/AntelopeJS/nodemailer/pull/52))
- **deps:** Bump @antelopejs/tooling-configs to 0.4.0 ([#59](https://github.com/AntelopeJS/nodemailer/pull/59))

### 🏡 Chore

- **verify:** Remove seeded runs from the verification skill ([#48](https://github.com/AntelopeJS/nodemailer/pull/48))
- **ci:** Remove the weekly mutation caller ([#49](https://github.com/AntelopeJS/nodemailer/pull/49))

### 🤖 CI

- Call ci-node.yml@v1 ([#50](https://github.com/AntelopeJS/nodemailer/pull/50))
- **release:** Accept an exact release version ([#61](https://github.com/AntelopeJS/nodemailer/pull/61))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.0.8

[compare changes](https://github.com/AntelopeJS/nodemailer/compare/v0.0.7...v0.0.8)

### 📖 Documentation

- **github:** Send questions and ideas to Discord ([#42](https://github.com/AntelopeJS/nodemailer/pull/42))

### 🏡 Chore

- Land the cleanup campaign on main ([#46](https://github.com/AntelopeJS/nodemailer/pull/46))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.0.7

[compare changes](https://github.com/AntelopeJS/nodemailer/compare/v0.0.6...v0.0.7)

### 🩹 Fixes

- **email:** Require STARTTLS when auth is set on a non-secure port ([#41](https://github.com/AntelopeJS/nodemailer/pull/41))

### 💅 Refactors

- Clean the repo with the guardrail pack ([#28](https://github.com/AntelopeJS/nodemailer/pull/28))
- **playground:** Drop the unused construct parameter ([#31](https://github.com/AntelopeJS/nodemailer/pull/31))

### 📖 Documentation

- **readme:** Use one Discord invite ([#39](https://github.com/AntelopeJS/nodemailer/pull/39))

### 📦 Build

- **deps:** Adopt @antelopejs/interface-email 0.1.0 ([#25](https://github.com/AntelopeJS/nodemailer/pull/25))
- **deps:** Bump @antelopejs/tooling-configs to 0.2.17 ([#32](https://github.com/AntelopeJS/nodemailer/pull/32))

### 🏡 Chore

- Adopt the guardrail pack from tooling-configs 0.2.0 ([#23](https://github.com/AntelopeJS/nodemailer/pull/23))
- Configure Renovate with the shared preset ([#24](https://github.com/AntelopeJS/nodemailer/pull/24))

### ❤️ Contributors

- Antony Rizzitelli ([@Upd4ting](http://github.com/Upd4ting))

## v0.0.6

[compare changes](https://github.com/AntelopeJS/nodemailer/compare/v0.0.5...v0.0.6)

### 📖 Documentation

- Rewrite the README ([#20](https://github.com/AntelopeJS/nodemailer/pull/20))
- **agents:** Simplify repository guidance ([#21](https://github.com/AntelopeJS/nodemailer/pull/21))

### 🏡 Chore

- Align community files with the organization defaults ([#12](https://github.com/AntelopeJS/nodemailer/pull/12))
- Remove .git-blame-ignore-revs ([#13](https://github.com/AntelopeJS/nodemailer/pull/13))
- **playground:** Update antelope dependencies to latest ([#16](https://github.com/AntelopeJS/nodemailer/pull/16))

### 🤖 CI

- **release:** Release next from a dedicated branch and restore requireCommits ([#14](https://github.com/AntelopeJS/nodemailer/pull/14))
- **release:** Reference the shared release workflows through v1 ([#15](https://github.com/AntelopeJS/nodemailer/pull/15))

### ❤️ Contributors

- Antony Rizzitelli <rizzitelli.antony@pm.me>

## v0.0.5

[compare changes](https://github.com/AntelopeJS/nodemailer/compare/v0.0.4...v0.0.5)

### 🩹 Fixes

- **deps:** Require current email interface ([#11](https://github.com/AntelopeJS/nodemailer/pull/11))

### 📖 Documentation

- Document the nodemailer module ([#9](https://github.com/AntelopeJS/nodemailer/pull/9))

### 🏡 Chore

- Replace Biome with oxlint, oxfmt and Knip ([#8](https://github.com/AntelopeJS/nodemailer/pull/8))

### 🤖 CI

- Standardize npm releases ([#7](https://github.com/AntelopeJS/nodemailer/pull/7))
- Use shared npm release workflow ([#10](https://github.com/AntelopeJS/nodemailer/pull/10))

### ❤️ Contributors

- Antony Rizzitelli <rizzitelli.antony@pm.me>
- Thomas ([@Thomasims](http://github.com/Thomasims))

## v0.0.4

[compare changes](https://github.com/AntelopeJS/nodemailer/compare/v0.0.3...v0.0.4)

## v0.0.3

[compare changes](https://github.com/AntelopeJS/nodemailer/compare/v0.0.2...v0.0.3)

### 🏡 Chore

- Update dependencies ([fc91cca](https://github.com/AntelopeJS/nodemailer/commit/fc91cca))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>

## v0.0.2

### 🚀 Enhancements

- Integrate email functionality with nodemailer and logging support ([685ed20](https://github.com/AntelopeJS/nodemailer/commit/685ed20))

### 💅 Refactors

- Remove unused email event interfaces and related event handlers ([67b992f](https://github.com/AntelopeJS/nodemailer/commit/67b992f))

### 📦 Build

- Replace rm -rf with rimraf ([af480ec](https://github.com/AntelopeJS/nodemailer/commit/af480ec))
- Replace rm -rf with rimraf ([#1](https://github.com/AntelopeJS/nodemailer/pull/1))

### 🏡 Chore

- Generate interface ([d1fec1e](https://github.com/AntelopeJS/nodemailer/commit/d1fec1e))
- Add github ([6b0b0b8](https://github.com/AntelopeJS/nodemailer/commit/6b0b0b8))
- Update package.json and pnpm-lock.yaml with testing dependencies ([0e2f8ce](https://github.com/AntelopeJS/nodemailer/commit/0e2f8ce))
- Rebuild pnpm-lock.yaml ([728b838](https://github.com/AntelopeJS/nodemailer/commit/728b838))
- Replicate ai agent config files (.agents/.claude) ([#2](https://github.com/AntelopeJS/nodemailer/pull/2))
- Remove ci publish strict ts interface tests ([#3](https://github.com/AntelopeJS/nodemailer/pull/3))
- Simplify CI workflow triggers and update AGENTS.md ([468d73c](https://github.com/AntelopeJS/nodemailer/commit/468d73c))
- Migrate from local beta interfaces to published @antelopejs packages ([79bc47b](https://github.com/AntelopeJS/nodemailer/commit/79bc47b))

### 🤖 CI

- Remove test:coverage step from CI workflow ([b855a4a](https://github.com/AntelopeJS/nodemailer/commit/b855a4a))

### ❤️ Contributors

- Antony Rizzitelli <upd4ting@gmail.com>
- Glastis ([@Glastis](http://github.com/Glastis))
- MrSociety404 <fabrice@altab.be>
