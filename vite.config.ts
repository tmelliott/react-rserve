import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import { extname, relative, resolve } from "path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "dist/**"],
  },
  plugins: [
    react(),
    dts({
      tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
    }),
    nodePolyfills(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "lib/main.ts"),
      formats: ["es"],
    },
    copyPublicDir: false,
    rollupOptions: {
      external: ["react", "react/jsx-runtime"],
      input: Object.fromEntries(
        glob
          .sync("lib/**/*.{ts,tsx}", {
            ignore: [
              "lib/**/*.d.ts",
              "lib/**/*.test.ts",
              "lib/**/*.test.tsx",
              "lib/**/typetest.ts",
              "lib/**/mre/**",
            ],
          })
          .map((file) => [
            // The name of the entry point
            // lib/nested/foo.ts becomes nested/foo
            relative("lib", file.slice(0, file.length - extname(file).length)),
            // The absolute path to the entry file
            // lib/nested/foo.ts becomes /project/lib/nested/foo.ts
            fileURLToPath(new URL(file, import.meta.url)),
          ])
      ),
      output: {
        assetFileNames: "assets/[name][extname]",
        entryFileNames: "[name].js",
      },
    },
  },
});
