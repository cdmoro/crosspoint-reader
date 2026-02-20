import { defineConfig } from "vite";
import { routeRedirectPlugin } from "./src/route-redirect-plugin";
import { mockDevServerPlugin } from 'vite-plugin-mock-dev-server'

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [
    mode === 'mock' ? mockDevServerPlugin() : undefined,
    routeRedirectPlugin(),
  ].filter(Boolean),
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
}));
