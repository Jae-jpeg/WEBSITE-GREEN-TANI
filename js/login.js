document.addEventListener("DOMContentLoaded", function () {
    const formLogin = document.getElementById("formLogin");
    const pesanLogin = document.getElementById("pesanLogin");

    if (!formLogin || !pesanLogin) return;

    formLogin.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document
            .getElementById("email")
            .value.trim()
            .toLowerCase();

        const password = document
            .getElementById("password")
            .value;

        pesanLogin.textContent = "";

        let customers;

        try {
            customers = JSON.parse(
                localStorage.getItem("mothernature_customers") || "[]"
            );
        } catch (error) {
            pesanLogin.textContent = "Data akun tidak dapat dibaca.";
            pesanLogin.style.color = "red";
            return;
        }

        if (!Array.isArray(customers)) {
            pesanLogin.textContent = "Format data akun tidak valid.";
            pesanLogin.style.color = "red";
            return;
        }

        const customer = customers.find(function (akun) {
            return (
                akun.email &&
                akun.email.toLowerCase() === email &&
                akun.password === password
            );
        });

        if (!customer) {
            pesanLogin.textContent =
                "Email atau password salah. Silakan periksa kembali.";
            pesanLogin.style.color = "red";
            return;
        }

        // Simpan informasi customer tanpa password.
        const dataLogin = {
            id: customer.id,
            nama: customer.nama,
            email: customer.email
        };

        sessionStorage.setItem(
            "mothernature_customer_login",
            JSON.stringify(dataLogin)
        );

        pesanLogin.textContent = "Login berhasil!";
        pesanLogin.style.color = "green";

        // Kembali ke halaman utama.
        window.location.href = "pesan.html";
    });
});
