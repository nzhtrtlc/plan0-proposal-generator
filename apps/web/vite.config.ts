import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import packageJson from "./package.json" with { type: "json" };

// https://vite.dev/config/
export default defineConfig({
   plugins: [react(), tailwindcss()],
   define: {
      APP_VERSION: JSON.stringify(packageJson.version),
   },
   resolve: {
      alias: {
         "@packages/types": path.resolve(__dirname, "../../packages/types/index.ts"),
         "@packages/utils": path.resolve(__dirname, "../../packages/utils/index.ts"),
      },
   },
});
