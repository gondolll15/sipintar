/* =================================
   SIPINTAR - LOADING SCREEN
================================= */

const loadingScreen = document.getElementById("loading-screen");
const loadingProgress = document.getElementById("loading-progress");
const loadingPercent = document.getElementById("loading-percent");
const loginPage = document.getElementById("login-screen");

const loadingDuration = 8000;
const startTime = Date.now();

const loadingInterval = setInterval(() => {

    const elapsedTime = Date.now() - startTime;

    let progress = Math.min(
        (elapsedTime / loadingDuration) * 100,
        100
    );

    progress = Math.floor(progress);

    loadingProgress.style.width = progress + "%";
    loadingPercent.textContent = progress + "%";

    if (progress >= 100) {

        clearInterval(loadingInterval);

        setTimeout(() => {

            loadingScreen.classList.add("fade-out");
            loginPage.classList.remove("hidden");

            setTimeout(() => {
                loadingScreen.style.display = "none";
            }, 600);

        }, 300);

    }

}, 50);


/* =================================
   SIPINTAR - SIDEBAR
================================= */

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");

sidebarToggle.addEventListener("click", function() {
    sidebar.classList.toggle("open");
});


/* =================================
   SIPINTAR - NAVIGASI HALAMAN
================================= */

const menuItems = document.querySelectorAll(".menu-item");
const pageViews = document.querySelectorAll(".page-view");

menuItems.forEach(function(item) {

    item.addEventListener("click", function() {

        const selectedPage = item.dataset.page;

        menuItems.forEach(function(menu) {
            menu.classList.remove("active");
        });

        item.classList.add("active");

        pageViews.forEach(function(page) {
            page.classList.add("hidden");
        });

        const targetPage = document.getElementById(
            "page-" + selectedPage
        );

        if (targetPage) {
            targetPage.classList.remove("hidden");
        }

        sidebar.classList.remove("open");

    });

});


/* =================================
   SIPINTAR - DATA BARANG
================================= */

