// PENDAFTARAN AKUN CUSTOMER Green Tani

const REGISTER_STORAGE_KEY = "mothernature_customers";

document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("formRegister");

    // Hentikan jika halaman tidak memiliki form pendaftaran.
    if (!registerForm) return;

    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const nama = document.getElementById("nama").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const telepon = document.getElementById("telepon").value.trim();
        const alamat = document.getElementById("alamat").value.trim();
        const password = document.getElementById("password").value;
        const konfirmasiPassword =
            document.getElementById("konfirmasiPassword").value;
        const message = document.getElementById("pesan");

        function showMessage(text, success) {
            if (!message) return;
            message.textContent = text;
            message.style.color = success ? "#28743a" : "#c62828";
        }

        // Periksa semua kolom.
        if (
            !nama ||
            !email ||
            !telepon ||
            !alamat ||
            !password ||
            !konfirmasiPassword
        ) {
            showMessage("Semua kolom wajib diisi.", false);
            return;
        }

        // Periksa kecocokan password.
        if (password !== konfirmasiPassword) {
            showMessage("Konfirmasi password tidak cocok.", false);
            return;
        }

        if (password.length < 6) {
            showMessage("Password minimal 6 karakter.", false);
            return;
        }

        // Ambil data akun yang sudah tersimpan.
        let customers = [];

        try {
            const savedCustomers =
                localStorage.getItem(REGISTER_STORAGE_KEY);

            customers = savedCustomers ? JSON.parse(savedCustomers) : [];

            if (!Array.isArray(customers)) {
                showMessage("Data akun tidak valid.", false);
                return;
            }
        } catch (error) {
            showMessage("Data akun gagal dibaca.", false);
            console.error(error);
            return;
        }

        // Tolak email yang sudah terdaftar.
        const emailSudahAda = customers.some(function (customer) {
            return (
                customer.email &&
                customer.email.trim().toLowerCase() === email
            );
        });

        if (emailSudahAda) {
            showMessage(
                "Email sudah terdaftar. Gunakan email lain.",
                false
            );
            return;
        }

        // Buat akun baru.
        const customerBaru = {
            id: "CUST-" + Date.now(),
            nama: nama,
            email: email,
            telepon: telepon,
            alamat: alamat,
            password: password,
            tanggalDaftar: new Date().toISOString()
        };

        // Simpan akun ke Local Storage.
        try {
            customers.push(customerBaru);

            localStorage.setItem(
                REGISTER_STORAGE_KEY,
                JSON.stringify(customers)
            );

            showMessage(
                "Pendaftaran berhasil! Akun tersimpan di browser ini.",
                true
            );

            registerForm.reset();
        } catch (error) {
            showMessage(
                "Akun gagal disimpan. Silakan coba lagi.",
                false
            );
            console.error("Gagal menyimpan akun:", error);
        }
    });
});
