import type { FailedFile, FileEntry } from "./types";
import "./style.css";
import "./FilesPage.css";
import { escapeHtml } from "./utils";

// get current path from query parameter
const currentPath = decodeURIComponent(
  new URLSearchParams(window.location.search).get("path") || "/",
);
const FILE_EXTENSION_REGEX = /\.([0-9a-z]+)(?:[\?#]|$)/i;

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(2)).toLocaleString() +
    " " +
    sizes[i]
  );
}

async function hydrate() {
  // Close modals when clicking overlay
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("open");
      }
    });
  });

  const breadcrumbs = document.getElementById("directory-breadcrumbs")!;
  const fileTable = document.getElementById("file-table")!;

  let breadcrumbContent = '<span class="sep">/</span>';
  if (currentPath === "/") {
    breadcrumbContent +=
      '<span class="current"><svg class="icon" aria-hidden="true"><use href="#icon-home"></use></svg></span>';
  } else {
    breadcrumbContent +=
      '<a href="/files"><svg class="icon" aria-hidden="true"><use href="#icon-home"></use></svg></a>';
    const pathSegments = currentPath.split("/");
    pathSegments
      .slice(1, pathSegments.length - 1)
      .forEach(function (segment, index) {
        breadcrumbContent +=
          '<span class="sep">/</span><a href="/files?path=' +
          encodeURIComponent(pathSegments.slice(0, index + 2).join("/")) +
          '">' +
          escapeHtml(segment) +
          "</a>";
      });
    breadcrumbContent += '<span class="sep">/</span>';
    breadcrumbContent +=
      '<span class="current">' +
      escapeHtml(pathSegments[pathSegments.length - 1]) +
      "</span>";
  }
  breadcrumbs.innerHTML = breadcrumbContent;

  let files = [];
  try {
    const response = await fetch(
      "/api/files?path=" + encodeURIComponent(currentPath),
    );
    if (!response.ok) {
      throw new Error(
        "Failed to load files: " + response.status + " " + response.statusText,
      );
    }
    files = await response.json() as FileEntry[];
  } catch (e) {
    fileTable.innerHTML =
      '<div class="no-files">An error occurred while loading the files</div>';
    return;
  }

  let folderCount = 0;
  let totalSize = 0;
  files.forEach((file) => {
    if (file.isDirectory) folderCount++;
    totalSize += file.size;
  });

  document.getElementById("folder-summary")!.innerHTML =
    `${folderCount} folders, ${files.length - folderCount} files, ${formatFileSize(totalSize)}`;

  if (files.length === 0) {
    fileTable.innerHTML = '<div class="no-files">This folder is empty</div>';
  } else {
    let fileTableContent = '<table class="file-table">';
    fileTableContent +=
      '<thead><tr><th></th><th>Name</th><th>Type</th><th class="size-col">Size</th><th class="actions-col">Actions</th></tr></thead>';
    fileTableContent += "<tbody>";

    const sortedFiles = files.sort((a, b) => {
      // Directories first, then epub files, then other files, alphabetically within each group
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      if (a.isEpub && !b.isEpub) return -1;
      if (!a.isEpub && b.isEpub) return 1;
      return a.name.localeCompare(b.name);
    });

    sortedFiles.forEach((file) => {
      if (file.isDirectory) {
        let folderPath = currentPath;
        if (!folderPath.endsWith("/")) folderPath += "/";
        folderPath += file.name;

        fileTableContent += '<tr class="folder-row">';
        fileTableContent +=
          '<td><span class="file-icon"><svg class="icon icon-folder" aria-hidden="true"><use href="#icon-folder"></use></svg></span></td>';
        fileTableContent += `<td><a href="/files?path=${encodeURIComponent(folderPath)}" class="folder-link">${escapeHtml(file.name)}</a></td>`;
        fileTableContent += "<td>Folder</td>";
        fileTableContent +=
          '<td class="size-col text-nowrap text-end">&ndash;</td>';
        fileTableContent += `<td class="text-end"><div class="action-icon-group"><button class="btn btn-icon btn-danger delete-btn" onclick="openDeleteModal('${file.name.replaceAll("'", "\\'")}', '${folderPath.replaceAll("'", "\\'")}', true)" title="Delete folder"><svg class="icon icon-trash" aria-hidden="true"><use href="#icon-trash"></use></svg></button></div></td>`;
        fileTableContent += "</tr>";
      } else {
        let filePath = currentPath;
        if (!filePath.endsWith("/")) filePath += "/";
        filePath += file.name;

        const match = file.name.match(FILE_EXTENSION_REGEX);
        const fileExtension = match ? match[1].toUpperCase() : "";
        const icon = file.isEpub ? "epub" : "file";

        fileTableContent += `<tr class="${file.isEpub ? "epub-file" : ""}">`;
        fileTableContent += `<td><span class="file-icon"><svg class="icon icon-${icon}" aria-hidden="true"><use href="#icon-${icon}"></use></svg></span></td>`;
        fileTableContent += `<td>${escapeHtml(file.name)}`;
        fileTableContent += "</td>";
        fileTableContent += `<td>${fileExtension}</td>`;
        fileTableContent += `<td class="size-col text-nowrap text-end"><code>${formatFileSize(file.size)}</code></td>`;
        fileTableContent += `<td class="text-end"><div class="action-icon-group">`;
        fileTableContent += `<button class="btn btn-icon move-btn" onclick="openMoveModal('${file.name.replaceAll("'", "\\'")}', '${filePath.replaceAll("'", "\\'")}', ${file.isEpub})" title="Move file"><svg class="icon icon-move-file" aria-hidden="true"><use href="#icon-move-file"></use></svg></button>`;
        fileTableContent += `<button class="btn btn-icon rename-btn" onclick="openRenameModal('${file.name.replaceAll("'", "\\'")}', '${filePath.replaceAll("'", "\\'")}', ${file.isEpub})" title="Rename file"><svg class="icon icon-edit" aria-hidden="true"><use href="#icon-edit"></use></svg></button>`;
        fileTableContent += `<button class="btn btn-icon btn-danger delete-btn" onclick="openDeleteModal('${file.name.replaceAll("'", "\\'")}', '${filePath.replaceAll("'", "\\'")}', false, ${file.isEpub})" title="Delete file"><svg class="icon icon-trash" aria-hidden="true"><use href="#icon-trash"></use></svg></button>`;
        fileTableContent += `</div></td>`;
        fileTableContent += "</tr>";
      }
    });

    fileTableContent += "</tbody>";
    fileTableContent += "</table>";
    fileTable.innerHTML = fileTableContent;
  }
}