(function () {

    const STORAGE_KEY = "sipintar_data_barang_v1";
    const DATABASE_NAME = "sipintar_foto_db";
    const STORE_NAME = "foto_barang";

    const form = document.getElementById("form-barang");
    const namaInput = document.getElementById("nama-barang");
    const kategoriInput = document.getElementById("kategori-barang");
    const stokInput = document.getElementById("stok-barang");
    const satuanInput = document.getElementById("satuan-barang");
    const fotoInput = document.getElementById("foto-barang");
    const keteranganInput = document.getElementById("keterangan-barang");

    const previewFoto = document.getElementById("preview-foto-barang");
    const daftarBarang = document.getElementById("daftar-barang");
    const pesanBarang = document.getElementById("pesan-barang");

    const judulForm = document.getElementById("form-barang-title");
    const tombolSimpan = document.getElementById("simpan-barang");
    const tombolBatal = document.getElementById("batal-edit-barang");

    // Elemen Dashboard
    const totalBarangDashboard = document.getElementById("total-barang");
    const stokTersediaDashboard = document.getElementById("stok-tersedia");
    const sedangDipinjamDashboard = document.getElementById("sedang-dipinjam");
    const stokMenipisDashboard = document.getElementById("stok-menipis");

    let barang = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    let barangSedangDiedit = null;
    let fotoSementara = null;


    // =================================
    // MEMBUKA DATABASE FOTO
    // =================================

    function bukaDatabase() {

        return new Promise(function (resolve, reject) {

            const request = indexedDB.open(DATABASE_NAME, 1);

            request.onupgradeneeded = function (event) {

                const db = event.target.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, {
                        keyPath: "id"
                    });
                }

            };

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function () {
                reject(request.error);
            };

        });

    }


    // =================================
    // MENYIMPAN FOTO
    // =================================

    async function simpanFoto(id, data) {

        const db = await bukaDatabase();

        return new Promise(function (resolve, reject) {

            const transaction = db.transaction(STORE_NAME, "readwrite");

            transaction.objectStore(STORE_NAME).put({
                id: id,
                data: data
            });

            transaction.oncomplete = function () {
                db.close();
                resolve();
            };

            transaction.onerror = function () {
                db.close();
                reject(transaction.error);
            };

        });

    }


    // =================================
    // MENGAMBIL FOTO
    // =================================

    async function ambilFoto(id) {

        const db = await bukaDatabase();

        return new Promise(function (resolve, reject) {

            const transaction = db.transaction(STORE_NAME, "readonly");
            const request = transaction.objectStore(STORE_NAME).get(id);

            request.onsuccess = function () {
                resolve(request.result ? request.result.data : "");
            };

            request.onerror = function () {
                reject(request.error);
            };

            transaction.oncomplete = function () {
                db.close();
            };

        });

    }


    // =================================
    // MENGHAPUS FOTO
    // =================================

    async function hapusFoto(id) {

        const db = await bukaDatabase();

        return new Promise(function (resolve, reject) {

            const transaction = db.transaction(STORE_NAME, "readwrite");

            transaction.objectStore(STORE_NAME).delete(id);

            transaction.oncomplete = function () {
                db.close();
                resolve();
            };

            transaction.onerror = function () {
                db.close();
                reject(transaction.error);
            };

        });

    }


    // =================================
    // MENYIMPAN DATA BARANG
    // =================================

    function simpanDataBarang() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(barang)
        );

    }


    // =================================
    // MENGAMANKAN TEKS HTML
    // =================================

    function escapeHTML(teks) {

        return String(teks ?? "").replace(/[&<>"']/g, function (karakter) {

            const pengganti = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return pengganti[karakter];

        });

    }


    // =================================
    // MEMBACA FOTO
    // =================================

    function bacaFoto(file) {

        return new Promise(function (resolve, reject) {

            const reader = new FileReader();

            reader.onload = function () {
                resolve(reader.result);
            };

            reader.onerror = function () {
                reject(new Error("Foto gagal dibaca."));
            };

            reader.readAsDataURL(file);

        });

    }


    // =================================
    // PREVIEW FOTO
    // =================================

    fotoInput.addEventListener("change", async function () {

        const file = fotoInput.files[0];

        fotoSementara = null;

        if (!file) {
            previewFoto.classList.add("hidden");
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("File harus berupa gambar.");
            fotoInput.value = "";
            previewFoto.classList.add("hidden");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Ukuran foto maksimal 5 MB.");
            fotoInput.value = "";
            previewFoto.classList.add("hidden");
            return;
        }

        try {

            fotoSementara = await bacaFoto(file);

            previewFoto.src = fotoSementara;
            previewFoto.classList.remove("hidden");

        } catch (error) {

            alert("Foto tidak dapat dibaca.");

        }

    });


    // =================================
    // DASHBOARD
    // =================================

    function tampilkanDashboard() {

        const totalJenisBarang = barang.length;

        const totalStokTersedia = barang.reduce(function (total, item) {
            return total + Number(item.stokTersedia || 0);
        }, 0);

        const totalSedangDipinjam = barang.reduce(function (total, item) {

            const stok = Number(item.stok || 0);
            const tersedia = Number(item.stokTersedia || 0);

            return total + Math.max(0, stok - tersedia);

        }, 0);

        const totalStokMenipis = barang.filter(function (item) {
            return Number(item.stokTersedia || 0) <= 5;
        }).length;

        totalBarangDashboard.textContent = totalJenisBarang;
        stokTersediaDashboard.textContent = totalStokTersedia;
        sedangDipinjamDashboard.textContent = totalSedangDipinjam;
        stokMenipisDashboard.textContent = totalStokMenipis;

    }


    // =================================
    // MENAMPILKAN DAFTAR BARANG
    // =================================

    async function tampilkanBarang() {

        if (barang.length === 0) {

            daftarBarang.innerHTML = `
                <tr>
                    <td colspan="8">Belum ada data barang.</td>
                </tr>
            `;

            return;
        }

        const baris = await Promise.all(barang.map(async function (item) {

            let foto = "";

            try {
                foto = await ambilFoto(item.id);
            } catch (error) {
                console.error("Gagal mengambil foto:", error);
            }

            return `
                <tr>
                    <td>
                        ${
                            foto
                            ? `<img src="${foto}" class="foto-tabel-barang" alt="Foto barang">`
                            : "Tidak ada foto"
                        }
                    </td>

                    <td>${escapeHTML(item.nama)}</td>
                    <td>${escapeHTML(item.kategori)}</td>
                    <td>${item.stok}</td>
                    <td>${item.stokTersedia}</td>
                    <td>${escapeHTML(item.satuan)}</td>
                    <td>${escapeHTML(item.keterangan || "-")}</td>

                    <td>
                        <div class="aksi-barang">

                            <button
                                type="button"
                                class="tombol-edit-barang"
                                data-aksi="edit"
                                data-id="${item.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="tombol-hapus-barang"
                                data-aksi="hapus"
                                data-id="${item.id}"
                            >
                                Hapus
                            </button>

                        </div>
                    </td>
                </tr>
            `;

        }));

        daftarBarang.innerHTML = baris.join("");

    }


    // =================================
    // RESET FORM BARANG
    // =================================

    function resetFormBarang() {

        form.reset();

        barangSedangDiedit = null;
        fotoSementara = null;

        judulForm.textContent = "Tambah Barang Baru";
        tombolSimpan.textContent = "Simpan Barang";

        fotoInput.required = true;

        tombolBatal.classList.add("hidden");
        previewFoto.classList.add("hidden");

        previewFoto.removeAttribute("src");
        pesanBarang.textContent = "";

    }


    // =================================
    // TAMBAH ATAU EDIT BARANG
    // =================================

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const nama = namaInput.value.trim();
        const kategori = kategoriInput.value.trim();
        const stok = Number(stokInput.value);
        const satuan = satuanInput.value.trim();
        const keterangan = keteranganInput.value.trim();

        if (!nama || !kategori || !satuan) {
            alert("Lengkapi semua data barang.");
            return;
        }

        if (!Number.isInteger(stok) || stok < 0) {
            alert("Jumlah stok harus berupa angka bulat minimal 0.");
            return;
        }

        if (!barangSedangDiedit && !fotoSementara) {
            alert("Silakan pilih foto barang terlebih dahulu.");
            return;
        }

        tombolSimpan.disabled = true;

        try {

            if (barangSedangDiedit) {

                const index = barang.findIndex(function (item) {
                    return item.id === barangSedangDiedit;
                });

                if (index === -1) {
                    throw new Error("Data barang tidak ditemukan.");
                }

                const dataLama = barang[index];

                const jumlahDipinjam =
                    Number(dataLama.stok) - Number(dataLama.stokTersedia);

                if (stok < jumlahDipinjam) {
                    alert(
                        "Total stok tidak boleh kurang dari jumlah barang yang sedang dipinjam (" +
                        jumlahDipinjam + ")."
                    );
                    return;
                }

                if (fotoSementara) {
                    await simpanFoto(dataLama.id, fotoSementara);
                }

                barang[index] = {
                    ...dataLama,
                    nama: nama,
                    kategori: kategori,
                    stok: stok,
                    stokTersedia: stok - jumlahDipinjam,
                    satuan: satuan,
                    keterangan: keterangan
                };

            } else {

                const id = "BRG-" + Date.now();

                await simpanFoto(id, fotoSementara);

                barang.push({
                    id: id,
                    nama: nama,
                    kategori: kategori,
                    stok: stok,
                    stokTersedia: stok,
                    satuan: satuan,
                    keterangan: keterangan,
                    tanggalDitambahkan: new Date().toISOString()
                });

            }

            simpanDataBarang();

            await tampilkanBarang();
            await tampilkanKatalogBarang();

            tampilkanDashboard();

            resetFormBarang();

        } catch (error) {

            console.error(error);

            alert("Data barang gagal disimpan. Silakan coba lagi.");

        } finally {

            tombolSimpan.disabled = false;

        }

    });


    // =================================
    // TOMBOL EDIT DAN HAPUS BARANG
    // =================================

    daftarBarang.addEventListener("click", async function (event) {

        const tombol = event.target.closest("button[data-aksi]");

        if (!tombol) return;

        const id = tombol.dataset.id;
        const aksi = tombol.dataset.aksi;

        const item = barang.find(function (data) {
            return data.id === id;
        });

        if (!item) return;


        // EDIT BARANG
        if (aksi === "edit") {

            barangSedangDiedit = id;

            namaInput.value = item.nama;
            kategoriInput.value = item.kategori;
            stokInput.value = item.stok;
            satuanInput.value = item.satuan;
            keteranganInput.value = item.keterangan || "";

            fotoInput.value = "";
            fotoInput.required = false;

            const foto = await ambilFoto(id);

            if (foto) {
                previewFoto.src = foto;
                previewFoto.classList.remove("hidden");
            }

            judulForm.textContent = "Edit Data Barang";
            tombolSimpan.textContent = "Perbarui Barang";

            tombolBatal.classList.remove("hidden");

            form.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }


        // HAPUS BARANG
        if (aksi === "hapus") {

            const yakin = confirm(
                `Apakah kamu yakin ingin menghapus barang "${item.nama}"?`
            );

            if (!yakin) return;

            const jumlahDipinjam =
                Number(item.stok) - Number(item.stokTersedia);

            if (jumlahDipinjam > 0) {
                alert(
                    "Barang tidak dapat dihapus karena masih ada " +
                    jumlahDipinjam + " yang sedang dipinjam."
                );
                return;
            }

            try {

                await hapusFoto(id);

                barang = barang.filter(function (data) {
                    return data.id !== id;
                });

                simpanDataBarang();

                await tampilkanBarang();
                await tampilkanKatalogBarang();

                tampilkanDashboard();

                resetFormBarang();

            } catch (error) {

                console.error(error);

                alert("Barang gagal dihapus.");

            }

        }

    });


    // =================================
    // BATAL EDIT BARANG
    // =================================

    tombolBatal.addEventListener("click", function () {
        resetFormBarang();
    });


    // =================================
    // MENAMPILKAN KATALOG BARANG
    // =================================

    async function tampilkanKatalogBarang() {

        const daftarKatalog = document.getElementById("daftar-katalog");
        const jumlahKatalog = document.getElementById("jumlah-katalog");

        if (!daftarKatalog || !jumlahKatalog) return;

        jumlahKatalog.textContent = barang.length + " jenis barang";

        if (barang.length === 0) {

            daftarKatalog.innerHTML = `
                <p class="katalog-kosong">
                    Belum ada barang yang tersedia.
                </p>
            `;

            return;

        }

        const kartuBarang = await Promise.all(
            barang.map(async function (item) {

                let foto = "";

                try {
                    foto = await ambilFoto(item.id);
                } catch (error) {
                    console.error("Foto katalog gagal dimuat:", error);
                }

                const stokHabis = item.stokTersedia <= 0;

                return `
                    <div class="katalog-card">

                        ${
                            foto
                            ? `<img src="${foto}" alt="${escapeHTML(item.nama)}">`
                            : `<div class="katalog-no-image">Tidak ada foto</div>`
                        }

                        <div class="katalog-card-body">

                            <h3>${escapeHTML(item.nama)}</h3>

                            <p>${escapeHTML(item.kategori)}</p>

                            <span class="katalog-stok ${stokHabis ? "habis" : ""}">
                                ${
                                    stokHabis
                                    ? "Stok Habis"
                                    : "Stok: " + item.stokTersedia + " " + escapeHTML(item.satuan)
                                }
                            </span>

                        </div>

                    </div>
                `;

            })
        );

        daftarKatalog.innerHTML = kartuBarang.join("");

    }


    // =================================
    // SINKRONISASI STOK
    // =================================

    window.addEventListener("sipintar:stok-berubah", async function () {

        barang = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

        await tampilkanBarang();
        await tampilkanKatalogBarang();

        tampilkanDashboard();

    });


    // =================================
    // TAMPILKAN DATA SAAT APLIKASI DIBUKA
    // =================================

    tampilkanBarang().catch(function (error) {
        console.error("Gagal menampilkan barang:", error);
    });

    tampilkanKatalogBarang().catch(function (error) {
        console.error("Gagal menampilkan katalog:", error);
    });

    tampilkanDashboard();

})();


