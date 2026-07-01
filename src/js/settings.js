document.addEventListener("DOMContentLoaded",
    async ()=>{
        await Promise.all([
         loadUser(),
         loadUnreadMessages(),
         loadNotifications(),
         loadSettings()
        ]);

        
        const logoutBtn =
            document.getElementById(
                "logout-Btn"
            );

        if(logoutBtn){

            logoutBtn.addEventListener(
                "click",
                async (e)=>{

                    e.preventDefault();

                    await supabaseClient
                    .auth
                    .signOut();

                    window.location.href =
                        "login.html";

                }
            );
        }

        const changePasswordBtn = document.getElementById(
            "changePasswordBtn"
        );

        if(changePasswordBtn){
            changePasswordBtn.addEventListener(
                "click", ()=>{
                    document.getElementById("PasswordModal")
                    .classList.remove("hidden");
                }
            );
        }

        const closePasswordModal = document.getElementById(
            "closePasswordModal"
        );

        if(closePasswordModal){
            closePasswordModal.addEventListener(
                "click", ()=>{
                    document.getElementById("PasswordModal")
                    .classList.add("hidden");
                }
            );
        }

        document.getElementById("passwordForm")
        .addEventListener("submit", changePassword);

        //SAVE SETTINGS
        document.getElementById("themeSelect")
        .addEventListener("change", saveSettings);

        document.getElementById("hideFromReaders")
        .addEventListener("change", saveSettings);

        document.getElementById("disableMessageNotifications")
        .addEventListener("change", saveSettings);

        document.getElementById("disableSwapNotifications")
        .addEventListener("change",saveSettings);

        // ==========================
// DELETE ACCOUNT MODAL
// ==========================

const deleteAccountBtn =
document.getElementById("deleteAccountBtn");

const deleteAccountModal =
document.getElementById("deleteAccountModal");

const cancelDeleteBtn =
document.getElementById("cancelDelete");

const confirmDeleteBtn =
document.getElementById("confirmDelete");

if(deleteAccountBtn){

    deleteAccountBtn.addEventListener(
        "click",
        ()=>{

            deleteAccountModal.classList.remove("hidden");

            document.getElementById(
                "deleteConfirm"
            ).value = "";

        }
    );

}

if(cancelDeleteBtn){

    cancelDeleteBtn.addEventListener(
        "click",
        ()=>{

            deleteAccountModal.classList.add("hidden");

        }
    );

}

if(confirmDeleteBtn){

    confirmDeleteBtn.addEventListener(
        "click",
        deleteAccount
    );

}

    }
);

async function loadUser() {
    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    if(!user) return;
    
    const {
        data:profile
    } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

    const fullName =
    profile?.full_name || user.user_metadata?.full_name ||
    "Reader";

    const avatar = 
    profile?.avatar_url || "../assets/user.jpg";

    //Sidebar name

    document.getElementById("sidebarUserName")
    .textContent = fullName;

    //Header & Sidebar Profile

    document.getElementById("profilePicture")
    .src = avatar;

    document.getElementById("sidebarProfilePic")
    .src = avatar;
}

async function loadSettings() {
    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    const{
        data:profile
    } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

    document.getElementById("themeSelect")
    .value = profile.theme || "light";

    applyTheme(profile.theme || "light");

    document.getElementById("hideFromReaders")
    .checked = !profile.show_in_readers;

    document.getElementById("disableMessageNotifications")
    .checked = !profile.message_notifications;

    document.getElementById("disableSwapNotifications")
    .checked = !profile.swap_notifications;

    
}

async function saveSettings() {
    
    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    const selectedTheme = document.getElementById("themeSelect")
    .value;
    localStorage.setItem("swapreads-theme", selectedTheme);

    applyTheme(selectedTheme);

    await supabaseClient
    .from("profiles")
    .update({
        theme:
        selectedTheme,

        show_in_readers:
        !document.getElementById("hideFromReaders")
        .checked,

        message_notifications:
        !document.getElementById("disableMessageNotifications")
        .checked,

        swap_notifications:
        !document.getElementById("disableSwapNotifications")
        .checked
    })
    .eq("id", user.id);
}

function applyTheme(theme){

    document.documentElement.classList.toggle("dark-theme", theme === "dark");

    localStorage.setItem("swapreads-theme", theme);

}
/*
function applyTheme(theme){
    if(theme === "dark"){
        document.body.classList.add("dark-theme");
    }else{
        document.body.classList.remove("dark-theme");
    }
}
    */

async function changePassword(e){

    console.log("Change Password Clicked");

    e.preventDefault();

    const password =
    document.getElementById(
        "newPassword"
    ).value;

    const confirm =
    document.getElementById(
        "confirmPassword"
    ).value;

    if(password !== confirm){

        showToast(
            "Passwords do not match."
        );

        return;
    }

    const {
        error
    } =
    await supabaseClient
    .auth
    .updateUser({

        password:password

    });

    if(error){

        showToast(error.message);

        return;
    }

    showToast(
        "Password updated successfully."
    );

    document
    .getElementById(
        "PasswordModal"
    )
    .classList.add(
        "hidden"
    );

}

async function deleteAccount(){

    const confirmation =
    document.getElementById(
        "deleteConfirm"
    ).value.trim();

    if(confirmation !== "DELETE"){

        showToast(
            "Please type DELETE to continue."
        );

        return;

    }

    const confirmDelete =
    confirm(
        "Are you sure you want to permanently delete your SwapReads account?"
    );

    if(!confirmDelete){

        return;

    }

    try{

        const {
            data:{session}
        } =
        await supabaseClient
        .auth
        .getSession();

        const response =
        await fetch(

            "https://qpbfqfmsioorjmfsckfb.functions.supabase.co/delete-account",

            {

                method:"POST",

                headers:{

                    Authorization:
                    `Bearer ${session.access_token}`,

                    apikey:
                    SUPABASE_PUBLISHABLE_KEY,

                    "Content-Type":
                    "application/json"

                }

            }

        );

        const result =
        await response.json();

        if(!response.ok){

            showToast(
                result.error ||
                "Failed to delete account."
            );

            return;

        }

        showToast(
            "Your account has been deleted successfully."
        );

        await supabaseClient
        .auth
        .signOut();

        window.location.href =
        "login.html";

    }

    catch(error){

        console.error(error);

        showToast(
            "Something went wrong."
        );

    }

}