// Modal functions
function openUploadModal() {
  document.getElementById("uploadPathDisplay")!.innerHTML =
    currentPath === "/"
      ? '/ <svg class="icon" aria-hidden="true"><use href="#icon-home"></use></svg>'
      : currentPath;
  document.getElementById("uploadModal")!.classList.add("open");
}

function closeUploadModal() {
  document.getElementById("uploadModal")!.classList.remove("open");
  (document.getElementById("fileInput") as HTMLInputElement)!.value = "";
  (document.getElementById("uploadBtn") as HTMLButtonElement)!.disabled = true;
  document.getElementById("progress-container")!.style.display = "none";
  document.getElementById("progress-fill")!.style.width = "0%";
  document.getElementById("progress-fill")!.style.backgroundColor = "#27ae60";
}

function openFolderModal() {
  document.getElementById("folderPathDisplay")!.textContent =
    currentPath === "/" ? "/ root" : currentPath;
  document.getElementById("folderModal")!.classList.add("open");
  (document.getElementById("folderName") as HTMLInputElement)!.value = "";
  document.getElementById("folderName")!.focus();
}

function closeFolderModal() {
  document.getElementById("folderModal")!.classList.remove("open");
}

function validateFile() {
  const fileInput = document.getElementById("fileInput")! as HTMLInputElement;
  const uploadBtn = document.getElementById("uploadBtn")! as HTMLButtonElement;
  const files = fileInput.files;
  uploadBtn.disabled = !(files && files.length > 0);
}

let failedUploadsGlobal: FailedFile[] = [];
const WS_PORT = 81;
const WS_CHUNK_SIZE = 4096; // 4KB chunks - smaller for ESP32 stability

// Get WebSocket URL based on current page location
function getWsUrl() {
  const host = window.location.hostname;
  return `ws://${host}:${WS_PORT}/`;
}