/* =================================
   SIPINTAR - DATA PEGAWAI
================================= */

(function () {

    const STORAGE_KEY = "sipintar_data_pegawai_v1";

    const form = document.getElementById("form-pegawai");
    const namaInput = document.getElementById("nama-pegawai");
    const nipInput = document.getElementById("nip-pegawai");
    const jabatanInput = document.getElementById("jabatan-pegawai");
    const ruanganInput = document.getElementById("ruangan-pegawai");

    const daftarPegawai = document.getElementById("daftar-pegawai");
    const pesanPegawai = document.getElementById("pesan-pegawai");

    const judulForm = document.getElementById("form-pegawai-title");
    const tombolSimpan = document.getElementById("simpan-pegawai");
    const tombolBatal = document.getElementById("batal-edit-pegawai");

    let pegawai = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    let pegawaiSedangDiedit = null;


    // =================================
    // MENGAMANKAN TEKS HTML
    // =================================

    function escapeHTML(teks) {

        return String(teks ?? "").replace(/[&<>"']/g, function (karakter) {

            const pengganti = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return pengganti[karakter];

        });

    }


    // =================================
    // MENYIMPAN DATA PEGAWAI
    // =================================

    function simpanDataPegawai() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(pegawai)
        );

    }


    // =================================
    // MENAMPILKAN DAFTAR PEGAWAI
    // =================================

    function tampilkanPegawai() {

        if (pegawai.length === 0) {

            daftarPegawai.innerHTML = `
                <tr>
                    <td colspan="6">Belum ada data pegawai.</td>
                </tr>
            `;

            return;

        }

        daftarPegawai.innerHTML = pegawai.map(function (item, index) {

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHTML(item.nama)}</td>
                    <td>${escapeHTML(item.nip || "-")}</td>
                    <td>${escapeHTML(item.jabatan)}</td>
                    <td>${escapeHTML(item.ruangan)}</td>

                    <td>
                        <div class="aksi-barang">

                            <button
                                type="button"
                                class="tombol-edit-barang"
                                data-aksi="edit"
                                data-id="${item.id}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="tombol-hapus-barang"
                                data-aksi="hapus"
                                data-id="${item.id}"
                            >
                                Hapus
                            </button>

                        </div>
                    </td>
                </tr>
            `;

        }).join("");

    }


    // =================================
    // RESET FORM PEGAWAI
    // =================================

    function resetFormPegawai() {

        form.reset();

        pegawaiSedangDiedit = null;

        judulForm.textContent = "Tambah Pegawai Baru";
        tombolSimpan.textContent = "Simpan Pegawai";

        tombolBatal.classList.add("hidden");

        pesanPegawai.textContent = "";

    }


    // =================================
    // TAMBAH DAN EDIT PEGAWAI
    // =================================

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        const nama = namaInput.value.trim();
        const nip = nipInput.value.trim();
        const jabatan = jabatanInput.value.trim();
        const ruangan = ruanganInput.value;

        if (!nama || !jabatan || !ruangan) {

            pesanPegawai.textContent = "Lengkapi data pegawai terlebih dahulu.";
            return;

        }

        if (pegawaiSedangDiedit) {

            const index = pegawai.findIndex(function (item) {
                return item.id === pegawaiSedangDiedit;
            });

            if (index === -1) {
                alert("Data pegawai tidak ditemukan.");
                return;
            }

            pegawai[index] = {
                ...pegawai[index],
                nama: nama,
                nip: nip,
                jabatan: jabatan,
                ruangan: ruangan
            };

            pesanPegawai.textContent = "Data pegawai berhasil diperbarui!";

        } else {

            pegawai.push({
                id: "PGW-" + Date.now(),
                nama: nama,
                nip: nip,
                jabatan: jabatan,
                ruangan: ruangan
            });

            pesanPegawai.textContent = "Pegawai berhasil ditambahkan!";

        }

        simpanDataPegawai();
        tampilkanPegawai();

        resetFormPegawai();

    });


    // =================================
    // TOMBOL EDIT DAN HAPUS PEGAWAI
    // =================================

    daftarPegawai.addEventListener("click", function (event) {

        const tombol = event.target.closest("button[data-aksi]");

        if (!tombol) return;

        const id = tombol.dataset.id;
        const aksi = tombol.dataset.aksi;

        const item = pegawai.find(function (data) {
            return data.id === id;
        });

        if (!item) return;


        // EDIT PEGAWAI
        if (aksi === "edit") {

            pegawaiSedangDiedit = id;

            namaInput.value = item.nama;
            nipInput.value = item.nip || "";
            jabatanInput.value = item.jabatan;
            ruanganInput.value = item.ruangan;

            judulForm.textContent = "Edit Data Pegawai";
            tombolSimpan.textContent = "Perbarui Pegawai";

            tombolBatal.classList.remove("hidden");

            form.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }


        // HAPUS PEGAWAI
        if (aksi === "hapus") {

            const yakin = confirm(
                `Yakin ingin menghapus pegawai "${item.nama}"?`
            );

            if (!yakin) return;

            pegawai = pegawai.filter(function (data) {
                return data.id !== id;
            });

            simpanDataPegawai();
            tampilkanPegawai();

            if (pegawaiSedangDiedit === id) {
                resetFormPegawai();
            }

        }

    });


    // =================================
    // BATAL EDIT PEGAWAI
    // =================================

    tombolBatal.addEventListener("click", function () {
        resetFormPegawai();
    });


    // =================================
    // TAMPILKAN DATA SAAT APLIKASI DIBUKA
    // =================================

    tampilkanPegawai();

})();


/* =================================
   SIPINTAR - PEMINJAMAN BARANG
================================= */

(function () {

    const BARANG_KEY = "sipintar_data_barang_v1";
    const PEGAWAI_KEY = "sipintar_data_pegawai_v1";
    const TRANSAKSI_KEY = "sipintar_transaksi_v1";

    const form = document.getElementById("form-peminjaman");
    const ruanganInput = document.getElementById("peminjaman-ruangan");
    const pegawaiInput = document.getElementById("peminjaman-pegawai");
    const barangInput = document.getElementById("peminjaman-barang");
    const jumlahInput = document.getElementById("peminjaman-jumlah");
    const tanggalInput = document.getElementById("peminjaman-tanggal");
    const catatanInput = document.getElementById("peminjaman-catatan");

    const daftarPeminjaman = document.getElementById("daftar-peminjaman");
    const pesanPeminjaman = document.getElementById("pesan-peminjaman");


    // =================================
    // MENGAMBIL DATA LOCALSTORAGE
    // =================================

    function ambilData(key) {

        try {
            return JSON.parse(localStorage.getItem(key) || "[]");
        } catch (error) {
            console.error("Gagal membaca data:", error);
            return [];
        }

    }


    // =================================
    // MENGAMANKAN TEKS HTML
    // =================================

    function escapeHTML(teks) {

        return String(teks ?? "").replace(/[&<>"']/g, function (karakter) {

            const pengganti = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return pengganti[karakter];

        });

    }


    // =================================
    // TANGGAL HARI INI
    // =================================

    function tanggalHariIni() {

        const sekarang = new Date();

        const tahun = sekarang.getFullYear();
        const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
        const tanggal = String(sekarang.getDate()).padStart(2, "0");

        return `${tahun}-${bulan}-${tanggal}`;

    }


    // =================================
    // PILIHAN PEGAWAI SESUAI RUANGAN
    // =================================

    function tampilkanPilihanPegawai() {

        const ruangan = ruanganInput.value;
        const pegawai = ambilData(PEGAWAI_KEY);

        pegawaiInput.innerHTML = `
            <option value="">Pilih Nama Pegawai</option>
        `;

        if (!ruangan) {

            pegawaiInput.disabled = true;

            pegawaiInput.innerHTML = `
                <option value="">Pilih Ruangan Terlebih Dahulu</option>
            `;

            return;

        }

        const pegawaiSesuai = pegawai.filter(function (item) {
            return item.ruangan === ruangan;
        });

        pegawaiInput.disabled = false;

        if (pegawaiSesuai.length === 0) {

            pegawaiInput.innerHTML = `
                <option value="">Belum ada pegawai di ruangan ini</option>
            `;

            pegawaiInput.disabled = true;

            return;

        }

        pegawaiSesuai.forEach(function (item) {

            const option = document.createElement("option");

            option.value = item.id;
            option.textContent = item.nama;

            pegawaiInput.appendChild(option);

        });

    }


    // =================================
    // PILIHAN BARANG DAN STOK
    // =================================

    function tampilkanPilihanBarang() {

        const barang = ambilData(BARANG_KEY);

        barangInput.innerHTML = `
            <option value="">Pilih Barang</option>
        `;

        barang.forEach(function (item) {

            const stok = Number(item.stokTersedia || 0);

            const option = document.createElement("option");

            option.value = item.id;

            option.textContent =
                `${item.nama} — Stok tersedia: ${stok} ${item.satuan}`;

            option.disabled = stok <= 0;

            barangInput.appendChild(option);

        });

    }


    // =================================
    // MENAMPILKAN DAFTAR PEMINJAMAN
    // =================================

    function tampilkanPeminjaman() {

        const transaksi = ambilData(TRANSAKSI_KEY);

        if (transaksi.length === 0) {

            daftarPeminjaman.innerHTML = `
                <tr>
                    <td colspan="7">Belum ada data peminjaman.</td>
                </tr>
            `;

            return;

        }

        daftarPeminjaman.innerHTML = transaksi.map(function (item, index) {

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHTML(item.tanggal)}</td>
                    <td>${escapeHTML(item.ruangan)}</td>
                    <td>${escapeHTML(item.namaPegawai)}</td>
                    <td>${escapeHTML(item.namaBarang)}</td>
                    <td>${item.jumlah} ${escapeHTML(item.satuan)}</td>
                    <td>
                        <span class="status-peminjaman">
                            ${escapeHTML(item.status)}
                        </span>
                    </td>
                </tr>
            `;

        }).join("");

    }


    // =================================
    // PILIH RUANGAN
    // =================================

    ruanganInput.addEventListener("change", function () {
        tampilkanPilihanPegawai();
    });


    // =================================
    // PILIH BARANG
    // =================================

    barangInput.addEventListener("change", function () {

        const barang = ambilData(BARANG_KEY);

        const item = barang.find(function (data) {
            return data.id === barangInput.value;
        });

        if (item) {

            jumlahInput.max = Number(item.stokTersedia || 0);
            jumlahInput.value = "";

        } else {

            jumlahInput.removeAttribute("max");

        }

    });


    // =================================
    // SIMPAN PEMINJAMAN
    // =================================

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        const ruangan = ruanganInput.value;
        const idPegawai = pegawaiInput.value;
        const idBarang = barangInput.value;
        const jumlah = Number(jumlahInput.value);
        const tanggal = tanggalInput.value;
        const catatan = catatanInput.value.trim();

        const pegawai = ambilData(PEGAWAI_KEY);
        const barang = ambilData(BARANG_KEY);
        const transaksi = ambilData(TRANSAKSI_KEY);

        const dataPegawai = pegawai.find(function (item) {
            return item.id === idPegawai && item.ruangan === ruangan;
        });

        const indexBarang = barang.findIndex(function (item) {
            return item.id === idBarang;
        });

        if (!ruangan || !idPegawai || !idBarang || !tanggal) {

            pesanPeminjaman.textContent =
                "Lengkapi data peminjaman terlebih dahulu.";

            return;

        }

        if (!dataPegawai) {

            pesanPeminjaman.textContent =
                "Pegawai tidak ditemukan. Silakan pilih ulang.";

            tampilkanPilihanPegawai();

            return;

        }

        if (indexBarang === -1) {

            pesanPeminjaman.textContent =
                "Barang tidak ditemukan.";

            tampilkanPilihanBarang();

            return;

        }

        if (!Number.isInteger(jumlah) || jumlah < 1) {

            pesanPeminjaman.textContent =
                "Jumlah peminjaman minimal 1.";

            return;

        }

        const dataBarang = barang[indexBarang];
        const stokTersedia = Number(dataBarang.stokTersedia || 0);

        if (jumlah > stokTersedia) {

            pesanPeminjaman.textContent =
                `Stok tidak mencukupi. Stok tersedia hanya ${stokTersedia}.`;

            return;

        }


        // Buat transaksi
        const dataTransaksi = {

            id: "PJM-" + Date.now(),

            tanggal: tanggal,

            ruangan: ruangan,

            idPegawai: dataPegawai.id,
            namaPegawai: dataPegawai.nama,

            idBarang: dataBarang.id,
            namaBarang: dataBarang.nama,
            satuan: dataBarang.satuan,

            jumlah: jumlah,
            jumlahDikembalikan: 0,

            catatan: catatan,

            status: "Dipinjam",

            tanggalDibuat: new Date().toISOString()

        };


        // Kurangi stok
        barang[indexBarang].stokTersedia =
            stokTersedia - jumlah;

        const stokLama = localStorage.getItem(BARANG_KEY);
        const transaksiLama = localStorage.getItem(TRANSAKSI_KEY);

        try {

            localStorage.setItem(
                BARANG_KEY,
                JSON.stringify(barang)
            );

            transaksi.unshift(dataTransaksi);

            localStorage.setItem(
                TRANSAKSI_KEY,
                JSON.stringify(transaksi)
            );

            window.dispatchEvent(
                new Event("sipintar:stok-berubah")
            );

            form.reset();

            tanggalInput.value = tanggalHariIni();

            tampilkanPilihanPegawai();
            tampilkanPilihanBarang();
            tampilkanPeminjaman();

            pesanPeminjaman.textContent =
                "Peminjaman berhasil disimpan! Stok tersedia telah diperbarui.";

        } catch (error) {

            console.error("Gagal menyimpan peminjaman:", error);

            try {

                if (stokLama === null) {
                    localStorage.removeItem(BARANG_KEY);
                } else {
                    localStorage.setItem(BARANG_KEY, stokLama);
                }

                if (transaksiLama === null) {
                    localStorage.removeItem(TRANSAKSI_KEY);
                } else {
                    localStorage.setItem(TRANSAKSI_KEY, transaksiLama);
                }

            } catch (restoreError) {
                console.error("Gagal memulihkan data:", restoreError);
            }

            pesanPeminjaman.textContent =
                "Peminjaman gagal disimpan. Silakan coba lagi.";

        }

    });


    // =================================
    // TAMPILKAN DATA SAAT APLIKASI DIBUKA
    // =================================

    tanggalInput.value = tanggalHariIni();

    tampilkanPilihanPegawai();
    tampilkanPilihanBarang();
    tampilkanPeminjaman();

})();


