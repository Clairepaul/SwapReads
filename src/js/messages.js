// =====================================
// GLOBAL VARIABLES
// =====================================

let currentUser = null;
let currentChatUser = null;
let currentChatProfile = null;


// =====================================
// PAGE LOAD
// =====================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const {
            data: { session }
        } =
        await supabaseClient
        .auth
        .getSession();

        if(!session){

            window.location.href =
                "login.html";

            return;
        }

        await Promise.all([
            loadUser(),
            loadUnreadMessages(),
            loadNotifications(),
            loadChatUsers()
        ]);

        // LOGOUT

        const logoutBtn =
            document.getElementById(
                "logout-Btn"
            );



        if(logoutBtn){

            logoutBtn.addEventListener(
                "click",
                async e => {

                    e.preventDefault();

                    await supabaseClient
                    .auth
                    .signOut();

                    window.location.href =
                        "login.html";

                }
            );
        }

        document
        .getElementById(
            "closeProfileModal"
        )
        .addEventListener(
            "click",
            () => {

                document
                .getElementById(
                    "profileModal"
                )
                .classList.add(
                    "hidden"
                );

            }
        );

        const params = new URLSearchParams(
            window.location.search
        );
        const userId = params.get("user");
        
        if(userId){
            await openChat(userId);
        }

        await loadUnreadCount();

        setupRealtimeMessages();

        // SEND MESSAGE

        document
        .getElementById(
            "sendMessageBtn"
        )
        .addEventListener(
            "click",
            sendMessage
        );

        // PROFILE MODAL

        document
        .getElementById(
            "viewProfileBtn"
        )
        .addEventListener(
            "click",
            showProfileModal
        );

        document.getElementById("chatHeaderInfo")
        .addEventListener("click", showProfileModal);

        

    }
);


// =====================================
// LOAD CURRENT USER
// =====================================

async function loadUser(){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    currentUser = user;

    const {
        data: profile
    } =
    await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

    const fullName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        "Reader";

    const avatar =
        profile?.avatar_url ||
        "../assets/user.jpg";

    document.getElementById(
        "sidebarUserName"
    ).textContent =
        fullName;

    document.getElementById(
        "profilePicture"
    ).src =
        avatar;

    document.getElementById(
        "sidebarProfilePic"
    ).src =
        avatar;
}

//DATE & TIME
function formatMessageTime(dateString){

    const date =
        new Date(dateString);

    const today =
        new Date();

    const isToday =
        date.toDateString() ===
        today.toDateString();

    if(isToday){

        return date.toLocaleTimeString(
            [],
            {
                hour:"2-digit",
                minute:"2-digit"
            }
        );
    }

    return date.toLocaleDateString(
        [],
        {
            day:"numeric",
            month:"short"
        }
    ) +
    " " +
    date.toLocaleTimeString(
        [],
        {
            hour:"2-digit",
            minute:"2-digit"
        }
    );
}


// =====================================
// LOAD CHAT USERS
// =====================================

