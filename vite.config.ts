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
        // Stable-ish names with hash; prefix avoids Cloudflare caching a prior 404
        // on generic /assets/index-*.js during first Pages publish.
        entryFileNames: "assets/laser-[hash].js",
        chunkFileNames: "assets/laser-[hash].js",
        assetFileNames: "assets/laser-[hash][extname]",
      },
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
