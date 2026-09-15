import { test as base } from "@playwright/test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

// Module-response fixtures need a dev server; the rest of E2E uses the production build.
export const fixtureTest = base.extend<{ fixtureUrl: string }>({
  fixtureUrl: async ({}, use) => {
    const server = await createServer({
      root: fileURLToPath(new URL("../../", import.meta.url)),
      server: { host: "127.0.0.1", port: 0, hmr: false, watch: null },
    });
    try {
      await server.listen();
      const address = server.httpServer?.address();
      if (!address || typeof address === "string")
        throw new Error(
          "E2E_FIXTURE_SERVER_MISSING: fixture server did not open a TCP port",
        );
      await use(`http://127.0.0.1:${address.port}/`);
    } finally {
      await server.close();
    }
  },
});
