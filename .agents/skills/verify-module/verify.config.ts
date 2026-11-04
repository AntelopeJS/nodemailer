import type { VerifyConfig } from "@antelopejs/tooling-configs/verify";

import { batchJourneys } from "./journeys-batch.ts";
import { sendJourneys } from "./journeys-send.ts";
import { smokeJourneys } from "./journeys-smoke.ts";
import { templateJourneys } from "./journeys-templates.ts";
import { transportJourneys } from "./journeys-transport.ts";
import { DEFAULT_FROM } from "./session.ts";

const config: VerifyConfig = {
  doors: {
    data: null,
    format: null,
    contract: {
      globs: ["package.json"],
      funnels: [],
      containments: [],
      why: "the config keys (`host`, `port`, `secure`, `auth`, `defaults`, `ethereal`) and the email interface range `antelopeJs.implements` and `dependencies` declare",
    },
    outbound: {
      globs: ["src/implementations/email/transporter.ts", "src/implementations/email/config.ts", "src/implementations/email/index.ts"],
      funnels: ["src/implementations/email/transporter.ts"],
      containments: [],
      why: "every email the module sends leaves through this one SMTP transport with the operator's host, port and credentials: its options decide which server receives what and whether the credentials are sent",
    },
    exposure: null,
    publish: {
      globs: ["package.json", ".release-it.json", "changelogen.config.json", ".github/workflows/release.yml"],
      funnels: [],
      containments: [],
      why: "the package name and release workflow claim @antelopejs/nodemailer on npm",
    },
  },
  moduleConfig() {
    return { host: "127.0.0.1", port: 9, secure: false, defaults: { from: DEFAULT_FROM } };
  },
  journeys: { ...sendJourneys, ...batchJourneys, ...templateJourneys, ...transportJourneys, ...smokeJourneys },
};

export default config;
