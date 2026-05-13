const token = localStorage.getItem("token");

if(!token){

    window.location.href = "login.html";
}

const user = JSON.parse(localStorage.getItem("user"));

if(user){

    document.getElementById("welcome").innerText =
        `Welcome ${user.fullName}`;
}

document
.getElementById("loadProfile")
.addEventListener("click", async () => {

    try {

        const response = await fetch(
            "http://localhost:5000/api/auth/profile",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        document.getElementById("profileData")
        .innerText = JSON.stringify(data,null,2);

    } catch(error){

        console.log(error);
    }
});


document
.getElementById("loadQR")
.addEventListener("click", async () => {

    try {

        const response = await fetch(
            "http://localhost:5000/api/qr/my-qr",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log(data);

        // adjust according to backend response
        if(data.qrUrl){

            document.getElementById("qrImage").src =
                data.qrUrl;
        }

    } catch(error){

        console.log(error);
    }
});

document
.getElementById("logout")
.addEventListener("click", () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    window.location.href = "login.html";
});