async function loadUnreadMessages(){

    const {
        data:{user}
    } =
    await supabaseClient
    .auth
    .getUser();

    if(!user) return;

    const {
        data:messages
    } =
    await supabaseClient
    .from("messages")
    .select("*")
    .eq(
        "receiver_id",
        user.id
    )
    .eq(
        "is_read",
        false
    );

    const count =
        messages?.length || 0;

    const badge =
        document.getElementById(
            "messageCount"
        );

    if(badge){

        badge.textContent =
            count;

        badge.style.display =
            count > 0
            ? "flex"
            : "none";
    }
}


async function loadNotifications(){

    const {
        data:{user}
    } =
    await supabaseClient
    .auth
    .getUser();

    if(!user) return;

    const {
        count,
        error
    } =
    await supabaseClient
    .from("notifications")
    .select("*", {
        count: "exact",
        head: true
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

    if(error){
        console.error(error);
        return;
    }

    const badge =
        document.getElementById("notificationCount");

    if(badge){

        badge.textContent = count || 0;

        badge.style.display =
            (count || 0) > 0
                ? "flex"
                : "none";
    }
}


async function createNotification(
    userId,
    title,
    message
){

    const {
        data:profile,
        error:profileError
    } =
    await supabaseClient
    .from("profiles")
    .select(
        "swap_notifications"
    )
    .eq(
        "id",
        userId
    )
    .single();

    if(profileError){

        console.error(
            profileError
        );

        return;
    }

    // User disabled swap notifications

    if(
        profile?.swap_notifications === false
    ){

        return;

    }

    const { error } =
    await supabaseClient
    .from("notifications")
    .insert({

        user_id:userId,

        title,

        message

    });

    if(error){

        console.error(
            "Notification Error:",
            error
        );

    }

}

async function toggleNotifications(){

    const dropdown =
    document.getElementById(
        "notificationDropdown"
    );

    dropdown.classList.toggle(
        "hidden"
    );

    if(
        !dropdown.classList.contains(
            "hidden"
        )
    ){

        await loadNotificationsList();

        await supabaseClient
        .from("notifications")
        .update({
            is_read:true
        })
        .eq("user_id",
            (
                await supabaseClient
                .auth
                .getUser()
            ).data.user.id
        );
        
        loadNotifications();

    }

}

async function loadNotificationsList(){

    const {
        data:{user}
    } =
    await supabaseClient
    .auth
    .getUser();

    const {
        data
    } =
    await supabaseClient
    .from("notifications")
    .select("*")
    .eq(
        "user_id",
        user.id
    )
    .eq(
        "is_read", false
    )
    .order(
        "created_at",
        {
            ascending:false
        }
    )
    .limit(6);

    const container =
    document.getElementById(
        "notificationsList"
    );

    container.innerHTML = "";

    data.forEach(notification=>{

        container.innerHTML += `

        <div class="notification-item">

            <strong>

                ${notification.title}

            </strong>

            <p>

                ${notification.message}

            </p>

        </div>

        `;

    });

}

document.addEventListener(
    "click",
    (e) => {

        const dropdown =
        document.getElementById(
            "notificationDropdown"
        );

        const bellBtn =
        document.getElementById(
            "notificationBtn"
        );

        if(
            !dropdown ||
            !bellBtn
        ) return;

        if(
            !dropdown.contains(
                e.target
            ) &&
            !bellBtn.contains(
                e.target
            )
        ){

            dropdown.classList.add(
                "hidden"
            );

        }

    }
);


setInterval(
    async ()=>{

        await loadNotifications();

        await loadUnreadMessages();

    },
    5000
);

document.addEventListener("DOMContentLoaded",
    ()=>{
        const messageBtn = document.getElementById("messagesBtn");
        if(messageBtn){
            messageBtn.addEventListener("click",
                ()=>{
                    window.location.href = "messages.html";
                }
            );
        }
    }
);