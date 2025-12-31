# AES Image Encryptor 🔐

A browser-based image encryption and decryption tool built using **pure frontend technologies** and the **Web Crypto API**.

## 🚀 Features
- Encrypt and decrypt images entirely on the client-side
- AES-GCM encryption (authenticated encryption)
- Password-based key derivation using PBKDF2
- Random salt and IV for every encryption
- Preserves original image name and format
- No backend, no uploads, works offline
- Responsive black & green security-themed UI

## 🛠️ Tech Stack
- HTML
- CSS
- Vanilla JavaScript
- Web Crypto API (AES-GCM)

## 📦 How It Works (High Level)
1. Image is read as binary data (`ArrayBuffer`)
2. Password is converted into a cryptographic key using PBKDF2
3. Image is encrypted using AES-GCM with a random IV
4. Metadata (filename & type) is stored with encrypted data
5. Decryption restores the original image safely

## ▶️ How to Run Locally
1. Clone the repository
2. Open the project using a local server (Live Server recommended)
3. Upload an image
4. Enter a password (minimum 6 characters)
5. Encrypt or decrypt the file

## 🔐 Security Notes
- Uses AES-GCM for confidentiality and integrity
- Password is never stored
- Salt and IV are generated securely using `crypto.getRandomValues`
- Wrong password or tampered file fails decryption safely

## ⚠️ Limitations
- Large files may use high browser memory
- Security depends on password strength
- Client-side only (no key recovery)

## 👤 Author
**Prakhar Shukla**
