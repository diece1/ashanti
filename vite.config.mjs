import { defineConfig } from "vite";
import { cpSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));
const outDir = fileURLToPath(new URL("./dist/", import.meta.url));
const atelier = join(root, "atelier_animations_foret_ancetres");

function atelierAssets() {
  return {
    name: "atelier-animation-assets",
    apply: "build",
    closeBundle() {
      const destination = join(outDir, "atelier_animations_foret_ancetres");
      for (const file of ["js/manifest.js", "js/animation-engine.js", "js/menu-scene.js"]) {
        const target = join(destination, file);
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(join(atelier, file), target);
      }
      cpSync(join(atelier, "assets"), join(destination, "assets"), { recursive: true });
      cpSync(join(root, "foret-bosses"), join(outDir, "foret-bosses"), { recursive: true });
    },
  };
}

export default defineConfig({
  root,
  publicDir: fileURLToPath(new URL("./public/", import.meta.url)),
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
  },
  build: {
    outDir,
    emptyOutDir: true,
  },
  plugins: [atelierAssets()],
});
