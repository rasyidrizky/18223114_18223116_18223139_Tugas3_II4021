# meowchat — Aplikasi Pesan End-to-End Encrypted

> **Tugas 3 — II4021 Kriptografi**

---

## Deskripsi Program

**meowchat** adalah aplikasi web pesan instan berbasis enkripsi *end-to-end* yang dibangun sebagai tugas 3 mata kuliah Kriptografi (II4021). Aplikasi ini memastikan bahwa seluruh pesan yang dikirim antar pengguna hanya dapat dibaca oleh pengirim dan penerima, tanpa kemampuan server untuk membaca isi pesan. Aplikasi chat dirancang dengan menerapkan beberapa mekanisme kriptografi modern untuk mendukung autentikasi, pembentukan kunci komunikasi, dan enkripsi pesan.

### Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Registrasi & Login** | Autentikasi pengguna dengan hashing password berbasis PBKDF2-SHA512 |
| **JWT Kustom** | Implementasi JWT dari nol menggunakan algoritma ECDSA (ES256 / ES384 / ES512) tanpa library eksternal |
| **E2E Encryption** | Enkripsi pesan menggunakan ECDH key exchange + AES-GCM via Web Crypto API |
| **MAC Verification** | Setiap pesan dilindungi dengan Message Authentication Code (MAC) untuk menjamin integritas |
| **Manajemen Kontak** | Pencarian dan penambahan kontak berdasarkan email |
| **Profil Pengguna** | Kustomisasi nama dan avatar pengguna |
| **Polling Pesan** | Pengambilan pesan baru secara periodik tanpa WebSocket |

---

## Teknologi yang Digunakan (Tech Stack)

### Frontend
| Teknologi | Versi | Fungsi |
|---|---|---|
| **React** | ^19.2.5 | UI framework (SPA) |
| **Vite** | ^8.0.10 | Build tool dan dev server |
| **Web Crypto API** | Native Browser | Operasi kriptografi sisi klien (ECDH, AES-GCM, HKDF) |
| **Axios** | ^1.15.2 | HTTP client untuk komunikasi dengan backend |

### Backend
| Teknologi | Versi | Fungsi |
|---|---|---|
| **Node.js** | ^25.9.0 | Runtime JavaScript server-side |
| **Express** | ^5.2.1 | Web framework RESTful API |
| **`node:sqlite`** | Built-in (Node 22+) | Driver SQLite bawaan Node.js |
| **`node:crypto`** | Built-in | Operasi kriptografi server (PBKDF2, ECDSA, key pair generation) |

### Database
| Teknologi | Fungsi |
|---|---|
| **SQLite** | Database lokal file-based (`local_DB.sqlite`) |

### DevOps & Tooling
| Teknologi | Versi | Fungsi |
|---|---|---|
| **Docker** | — | Containerisasi aplikasi |
| **Docker Compose** | — | Orkestrasi multi-port container |
| **Nodemon** | ^3.1.14 | Hot-reload server saat development |
| **Concurrently** | ^9.2.1 | Menjalankan frontend dan backend secara bersamaan |
| **ESLint** | ^10.2.1 | Linting kode JavaScript/JSX |

---

## Dependensi

### Production Dependencies

```json
{
  "axios": "^1.15.2",
  "cors": "^2.8.6",
  "express": "^5.2.1",
  "react": "^19.2.5",
  "react-dom": "^19.2.5"
}
```

### Development Dependencies

```json
{
  "@eslint/js": "^10.0.1",
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3",
  "@vitejs/plugin-react": "^6.0.1",
  "concurrently": "^9.2.1",
  "eslint": "^10.2.1",
  "eslint-plugin-react-hooks": "^7.1.1",
  "eslint-plugin-react-refresh": "^0.5.2",
  "globals": "^17.5.0",
  "nodemon": "^3.1.14",
  "vite": "^8.0.10"
}
```

> **Catatan:** Aplikasi ini **tidak menggunakan library JWT eksternal** (seperti `jsonwebtoken`). Implementasi JWT (sign, verify, encoding DER/JOSE) dibuat secara mandiri di `server/services/JwtLibrary.js`.

---

