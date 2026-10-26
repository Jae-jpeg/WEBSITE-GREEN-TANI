// ── DATA LAYER ──
// Produk, stok, dan pesanan memakai data bersama di js/katalog.js (objek GT),
// sehingga sisi pelanggan dan panel admin selalu membaca data yang sama.

function getLoginEmail() {
    try {
        const d = JSON.parse(sessionStorage.getItem('mothernature_customer_login') || 'null');
        return d && d.email ? String(d.email).toLowerCase() : '';
    } catch (error) {
        return '';
    }
}

function getLoginData() {
    try {
        return JSON.parse(sessionStorage.getItem('mothernature_customer_login') || 'null');
    } catch (error) {
        return null;
    }
}

function getData() {
    return GT.orders();
}

function saveData(data) {
    if (GT.saveOrders(data)) return true;
    alert('Data tidak dapat disimpan. Pastikan penyimpanan browser tersedia.');
    return false;
}

// ── HELPERS ──
function formatTanggal(dateStr) {
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr || '-');
    return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
}

function statusPesananClass(status) {
    return ({ Menunggu: 'status-proses', Diproses: 'status-dikirim', Selesai: 'status-selesai', Dibatalkan: 'status-batal' })[status] || 'status-proses';
}

// ── HALAMAN BERANDA: kartu produk dari katalog ──
function initBeranda() {
    const grid = document.getElementById('berandaGrid');
    if (!grid) return;
    grid.innerHTML = GT.products().map(function (p) {
        return '<article class="produk-card"><h3>' + GT.esc(p.name) + '</h3>' +
            '<img src="' + GT.esc(p.image || '../Gambar/logo.png') + '" width="300" height="200" alt="' + GT.esc(p.name) + '" onerror="this.src=\'../Gambar/logo.png\'"></article>';
    }).join('');
}

// ── HALAMAN PRODUK: stok & harga real-time dari admin ──
function initProduk() {
    const grid = document.getElementById('produkGrid');
    if (!grid) return;
    const list = GT.products();

    const count = document.getElementById('produkCount');
    if (count) count.textContent = list.length + ' produk pupuk pilihan untuk kebutuhan lahan Anda';

    grid.innerHTML = list.map(function (p) {
        const st = GT.stockStatus(p);
        const badge = st[1] === 'out' ? 'Stok habis'
            : st[1] === 'low' ? 'Stok menipis: ' + p.stock + ' ' + p.unit
            : 'Stok: ' + p.stock + ' ' + p.unit;
        const action = st[1] === 'out'
            ? '<span class="btn btn-sm btn-disabled" aria-disabled="true">Habis</span>'
            : '<a class="btn btn-green btn-sm" href="pesan.html?produk=' + encodeURIComponent(p.id) + '">Pesan</a>';
        return '<article class="produk-card">' +
            '<img src="' + GT.esc(p.image || '../Gambar/logo.png') + '" alt="' + GT.esc(p.name) + '" loading="lazy" onerror="this.src=\'../Gambar/logo.png\'">' +
            '<h3>' + GT.esc(p.name) + '</h3>' +
            '<p>' + GT.esc(p.description || '') + '</p>' +
            '<span class="stock-badge ' + st[1] + '">' + GT.esc(badge) + '</span>' +
            '<div class="card-price-row with-action"><span class="card-price">' + GT.rupiah(p.price) + ' / ' + GT.esc(p.unit) + '</span>' + action + '</div>' +
            '</article>';
    }).join('');
}

