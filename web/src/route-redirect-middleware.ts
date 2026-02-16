import type { Plugin } from "vite";

export function routeRedirectPlugin(): Plugin {
  return {
    name: "route-redirect",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === "/") {
          req.url = "/HomePage.html";
        } else if (req.url === "/settings") {
          req.url = "/SettingsPage.html";
        } else if (req.url?.startsWith("/files")) {
          req.url = "/FilesPage.html";
        }
        next();
      });
    },
  };
}