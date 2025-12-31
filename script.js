// ===== DOM ELEMENTS =====
const fileInput = document.getElementById("fileInput");
const statusText = document.getElementById("status");
const passwordInput = document.getElementById("passwordInput");
const encryptBtn = document.getElementById("encryptBtn");
const decryptBtn = document.getElementById("decryptBtn");

// ===== GLOBAL STATE =====
let fileBuffer = null;
let originalFileName = null;
let originalFileType = null;

// ===== FILE HANDLING =====
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];

  if (!file) {
    statusText.textContent = "No file selected.";
    return;
  }

  try {
    fileBuffer = await file.arrayBuffer();
    originalFileName = file.name;
    originalFileType = file.type;

    statusText.textContent = `Loaded file: ${file.name}`;
  } catch (error) {
    console.error(error);
    statusText.textContent = "Failed to read file.";
  }
});

// ===== KEY DERIVATION =====
async function deriveKeyFromPassword(password, salt) {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ===== METADATA HELPERS =====
function encodeMetadata(name, type) {
  return new TextEncoder().encode(JSON.stringify({ name, type }));
}

function decodeMetadata(bytes) {
  return JSON.parse(new TextDecoder().decode(bytes));
}

// ===== ENCRYPTION =====
async function encryptData(password, dataBuffer) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    dataBuffer
  );

  const metadataBytes = encodeMetadata(originalFileName, originalFileType);
  const metadataLength = new Uint32Array([metadataBytes.length]);

  const encryptedBytes = new Uint8Array(
    4 +
      metadataBytes.length +
      salt.length +
      iv.length +
      encryptedBuffer.byteLength
  );

  let offset = 0;
  encryptedBytes.set(new Uint8Array(metadataLength.buffer), offset);
  offset += 4;

  encryptedBytes.set(metadataBytes, offset);
  offset += metadataBytes.length;

  encryptedBytes.set(salt, offset);
  offset += salt.length;

  encryptedBytes.set(iv, offset);
  offset += iv.length;

  encryptedBytes.set(new Uint8Array(encryptedBuffer), offset);

  return encryptedBytes;
}

// ===== DECRYPTION =====
async function decryptData(password, encryptedBytes) {
  try {
    let offset = 0;

    const metadataLength = new Uint32Array(
      encryptedBytes.slice(0, 4).buffer
    )[0];
    offset += 4;

    const metadataBytes = encryptedBytes.slice(offset, offset + metadataLength);
    const metadata = decodeMetadata(metadataBytes);
    offset += metadataLength;

    const salt = encryptedBytes.slice(offset, offset + 16);
    offset += 16;

    const iv = encryptedBytes.slice(offset, offset + 12);
    offset += 12;

    const encryptedData = encryptedBytes.slice(offset);
    const key = await deriveKeyFromPassword(password, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encryptedData
    );

    return {
      buffer: decryptedBuffer,
      name: metadata.name,
      type: metadata.type,
    };
  } catch {
    throw new Error("Decryption failed. Wrong password or corrupted file.");
  }
}

// ===== DOWNLOAD HELPER =====
function downloadFile(data, filename, type = "application/octet-stream") {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== ENCRYPT BUTTON =====
encryptBtn.addEventListener("click", async () => {
  if (!fileBuffer) {
    statusText.textContent = "Please select an image first.";
    return;
  }

  const password = passwordInput.value;

  if (!password || password.length < 6) {
    statusText.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (fileInput.files[0].name.endsWith(".enc")) {
    statusText.textContent = "This file is already encrypted.";
    return;
  }

  try {
    statusText.textContent = "Encrypting...";
    const encryptedBytes = await encryptData(password, fileBuffer);
    downloadFile(encryptedBytes, "encrypted-image.enc");
    statusText.textContent = "Encryption successful.";
  } catch (error) {
    console.error(error);
    statusText.textContent = "Encryption failed.";
  }
});

// ===== DECRYPT BUTTON =====
decryptBtn.addEventListener("click", async () => {
  if (!fileBuffer) {
    statusText.textContent = "Please select an encrypted file.";
    return;
  }

  const password = passwordInput.value;

  if (!password || password.length < 6) {
    statusText.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (!fileInput.files[0].name.endsWith(".enc")) {
    statusText.textContent = "Please select a valid .enc file.";
    return;
  }

  try {
    statusText.textContent = "Decrypting...";
    const result = await decryptData(password, new Uint8Array(fileBuffer));
    downloadFile(result.buffer, result.name, result.type);
    statusText.textContent = "Decryption successful.";
  } catch (error) {
    console.error(error);
    statusText.textContent = error.message;
  }
});
