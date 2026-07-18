import { defineConfig } from "vite";

// GitHub Pages custom domain (itsjakegray.com) serves from site root.
export default defineConfig({
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
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