// Upload file via WebSocket (faster, binary protocol)
function uploadFileWebSocket(file: File, onProgress?: (uploaded: number, total: number) => void, onComplete?: () => void, onError?: (error: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(getWsUrl());
    let uploadStarted = false;
    let sendingChunks = false;

    ws.binaryType = "arraybuffer";

    ws.onopen = function () {
      console.log("[WS] Connected, starting upload:", file.name);
      // Send start message: START:<filename>:<size>:<path>
      ws.send(`START:${file.name}:${file.size}:${currentPath}`);
    };

    ws.onmessage = async function (event) {
      const msg = event.data;
      console.log("[WS] Message:", msg);

      if (msg === "READY") {
        uploadStarted = true;
        sendingChunks = true;

        // Small delay to let connection stabilize
        await new Promise((r) => setTimeout(r, 50));

        try {
          // Send file in chunks
          const totalSize = file.size;
          let offset = 0;

          while (offset < totalSize && ws.readyState === WebSocket.OPEN) {
            const chunkSize = Math.min(WS_CHUNK_SIZE, totalSize - offset);
            const chunk = file.slice(offset, offset + chunkSize);
            const buffer = await chunk.arrayBuffer();

            // Wait for buffer to clear - more aggressive backpressure
            while (
              ws.bufferedAmount > WS_CHUNK_SIZE * 2 &&
              ws.readyState === WebSocket.OPEN
            ) {
              await new Promise((r) => setTimeout(r, 5));
            }

            if (ws.readyState !== WebSocket.OPEN) {
              throw new Error("WebSocket closed during upload");
            }

            ws.send(buffer);
            offset += chunkSize;

            // Update local progress - cap at 95% since server still needs to write
            // Final 100% shown when server confirms DONE
            if (onProgress) {
              const cappedOffset = Math.min(
                offset,
                Math.floor(totalSize * 0.95),
              );
              onProgress(cappedOffset, totalSize);
            }
          }

          sendingChunks = false;
          console.log("[WS] All chunks sent, waiting for DONE");
        } catch (err) {
          console.error("[WS] Error sending chunks:", err);
          sendingChunks = false;
          ws.close();
          reject(err);
        }
      } else if (msg.startsWith("PROGRESS:")) {
        // Server confirmed progress - log for debugging but don't update UI
        // (local progress is smoother, server progress causes jumping)
        console.log("[WS] Server progress:", msg);
      } else if (msg === "DONE") {
        // Show 100% when server confirms completion
        if (onProgress) onProgress(file.size, file.size);
        ws.close();
        if (onComplete) onComplete();
        resolve();
      } else if (msg.startsWith("ERROR:")) {
        const error = msg.substring(6);
        ws.close();
        if (onError) onError(error);
        reject(new Error(error));
      }
    };

    ws.onerror = function (event) {
      console.error("[WS] Error:", event);
      if (!uploadStarted) {
        reject(new Error("WebSocket connection failed"));
      } else if (!sendingChunks) {
        reject(new Error("WebSocket error during upload"));
      }
    };

    ws.onclose = function (event) {
      console.log(
        "[WS] Connection closed, code:",
        event.code,
        "reason:",
        event.reason,
      );
      if (sendingChunks) {
        reject(new Error("WebSocket closed unexpectedly"));
      }
    };
  });
}

// Upload file via HTTP (fallback method)
function uploadFileHTTP(file: File, onProgress?: (uploaded: number, total: number) => void, onComplete?: () => void, onError?: (error: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload?path=" + encodeURIComponent(currentPath), true);

    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded, e.total);
      }
    };

    xhr.onload = function () {
      if (xhr.status === 200) {
        if (onComplete) onComplete();
        resolve();
      } else {
        const error = xhr.responseText || "Upload failed";
        if (onError) onError(error);
        reject(new Error(error));
      }
    };

    xhr.onerror = function () {
      const error = "Network error";
      if (onError) onError(error);
      reject(new Error(error));
    };

    xhr.send(formData);
  });
}

