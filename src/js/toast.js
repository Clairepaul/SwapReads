function showToast(message, type = "success") {

    const container =
    document.getElementById("toastContainer");

    const toast =
    document.createElement("div");

    toast.className =
    `toast ${type}`;

    let icon = "✅";

    if(type === "error"){

        icon = "❌";

    }

    if(type === "info"){

        icon = "🔔";

    }

    toast.innerHTML = `

        <span>${icon}</span>

        <span>${message}</span>

    `;

    container.appendChild(toast);

    setTimeout(() => {

        toast.classList.add("hide");

        setTimeout(() => {

            toast.remove();

        },300);

    },3000);

}