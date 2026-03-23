import { defineConfig } from "@antelopejs/interface-core/config";

export default defineConfig({
  name: "nodemailer-test",
  cacheFolder: ".antelope/cache",
  logging: {
    channelFilter: {
      "*": "INFO",
    },
  },
  modules: {
    local: {
      source: {
        type: "local",
        path: ".",
        installCommand: ["npx tsc"],
      },
      config: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        defaults: {
          from: "noreply@example.com",
        },
      },
    },
  },
  test: {
    folder: "dist/test",
  },
});