function uploadFile(event: Event) {
  event.preventDefault();
  const fileInput = document.getElementById("fileInput") as HTMLInputElement;
  const files = Array.from(fileInput.files || []);

  if (files.length === 0) {
    alert("Please select at least one file!");
    return;
  }

  const progressContainer = document.getElementById("progress-container") as HTMLDivElement;
  const progressFill = document.getElementById("progress-fill") as HTMLDivElement;
  const progressText = document.getElementById("progress-text") as HTMLDivElement;
  const uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement;

  progressContainer.style.display = "block";
  uploadBtn.disabled = true;

  let currentIndex = 0;
  const failedFiles: FailedFile[] = [];
  let useWebSocket = true; // Try WebSocket first

  async function uploadNextFile() {
    if (currentIndex >= files.length) {
      // All files processed - show summary
      if (failedFiles.length === 0) {
        progressFill.style.backgroundColor = "#4caf50";
        progressText.textContent = "All uploads complete!";
        setTimeout(() => {
          closeUploadModal();
          hydrate();
        }, 1000);
      } else {
        progressFill.style.backgroundColor = "#e74c3c";
        const failedList = failedFiles.map((f) => f.name).join(", ");
        progressText.textContent = `${files.length - failedFiles.length}/${files.length} uploaded. Failed: ${failedList}`;
        failedUploadsGlobal = failedFiles;
        setTimeout(() => {
          closeUploadModal();
          showFailedUploadsBanner();
          hydrate();
        }, 2000);
      }
      return;
    }

    const file = files[currentIndex];
    progressFill.style.width = "0%";
    progressFill.style.backgroundColor = "#27ae60";
    const methodText = useWebSocket ? " [WS]" : " [HTTP]";
    progressText.textContent = `Uploading ${file.name} (${currentIndex + 1}/${files.length})${methodText}`;

    const onProgress = (loaded: number, total: number) => {
      const percent = Math.round((loaded / total) * 100);
      progressFill.style.width = percent + "%";
      progressText.textContent = `Uploading ${file.name} (${currentIndex + 1}/${files.length})${methodText} — ${percent}%`;
    };

    const onComplete = () => {
      currentIndex++;
      uploadNextFile();
    };

    const onError = (error: string) => {
      failedFiles.push({ name: file.name, error, file: file });
      currentIndex++;
      uploadNextFile();
    };

    try {
      if (useWebSocket) {
        await uploadFileWebSocket(file, onProgress);
        onComplete();
      } else {
        await uploadFileHTTP(file, onProgress);
        onComplete();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      if (useWebSocket && error.message === "WebSocket connection failed") {
        // Fall back to HTTP for all subsequent uploads
        console.log("WebSocket failed, falling back to HTTP");
        useWebSocket = false;
        // Retry this file with HTTP
        try {
          await uploadFileHTTP(file, onProgress);
          onComplete();
        } catch (httpError: any) {
          onError(httpError.message);
        }
      } else {
        onError(error.message);
      }
    }
  }

  uploadNextFile();
}

function showFailedUploadsBanner() {
  const banner = document.getElementById("failedUploadsBanner")!;
  const filesList = document.getElementById("failedFilesList")!;

  filesList.innerHTML = "";

  failedUploadsGlobal.forEach((failedFile, index) => {
    const match = failedFile.name.match(FILE_EXTENSION_REGEX);
    const fileExtension = match ? match[1].toUpperCase() : "";
    const icon = fileExtension === "EPUB" ? "epub" : "file";

    const item = document.createElement("div");
    item.className = "failed-file-item";
    item.innerHTML = `
      <div class="failed-file-info">
        <div class="failed-file-name"><svg class="icon icon-${icon}" aria-hidden="true"><use href="#icon-${icon}"></use></svg> ${escapeHtml(failedFile.name)}</div>
        <div class="failed-file-error">Error: ${escapeHtml(failedFile.error)}</div>
      </div>
      <button class="btn btn-sm retry-btn" onclick="retrySingleUpload(${index})">Retry</button>
    `;
    filesList.appendChild(item);
  });

  // Ensure retry all button is visible
  const retryAllBtn = banner.querySelector<HTMLButtonElement>(".retry-all-btn");
  if (retryAllBtn) retryAllBtn.style.display = "";

  banner.classList.add("show");
}

function dismissFailedUploads() {
  const banner = document.getElementById("failedUploadsBanner")!;
  banner.classList.remove("show");
  failedUploadsGlobal = [];
}

function retrySingleUpload(index: number) {
  const failedFile = failedUploadsGlobal[index];
  if (!failedFile) return;

  // Create a DataTransfer to set the file input
  const dt = new DataTransfer();
  dt.items.add(failedFile.file);

  const fileInput = document.getElementById("fileInput")! as HTMLInputElement;
  fileInput.files = dt.files;

  // Remove this file from failed list
  failedUploadsGlobal.splice(index, 1);

  // If no more failed files, hide banner
  if (failedUploadsGlobal.length === 0) {
    dismissFailedUploads();
  }

  // Open modal and trigger upload
  openUploadModal();
  validateFile();
}

function retryAllFailedUploads() {
  if (failedUploadsGlobal.length === 0) return;

  // Create a DataTransfer with all failed files
  const dt = new DataTransfer();
  failedUploadsGlobal.forEach((failedFile) => {
    dt.items.add(failedFile.file);
  });

  const fileInput = document.getElementById("fileInput") as HTMLInputElement;
  fileInput.files = dt.files;

  // Clear failed files list
  failedUploadsGlobal = [];
  dismissFailedUploads();

  // Open modal and trigger upload
  openUploadModal();
  validateFile();
}

function createFolder() {
  const folderName = (document.getElementById("folderName") as HTMLInputElement)!.value.trim();

  if (!folderName) {
    alert("Please enter a folder name!");
    return;
  }

  // Validate folder name
  const validName = /^(?!\.{1,2}$)[^"*:<>?\/\\|]+$/.test(folderName);
  if (!validName) {
    alert(
      'Folder name cannot contain \" * : < > ? / \\ | and must not be . or ..',
    );
    return;
  }

  const formData = new FormData();
  formData.append("name", folderName);
  formData.append("path", currentPath);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/mkdir", true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      window.location.reload();
    } else {
      alert("Failed to create folder: " + xhr.responseText);
    }
  };

  xhr.onerror = function () {
    alert("Failed to create folder - network error");
  };

  xhr.send(formData);
}

