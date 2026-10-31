---
covers:
  - src/implementations/email/index.ts
  - src/implementations/email/responses.ts
docs:
  - README.md
journeys:
  - batch-continues
  - batch-stops
---

# Batch

Many messages go out one after the other with shared defaults.

## Sub-features

- `batch-continues`: three messages with one refused give totals 3, 2 sent and 1 failed, answers in message order, and the two accepted messages delivered.
- `batch-stops`: with `continueOnError: false` the batch stops at the first failure, answers only for the messages tried, and delivers only the first.

## How to get to it (user POV)

- A module that calls `SendBatch({ messages, defaults, continueOnError? })`.

## Driving it with antelopejs-verify

```bash
pnpm exec antelopejs-verify journey "$RUN" batch
```

## Gotchas

- The batch is sequential; the journeys rely on the order of the stand-in's log.
