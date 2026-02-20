import { StatusResponse } from "../src/types";

export const status = {
  version: "1.0.0",
  ip: "192.168.0.68",
  freeHeap: 123456,
} satisfies StatusResponse;