async function loadChatUsers(){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    const {
        data: requests,
        error
    } =
    await supabaseClient
    .from("swap_requests")
    .select("*");

    if(error){

        console.error(error);

        return;
    }

    const userIds =
        new Set();

    requests.forEach(req => {

        if(
            req.owner_id === user.id
        ){

            userIds.add(
                req.requester_id
            );
        }

        if(
            req.requester_id === user.id
        ){

            userIds.add(
                req.owner_id
            );
        }

    });

    // =====================================
// ALSO INCLUDE USERS YOU HAVE MESSAGED
// =====================================
    const {
        data: messages
    } = 
    await supabaseClient
    .from("messages")
    .select("sender_id, receiver_id");
    
    messages.forEach(msg=>{
        
        if(msg.sender_id === user.id){
            userIds.add(msg.receiver_id);
        }
        
        if(msg.receiver_id === user.id){
            userIds.add(msg.sender_id);
        }
    });

    const chatUsers =
        document.getElementById(
            "chatUsers"
        );

    chatUsers.innerHTML = "";

    for(const userId of userIds){

        const {
            data: profile
        } =
        await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

        if(!profile) continue;

        const {
            data: lastMessage
        } =
        await supabaseClient
        .from("messages")
        .select("*")
        .or(
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`
        )
        .order(
            "created_at",
                        {
                            ascending:false
                        }
                    )
                    .limit(1);

                    let preview = "No messages yet";
                    let timeText = "";

                    if(lastMessage && lastMessage.length){
                        preview = lastMessage[0].message;

                        if(
                            preview.length > 25
                        ){
                            preview = preview.substring(0, 25) + "..."
                        }

                        const date = new Date(
                            lastMessage[0].created_at
                        );

                        timeText = date.toLocaleTimeString(
                            [], {
                                hour:"2-digit",
                                minute:"2-digit"
                            }
                        );
                    }

        const {
    data: unreadMessages
} =
await supabaseClient
.from("messages")
.select("id")
.eq(
    "sender_id",
    userId
)
.eq(
    "receiver_id",
    currentUser.id
)
.eq(
    "is_read",
    false
);

const unreadCount =
    unreadMessages?.length || 0;

        chatUsers.innerHTML += `

            <div
                class="chat-user"
                id="chat-user-${userId}"
                onclick="openChat('${userId}')">

                <img
                    src="${
                        profile.avatar_url ||
                        '../assets/user.jpg'
                    }"
                    class="chat-avatar">

                <div class="chat-details">
                    <div class="chat-top-row">
                        
                       <h4>${profile.full_name || 'Reader'}</h4>
                    
                       <span class="chat-time"> ${timeText}</span>
                 
                    </div>
                    
                    <small>${preview}</small>
                </div>
                ${
    unreadCount > 0
    ? `
    <span class="chat-badge">
        ${unreadCount}
    </span>
    `
    : ""
}

            </div>


        `;
    }
}


// =====================================
// OPEN CHAT
// =====================================

async function openChat(userId){

    currentChatUser =
        userId;

        document.getElementById("chatMenu")
        .classList.add("hidden");

        document.getElementById("chatPlaceholder")
        .classList.add("hidden");

        document.getElementById("chatContent")
        .classList.remove("hidden");

        document
        .querySelectorAll(".chat-user")
        .forEach(chat => {

            chat.classList.remove(
                "active-chat"
            );
        });

        const activeChat =
        document.getElementById(
            `chat-user-${userId}`
        );

        if(activeChat){
            activeChat.classList.add("active-chat");
        }


    const {
        data: profile
    } =
    await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

    currentChatProfile =
        profile;

    document
    .getElementById(
        "chatUserName"
    )
    .textContent =
        profile?.full_name ||
        "Reader";

    document.getElementById("chatUserBio")
    .textContent = profile?.bio?.substring(0, 40) || "No bio";

    document
    .getElementById(
        "chatUserAvatar"
    )
    .src =
        profile?.avatar_url ||
        "../assets/user.jpg";

    await loadMessages();
    await loadUnreadCount();
    await loadChatUsers();
   
}


// =====================================
// LOAD MESSAGES
// =====================================

async function loadMessages(){

    if(!currentChatUser)
        return;

    const {
        data: messages,
        error
    } =
    await supabaseClient
    .from("messages")
    .select("*")
    .or(
`and(sender_id.eq.${currentUser.id},receiver_id.eq.${currentChatUser}),and(sender_id.eq.${currentChatUser},receiver_id.eq.${currentUser.id})`
    )
    .order(
        "created_at",
        {
            ascending:true
        }
    );

    console.log(messages);
    console.log(error);

    if(error){

        console.error(error);

        return;
    }

    const container =
        document.getElementById(
            "messagesContainer"
        );

    container.innerHTML = "";

    messages.forEach(msg => {

        const type =
            msg.sender_id ===
            currentUser.id
            ? "sent"
            : "received";

            const date = new Date(msg.created_at);

            const timestamp = formatMessageTime(msg.created_at)

        container.innerHTML += `

            <div class="${type}">

                <div class="message-bubble">

                    <div class="message-text">

                    ${msg.message}

                    </div>

                    <div class="message-time">

                    ${timestamp}
                    ${
                        type === "sent"?
                        `<span class="read-status"> ${msg.is_read ? "✓✓" : "✓"}
                        </span>`
                        : ""
                    }
                    
                    </div>

                </div>

            </div>

        `;
    });

    

    container.scrollTop =
        container.scrollHeight;

        messagesContainer.scrollTop = 
        messagesContainer.scrollHeight;

    await markMessagesRead();
}


// =====================================
// SEND MESSAGE
// =====================================

async function sendMessage(){

    if(!currentChatUser)
        return;

    const input =
        document.getElementById(
            "messageText"
        );

    const text =
        input.value.trim();

    if(!text)
        return;

    const {
        error
    } =
    await supabaseClient
    .from("messages")
    .insert({

        sender_id:
            currentUser.id,

        receiver_id:
            currentChatUser,

        message:
            text

    });

    if(error){

        console.error(error);

        return;
    }

    //get sender details 

    const {
                data:senderProfile
            } = await supabaseClient
            .from("profiles")
            .select("full_name")
            .eq("id", currentUser.id)
            .single();

    // Check receiver notification preference

    const {
        data:receiverProfile
    } = await supabaseClient
    .from("profiles")
    .select("message_notifications")
    .eq("id", currentChatUser)
    .single();

    // Create notification only if enabled

    if(receiverProfile?.message_notifications !== false){
        await supabaseClient
        .from("notifications")
        .insert({

            user_id:
            currentChatUser,

            title:
            "New Message",

            message:
            `${senderProfile?.full_name || "A reader"} sent you a message.`

        });

    }

    input.value = "";

    await loadMessages();
    await loadChatUsers();
}


// =====================================
// MARK AS READ
// =====================================

async function markMessagesRead(){

    await supabaseClient
    .from("messages")
    .update({

        is_read:true

    })
    .eq(
        "sender_id",
        currentChatUser
    )
    .eq(
        "receiver_id",
        currentUser.id
    );
}


// =====================================
// UNREAD COUNT
// =====================================

async function loadUnreadCount(){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    const {
        data,
        error
    } =
    await supabaseClient
    .from("messages")
    .select("id")
    .eq(
        "receiver_id",
        user.id
    )
    .eq(
        "is_read",
        false
    );

    if(error){

        console.error(error);

        return;
    }

    const badge =
        document.getElementById(
            "messageCount"
        );

    if(badge){

        badge.textContent =
            data.length;
    }
}


// =====================================
// PROFILE MODAL
// =====================================

async function showProfileModal(){

    if(!currentChatProfile)
        return;

    document
    .getElementById(
        "modalProfilePic"
    )
    .src =
        currentChatProfile.avatar_url ||
        "../assets/user.jpg";

    document
    .getElementById(
        "modalName"
    )
    .textContent =
        currentChatProfile.full_name ||
        "Reader";

    document
    .getElementById(
        "modalBio"
    )
    .textContent =
        currentChatProfile.bio ||
        "No bio added.";

    document
    .getElementById(
        "modalLocation"
    )
    .textContent =
        currentChatProfile.location ||
        "Not specified";

    document
    .getElementById(
        "modalGenres"
    )
    .textContent =
        currentChatProfile.favorite_genres
        ? currentChatProfile.favorite_genres.join(", ")
        : "None";

    document
    .getElementById(
        "profileModal"
    )
    .classList.remove(
        "hidden"
    );
}


// =====================================
// REALTIME
// =====================================

function setupRealtimeMessages(){

    supabaseClient
    .channel(
        "messages-channel"
    )
    .on(
        "postgres_changes",
        {
            event:"INSERT",
            schema:"public",
            table:"messages"
        },
        async () => {

            await loadUnreadCount();

            if(
                currentChatUser
            ){

                await loadMessages();
            }

        }
    )
    .on(
        "postgres_changes",
        {
            event:"UPDATE",
            schema:"public",
            table:"messages"
        },
        async () => {
            if(currentChatUser){
                await loadMessages();
            }
        }
    )
    .subscribe();
}

//CHAT MENU

function toggleChatMenu(){
    document.getElementById(
        "chatMenu"
    )
    .classList.toggle("hidden");
}

//CLOSE cHAT

function closeChat(){
    currentChatUser = null;
    document.getElementById("chatContent")
    .classList.add("hidden");

    document.getElementById("chatPlaceholder")
    .classList.remove("hidden");

    document.getElementById("chatPlaceholder")
    .classList.add("hidden");

    document.querySelectorAll(".chat-user")
    .forEach(chat => {
        chat.classList.remove("active-chat");
    });

}

//DELETE CHAT
async function deleteChat() {

    document.getElementById("chatMenu")
    .classList.add("hidden");


    if(!confirm(
        "Delete this conversations?"
    )
){
    return;
}

await supabaseClient
.from("messages")
.delete()
.or(
`and(sender_id.eq.${currentUser.id},receiver_id.eq.${currentChatUser}),and(sender_id.eq.${currentChatUser},receiver_id.eq.${currentUser.id})`

);

closeChat();

loadChatUsers();
}

//VIEW INFO

function viewChatInfo(){

    document.getElementById("chatMenu")
    .classList.add("hidden");

    showProfileModal();
}

document.addEventListener(
    "click",
    (e)=>{

        const menu =
        document.getElementById(
            "chatMenu"
        );

        const btn =
        document.getElementById(
            "chatMenuBtn"
        );

        if(
            !menu.contains(e.target) &&
            !btn.contains(e.target)
        ){

            menu.classList.add(
                "hidden"
            );

        }

    }
);