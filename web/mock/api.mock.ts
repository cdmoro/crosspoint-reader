import { defineMock } from "vite-plugin-mock-dev-server";
import { status } from "./status.mock";
import { getFilesByPath } from "./files.mock";
import { settings } from "./settings.mock";

export default defineMock([
  {
    url: "/api/status",
    body: status,
  },
  {
    url: "/api/files",
    body(request) {
      return getFilesByPath((request.query.path as string) || "/");
    },
  },
  {
    url: "/api/settings",
    body: settings,
  },
]);
