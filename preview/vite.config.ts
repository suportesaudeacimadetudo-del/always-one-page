import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig({
  root: path.join(repositoryRoot, "preview"),
  base: "./",
  publicDir: path.join(repositoryRoot, "public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@tanstack/react-start": path.join(repositoryRoot, "preview/client-only.ts"),
      "@": path.join(repositoryRoot, "src"),
    },
  },
  build: {
    outDir: path.join(repositoryRoot, "dist-preview"),
    emptyOutDir: true,
  },
});