// Rename functions
function openRenameModal(name: string, path: string, isEpub = false) {
  const iconType = isEpub ? "epub" : "file";
  document.getElementById("renameItemName")!.innerHTML =
    `<svg class="icon icon-${iconType}" aria-hidden="true"><use href="#icon-${iconType}"></use></svg> ${name}`;
  (document.getElementById("renameItemPath") as HTMLInputElement)!.value = path;
  (document.getElementById("renameNewName") as HTMLInputElement)!.value = name;
  document.getElementById("renameModal")!.classList.add("open");
  setTimeout(() => {
    const input = document.getElementById("renameNewName")! as HTMLInputElement;
    input.focus();
    input.select();
  }, 50);
}

function closeRenameModal() {
  document.getElementById("renameModal")!.classList.remove("open");
}

function confirmRename() {
  const path = (document.getElementById("renameItemPath")! as HTMLInputElement).value;
  const newName = (document.getElementById("renameNewName")! as HTMLInputElement).value.trim();

  if (!newName) {
    alert("Please enter a new name.");
    return;
  }
  if (newName.includes("/") || newName.includes("\\")) {
    alert("File name cannot include slashes.");
    return;
  }

  const formData = new FormData();
  formData.append("path", path);
  formData.append("name", newName);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/rename", true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      window.location.reload();
    } else {
      alert("Failed to rename: " + xhr.responseText);
    }
    closeRenameModal();
  };

  xhr.onerror = function () {
    alert("Failed to rename - network error");
    closeRenameModal();
  };

  xhr.send(formData);
}