## Tata Cara Menjalankan Program

### Prasyarat

- **Node.js** versi **22 atau lebih baru** (diperlukan untuk modul `node:sqlite` bawaan)
- **npm** (sudah termasuk dalam instalasi Node.js)
- **Git** (opsional, untuk meng-*clone* repository)

### Cara 1: Menjalankan Secara Lokal (Rekomendasi untuk Development)

#### 1. Clone / Download Repository

```bash
git clone <url-repository>
cd 18223114_18223116_18223139_Tugas3_II4021
```

#### 2. Install Dependensi

```bash
npm install
```

#### 3. Jalankan Aplikasi (Frontend + Backend Sekaligus)

```bash
npm run dev
```

Perintah ini akan menjalankan:
- **Backend** (Express) di `http://localhost:3000`
- **Frontend** (Vite/React) di `http://localhost:5173`

> Untuk menjalankan frontend dan backend secara terpisah:
> ```bash
> npm run dev:backend   # hanya backend
> npm run dev:frontend  # hanya frontend
> ```

#### 4. Buka Aplikasi

Buka browser dan akses: **`http://localhost:5173`**

> **Penting — HTTPS untuk Web Crypto API:**
> Fitur `window.crypto.subtle` (Web Crypto API) hanya tersedia di konteks **aman** (HTTPS atau `localhost`).
> Jika mengakses aplikasi dari perangkat/IP lain di jaringan yang sama, konfigurasikan HTTPS pada Vite (lihat [Environment/Configuration](#environmentconfiguration)).

---

### Cara 2: Menjalankan dengan Docker

#### Prasyarat Tambahan
- **Docker Desktop** terinstal dan berjalan

#### 1. Build dan Jalankan Container

```bash
docker compose up --build
```

#### 2. Buka Aplikasi

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`

#### 3. Menghentikan Container

```bash
docker compose down
```

---

### Menjalankan Unit Test

```bash
npm test
```

Test akan menjalankan semua file `*.test.js` di folder `tests/` menggunakan test runner bawaan Node.js (`node:test`). Test saat ini mencakup pengujian `JwtLibrary` (sign, verify, edge cases).

---

### Perintah Lainnya

| Perintah | Fungsi |
|---|---|
| `npm run lint` | Menjalankan ESLint untuk memeriksa kualitas kode |
| `npm run build` | Mem-build frontend untuk production ke folder `dist/` |
| `npm run preview` | Menjalankan preview build production |

---

## Environment / Configuration

### Variabel Environment

Aplikasi membaca variabel environment berikut. Tidak ada file `.env` yang diperlukan untuk menjalankan aplikasi secara default — semua nilai di bawah ini bersifat opsional dan memiliki nilai *fallback*.

| Variabel | Nilai Default | Deskripsi |
|---|---|---|
| `NODE_ENV` | `development` | Mode environment Node.js |
| `JWT_ALG` | `ES256` | Algoritma ECDSA untuk JWT. Nilai yang valid: `ES256`, `ES384`, `ES512` |

### Detail Konfigurasi

#### JWT & Key Pair

- Saat server pertama kali dijalankan, jika file **PEM key pair** belum ada, server akan **membuat otomatis** pasangan kunci privat/publik ECDSA dan menyimpannya di:
  - `server/jwt_private.pem` (untuk ES256)
  - `server/jwt_public.pem` (untuk ES256)
  - `server/jwt_<alg>_private.pem` / `server/jwt_<alg>_public.pem` (untuk ES384 / ES512)
- Token JWT memiliki masa berlaku **1 jam** (`exp: now + 3600`).

#### Database

- Database SQLite dibuat otomatis di root project sebagai file `local_DB.sqlite` saat server pertama kali dijalankan.
- Schema database diinisialisasi dari `server/schema.sql` dan mencakup tabel: `user`, `messages`, `contacts`.

#### Port

| Layanan | Port Default |
|---|---|
| Backend (Express API) | `3000` |
| Frontend (Vite Dev Server) | `5173` |

#### HTTPS untuk Akses Jaringan

Jika ingin mengakses aplikasi dari IP jaringan (bukan `localhost`) agar Web Crypto API berfungsi, tambahkan konfigurasi SSL ke `vite.config.js`:

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    https: {
      key: fs.readFileSync('./cert/key.pem'),
      cert: fs.readFileSync('./cert/cert.pem'),
    },
  },
})
```

---

## Struktur Proyek

```
.
├── server/                     # Backend (Express + Node.js)
│   ├── config/
│   │   └── Database.js         # Koneksi & inisialisasi SQLite
│   ├── controllers/
│   │   ├── AuthController.js   # Logika registrasi, login, update profil
│   │   └── MessageController.js# Logika pesan, kontak
│   ├── models/                 # Model data (UserModel, MessageModel, ContactModel)
│   ├── routes/                 # Definisi route API
│   ├── services/
│   │   ├── AuthMiddleware.js   # Middleware verifikasi JWT
│   │   ├── CryptoServer.js     # Utilitas kriptografi server (PBKDF2, key pair)
│   │   └── JwtLibrary.js       # Implementasi JWT kustom (sign & verify)
│   ├── schema.sql              # Skema database SQLite
│   ├── jwt_private.pem         # (Di-generate otomatis) ECDSA private key
│   ├── jwt_public.pem          # (Di-generate otomatis) ECDSA public key
│   └── server.js               # Entry point server
├── src/                        # Frontend (React + Vite)
│   ├── components/             # Komponen React yang dapat digunakan ulang
│   ├── pages/                  # Halaman aplikasi (Login, Register, Dashboard, Chat, dll.)
│   ├── services/               # Layanan API dan kriptografi sisi klien
│   ├── styling/                # File CSS per halaman
│   └── App.jsx                 # Root component dan routing
├── tests/
│   └── jwtLibrary.test.js      # Unit test untuk JwtLibrary
├── Dockerfile                  # Konfigurasi Docker image
├── compose.yaml                # Konfigurasi Docker Compose
├── vite.config.js              # Konfigurasi Vite
├── package.json                # Dependensi dan skrip npm
└── local_DB.sqlite             # (Di-generate otomatis) File database SQLite
```

---

## API Endpoints

### Autentikasi (`/api/auth`)

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Registrasi pengguna baru | — |
| `POST` | `/api/auth/login` | Login dan mendapatkan JWT | — |
| `PUT` | `/api/auth/profile` | Update nama & avatar | ✅ JWT |

### Pesan & Kontak (`/api/messages`)

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/messages/contacts` | Daftar semua pengguna terdaftar | ✅ JWT |
| `GET` | `/api/messages/search?email=...` | Cari pengguna berdasarkan email | ✅ JWT |
| `POST` | `/api/messages/contacts` | Tambah kontak | ✅ JWT |
| `POST` | `/api/messages/send` | Kirim pesan terenkripsi | ✅ JWT |
| `GET` | `/api/messages/conv/:partnerId` | Ambil riwayat pesan dengan kontak | ✅ JWT |

## Kontributor

<p align="center">
  <table>
    <tbody>
      <tr>
        <td align="center" valign="top" width="14.28%"><a href="https://github.com/rasyidrizky"><img src="https://avatars.githubusercontent.com/u/188223327?v=4?s=100" width="100px;" alt="Rasyid Rizky Susilo N."/><br /><sub><b>Rasyid Rizky Susilo N.</b></sub><br /><sub><b>18223114</b></sub></a><br />   </td>
        <td align="center" valign="top" width="14.28%"><a href="https://github.com/StefanyJosefina"><img src="https://avatars.githubusercontent.com/u/167734949?v=4?s=100" width="100px;" alt="Stefany Josefina Santono"/><br /><sub><b>Stefany Josefina Santono</b></sub><br /><sub><b>18223116</b></sub></a><br /> </td>
        <td align="center" valign="top" width="14.28%"><a href="https://github.com/kifu"><img src="https://avatars.githubusercontent.com/u/136690241?v=4?s=100" width="100px;" alt="Andi Syaichul Mubaraq"/><br /><sub><b>Andi Syaichul Mubaraq</b></sub><br /><sub><b>18223139</b></sub></a><br /> </td>
      </tr>
    </tbody>
  </table>
</p>