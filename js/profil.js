
(function () {
    function initProfil() {
        const trigger = document.getElementById("accountTrigger");
        const dropdown = document.getElementById("accountDropdown");
        const navAccount = document.getElementById("navAccount");

        if (!trigger || !dropdown || !navAccount) return;

        const avatar = document.getElementById("accountAvatar");
        const greeting = document.getElementById("accountGreeting");
        const loginLink = document.getElementById("accountLogin");
        const registerLink = document.getElementById("accountRegister");
        const historyLink = document.getElementById("accountHistory");
        const logoutButton = document.getElementById("accountLogout");

        function getLogin() {
            try {
                const data = sessionStorage.getItem(
                    "mothernature_customer_login"
                );

                if (!data) return null;

                const customer = JSON.parse(data);

                if (
                    customer &&
                    typeof customer.nama === "string" &&
                    customer.nama.trim() !== "" &&
                    typeof customer.email === "string" &&
                    customer.email.trim() !== ""
                ) {
                    return customer;
                }

                return null;
            } catch (error) {
                return null;
            }
        }

        function setVisibility(element, visible) {
            if (!element) return;
        
            element.hidden = !visible;
        
            if (visible) {
                element.style.removeProperty("display");
            } else {
                element.style.setProperty("display", "none", "important");
            }
        }

        function renderProfile() {
            const customer = getLogin();
            const isLoggedIn = Boolean(customer);

            setVisibility(loginLink, !isLoggedIn);
            setVisibility(registerLink, !isLoggedIn);
            setVisibility(historyLink, isLoggedIn);
            setVisibility(logoutButton, isLoggedIn);

            if (isLoggedIn) {
                const nama = customer.nama.trim();

                const initials = nama
                    .split(/\s+/)
                    .slice(0, 2)
                    .map(function (kata) {
                        return kata.charAt(0);
                    })
                    .join("")
                    .toUpperCase();

                avatar.textContent = initials || "♙";
                greeting.textContent = "Halo, " + nama + "!";
            } else {
                avatar.textContent = "♙";
                greeting.textContent = "Selamat datang!";
            }
        }

        trigger.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            dropdown.hidden = !dropdown.hidden;
            trigger.setAttribute(
                "aria-expanded",
                String(!dropdown.hidden)
            );
        });

        dropdown.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        document.addEventListener("click", function (event) {
            if (!navAccount.contains(event.target)) {
                dropdown.hidden = true;
                trigger.setAttribute("aria-expanded", "false");
            }
        });

        if (logoutButton) {
            logoutButton.addEventListener("click", function () {
                sessionStorage.removeItem("mothernature_customer_login");
                window.location.href = "index.html";
            });
        }

        renderProfile();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initProfil);
    } else {
        initProfil();
    }
})();
