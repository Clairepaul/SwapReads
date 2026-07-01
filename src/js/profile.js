document.addEventListener("DOMContentLoaded", async () => {

    // Check login

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {

        window.location.href = "login.html";

        return;
    }
    await Promise.all([
     loadUserProfile(),

     loadProfileStats(),

     loadUnreadMessages(),

     loadNotifications()
    ]);

    // Edit button

    const editBtn =
        document.getElementById("editProfileBtn");

    if (editBtn) {

        editBtn.addEventListener("click", () => {

            document
                .getElementById("profileModal")
                .classList.remove("hidden");

        });
    }

    // Cancel button

    const cancelBtn = document.getElementById("closeProfileModal");

if(cancelBtn){

    cancelBtn.addEventListener(
        "click",
        () => {

            const modal =
            document.getElementById(
                "profileModal"
            );

            const uploadIcon =
            document.getElementById(
                "uploadIcon"
            );

            if(modal){
                modal.classList.add(
                    "hidden"
                );
            }

            if(uploadIcon){
                uploadIcon.classList.add(
                    "hidden"
                );
            }

            const profileImage =
            document.getElementById(
                "profileImage"
            );

            if(profileImage){
                profileImage.value = "";
            }

        }
    );
}
    // Save profile

    const profileForm =
        document.getElementById("profileForm");

    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            saveProfile
        );
    }

    // Logout

    const logoutBtn =
        document.getElementById("logout-Btn");

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async (e) => {

                e.preventDefault();

                await supabaseClient.auth.signOut();

                window.location.href =
                    "login.html";

            }
        );
    }

    // Image preview

    const profileImage =
document.getElementById(
    "profileImage"
);

if(profileImage){

    profileImage.addEventListener(
        "change",
        async (e) => {

            const file =
            e.target.files[0];

            if(!file) return;

            try{

                const {
                    data:{session}
                } = 
                await supabaseClient.auth.getSession();
                
                const user = session?.user;

                const avatarUrl =
                await uploadProfilePicture(
                    file,
                    user.id
                );

                const {
                    error
                } =
                await supabaseClient
                .from("profiles")
                .update({

                    avatar_url:
                    avatarUrl

                })
                .eq(
                    "id",
                    user.id
                );

                if(error){

                    showToast(
                        error.message
                    );

                    return;
                }

                document
                .getElementById(
                    "profilePreview"
                )
                .src =
                avatarUrl;

                document
                .getElementById(
                    "profilePicture"
                )
                .src =
                avatarUrl;

                document
                .getElementById(
                    "sidebarProfilePic"
                )
                .src =
                avatarUrl;

                showToast(
                    "Profile picture updated!"
                );

            }catch(error){

                console.error(
                    error
                );

                showToast(
                    error.message
                );
            }

        }
    );
}

    const profileModal =
    document.getElementById("profileModal");


    if(profileModal){

    profileModal.addEventListener(
        "click",
        (e)=>{

            if(
                e.target === profileModal
            ){

                profileModal.classList.add(
                    "hidden"
                );

                document
                .getElementById(
                    "uploadIcon"
                )
                .classList.add(
                    "hidden"
                );
            }
        }
    );
}

});


/* =========================
   LOAD USER PROFILE
========================= */

