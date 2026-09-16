import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      configPath: "./wrangler.jsonc",
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      // konva's package.json "main" (Node build) resolves during the SSR
      // build step and requires the optional peer "canvas" - a native
      // addon this app never installs, since the sticker editor
      // (src/components/custom-sticker/sticker-canvas.tsx) is a "use
      // client" component that only ever runs Konva in the browser. The
      // SSR bundle still has to statically resolve the import to build,
      // even though that code path never executes server-side, so
      // externalizing "canvas" here just skips bundling it - fine, since
      // nothing at runtime ever actually calls into it.
      external: ["canvas"],
    },
  },
});
