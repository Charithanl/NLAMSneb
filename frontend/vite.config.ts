import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const datasetPath = path.resolve(
  rootDir,
  "public/data/synthetic_acquisition_demo.csv",
);

function acquisitionDatasetPlugin() {
  return {
    name: "nlams-acquisition-dataset",
    configureServer(server: { middlewares: { use: (path: string, handler: (request: unknown, response: { setHeader: (name: string, value: string) => void; end: (body?: string) => void }) => void) => void } }) {
      server.middlewares.use("/data/synthetic_acquisition_demo.csv", (_request, response) => {
        response.setHeader("Content-Type", "text/csv; charset=utf-8");
        response.end(fs.readFileSync(datasetPath, "utf8"));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), acquisitionDatasetPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
});