async function loadUserProfile() {

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    if (!user) return;

    const fullName =
        user.user_metadata?.full_name ||
        "Reader";

    const email =
        user.email;

    const joinedDate = new Date(
        user.created_at
    ).toLocaleDateString();

    // Profile page

    const displayName =
        document.getElementById("displayName");

    const displayEmail =
        document.getElementById("displayEmail");

    if (displayName) {

        displayName.textContent =
            fullName;
    }

    if (displayEmail) {

        displayEmail.textContent =
            email;
    }

    const memberSince = document.getElementById("memberSince");

    if(memberSince){
        memberSince.textContent = joinedDate;
    }

    // Sidebar

    const sidebarUserName =
        document.getElementById("sidebarUserName");

    if (sidebarUserName) {

        sidebarUserName.textContent =
            fullName;
    }

    // Edit form

    const fullNameInput =
        document.getElementById("fullName");

    if (fullNameInput) {

        fullNameInput.value =
            fullName;
    }

    // Load extra profile data

    const {
        data: profile
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profile) {

        const displayLocation =
        document.getElementById("displayLocation");
        
        const displayBio =
        document.getElementById("displayBio");

        document.getElementById("location")
        .value = profile.location || "";


        document.getElementById("bio")
        .value = profile.bio || "";

        
        if (displayLocation) {
            displayLocation.textContent =
            profile.location || "Not provided";
        }
        
        if (displayBio) {
            displayBio.textContent =
            profile.bio || "No bio added yet.";
        }

        const displayGenres = document.getElementById("displayGenres");

        if(displayGenres){
            displayGenres.textContent = 
            profile.favorite_genres?.length
            ?profile.favorite_genres.join(", ") : "Not selected";
        }

        const avatar =
            profile.avatar_url ||
            "../assets/user.jpg";

        // Profile page image

        const profilePreview =
            document.getElementById(
                "profilePreview"
            );

        if (profilePreview) {

            profilePreview.src =
                avatar;
        }

        // Header image

        const profilePicture =
            document.getElementById(
                "profilePicture"
            );

        if (profilePicture) {

            profilePicture.src =
                avatar;
        }

        // Sidebar image

        const sidebarProfilePic =
            document.getElementById(
                "sidebarProfilePic"
            );

        if (sidebarProfilePic) {

            sidebarProfilePic.src =
                avatar;
        }

        // Genres

        if (profile.favorite_genres) {

            profile.favorite_genres.forEach(
                genre => {

                    const checkbox =
                        document.querySelector(
                            `input[value="${genre}"]`
                        );

                    if (checkbox) {

                        checkbox.checked =
                            true;
                    }
                }
            );
        }
    }
}

//PROFILE STATS

async function loadProfileStats(){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    if(!user) return;

    const {
        count:booksCount
    } =
    await supabaseClient
    .from("books")
    .select(
        "*",
        {
            count:"exact",
            head:true
        }
    )
    .eq(
        "user_id",
        user.id
    );

    const {
        count:swapsCount
    } =
    await supabaseClient
    .from("swap_requests")
    .select(
        "*",
        {
            count:"exact",
            head:true
        }
    )
    .eq(
        "status",
        "completed"
    )
    .or(
        `owner_id.eq.${user.id},requester_id.eq.${user.id}`
    );

    const {
        count:wishlistCount
    } =
    await supabaseClient
    .from("wishlist")
    .select(
        "*",
        {
            count:"exact",
            head:true
        }
    )
    .eq(
        "user_id",
        user.id
    );

    document
    .getElementById(
        "booksCount"
    )
    .textContent =
    booksCount || 0;

    document
    .getElementById(
        "swapsCount"
    )
    .textContent =
    swapsCount || 0;

    document
    .getElementById(
        "wishlistCount"
    )
    .textContent =
    wishlistCount || 0;
}



/* =========================
   SAVE PROFILE
========================= */

async function saveProfile(e) {

    e.preventDefault();

    try {

        const {
            data:{session}
        } = await supabaseClient.auth.getSession();
        
        const user = session?.user;

        

        const genres =
            [
                ...document.querySelectorAll(
                    ".genre-grid input:checked"
                )
            ].map(
                item => item.value
            );

        const fullName =
            document.getElementById(
                "fullName"
            ).value;

        // Update auth metadata

        await supabaseClient.auth.updateUser({

            data: {

                full_name:
                    fullName
            }
        });

        const payload = {

            id: user.id,

            full_name:
                fullName,

            location:
                document.getElementById(
                    "location"
                ).value,

            bio:
                document.getElementById(
                    "bio"
                ).value,

            favorite_genres:
                genres
        };

    

        const { error } =
            await supabaseClient
            .from("profiles")
            .upsert(payload);

        if (error) {

            showToast(error.message);

            return;
        }

        showToast(
            "Profile updated successfully!"
        );

        await loadUserProfile();
        const modal =
        document.getElementById("profileModal");
        
        if(modal){
            modal.classList.add("hidden");
        }

        
        document.getElementById("profileImage")
        .value = "";


    }
    catch (error) {

        console.error(error);

        showToast(error.message);
    }
}


/* =========================
   UPLOAD PROFILE PICTURE
========================= */

async function uploadProfilePicture(
    file,
    userId
) {

    const fileName =
        `${userId}-${Date.now()}-${file.name}`;

    const { error } =
        await supabaseClient.storage
        .from("profile-pictures")
        .upload(
            fileName,
            file
        );

    if (error) {

        throw error;
    }

    const { data } =
        supabaseClient.storage
        .from("profile-pictures")
        .getPublicUrl(
            fileName
        );

    return data.publicUrl;
}