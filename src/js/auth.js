const SUPABASE_URL = "https://qpbfqfmsioorjmfsckfb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6-ev7RApfyWcVjwfjSg1FQ_uvsd-Tj6";

const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function showMessage(message, type = "error") {
    const messageElement = document.getElementById("authMessage");

    if (!messageElement) {
        alert(message);
        return;
    }

    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
}

function setButtonLoading(form, isLoading) {
    const button = form.querySelector("button");

    if (!button) {
        return;
    }

    button.disabled = isLoading;
    button.dataset.originalText = button.dataset.originalText || button.textContent;
    button.textContent = isLoading ? "Please wait..." : button.dataset.originalText;
}

function redirectAfter(message, url) {
    showMessage(message, "success");
    setTimeout(() => {
        window.location.href = url;
    }, 1200);
}

async function register(event) {
    event.preventDefault();

    if (!supabaseClient) {
        showMessage("Supabase could not load. Check your internet connection and Supabase script link.");
        return;
    }

    setButtonLoading(event.target, true);

    const name = document.getElementById("name").value.trim();
    const email = normalizeEmail(document.getElementById("registerEmail").value);
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!name || !email || !password || !confirmPassword) {
        showMessage("Please fill in all fields.");
        setButtonLoading(event.target, false);
        return;
    }

    if (password.length < 6) {
        showMessage("Password must be at least 6 characters.");
        setButtonLoading(event.target, false);
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Passwords do not match.");
        setButtonLoading(event.target, false);
        return;
    }

    const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name
            },
            emailRedirectTo: `${window.location.origin}/src/html/login.html`
        }
    });

    setButtonLoading(event.target, false);

    if (error) {
        showMessage(error.message);
        return;
    }

    showMessage("Account created successfully. Check your email, then login.", "success");
}

async function login(event) {
    event.preventDefault();

    if (!supabaseClient) {
        showMessage("Supabase could not load. Check your internet connection and Supabase script link.");
        return;
    }

    setButtonLoading(event.target, true);

    const email = normalizeEmail(document.getElementById("email").value);
    const password = document.getElementById("password").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    setButtonLoading(event.target, false);

    if (error) {
        showMessage(error.message);
        return;
    }

    const name = data.user.user_metadata.full_name || "reader";

    //Get users theme
    const {data: profile} = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();


    
    // Cache theme
    localStorage.setItem("swapreads-theme", 
        profile?.theme || "light"
    );
    showMessage(`Welcome back, ${name}! Redirecting...`, "success");

    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 1000);
}

async function resetPassword(event) {
    event.preventDefault();

    if (!supabaseClient) {
        showMessage("Supabase could not load. Check your internet connection and Supabase script link.");
        return;
    }

    setButtonLoading(event.target, true);

    const email = normalizeEmail(document.getElementById("resetEmail").value);
    const redirectTo = `${window.location.origin}/src/html/update-password.html`;

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo
    });

    setButtonLoading(event.target, false);

    if (error) {
        showMessage(error.message);
        return;
    }

    showMessage("Password reset link sent. Check your email.", "success");
}

async function updatePassword(event) {
    event.preventDefault();

    if (!supabaseClient) {
        showMessage("Supabase could not load. Check your internet connection and Supabase script link.");
        return;
    }

    setButtonLoading(event.target, true);

    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;

    if (newPassword.length < 6) {
        showMessage("Password must be at least 6 characters.");
        setButtonLoading(event.target, false);
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showMessage("Passwords do not match.");
        setButtonLoading(event.target, false);
        return;
    }

    const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
    });

    setButtonLoading(event.target, false);

    if (error) {
        showMessage(error.message);
        return;
    }

    redirectAfter("Password updated successfully. Redirecting to login...", "login.html");
}

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const resetForm = document.getElementById("resetForm");
    const updatePasswordForm = document.getElementById("updatePasswordForm");

    if (registerForm) {
        registerForm.addEventListener("submit", register);
    }

    if (loginForm) {
        loginForm.addEventListener("submit", login);
    }

    if (resetForm) {
        resetForm.addEventListener("submit", resetPassword);
    }

    if (updatePasswordForm) {
        updatePasswordForm.addEventListener("submit", updatePassword);
    }
});

/*
//DARK MODE
async function loadTheme(){
    const {
        data:{user}
    } = await supabaseClient
    .auth
    .getUser();

    if(!user)
        return;

    const {
        data:profile
    } = await supabaseClient
    .from("profiles")
    .select("theme")
    .eq("id", user.id)
    .single();

    if(
        profile?.theme === "dark"
    ){

        document.body
        .classList.add(
            "dark-theme"
        );

    }

}
    */