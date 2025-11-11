# BOIX TTS Studio

Aplikasi web untuk mengubah teks menjadi suara (Text-to-Speech) menggunakan model `gemini-2.5-flash-preview-tts` dari Google AI.

---

### Cara Menjalankan Proyek Ini di Komputer Anda (Lokal)

1.  **Buka Terminal:** Buka terminal atau command prompt di dalam folder proyek ini. Cara termudah adalah menggunakan terminal yang terintegrasi di dalam Visual Studio Code (`Terminal` -> `New Terminal`).

2.  **Install Dependencies:** Jalankan perintah ini untuk mengunduh semua paket yang dibutuhkan oleh proyek. Anda hanya perlu melakukan ini sekali.
    ```bash
    npm install
    ```

3.  **Jalankan Server Pengembangan:** Jalankan perintah ini untuk memulai aplikasi.
    ```bash
    npm run dev
    ```

4.  **Buka di Browser:** Buka browser web Anda dan kunjungi alamat yang ditampilkan di terminal (biasanya `http://localhost:5173`).

---

### Cara Publikasi ke Netlify (Metode Drag & Drop)

1.  **Buat Build:** Di terminal (di dalam folder proyek), jalankan perintah berikut:
    ```bash
    npm run build
    ```
    Perintah ini akan membuat folder baru bernama `dist`. Folder inilah yang akan kita unggah.

2.  **Buka Netlify:** Login ke akun Netlify Anda dan pergi ke halaman "Sites".

3.  **Drag & Drop:** Seret folder `dist` dari komputer Anda dan lepaskan ke area unggah di halaman Netlify.

4.  **Atur API Key:**
    *   Setelah situs di-deploy, pergi ke `Deploy settings` -> `Environment variables`.
    *   Klik `Add a variable`.
    *   **Key:** `API_KEY`
    *   **Value:** `[tempel kunci API Anda di sini]`
    *   Klik `Save`.
    *   Pergi ke tab `Deploys` dan klik `Trigger deploy` -> `Deploy site` untuk mempublikasikan ulang dengan API Key.
