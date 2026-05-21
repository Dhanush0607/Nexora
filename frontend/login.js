
const form = document.getElementById("loginForm");

function showMessage(text, type) {

    const msg = document.getElementById("message");

    msg.innerText = text;

    msg.className = type;
}

// Uses API from config.js
form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

    try {

        const response = await fetch(
            `${API}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (data.success) {

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            showMessage(
                "Login successful",
                "success"
            );

            // Redirect admin users
            if (data.user.isAdmin) {

                window.location.href =
                    "admin/admin.html";

            } else {

                window.location.href =
                    "dashboard.html";
            }

        } else {

            showMessage(
                data.message,
                "error"
            );
        }

    } catch (error) {

        console.log(error);

        showMessage(
            "Server error. Please try again.",
            "error"
        );
    }

});