// ── FORM PEMESANAN ──
function initForm() {
    const form = document.getElementById('formPesanan');
    if (!form) return;

    const teleponEl = document.getElementById('telepon');
    if (teleponEl) {
        teleponEl.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 13);
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    const preProduk = urlParams.get('produk');
    const produkEl = document.getElementById('produk');
    const jumlahEl = document.getElementById('jumlah');
    const errorEl = document.getElementById('formError');
    let editMode = false;
    let editItem = null;

    if (editId) {
        editItem = GT.orders().filter(function (o) { return String(o.id) === String(editId); })[0] || null;
        if (editItem && editItem.status !== 'Menunggu') {
            alert('Pesanan ini sudah ' + String(editItem.status || '').toLowerCase() + ' dan tidak dapat diubah lagi.');
            window.location.href = 'riwayat.html';
            return;
        }
        editMode = !!editItem;
    }

    // Isi daftar produk dari katalog (harga & stok terbaru).
    function stokTersedia(p) {
        // Saat edit, stok yang sudah dipesan sendiri dihitung kembali.
        const own = (editMode && editItem.stokDipotong && editItem.produkId === p.id) ? Number(editItem.jumlah) : 0;
        return Number(p.stock) + own;
    }
    const katalog = GT.products();
    let opsi = '<option value="pilihan">-- Pilih Pupuk Yang Anda Butuhkan --</option>';
    katalog.forEach(function (p) {
        const sisa = stokTersedia(p);
        const info = sisa <= 0 ? ' (stok habis)' : ' (stok ' + sisa + ' ' + p.unit + ')';
        opsi += '<option value="' + GT.esc(p.id) + '"' + (sisa <= 0 ? ' disabled' : '') + '>' +
            GT.esc(p.name) + ' — ' + GT.rupiah(p.price) + '/' + GT.esc(p.unit) + info + '</option>';
    });
    produkEl.innerHTML = opsi;

    const stokInfo = document.getElementById('stokInfo');
    function updateStokInfo() {
        const p = katalog.filter(function (x) { return x.id === produkEl.value; })[0];
        if (!p) {
            if (stokInfo) stokInfo.textContent = '* Minimum pembelian 1 kg';
            jumlahEl.removeAttribute('max');
            return;
        }
        const sisa = stokTersedia(p);
        jumlahEl.max = sisa;
        if (stokInfo) stokInfo.textContent = '* Stok tersedia: ' + sisa + ' ' + p.unit + ' · Minimum pembelian 1 ' + p.unit;
    }
    produkEl.addEventListener('change', updateStokInfo);

    if (editMode) {
        document.getElementById('nama').value    = editItem.nama    || '';
        document.getElementById('telepon').value = editItem.telepon || '';
        document.getElementById('email').value   = editItem.email   || '';
        document.getElementById('alamat').value  = editItem.alamat  || '';
        document.getElementById('kota').value    = editItem.kota    || '';
        const provinsiEl = document.getElementById('provinsi');
        if (provinsiEl && editItem.provinsi) provinsiEl.value = editItem.provinsi;
        if (editItem.produkId) produkEl.value = editItem.produkId;
        jumlahEl.value = editItem.jumlah || '';
        const pengirimanEl = document.getElementById('pengiriman');
        if (pengirimanEl && editItem.pengiriman) pengirimanEl.value = editItem.pengiriman;
        const pembayaranEl = document.getElementById('pembayaran');
        if (pembayaranEl && editItem.pembayaran) pembayaranEl.value = editItem.pembayaran;
        document.getElementById('catatan').value = editItem.catatan || '';

        const btnSubmit = form.querySelector('button[type="submit"]');
        if (btnSubmit) btnSubmit.innerHTML = '✏️ Simpan Perubahan';

        const formWrapper = document.getElementById('formWrapper');
        if (formWrapper) {
            setTimeout(function () {
                formWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    } else {
        // Isi otomatis dari akun yang sedang login.
        const login = getLoginData();
        if (login) {
            if (login.nama) document.getElementById('nama').value = login.nama;
            if (login.email) document.getElementById('email').value = login.email;
        }
        if (preProduk && katalog.some(function (p) { return p.id === preProduk && Number(p.stock) > 0; })) {
            produkEl.value = preProduk;
        }
    }
    updateStokInfo();

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const nama       = document.getElementById('nama').value.trim();
        const telepon    = document.getElementById('telepon').value.trim();
        const email      = document.getElementById('email').value.trim();
        const alamat     = document.getElementById('alamat').value.trim();
        const kota       = document.getElementById('kota').value.trim();
        const provinsi   = document.getElementById('provinsi').value.trim();
        const produkId   = produkEl.value;
        const jumlah     = jumlahEl.value.trim();
        const pengiriman = document.getElementById('pengiriman').value;
        const pembayaran = document.getElementById('pembayaran').value;
        const catatan    = document.getElementById('catatan').value.trim();
        errorEl.textContent = '';

        if (!nama || !telepon || !email || !alamat || !kota || !provinsi || provinsi === 'pilihan' ||
            !produkId || produkId === 'pilihan' ||
            !jumlah ||
            !pengiriman || pengiriman === 'pilihan' ||
            !pembayaran || pembayaran === 'pilihan') {
            errorEl.textContent = '❌ Semua isian wajib harus dilengkapi!';
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!/^[0-9]+$/.test(telepon) || telepon.length > 13) {
            errorEl.textContent = '❌ Nomor telepon hanya boleh angka, maksimal 13 digit!';
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (isNaN(jumlah) || Number(jumlah) < 1) {
            errorEl.textContent = '❌ Jumlah pesanan minimal 1 kg!';
            return;
        }

        // Baca ulang katalog: stok bisa saja berubah sejak halaman dibuka.
        const produk = GT.findProduct(produkId);
        if (!produk) {
            errorEl.textContent = '❌ Produk tidak ditemukan. Muat ulang halaman.';
            return;
        }
        const own = (editMode && editItem.stokDipotong && editItem.produkId === produkId) ? Number(editItem.jumlah) : 0;
        const sisa = Number(produk.stock) + own;
        if (Number(jumlah) > sisa) {
            errorEl.textContent = '❌ Stok ' + produk.name + ' tidak mencukupi. Tersisa ' + sisa + ' ' + produk.unit + '.';
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const qty = Number(jumlah);
        const data = getData();
        let order;

        if (editMode) {
            order = data.filter(function (o) { return String(o.id) === String(editId); })[0];
            if (!order || order.status !== 'Menunggu') {
                errorEl.textContent = '❌ Pesanan ini sudah diproses dan tidak dapat diubah.';
                return;
            }
            GT.releaseStock(order, 'Pesanan ' + order.id + ' diubah pelanggan');
        } else {
            order = { id: GT.newOrderId(), tanggal: GT.todayISO(), date: new Date().toLocaleDateString('id-ID'), status: 'Menunggu', sumber: 'pelanggan', ownerEmail: getLoginEmail() };
            data.push(order);
        }

        Object.assign(order, {
            nama: nama, telepon: telepon, email: email, alamat: alamat, kota: kota, provinsi: provinsi,
            produkId: produk.id, produk: produk.name, harga: Number(produk.price),
            jumlah: String(qty), pengiriman: pengiriman, pembayaran: pembayaran, catatan: catatan,
            customer: nama, summary: produk.name + ' × ' + qty + ' ' + produk.unit,
            total: Number(produk.price) * qty
        });

        if (!GT.reserveStock(order, 'Pesanan ' + order.id + ' (pelanggan)')) {
            errorEl.textContent = '❌ Stok tidak mencukupi. Silakan coba lagi.';
            return;
        }
        if (!saveData(data)) return;

        form.reset();
        errorEl.textContent = '';
        alert(editMode ? '✅ Perubahan berhasil disimpan!' : '✅ Pesanan berhasil dikirim! Nomor pesanan: ' + order.id);
        window.location.href = 'riwayat.html';
    });
}

// ── RIWAYAT PESANAN ──
function initRiwayat() {
    const tbody         = document.getElementById('tableBody');
    const emptyState    = document.getElementById('emptyState');
    const dataCount     = document.getElementById('dataCount');
    const btnHapusSemua = document.getElementById('btnHapusSemua');
    const tableWrapper  = document.getElementById('tableWrapper');

    if (!tbody) return;

    // Hanya pesanan milik pelanggan ini (bukan data demo admin).
    function milikSaya(o) {
        return o.sumber === 'pelanggan' && String(o.ownerEmail || '') === getLoginEmail();
    }

    renderTable();

    if (btnHapusSemua) {
        btnHapusSemua.addEventListener('click', function () {
            if (!confirm('Hapus seluruh riwayat pesanan? Pesanan yang sedang diproses tidak ikut dihapus.')) return;
            const data = getData();
            const sisa = data.filter(function (o) {
                if (!milikSaya(o)) return true;
                if (o.status === 'Diproses') return true;
                if (o.status === 'Menunggu') GT.releaseStock(o, 'Pesanan ' + o.id + ' dihapus pelanggan');
                return false;
            });
            if (saveData(sisa)) renderTable();
        });
    }

    function renderTable() {
        const data = getData().filter(milikSaya);

        if (dataCount) dataCount.textContent = data.length + ' pesanan';

        if (data.length === 0) {
            tbody.innerHTML = '';
            if (emptyState)    emptyState.style.display    = 'block';
            if (tableWrapper)  tableWrapper.style.display  = 'none';
            if (btnHapusSemua) btnHapusSemua.style.display = 'none';
            return;
        }

        if (emptyState)    emptyState.style.display    = 'none';
        if (tableWrapper)  tableWrapper.style.display  = 'block';
        if (btnHapusSemua) btnHapusSemua.style.display = 'inline-block';

        tbody.innerHTML = '';
        data.forEach(function (item, i) {
            const tr = document.createElement('tr');
            const nilaiKolom = [
                String(i + 1),
                String(item.nama || ''),
                String(item.produk || ''),
                String(item.jumlah || '0') + ' kg',
                GT.rupiah(item.total || 0),
                String(item.pengiriman || ''),
                String(item.pembayaran || ''),
                formatTanggal(item.tanggal),
                String(item.status || 'Menunggu')
            ];

            nilaiKolom.forEach(function (nilai, index) {
                const td = document.createElement('td');
                if (index === 8) {
                    const badge = document.createElement('span');
                    badge.className = 'status-badge ' + statusPesananClass(nilai);
                    badge.textContent = nilai;
                    td.appendChild(badge);
                } else {
                    td.textContent = nilai;
                }
                if (index === 3) td.classList.add('quantity-cell');
                if (index === 1) {
                    const idEl = document.createElement('span');
                    idEl.className = 'table-subtext';
                    idEl.textContent = String(item.id);
                    td.appendChild(document.createElement('br'));
                    td.appendChild(idEl);
                }
                tr.appendChild(td);
            });

            const actionCell = document.createElement('td');
            const bisaUbah = item.status === 'Menunggu';
            const bisaHapus = item.status !== 'Diproses';

            if (bisaUbah) {
                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.className = 'btn-edit';
                editButton.dataset.id = String(item.id);
                editButton.textContent = 'Edit';
                editButton.setAttribute('aria-label', 'Edit pesanan ' + String(item.nama || ''));
                actionCell.appendChild(editButton);
                actionCell.appendChild(document.createTextNode(' '));
            }
            if (bisaHapus) {
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'btn-hapus';
                deleteButton.dataset.id = String(item.id);
                deleteButton.textContent = 'Hapus';
                deleteButton.setAttribute('aria-label', 'Hapus pesanan ' + String(item.nama || ''));
                actionCell.appendChild(deleteButton);
            }
            if (!bisaUbah && !bisaHapus) {
                actionCell.textContent = 'Sedang diproses';
            }
            tr.appendChild(actionCell);
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-edit').forEach(function (btn) {
            btn.addEventListener('click', function () {
                window.location.href = 'pesan.html?edit=' + encodeURIComponent(this.getAttribute('data-id'));
            });
        });

        tbody.querySelectorAll('.btn-hapus').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                if (!confirm('Hapus pesanan ini selamanya?')) return;
                const data = getData();
                const target = data.filter(function (o) { return String(o.id) === id; })[0];
                if (target && target.status === 'Menunggu') {
                    GT.releaseStock(target, 'Pesanan ' + target.id + ' dihapus pelanggan');
                }
                const sisa = data.filter(function (o) { return String(o.id) !== id; });
                if (saveData(sisa)) renderTable();
            });
        });
    }
}

function initMobileNavigation() {
    const menuButton = document.querySelector('.hamburger');
    const menu = document.querySelector('.nav-menu');
    if (!menuButton || !menu) return;

    menuButton.addEventListener('click', function () {
        const isOpen = menu.classList.toggle('open');
        menuButton.setAttribute('aria-expanded', String(isOpen));
    });

    menu.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            menu.classList.remove('open');
            menuButton.setAttribute('aria-expanded', 'false');
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initMobileNavigation();
    if (typeof GT === 'undefined') return;
    initBeranda();
    initProduk();
    initForm();
    initRiwayat();
});
