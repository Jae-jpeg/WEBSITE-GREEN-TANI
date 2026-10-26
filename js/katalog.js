/* Green Tani — data bersama antara halaman pelanggan dan admin (localStorage).
   Satu sumber data: produk & stok, riwayat stok, dan pesanan. */
(function () {
    'use strict';

    var KEYS = {
        products: 'greentani_products_v2',
        history: 'greentani_stock_history_v1',
        orders: 'greentani_orders_v1',
        oldOrders: 'mothernature_pesanan' // format lama, otomatis dimigrasikan
    };

    var SEED = [
        { id: 'GT001', name: 'Pupuk Natur T16', category: 'Pupuk', unit: 'kg', price: 85000, stock: 500, image: '../Gambar/Pupuk_1.jpeg', description: 'Pupuk majemuk granular yang memiliki unsur micro TE seimbang yang mudah diserap. Cocok untuk menunjang pembuahan dan tahan lama.' },
        { id: 'GT002', name: 'Pupuk Natur Urea', category: 'Pupuk Anorganik', unit: 'kg', price: 120000, stock: 200, image: '../Gambar/Pupuk_2.jpeg', description: 'Diperkaya dengan kandungan nitrogen (46%) yang pekat dan mudah diserap. Cocok untuk merangsang pertumbuhan yang optimal dan sehat pada tumbuhan.' },
        { id: 'GT003', name: 'Pupuk Naturstar 16-20s', category: 'Pupuk Anorganik', unit: 'kg', price: 45000, stock: 800, image: '../Gambar/Pupuk_3.jpeg', description: 'Pupuk kristal unggulan dengan kandungan nitrogen, posfat dan sulfur yang lengkap. Cocok untuk memelihara kesuburan dan keberlangsungan tumbuhan.' },
        { id: 'GT004', name: 'Pupuk Naturfast Powder', category: 'Pupuk', unit: 'kg', price: 90000, stock: 12, image: '../Gambar/Pupuk_4.jpeg', description: 'Berbentuk serbuk halus dan diperkaya mikronutrisi padat, dirancang untuk bereaksi cepat dengan tanah sehingga mampu menyediakan nutrisi cepat tepat. Cocok untuk pemupukan skala kecil dan harian.' },
        { id: 'GT005', name: 'Pupuk N-Multi CRF +', category: 'Pupuk Organik', unit: 'kg', price: 110000, stock: 0, image: '../Gambar/Pupuk_5.jpeg', description: 'Pupuk slow release kalium yang melepaskan hara secara bertahap sesuai dengan kebutuhan tumbuhan. Hemat biaya dan efisien.' },
        { id: 'GT006', name: 'Pupuk Natur Zinc', category: 'Pupuk', unit: 'kg', price: 110000, stock: 120, image: '../Gambar/Pupuk_6.jpeg', description: 'Pupuk granul yang kaya akan unsur Zinc dan Cu untuk meningkatkan aroma dan tekstur pada buah, sayur dan umbi. Butirannya mudah ditabur dan tidak mudah menggumpal.' }
    ];

    // ── util penyimpanan ──
    function read(key, fallback) {
        try {
            var x = JSON.parse(localStorage.getItem(key));
            return Array.isArray(x) ? x : fallback;
        } catch (e) { return fallback; }
    }
    function write(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); return true; }
        catch (e) { return false; }
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
    function todayISO() {
        var d = new Date();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return d.getFullYear() + '-' + m + '-' + day;
    }

    // ── produk & stok ──
    function products() {
        var x = read(KEYS.products, null);
        if (!x || !x.length) {
            x = SEED.map(function (p) { return Object.assign({}, p); });
            write(KEYS.products, x);
        }
        return x;
    }
    function saveProducts(list) { return write(KEYS.products, list); }
    function findProduct(id) {
        return products().filter(function (p) { return p.id === id; })[0] || null;
    }
    // [label, kelas] — kelas: available | low | out
    function stockStatus(p) {
        var s = Number(p.stock);
        if (s <= 0) return ['Habis', 'out'];
        if (s <= 20) return ['Menipis', 'low'];
        return ['Tersedia', 'available'];
    }

    // ── riwayat stok (dibaca juga oleh admin gudang) ──
    function addHistory(p, delta, reason) {
        var h = read(KEYS.history, []);
        h.unshift({ time: new Date().toLocaleString('id-ID'), ts: Date.now(), id: p.id, name: p.name, delta: delta, unit: p.unit, reason: reason, type: 'order', by: 'Sistem (pesanan)' });
        write(KEYS.history, h.slice(0, 100));
    }

    // Kurangi stok untuk sebuah pesanan. Return false bila stok tidak cukup.
    function reserveStock(order, reason) {
        var ps = products();
        var p = ps.filter(function (x) { return x.id === order.produkId; })[0];
        var qty = Number(order.jumlah);
        if (!p || !(qty > 0) || Number(p.stock) < qty) return false;
        p.stock = Number(p.stock) - qty;
        saveProducts(ps);
        addHistory(p, -qty, reason || ('Pesanan ' + order.id));
        order.stokDipotong = true;
        return true;
    }
    // Kembalikan stok pesanan (dibatalkan / diubah / dihapus).
    function releaseStock(order, reason) {
        if (!order.stokDipotong) return;
        var ps = products();
        var p = ps.filter(function (x) { return x.id === order.produkId; })[0];
        order.stokDipotong = false;
        if (!p) return;
        var qty = Number(order.jumlah);
        p.stock = Number(p.stock) + qty;
        saveProducts(ps);
        addHistory(p, qty, reason || ('Pesanan ' + order.id + ' dikembalikan'));
    }
    // Dipakai admin saat mengubah status pesanan. Mengatur stok otomatis.
    function applyStatus(order, newStatus) {
        if (!order.produkId) return { ok: true }; // pesanan demo tanpa produk
        if (newStatus === 'Dibatalkan') {
            releaseStock(order, 'Pesanan ' + order.id + ' dibatalkan');
            return { ok: true };
        }
        if (!order.stokDipotong && !reserveStock(order, 'Pesanan ' + order.id + ' diaktifkan kembali')) {
            return { ok: false, msg: 'Stok tidak cukup untuk mengaktifkan kembali pesanan ini.' };
        }
        return { ok: true };
    }

    // ── pesanan ──
    function newOrderId() {
        var d = new Date();
        var ymd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        var existing = read(KEYS.orders, []).map(function (o) { return o.id; });
        var id;
        do { id = 'GT-' + ymd + '-' + String(Math.floor(Math.random() * 9000) + 1000); }
        while (existing.indexOf(id) !== -1);
        return id;
    }
    function migrateOldOrders() {
        var old = read(KEYS.oldOrders, null);
        if (!old || !old.length) { try { localStorage.removeItem(KEYS.oldOrders); } catch (e) {} return; }
        var current = read(KEYS.orders, []);
        old.forEach(function (o) {
            var base = String(o.produk || '').split(' — ')[0];
            var match = products().filter(function (p) { return p.name === base; })[0];
            var price = match ? Number(match.price) : 0;
            var qty = Number(o.jumlah) || 0;
            current.push(Object.assign({}, o, {
                id: 'GT-OLD-' + String(o.id),
                produkId: match ? match.id : '',
                produk: base,
                customer: o.nama,
                summary: base + ' × ' + qty + ' kg',
                total: price * qty,
                date: o.tanggal ? new Date(o.tanggal).toLocaleDateString('id-ID') : '',
                status: 'Selesai',
                stokDipotong: false,
                sumber: 'pelanggan',
                ownerEmail: ''
            }));
        });
        write(KEYS.orders, current);
        try { localStorage.removeItem(KEYS.oldOrders); } catch (e) {}
    }
    function orders() {
        migrateOldOrders();
        return read(KEYS.orders, []);
    }
    function saveOrders(list) { return write(KEYS.orders, list); }

    window.GT = {
        KEYS: KEYS, SEED: SEED,
        products: products, saveProducts: saveProducts, findProduct: findProduct,
        stockStatus: stockStatus, addHistory: addHistory,
        reserveStock: reserveStock, releaseStock: releaseStock, applyStatus: applyStatus,
        orders: orders, saveOrders: saveOrders, newOrderId: newOrderId,
        esc: esc, rupiah: rupiah, todayISO: todayISO
    };
})();
