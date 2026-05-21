
const form = document.getElementById("registerForm");

function showMessage(text, type) {

    const msg = document.getElementById("message");

    msg.innerText = text;

    msg.className = type;
}

// Uses API from config.js
form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const fullName =
        document.getElementById("fullName").value;

    const email =
        document.getElementById("email").value;

    const password =
        document.getElementById("password").value;

    try {

        const response = await fetch(
            `${API}/auth/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    fullName,
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

            if (data.user) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );
            }

            showMessage(
                "Account created successfully!",
                "success"
            );

            window.location.href =
                "dashboard.html";

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