// Move functions
function normalizePath(path: string) {
  if (!path) return "/";
  let normalized = path.trim();
  if (!normalized.startsWith("/")) normalized = "/" + normalized;
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function getParentPath(path: string) {
  const normalized = normalizePath(path);
  if (normalized === "/") return "/";
  const idx = normalized.lastIndexOf("/");
  return idx <= 0 ? "/" : normalized.slice(0, idx);
}

async function loadMoveFolderOptions() {
  const options = new Set<string>();
  options.add("/");
  const parent = getParentPath(currentPath);
  if (parent) options.add(parent);

  async function fetchFolders(path: string) {
    try {
      const response = await fetch(
        "/api/files?path=" + encodeURIComponent(path),
      );
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      return [];
    }
  }

  const rootFiles = await fetchFolders("/") as FileEntry[];
  rootFiles.forEach((file) => {
    if (file.isDirectory) {
      options.add("/" + file.name);
    }
  });

  if (currentPath !== "/") {
    const currentFiles = await fetchFolders(currentPath) as FileEntry[];
    currentFiles.forEach((file) => {
      if (file.isDirectory) {
        let folderPath = currentPath;
        if (!folderPath.endsWith("/")) folderPath += "/";
        folderPath += file.name;
        options.add(folderPath);
      }
    });
  }

  const dataList = document.getElementById("moveFolderOptions")! as HTMLDataListElement;
  dataList.innerHTML = "";
  Array.from(options)
    .sort()
    .forEach((path) => {
      const option = document.createElement("option");
      option.value = path;
      dataList.appendChild(option);
    });
}

function openMoveModal(name: string, path: string, isEpub = false) {
  const iconType = isEpub ? "epub" : "file";
  document.getElementById("moveItemName")!.innerHTML =
    `<svg class="icon icon-${iconType}" aria-hidden="true"><use href="#icon-${iconType}"></use></svg> ${name}`;
  (document.getElementById("moveItemPath") as HTMLInputElement)!.value = path;
  (document.getElementById("moveDestPath") as HTMLInputElement)!.value =
    currentPath === "/" ? "/" : currentPath;
  document.getElementById("moveModal")!.classList.add("open");
  loadMoveFolderOptions();
  setTimeout(() => {
    (document.getElementById("moveDestPath") as HTMLInputElement)!.focus();
  }, 50);
}

function closeMoveModal() {
  document.getElementById("moveModal")!.classList.remove("open");
}

function confirmMove() {
  const path = (document.getElementById("moveItemPath") as HTMLInputElement)!.value;
  const destPath = normalizePath((document.getElementById("moveDestPath") as HTMLInputElement)!.value);

  if (!destPath) {
    alert("Please enter a destination folder.");
    return;
  }

  const formData = new FormData();
  formData.append("path", path);
  formData.append("dest", destPath);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/move", true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      window.location.reload();
    } else {
      alert("Failed to move: " + xhr.responseText);
    }
    closeMoveModal();
  };

  xhr.onerror = function () {
    alert("Failed to move - network error");
    closeMoveModal();
  };

  xhr.send(formData);
}

// Delete functions
function openDeleteModal(name: string, path: string, isFolder: boolean, isEpub = false) {
  const iconType = isFolder ? "folder" : isEpub ? "epub" : "file";
  document.getElementById("deleteItemName")!.innerHTML =
    `<svg class="icon icon-${iconType}" aria-hidden="true"><use href="#icon-${iconType}"></use></svg> ${name}`;
  (document.getElementById("deleteItemPath") as HTMLInputElement)!.value = path;
  (document.getElementById("deleteItemType") as HTMLInputElement)!.value = isFolder
    ? "folder"
    : "file";
  document.getElementById("deleteModal")!.classList.add("open");
}

function closeDeleteModal() {
  document.getElementById("deleteModal")!.classList.remove("open");
}

function confirmDelete() {
  const path = (document.getElementById("deleteItemPath") as HTMLInputElement).value;
  const itemType = (document.getElementById("deleteItemType") as HTMLInputElement).value;

  const formData = new FormData();
  formData.append("path", path);
  formData.append("type", itemType);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/delete", true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      window.location.reload();
    } else {
      alert("Failed to delete: " + xhr.responseText);
      closeDeleteModal();
    }
  };

  xhr.onerror = function () {
    alert("Failed to delete - network error");
    closeDeleteModal();
  };

  xhr.send(formData);
}

document.addEventListener("DOMContentLoaded", () => {
    hydrate();

    document.querySelector(".upload-action-btn")!.addEventListener("click", openUploadModal);
    document.querySelector("#uploadModal .modal-close")!.addEventListener("click", closeUploadModal);
    
    document.querySelector(".folder-action-btn")!.addEventListener("click", openFolderModal);
    document.querySelector("#folderModal .modal-close")!.addEventListener("click", closeFolderModal);
    document.getElementById("uploadForm")!.addEventListener("submit", uploadFile);
    document.getElementById("fileInput")!.addEventListener("change", validateFile);
    document.getElementById("createFolderBtn")!.addEventListener("click", createFolder);
    document.getElementById("renameConfirmBtn")!.addEventListener("click", confirmRename);
    document.getElementById("moveConfirmBtn")!.addEventListener("click", confirmMove);
    document.getElementById("deleteConfirmBtn")!.addEventListener("click", confirmDelete);
    document.getElementById("deleteConfirmBtn")!.addEventListener("click", retryAllFailedUploads);
    document.getElementById("deleteConfirmBtn")!.addEventListener("click", () => retrySingleUpload);
    document.getElementById("deleteConfirmBtn")!.addEventListener("click", () => openMoveModal);
    document.getElementById("deleteConfirmBtn")!.addEventListener("click", () => openRenameModal);
    document.getElementById("deleteConfirmBtn")!.addEventListener("click", () => openDeleteModal);
});