import { defineConfig } from "vite";

// itsjakegray.com is served from the site root on Vercel.
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
