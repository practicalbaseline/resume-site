import { defineConfig } from "vite";

// GitHub Pages custom domain (itsjakegray.com) serves from site root.
export default defineConfig({
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
