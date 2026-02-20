import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { createHtmlPlugin } from "vite-plugin-html";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const page = env.PAGE || "HomePage";

  return {
    base: "./",
    build: {
      deleteDest: false,
      outDir: "dist",
      minify: "esbuild",
      cssMinify: "lightningcss",
      rollupOptions: {
        input: {
          [page]: path.resolve(__dirname, `./${page}.html`),
        },
      },
    },
    plugins: [
      createHtmlPlugin({ minify: true }),
      viteSingleFile({
        removeViteModuleLoader: true,
        useRecommendedBuildConfig: true,
      }),
    ],
  };
});
