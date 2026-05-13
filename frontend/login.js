const form = document.getElementById("loginForm");

function showMessage(text, type) {
    const msg = document.getElementById("message");
    msg.innerText = text;
    msg.className = type; // "error" or "success" — triggers CSS styling
}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {

        const response = await fetch(
            "http://localhost:5000/api/auth/login",
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

            localStorage.setItem("token", data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            showMessage("Login successful", "success");

            window.location.href = "dashboard.html";

        } else {

            showMessage(data.message, "error");
        }

    } catch (error) {

        console.log(error);

        showMessage("Server error. Please try again.", "error");
    }

});