/* =================================
   SIPINTAR - PENGEMBALIAN BARANG
================================= */

(function () {

    const BARANG_KEY = "sipintar_data_barang_v1";
    const TRANSAKSI_KEY = "sipintar_transaksi_v1";

    const form = document.getElementById("form-pengembalian");
    const transaksiInput = document.getElementById("pengembalian-transaksi");
    const jumlahInput = document.getElementById("jumlah-pengembalian");
    const tanggalInput = document.getElementById("tanggal-pengembalian");
    const catatanInput = document.getElementById("catatan-pengembalian");

    const detailPengembalian = document.getElementById("detail-pengembalian");
    const detailRuangan = document.getElementById("detail-ruangan");
    const detailPegawai = document.getElementById("detail-pegawai");
    const detailBarang = document.getElementById("detail-barang");
    const detailJumlah = document.getElementById("detail-jumlah");
    const detailDikembalikan = document.getElementById("detail-dikembalikan");
    const detailSisa = document.getElementById("detail-sisa");

    const tombolSimpan = document.getElementById("simpan-pengembalian");
    const daftarPengembalian = document.getElementById("daftar-pengembalian");
    const pesanPengembalian = document.getElementById("pesan-pengembalian");


    // =================================
    // MEMBACA DATA LOCALSTORAGE
    // =================================

    function ambilData(key) {

        try {
            return JSON.parse(localStorage.getItem(key) || "[]");
        } catch (error) {
            console.error("Gagal membaca data:", error);
            return [];
        }

    }


    // =================================
    // MENGAMANKAN TEKS HTML
    // =================================

    function escapeHTML(teks) {

        return String(teks ?? "").replace(/[&<>"']/g, function (karakter) {

            const pengganti = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return pengganti[karakter];

        });

    }


    // =================================
    // TANGGAL HARI INI
    // =================================

    function tanggalHariIni() {

        const sekarang = new Date();

        const tahun = sekarang.getFullYear();
        const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
        const tanggal = String(sekarang.getDate()).padStart(2, "0");

        return `${tahun}-${bulan}-${tanggal}`;

    }


    // =================================
    // MENGHITUNG SISA PENGEMBALIAN
    // =================================

    function hitungSisa(transaksi) {

        const jumlah = Number(transaksi.jumlah || 0);
        const sudahKembali = Number(transaksi.jumlahDikembalikan || 0);

        return Math.max(0, jumlah - sudahKembali);

    }


    // =================================
    // MENAMPILKAN PILIHAN TRANSAKSI
    // =================================

    function tampilkanPilihanTransaksi() {

        const transaksi = ambilData(TRANSAKSI_KEY);

        transaksiInput.innerHTML = `
            <option value="">Pilih transaksi peminjaman</option>
        `;

        const transaksiAktif = transaksi.filter(function (item) {

            return hitungSisa(item) > 0 &&
                item.status !== "Selesai";

        });

        transaksiAktif.forEach(function (item) {

            const option = document.createElement("option");

            option.value = item.id;

            option.textContent =
                `${item.namaPegawai} - ${item.namaBarang} (Sisa: ${hitungSisa(item)})`;

            transaksiInput.appendChild(option);

        });

        if (transaksiAktif.length === 0) {

            const option = document.createElement("option");

            option.value = "";
            option.textContent = "Tidak ada peminjaman yang perlu dikembalikan";

            transaksiInput.appendChild(option);

        }

        transaksiInput.disabled = transaksiAktif.length === 0;

        jumlahInput.disabled = true;
        tombolSimpan.disabled = true;

        detailPengembalian.classList.add("hidden");

    }


    // =================================
    // MENAMPILKAN DETAIL TRANSAKSI
    // =================================

    function tampilkanDetailTransaksi() {

        const transaksi = ambilData(TRANSAKSI_KEY);

        const item = transaksi.find(function (data) {
            return data.id === transaksiInput.value;
        });

        if (!item) {

            detailPengembalian.classList.add("hidden");

            jumlahInput.disabled = true;
            tombolSimpan.disabled = true;

            jumlahInput.value = "";
            jumlahInput.removeAttribute("max");

            return;

        }

        const sudahKembali = Number(item.jumlahDikembalikan || 0);
        const sisa = hitungSisa(item);

        detailRuangan.textContent = item.ruangan || "-";
        detailPegawai.textContent = item.namaPegawai || "-";
        detailBarang.textContent = item.namaBarang || "-";
        detailJumlah.textContent = item.jumlah + " " + (item.satuan || "");
        detailDikembalikan.textContent = sudahKembali + " " + (item.satuan || "");
        detailSisa.textContent = sisa + " " + (item.satuan || "");

        detailPengembalian.classList.remove("hidden");

        jumlahInput.disabled = sisa <= 0;
        jumlahInput.min = 1;
        jumlahInput.max = sisa;
        jumlahInput.value = "";

        tombolSimpan.disabled = sisa <= 0;

    }


    // =================================
    // MENAMPILKAN DAFTAR PENGEMBALIAN
    // =================================

    function tampilkanPengembalian() {

        const transaksi = ambilData(TRANSAKSI_KEY);

        const transaksiAktif = transaksi.filter(function (item) {
            return hitungSisa(item) > 0 &&
                item.status !== "Selesai";
        });

        if (transaksiAktif.length === 0) {

            daftarPengembalian.innerHTML = `
                <tr>
                    <td colspan="9">
                        Tidak ada barang yang menunggu pengembalian.
                    </td>
                </tr>
            `;

            return;

        }

        daftarPengembalian.innerHTML = transaksiAktif.map(function (item, index) {

            const sudahKembali = Number(item.jumlahDikembalikan || 0);
            const sisa = hitungSisa(item);

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHTML(item.tanggal)}</td>
                    <td>${escapeHTML(item.ruangan)}</td>
                    <td>${escapeHTML(item.namaPegawai)}</td>
                    <td>${escapeHTML(item.namaBarang)}</td>
                    <td>${item.jumlah} ${escapeHTML(item.satuan)}</td>
                    <td>${sudahKembali} ${escapeHTML(item.satuan)}</td>
                    <td>${sisa} ${escapeHTML(item.satuan)}</td>
                    <td>
                        <span class="status-peminjaman">
                            ${escapeHTML(item.status)}
                        </span>
                    </td>
                </tr>
            `;

        }).join("");

    }


    // =================================
    // PILIH TRANSAKSI
    // =================================

    transaksiInput.addEventListener("change", function () {

        pesanPengembalian.textContent = "";

        tampilkanDetailTransaksi();

    });


    // =================================
    // SIMPAN PENGEMBALIAN
    // =================================

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        const idTransaksi = transaksiInput.value;
        const jumlahKembali = Number(jumlahInput.value);
        const tanggalKembali = tanggalInput.value;
        const catatan = catatanInput.value.trim();

        let transaksi = ambilData(TRANSAKSI_KEY);
        let barang = ambilData(BARANG_KEY);

        const indexTransaksi = transaksi.findIndex(function (item) {
            return item.id === idTransaksi;
        });

        if (indexTransaksi === -1) {

            pesanPengembalian.textContent =
                "Transaksi tidak ditemukan.";

            return;

        }

        const dataTransaksi = transaksi[indexTransaksi];
        const sisa = hitungSisa(dataTransaksi);

        if (!tanggalKembali || !idTransaksi) {

            pesanPengembalian.textContent =
                "Lengkapi data pengembalian terlebih dahulu.";

            return;

        }

        if (!Number.isInteger(jumlahKembali) || jumlahKembali < 1) {

            pesanPengembalian.textContent =
                "Jumlah pengembalian minimal 1.";

            return;

        }

        if (jumlahKembali > sisa) {

            pesanPengembalian.textContent =
                `Jumlah terlalu banyak. Barang yang belum dikembalikan hanya ${sisa}.`;

            return;

        }

        const indexBarang = barang.findIndex(function (item) {
            return item.id === dataTransaksi.idBarang;
        });

        if (indexBarang === -1) {

            pesanPengembalian.textContent =
                "Data barang tidak ditemukan. Stok tidak dapat diperbarui.";

            return;

        }


        // Simpan data lama untuk pemulihan jika gagal
        const barangLama = localStorage.getItem(BARANG_KEY);
        const transaksiLama = localStorage.getItem(TRANSAKSI_KEY);

        const jumlahSebelumnya = Number(
            dataTransaksi.jumlahDikembalikan || 0
        );

        const jumlahBaru = jumlahSebelumnya + jumlahKembali;

        const sisaBaru = Number(dataTransaksi.jumlah) - jumlahBaru;


        // Tambahkan stok tersedia
        barang[indexBarang].stokTersedia =
            Number(barang[indexBarang].stokTersedia || 0) + jumlahKembali;


        // Perbarui transaksi
        transaksi[indexTransaksi] = {

            ...dataTransaksi,

            jumlahDikembalikan: jumlahBaru,

            status: sisaBaru === 0
                ? "Selesai"
                : "Dikembalikan Sebagian",

            tanggalPengembalianTerakhir: tanggalKembali,

            catatanPengembalian: catatan

        };


        tombolSimpan.disabled = true;

        try {

            localStorage.setItem(
                BARANG_KEY,
                JSON.stringify(barang)
            );

            localStorage.setItem(
                TRANSAKSI_KEY,
                JSON.stringify(transaksi)
            );


            // Perbarui Data Barang, Katalog, dan Dashboard
            window.dispatchEvent(
                new Event("sipintar:stok-berubah")
            );


            // Reset formulir
            form.reset();

            tanggalInput.value = tanggalHariIni();

            tampilkanPilihanTransaksi();
            tampilkanPengembalian();

            pesanPengembalian.textContent =
                sisaBaru === 0
                ? "Pengembalian berhasil! Semua barang telah dikembalikan."
                : `Pengembalian berhasil! Masih ada ${sisaBaru} barang yang belum dikembalikan.`;

        } catch (error) {

            console.error("Gagal menyimpan pengembalian:", error);

            // Pulihkan data jika penyimpanan gagal
            try {

                if (barangLama === null) {
                    localStorage.removeItem(BARANG_KEY);
                } else {
                    localStorage.setItem(BARANG_KEY, barangLama);
                }

                if (transaksiLama === null) {
                    localStorage.removeItem(TRANSAKSI_KEY);
                } else {
                    localStorage.setItem(TRANSAKSI_KEY, transaksiLama);
                }

            } catch (restoreError) {

                console.error("Gagal memulihkan data:", restoreError);

            }

            pesanPengembalian.textContent =
                "Pengembalian gagal disimpan. Silakan coba lagi.";

            tampilkanDetailTransaksi();

        } finally {

            tombolSimpan.disabled = !transaksiInput.value;

        }

    });


    // =================================
    // SINKRONISASI DARI PEMINJAMAN
    // =================================

    window.addEventListener("sipintar:stok-berubah", function () {

        tampilkanPilihanTransaksi();
        tampilkanPengembalian();

    });


    // =================================
    // TANGGAL DAN DATA AWAL
    // =================================

    tanggalInput.value = tanggalHariIni();

    tampilkanPilihanTransaksi();
    tampilkanPengembalian();

})();
/* =====================================
   SIPINTAR - RIWAYAT TRANSAKSI
===================================== */

(() => {
    const TRANSAKSI_KEY = "sipintar_transaksi_v1";

    const cariInput = document.getElementById("cari-riwayat");
    const filterStatus = document.getElementById("filter-status-riwayat");
    const filterTanggal = document.getElementById("filter-tanggal-riwayat");
    const resetButton = document.getElementById("reset-filter-riwayat");
    const daftarRiwayat = document.getElementById("daftar-riwayat");

    const totalElement = document.getElementById("riwayat-total");
    const aktifElement = document.getElementById("riwayat-aktif");
    const selesaiElement = document.getElementById("riwayat-selesai");
    const jumlahHasil = document.getElementById("jumlah-hasil-riwayat");

    if (
        !cariInput ||
        !filterStatus ||
        !filterTanggal ||
        !resetButton ||
        !daftarRiwayat
    ) {
        return;
    }

    function ambilTransaksi() {
        try {
            return JSON.parse(
                localStorage.getItem(TRANSAKSI_KEY)
            ) || [];
        } catch (error) {
            console.error("Gagal membaca riwayat:", error);
            return [];
        }
    }

    function escapeHTML(teks) {
        return String(teks ?? "").replace(/[&<>"']/g, karakter => {
            const karakterHTML = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return karakterHTML[karakter];
        });
    }

    function formatTanggal(tanggal) {
        if (!tanggal) return "-";

        const bagian = String(tanggal).split("-");

        if (bagian.length !== 3) return escapeHTML(tanggal);

        return `${bagian[2]}/${bagian[1]}/${bagian[0]}`;
    }

    function hitungSisa(transaksi) {
        const jumlah = Number(transaksi.jumlah) || 0;
        const dikembalikan = Number(transaksi.jumlahDikembalikan) || 0;

        return Math.max(0, jumlah - dikembalikan);
    }

    function tampilkanRiwayat() {
        const semuaTransaksi = ambilTransaksi();

        // Ringkasan transaksi
        const total = semuaTransaksi.length;
        const selesai = semuaTransaksi.filter(item =>
            item.status === "Selesai"
        ).length;

        const aktif = semuaTransaksi.filter(item =>
            item.status !== "Selesai"
        ).length;

        if (totalElement) totalElement.textContent = total;
        if (aktifElement) aktifElement.textContent = aktif;
        if (selesaiElement) selesaiElement.textContent = selesai;

        // Ambil nilai pencarian dan filter
        const kataKunci = cariInput.value.trim().toLowerCase();
        const statusDipilih = filterStatus.value;
        const tanggalDipilih = filterTanggal.value;

        // Filter transaksi
        const hasilFilter = semuaTransaksi.filter(item => {
            const cocokPencarian = [
                item.id,
                item.namaPegawai,
                item.namaBarang,
                item.ruangan
            ].some(nilai =>
                String(nilai ?? "").toLowerCase().includes(kataKunci)
            );

            const cocokStatus =
                !statusDipilih || item.status === statusDipilih;

            const cocokTanggal =
                !tanggalDipilih || item.tanggal === tanggalDipilih;

            return cocokPencarian && cocokStatus && cocokTanggal;
        });

        // Urutkan transaksi terbaru di atas
        hasilFilter.sort((a, b) =>
            String(b.tanggalDibuat || b.tanggal || "")
                .localeCompare(String(a.tanggalDibuat || a.tanggal || ""))
        );

        if (jumlahHasil) {
            jumlahHasil.textContent =
                `Menampilkan ${hasilFilter.length} dari ${total} transaksi`;
        }

        if (hasilFilter.length === 0) {
            daftarRiwayat.innerHTML = `
                <tr>
                    <td colspan="9" class="riwayat-kosong">
                        Tidak ada transaksi yang cocok dengan pencarian.
                    </td>
                </tr>
            `;
            return;
        }

        daftarRiwayat.innerHTML = hasilFilter.map((item, index) => {
            const jumlah = Number(item.jumlah) || 0;
            const dikembalikan = Number(item.jumlahDikembalikan) || 0;

            let statusClass = "status-dipinjam";

            if (item.status === "Selesai") {
                statusClass = "status-selesai";
            } else if (item.status === "Dikembalikan Sebagian") {
                statusClass = "status-sebagian";
            }

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHTML(item.id)}</td>
                    <td>${formatTanggal(item.tanggal)}</td>
                    <td>${escapeHTML(item.ruangan)}</td>
                    <td>${escapeHTML(item.namaPegawai)}</td>
                    <td>${escapeHTML(item.namaBarang)}</td>
                    <td>${jumlah} ${escapeHTML(item.satuan)}</td>
                    <td>${dikembalikan} ${escapeHTML(item.satuan)}</td>
                    <td>
                        <span class="riwayat-status ${statusClass}">
                            ${escapeHTML(item.status)}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Pencarian langsung saat mengetik
    cariInput.addEventListener("input", tampilkanRiwayat);

    // Filter status
    filterStatus.addEventListener("change", tampilkanRiwayat);

    // Filter tanggal
    filterTanggal.addEventListener("change", tampilkanRiwayat);

    // Reset semua filter
    resetButton.addEventListener("click", () => {
        cariInput.value = "";
        filterStatus.value = "";
        filterTanggal.value = "";

        tampilkanRiwayat();
    });

    // Perbarui riwayat ketika transaksi berubah
    window.addEventListener("sipintar:stok-berubah", tampilkanRiwayat);

    // Tampilkan data pertama kali
    tampilkanRiwayat();

})();
/* =====================================
   SIPINTAR - LAPORAN
===================================== */

(() => {
    const BARANG_KEY = "sipintar_data_barang_v1";
    const TRANSAKSI_KEY = "sipintar_transaksi_v1";

    const tanggalMulai = document.getElementById("laporan-tanggal-mulai");
    const tanggalAkhir = document.getElementById("laporan-tanggal-akhir");
    const tombolReset = document.getElementById("laporan-reset");
    const tombolCetak = document.getElementById("laporan-cetak");

    const daftarBarang = document.getElementById("laporan-daftar-barang");
    const daftarTransaksi = document.getElementById("laporan-daftar-transaksi");

    if (!tanggalMulai || !tanggalAkhir || !daftarBarang || !daftarTransaksi) {
        return;
    }

    function ambilData(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (error) {
            console.error("Gagal membaca data:", error);
            return [];
        }
    }

    function aman(teks) {
        return String(teks ?? "").replace(/[&<>"']/g, karakter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[karakter]);
    }

    function formatTanggal(tanggal) {
        if (!tanggal) return "-";

        const bagian = String(tanggal).split("-");
        if (bagian.length !== 3) return aman(tanggal);

        return `${bagian[2]}/${bagian[1]}/${bagian[0]}`;
    }

    function hitungSisa(item) {
        return Math.max(
            0,
            (Number(item.jumlah) || 0) -
            (Number(item.jumlahDikembalikan) || 0)
        );
    }

    function tampilkanLaporan() {
        const barang = ambilData(BARANG_KEY);
        const transaksi = ambilData(TRANSAKSI_KEY);

        // RINGKASAN INVENTARIS
        const totalJenis = barang.length;

        const stokTersedia = barang.reduce(
            (total, item) => total + (Number(item.stokTersedia) || 0),
            0
        );

        const sedangDipinjam = barang.reduce(
            (total, item) => total + Math.max(
                0,
                (Number(item.stok) || 0) -
                (Number(item.stokTersedia) || 0)
            ),
            0
        );

        document.getElementById("laporan-total-barang").textContent = totalJenis;
        document.getElementById("laporan-stok-tersedia").textContent = stokTersedia;
        document.getElementById("laporan-sedang-dipinjam").textContent = sedangDipinjam;

        // FILTER PERIODE BERDASARKAN TANGGAL PEMINJAMAN
        const mulai = tanggalMulai.value;
        const akhir = tanggalAkhir.value;

        const transaksiFilter = transaksi.filter(item => {
            const tanggal = String(item.tanggal || "");

            return (
                (!mulai || tanggal >= mulai) &&
                (!akhir || tanggal <= akhir)
            );
        });

        // REKAP STATUS
        const jumlahDipinjam = transaksiFilter.filter(
            item => item.status === "Dipinjam"
        ).length;

        const jumlahSebagian = transaksiFilter.filter(
            item => item.status === "Dikembalikan Sebagian"
        ).length;

        const jumlahSelesai = transaksiFilter.filter(
            item => item.status === "Selesai"
        ).length;

        document.getElementById("laporan-status-dipinjam").textContent = jumlahDipinjam;
        document.getElementById("laporan-status-sebagian").textContent = jumlahSebagian;
        document.getElementById("laporan-status-selesai").textContent = jumlahSelesai;

        // REKAP BARANG
        const rekap = {};

        transaksiFilter.forEach(item => {
            const nama = item.namaBarang || "Barang tidak diketahui";

            if (!rekap[nama]) {
                rekap[nama] = {
                    nama,
                    dipinjam: 0,
                    dikembalikan: 0,
                    sisa: 0
                };
            }

            rekap[nama].dipinjam += Number(item.jumlah) || 0;
            rekap[nama].dikembalikan += Number(item.jumlahDikembalikan) || 0;
            rekap[nama].sisa += hitungSisa(item);
        });

        const hasilRekap = Object.values(rekap).sort(
            (a, b) => b.dipinjam - a.dipinjam
        );

        daftarBarang.innerHTML = hasilRekap.length
            ? hasilRekap.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${aman(item.nama)}</td>
                    <td>${item.dipinjam}</td>
                    <td>${item.dikembalikan}</td>
                    <td>${item.sisa}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="5">Belum ada data peminjaman pada periode ini.</td></tr>`;

        // DETAIL TRANSAKSI
        const hasilTransaksi = [...transaksiFilter].sort(
            (a, b) => String(b.tanggalDibuat || b.tanggal || "")
                .localeCompare(String(a.tanggalDibuat || a.tanggal || ""))
        );

        daftarTransaksi.innerHTML = hasilTransaksi.length
            ? hasilTransaksi.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${aman(item.id)}</td>
                    <td>${formatTanggal(item.tanggal)}</td>
                    <td>${aman(item.ruangan)}</td>
                    <td>${aman(item.namaPegawai)}</td>
                    <td>${aman(item.namaBarang)}</td>
                    <td>${Number(item.jumlah) || 0} ${aman(item.satuan)}</td>
                    <td>${Number(item.jumlahDikembalikan) || 0} ${aman(item.satuan)}</td>
                    <td>${aman(item.status)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="9">Belum ada transaksi pada periode ini.</td></tr>`;
    }

    // FILTER TANGGAL
    tanggalMulai.addEventListener("change", tampilkanLaporan);
    tanggalAkhir.addEventListener("change", tampilkanLaporan);

    // RESET PERIODE
    tombolReset.addEventListener("click", () => {
        tanggalMulai.value = "";
        tanggalAkhir.value = "";
        tampilkanLaporan();
    });

    // CETAK LAPORAN
    tombolCetak.addEventListener("click", () => {
        window.print();
    });

    // PERBARUI JIKA DATA TRANSAKSI BERUBAH
    window.addEventListener("sipintar:stok-berubah", tampilkanLaporan);

    tampilkanLaporan();
})();
/* =====================================
   SIPINTAR - BACKUP & RESTORE DATA
===================================== */

(function () {

    const BARANG_KEY = "sipintar_data_barang_v1";
    const PEGAWAI_KEY = "sipintar_data_pegawai_v1";
    const TRANSAKSI_KEY = "sipintar_transaksi_v1";

    const DATABASE_NAME = "sipintar_foto_db";
    const STORE_NAME = "foto_barang";

    const tombolBackup = document.getElementById("tombol-backup");
    const tombolPilihRestore = document.getElementById("tombol-pilih-restore");
    const fileRestore = document.getElementById("file-restore");
    const pesanBackup = document.getElementById("pesan-backup");

    if (!tombolBackup || !tombolPilihRestore || !fileRestore || !pesanBackup) {
        return;
    }

    // =================================
    // MEMBUKA DATABASE FOTO
    // =================================

    function bukaDatabase() {
        return new Promise(function (resolve, reject) {

            const request = indexedDB.open(DATABASE_NAME);

            request.onsuccess = function () {
                const db = request.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.close();
                    reject(new Error("Database foto SIPINTAR tidak ditemukan."));
                    return;
                }

                resolve(db);
            };

            request.onerror = function () {
                reject(request.error);
            };

        });
    }


    // =================================
    // MENGAMBIL SELURUH FOTO
    // =================================

    async function ambilSemuaFoto() {

        const db = await bukaDatabase();

        return new Promise(function (resolve, reject) {

            const transaction = db.transaction(STORE_NAME, "readonly");
            const request = transaction.objectStore(STORE_NAME).getAll();

            request.onsuccess = function () {
                resolve(request.result || []);
            };

            request.onerror = function () {
                reject(request.error);
            };

            transaction.oncomplete = function () {
                db.close();
            };

            transaction.onerror = function () {
                db.close();
                reject(transaction.error);
            };

        });
    }


    // =================================
    // MENGGANTI SELURUH FOTO
    // =================================

    async function gantiSemuaFoto(daftarFoto) {

        const db = await bukaDatabase();

        return new Promise(function (resolve, reject) {

            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);

            store.clear();

            daftarFoto.forEach(function (foto) {
                store.put(foto);
            });

            transaction.oncomplete = function () {
                db.close();
                resolve();
            };

            transaction.onerror = function () {
                db.close();
                reject(transaction.error);
            };

            transaction.onabort = function () {
                db.close();
                reject(transaction.error || new Error("Pemulihan foto dibatalkan."));
            };

        });
    }


    // =================================
    // MEMBACA DATA LOCALSTORAGE
    // =================================

    function ambilData(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || "[]");
        } catch (error) {
            throw new Error("Data SIPINTAR tidak dapat dibaca.");
        }
    }


    // =================================
    // MEMBUAT FILE BACKUP
    // =================================

    async function buatBackup() {

        tombolBackup.disabled = true;
        pesanBackup.textContent = "Sedang membuat backup...";

        try {

            const backup = {
                aplikasi: "SIPINTAR",
                versiBackup: 1,
                tanggalBackup: new Date().toISOString(),

                data: {
                    barang: ambilData(BARANG_KEY),
                    pegawai: ambilData(PEGAWAI_KEY),
                    transaksi: ambilData(TRANSAKSI_KEY)
                },

                foto: await ambilSemuaFoto()
            };

            const isiFile = JSON.stringify(backup, null, 2);

            const file = new Blob(
                [isiFile],
                { type: "application/json" }
            );

            const url = URL.createObjectURL(file);
            const link = document.createElement("a");

            const tanggal = new Date().toISOString()
                .replace(/[:.]/g, "-");

            link.href = url;
            link.download = "SIPINTAR-Backup-" + tanggal + ".json";

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

            pesanBackup.textContent =
                "Backup berhasil dibuat. Simpan file tersebut di tempat yang aman.";

        } catch (error) {

            console.error("Backup gagal:", error);

            pesanBackup.textContent =
                "Backup gagal: " + error.message;

        } finally {

            tombolBackup.disabled = false;

        }

    }


    // =================================
    // MEMERIKSA FORMAT FILE BACKUP
    // =================================

    function validasiBackup(backup) {

        if (
            !backup ||
            backup.aplikasi !== "SIPINTAR" ||
            backup.versiBackup !== 1 ||
            !backup.data ||
            !Array.isArray(backup.data.barang) ||
            !Array.isArray(backup.data.pegawai) ||
            !Array.isArray(backup.data.transaksi) ||
            !Array.isArray(backup.foto)
        ) {
            throw new Error("Format file backup tidak valid.");
        }

        const semuaFotoValid = backup.foto.every(function (foto) {
            return (
                foto &&
                typeof foto.id === "string" &&
                typeof foto.data === "string"
            );
        });

        if (!semuaFotoValid) {
            throw new Error("Data foto dalam backup tidak valid.");
        }

        const semuaDataValid =
            backup.data.barang.every(item =>
                item && typeof item.id === "string"
            ) &&
            backup.data.pegawai.every(item =>
                item && typeof item.id === "string"
            ) &&
            backup.data.transaksi.every(item =>
                item && typeof item.id === "string"
            );

        if (!semuaDataValid) {
            throw new Error("Ada data barang, pegawai, atau transaksi yang tidak valid.");
        }

    }


    // =================================
    // MEMULIHKAN DATA
    // =================================

    async function pulihkanBackup(backup) {

        validasiBackup(backup);

        const yakin = confirm(
            "PERHATIAN!\n\n" +
            "Restore akan mengganti seluruh data barang, pegawai, " +
            "transaksi, dan foto yang saat ini tersimpan.\n\n" +
            "Pastikan kamu sudah memiliki backup data terbaru.\n\n" +
            "Apakah kamu yakin ingin melanjutkan?"
        );

        if (!yakin) {
            pesanBackup.textContent = "Restore dibatalkan.";
            return;
        }

        tombolPilihRestore.disabled = true;
        tombolBackup.disabled = true;

        pesanBackup.textContent = "Sedang memulihkan data...";

        const kunciData = [
            BARANG_KEY,
            PEGAWAI_KEY,
            TRANSAKSI_KEY
        ];

        const dataLama = {};

        kunciData.forEach(function (key) {
            dataLama[key] = localStorage.getItem(key);
        });

        let fotoLama = null;

        try {

            // Simpan foto lama untuk cadangan pemulihan
            fotoLama = await ambilSemuaFoto();

            // Ganti seluruh foto
            await gantiSemuaFoto(backup.foto);

            // Ganti data LocalStorage
            localStorage.setItem(
                BARANG_KEY,
                JSON.stringify(backup.data.barang)
            );

            localStorage.setItem(
                PEGAWAI_KEY,
                JSON.stringify(backup.data.pegawai)
            );

            localStorage.setItem(
                TRANSAKSI_KEY,
                JSON.stringify(backup.data.transaksi)
            );

            pesanBackup.textContent =
                "Restore berhasil! Aplikasi akan dimuat ulang.";

            setTimeout(function () {
                window.location.reload();
            }, 1200);

        } catch (error) {

            console.error("Restore gagal:", error);

            // Pulihkan data LocalStorage sebelumnya
            kunciData.forEach(function (key) {

                try {
                    if (dataLama[key] === null) {
                        localStorage.removeItem(key);
                    } else {
                        localStorage.setItem(key, dataLama[key]);
                    }
                } catch (restoreError) {
                    console.error("Gagal memulihkan LocalStorage:", restoreError);
                }

            });

            // Pulihkan foto sebelumnya
            if (fotoLama !== null) {
                try {
                    await gantiSemuaFoto(fotoLama);
                } catch (restoreError) {
                    console.error("Gagal memulihkan foto lama:", restoreError);
                }
            }

            pesanBackup.textContent =
                "Restore gagal. Data sebelumnya telah dicoba untuk dipulihkan. " +
                error.message;

        } finally {

            tombolPilihRestore.disabled = false;
            tombolBackup.disabled = false;

            fileRestore.value = "";

        }

    }


    // =================================
    // TOMBOL BACKUP
    // =================================

    tombolBackup.addEventListener("click", buatBackup);


    // =================================
    // PILIH FILE RESTORE
    // =================================

    tombolPilihRestore.addEventListener("click", function () {
        fileRestore.click();
    });


    // =================================
    // PROSES FILE RESTORE
    // =================================

    fileRestore.addEventListener("change", async function () {

        const file = fileRestore.files[0];

        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".json")) {
            pesanBackup.textContent =
                "Pilih file backup SIPINTAR dengan format .json.";

            fileRestore.value = "";
            return;
        }

        try {

            const isiFile = await file.text();
            const backup = JSON.parse(isiFile);

            await pulihkanBackup(backup);

        } catch (error) {

            console.error("File backup gagal dibaca:", error);

            pesanBackup.textContent =
                "File backup tidak dapat dibaca atau formatnya tidak valid.";

            fileRestore.value = "";

        }

    });

})();