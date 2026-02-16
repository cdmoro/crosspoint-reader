import type { StatusResponse } from "./types";
import "./style.css";
import "./HomePage.css";

async function fetchStatus() {
  try {
    const response = await fetch("/api/status");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch status: ${response.status} ${response.statusText}`,
      );
    }

    const { version, ip, freeHeap } = await response.json() as StatusResponse;

    document.getElementById("version")!.textContent = version || "N/A";
    document.getElementById("ip-address")!.textContent = ip || "N/A";
    document.getElementById("free-heap")!.textContent = freeHeap
      ? `${freeHeap.toLocaleString()} bytes`
      : "N/A";
  } catch (error) {
    console.error("Error fetching status:", error);
  }
}

// Fetch status on page load
document.addEventListener("DOMContentLoaded", fetchStatus);
