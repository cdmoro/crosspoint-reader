import { defineConfig } from "vite";
import { routeRedirectPlugin } from "./src/route-redirect-middleware";
import { mockDevServerPlugin } from 'vite-plugin-mock-dev-server'

export default defineConfig({
  base: "./",
  plugins: [
    mockDevServerPlugin(),
    routeRedirectPlugin(),
  ],
  server: {
    open: "/HomePage.html",
    proxy: {
      "/api": {
        target: "http://192.168.0.68",
        changeOrigin: true,
      },
    },
    fs: {
      strict: false,
    },
  },
});
