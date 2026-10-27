import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/site-[hash].js",
        chunkFileNames: "assets/site-[hash].js",
        assetFileNames: "assets/site-[hash][extname]",
      },
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
