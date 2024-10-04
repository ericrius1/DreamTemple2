import { defineConfig } from "vite"
import glsl from "vite-plugin-glsl"
import topLevelAwait from "vite-plugin-top-level-await"

export default defineConfig({
  server: {
    open: true,
  },
  // Apply the top-level await plugin to our vite.config.js
  plugins: [
    glsl(),
    topLevelAwait({
      promiseExportName: "__tla",
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
})
