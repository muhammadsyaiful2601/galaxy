# Antariksa — Space Simulator Three.js

Simulasi ruang angkasa 3D interaktif dengan sistem planet, glitch warp drive, dan berbagai tipe spaceship. Dibangun dengan [Three.js](https://threejs.org/) dan [GSAP](https://gsap.com/).

![Preview](index.html)

## Fitur Utama

- 🪐 **Sistem Tata Surya** — 8 planet (Mercury–Neptune) dengan model GLB 3D, orbit, dan rotasi
- 🕰️ **Orbit realtime berskala fisik** — Ukuran Matahari, planet, bulan, cincin Saturnus, serta jarak orbit memakai satu skala konsisten: 30000 unit dunia = 1 AU. Rasio ukuran planet sebanding dengan jarak orbit dipertahankan 1:1 (unit dunia ≈ 4.987 km); ukuran rendernya diperbesar sehingga Matahari dan planet terlihat jelas dari kamera, sambil proporsi fisik antara ukuran planet dan jarak orbit tetap utuh. Kepler-186f tetap ilustratif karena berada di luar Tata Surya dan bintang induknya tidak dimodelkan.
- 🗓️ **Kalender & jam WIB** — Tanggal dan waktu realtime ditampilkan dalam zona `Asia/Jakarta` (WIB); rotasi memakai waktu presisi tinggi agar gerakannya tetap halus.
- 🕳️ **Sagittarius A\*** — Lubang hitam supermacia dengan model GLB 31.3 MB, akresi disk, glow, dan distorti procedural
- ☀️ **Matahari** — Model GLB 3D dengan efek cahaya
- 🚀 **Spaceship 3 tipe** — Recon (cepat), Heavy (lambat/tahan lumpur), UFO (sedang/alien)
- 🌌 **Warp Drive** — Terowongan perspektif 3D dengan ring dan streak yang melesat, efek percepatan FOV, dan HUD kecepatan yang mengikuti fase warp
- 🎮 **Kontrol WASD** — Gerak kamera/spaceship dengan kecepatan bervariasi menurut tipe kapal
- ⚔️ **Pertempuran UFO** — Tekan `Space` untuk laser; UFO netral sampai diserang, lalu membalas. Kapal dan UFO memiliki health, ledakan, dan respawn
- 📊 **HUD** — Informasi target, jarak, dan kecepatan warp
- 🎵 **Audio** — Efek suara klik, warp, dan perpindahan spaceship

## Teknologi

| Teknologi | Penggunaan |
|-----------|------------|
| [Three.js](https://threejs.org/) | Rendering 3D, kamera, scene, loader GLTF/GLB |
| [GSAP](https://gsap.com/) | Animasi warp, transisi kamera, progress bar |
| [Tailwind CSS](https://tailwindcss.com/) | Styling HUD dan UI |
| [Font Awesome](https://fontawesome.com/) | Ikon UI |
| GLTFLoader | Memuat model 3D GLB (planet, spaceship, lubang hitam) |

## Struktur Proyek

```
antariksa/
├── index.html              # Entry point + UI/HUD (Tailwind)
├── README.md               # Dokumentasi proyek (file ini)
├── css/                    # Stylesheet kustom
│   └── style.css
├── js/                     # Logika aplikasi
│   ├── main.js             # Inisialisasi Three.js + loop animate
│   ├── scene.js            # Pembuatan scene, planet, spaceship, lubang hitam
│   ├── animate.js          # Loop animasi, gerak WASD, efek warp starfield
│   ├── interaction.js      # Raycaster, klik target, warp drive, panel UI
│   ├── config.js           # Konfigurasi orbit, planet, dan warna
│   ├── audio.js            # Sistem suara (klik, warp, ship)
│   └── textures.js         # Generasi tekstur procedural (fallback)
├── asset3D/
│   ├── object/             # Model planet dan lubang hitam (GLB)
│   │   ├── mercury.glb, venus.glb, earth.glb, mars.glb
│   │   ├── jupiter.glb, saturn.glb, uranus_4k.glb, neptune.glb
│   │   ├── sun.glb, moon.glb, black_hole.glb
│   │   └── ...
│   └── spaceship/          # Model spaceship dan cockpit (GLB)
│       ├── space_ship.glb (recon)
│       ├── heavy space ship.glb
│       ├── ufo.glb
│       ├── cockpit recon.glb
│       ├── cockpit heavy.glb
│       └── ufo cockpit.glb
└── sound/                  # File audio efek
```

## Cara Menjalankan

1. Clone repository:
   ```bash
   git clone https://github.com/muhammadsyaiful2601/galaxy.git
   cd galaxy
   ```

2. Jalankan local server (disarankan karena GLTFLoader membutuhkan HTTP):
   ```bash
   # Dengan Python
   python -m http.server 5502

   # Atau dengan Node (http-server)
   npx http-server -p 5502
   ```

3. Buka browser: `http://localhost:5502`

> ⚠️ **Catatan:** Jangan buka `index.html` langsung melalui `file://` karena GLB model tidak akan dapat dimuat oleh `THREE.GLTFLoader` karena pembatasan CORS.

## Kontrol

| Aksi | Tombol |
|------|--------|
| Maju | `W` |
| Mundur | `S` |
| Kiri | `A` |
| Kanan | `D` |
| Tembak laser | Tahan `Space` |
| Pilih target | Klik objek di layar |
| Warp ke target | Tombol **Engage Warp** atau pilih dari daftar Quick Warp |
| Batalkan warp | Tombol **Cancel Warp** saat overlay aktif |
| Ganti spaceship | Menu **Select Ship** |

## Tipe Spaceship dan Kecepatan

Setiap spaceship memiliki kecepatan gerak yang berbeda:

| Tipe | Kecepatan | Keterangan |
|------|-----------|------------|
| **Recon** | 45 unit/detik | Kecepatan dasar |
| **Heavy** | 9 unit/detik | 5 kali lebih lambat dari Recon |
| **UFO** | 450 unit/detik | 10 kali lebih cepat dari Recon |

Kecepatan diterapkan otomatis saat memilih spaceship melalui menu **Select Ship**.

## Efek Warp Drive

Saat meneklam **Engage Warp**:

1. Overlay warp muncul dengan efek tunnel
2. Starfield meregang membentuk garis bintang (warp streaks)
3. Rotasi starfield bertambah cepat
4. HUD menampilkan kecepatan super: `999+ LY/s` dengan warna amber dan efek pulse
5. Kamera melompat dari posisi awal ke target dengan easing GSAP (`power3.inOut`)
6. Setelah tiba, kamera otomatis follow target

## Skala Tata Surya

Ukuran Matahari, delapan planet, bulan utama yang ditampilkan, cincin Saturnus, dan jarak orbit Tata Surya menggunakan rasio fisik 1:1. Konversi scene-nya adalah 3000 unit dunia per AU (1 unit dunia = 49.865,3 km). Rasio ukuran planet terhadap jarak orbit dipertahankan 1:1, tetapi planet diperbesar secara proporsional agar terlihat dari kamera (planet planet sebanding dengan ukuran aslinya dalam km). Kapal pemain, UFO, objek fiksi, latar galaksi, dan Kepler-186f tidak termasuk skala Tata Surya ini.

## Model 3D (GLB)

Semua model celestial dan spaceship menggunakan format `.glb` dimuat secara async melalui `THREE.GLTFLoader`. Jika gagal memuat, sistem akan fallback ke model procedural (geomitori dasar Three.js).

### Celestial Objects
- **Matahari** — `sun.glb`
- **Planet** — Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
- **Bulan** — `moon.glb`
- **Lubang Hitam** — `black_hole.glb` (Sagittarius A\*, 31.3 MB) dengan overlay akresi dan glow procedural

### Spaceship
- **Recon** — `space_ship.glb` + `cockpit recon.glb`
- **Heavy** — `heavy space ship.glb` + `cockpit heavy.glb`
- **UFO** — `ufo.glb` + `ufo cockpit.glb`

## Lisensi

Proyek ini dibuat untuk pembelajaran dan demonstrasi simulasi ruang angkasa berbasis web.

---

Dibuat dengan ❤️ menggunakan Three.js.