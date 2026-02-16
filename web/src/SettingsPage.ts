import type { Setting } from "./types";
import "./style.css";
import "./SettingsPage.css";

let allSettings: Setting[] = [];
let originalValues: Record<string, unknown> = {};
const VALID_SETTING_TYPES = ["toggle", "enum", "value", "string"];

function escapeHtml(unsafe: string) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(text: string, type: "info" | "success" | "error" = "info") {
  const toast = document.getElementById("toast")!;
  toast.textContent = text;
  toast.className = "toast toast-" + type;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 4000);
}

function renderControl(setting: Setting) {
  const id = `setting-${setting.key}`;

  if (setting.type === "toggle") {
    const checked = setting.value ? "checked" : "";
    return `
        <label class="toggle-switch">
            <input type="checkbox" id="${id}" ${checked}>
            <span class="toggle-slider"></span>
        </label>`;
  }

  if (setting.type === "enum") {
    let html = `<select id="${id}">`;
    setting.options.forEach((opt, idx: number) => {
      const selected = idx === setting.value ? " selected" : "";
      html += `<option value="${idx}"${selected}>${escapeHtml(opt)}</option>`;
    });
    html += "</select>";
    return html;
  }

  if (setting.type === "value") {
    return `
        <input type="number" id="${id}" 
            value="${setting.value}" min="${setting.min}"
            max="${setting.max}" step="${setting.step}"
        >`;
  }

  if (setting.type === "string") {
    const inputType = setting.name.toLowerCase().includes("password")
      ? "password"
      : "text";
    const val = setting.value || "";
    return `<input type="${inputType}" id="${id}" value="${escapeHtml(val)}">`;
  }
}

function getValue(setting: Setting) {
  const el = document.getElementById(
    "setting-" + setting.key,
  ) as HTMLInputElement;
  if (!el) return undefined;

  switch (setting.type) {
    case "toggle":
      return el.checked ? 1 : 0;
    case "enum":
    case "value":
      return parseInt(el.value, 10);
    case "string":
      return el.value;
    default:
      return undefined;
  }
}

function markChanged() {
  document.querySelector<HTMLButtonElement>("#saveBtn")!.disabled = false;
}

async function loadSettings() {
  try {
    const response = await fetch("/api/settings");
    if (!response.ok) {
      throw new Error(`Failed to load settings: ${response.status}`);
    }
    allSettings = await response.json() as Setting[];

    // Store original values
    originalValues = {};
    allSettings.forEach((s) => {
      originalValues[s.key] = s.value;
    });

    // Group by category
    const groups: Record<string, Setting[]> = {};
    allSettings.forEach(function (s) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });

    const container = document.getElementById("settings-container")!;
    let html = "";

    for (const category in groups) {
      html += `<div class="card"><h3>${escapeHtml(category)}</h3>`;
      groups[category].forEach((s) => {
        if (!VALID_SETTING_TYPES.includes(s.type)) return;

        html += `
            <div class="setting-row">
                <span class="setting-name">${escapeHtml(s.name)}</span>
                <span class="setting-control">${renderControl(s)}</span>
          </div>`;
      });
      html += "</div>";
    }

    container.innerHTML = html;
    document.getElementById("save-container")!.style.display = "";
    document.querySelector<HTMLButtonElement>("#saveBtn")!.disabled = true;
  } catch (e) {
    console.error(e);
    document.getElementById("settings-container")!.innerHTML =
      `<div class="card"><p style="text-align:center;color:#e74c3c;">Failed to load settings</p></div>`;
  }
}

async function saveSettings(event: Event) {
  const btn = event.target as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = "Saving...";

  // Collect only changed values
  const changes: Record<string, unknown> = {};
  allSettings.forEach(function (s) {
    const current = getValue(s);
    if (current !== undefined && current !== originalValues[s.key]) {
      changes[s.key] = current;
    }
  });

  if (Object.keys(changes).length === 0) {
    showToast("No changes to save.");
    btn.textContent = "Save Settings";
    return;
  }

  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Save failed");
    }

    // Update original values to new values
    for (const key in changes) {
      originalValues[key] = changes[key];
    }

    showToast("Settings saved successfully!", "success");
  } catch (e) {
    console.error(e);
    showToast(
      "Error: " + (e instanceof Error ? e.message : String(e)),
      "error",
    );
  }

  btn.textContent = "Save Settings";
}

function init() {
  loadSettings();

  document.querySelectorAll("input[type='number'], input[type='checkbox'],select").forEach((el) => {
    el.addEventListener("change", markChanged);
  });
  document.querySelectorAll("input[type='text'], input[type='password']").forEach((el) => {
    el.addEventListener("input", markChanged);
  });
  document.getElementById("saveBtn")!.addEventListener("click", saveSettings);
}

document.addEventListener("DOMContentLoaded", init);
