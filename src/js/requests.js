// =============================
// LOAD PAGE
// =============================
document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const {
            data: { session }
        } = await supabaseClient.auth.getSession();

        if (!session) {

            window.location.href =
                "login.html";

            return;
        }
    
        await Promise.all([
            loadUser(),
            loadUnreadMessages(),
            loadNotifications(),
            loadIncomingRequests(),
            loadOutgoingRequests()
        ]);

        const logoutBtn =
            document.getElementById(
                "logout-Btn"
            );

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                async (e) => {

                    e.preventDefault();

                    await supabaseClient
                    .auth
                    .signOut();

                    window.location.href =
                        "login.html";

                }
            );
        }

    }
);


// =============================
// LOAD USER DETAILS
// =============================

async function loadUser(){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    if(!user) return;

    const {
        data:profile
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


// =============================
// INCOMING REQUESTS
// =============================

async function loadIncomingRequests(){

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
    .from("swap_requests")
    .select(`
        *,
        books!book_id(
        id,
        title,
        author,
        cover_url
        ),
        offered_book:books!requester_book_id(
        id,
        title,
        author,
        cover_url
        )
        `)
    .eq("owner_id", user.id)
    .eq("owner_deleted", false);

    const {
        data: profiles,
        error: profilesError
    } =
    await supabaseClient
    .from("profiles")
    .select("*");
    
    console.log("ALL PROFILES:", profiles);

    if(error){

        console.error(error);

        return;
    }

    renderIncomingRequests(data, profiles);
}


// =============================
// OUTGOING REQUESTS
// =============================

async function loadOutgoingRequests(){

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
    .from("swap_requests")
    .select(`
        *,
        books!book_id (
            id,
            title,
            author,
            cover_url
        ),
        offered_book:books!requester_book_id(
        id,
        title,
        author,
        cover_url
        )
    `)
    .eq("requester_id", user.id)
    .eq("requester_deleted", false)
    .order(
        "created_at",
        {
            ascending:false
        }
    );

    if(error){

        console.error(error);

        return;
    }

    const{
        data: profiles
    } = 
    await supabaseClient
    .from("profiles")
    .select("*");

    renderOutgoingRequests(data, profiles);
}





// =============================
// RENDER INCOMING
// =============================

async function renderIncomingRequests(requests, profiles){

    const container =
        document.getElementById(
            "incomingRequests"
        );

    container.innerHTML = "";

    if(!requests.length){

        container.innerHTML = `
            <div class="empty-state">
                <p>No incoming requests.</p>
            </div>
        `;

        return;
    }

    for(const req of requests){
        
        const profile = 
        profiles.find(
            p => p.id === req.requester_id
        );

        let badgeClass = "pending";

        if(req.status === "accepted"){
            badgeClass = "accepted";
        }else if(req.status === "declined"){
            badgeClass = "declined";
        }

        container.innerHTML += `

        <div class="request-card">
            <div class="request-user">
                    <img src="${profile?.avatar_url || '../assets/user.jpg' }" class="request-avatar">
                <div>
                    <h3>${profile?.full_name || "Reader"}</h3>
                    <p>Wants to swap books</p>
                </div>
            </div>
            
            <div class="swap-books">
                <div class="swap-book">
                    <img src="${req.books?.cover_url || '../assets/book1.jpg'}">
                    <h4>Your Book</h4>
                     <p>${req.books?.title || ''}</p>
                </div>
                <div class="swap-arrow">
                  ⇄
                </div>
                <div class="swap-book">
                    <img src="${req.offered_book?.cover_url || '../assets/book1.jpg'}">
                    <h4>Offered Book</h4>
                    <p>${req.offered_book?.title || ''}</p>
                </div>
            </div>

    <div class="request-footer">

        <span
            class="status-badge ${badgeClass}">

            ${req.status}

        </span>

        <div class="request-actions">

            <button
                class="view-btn"
                onclick="openChat('${
                    req.requester_id
                }')">

                💬 Message

            </button>

            ${
req.status === "pending"
?
`
<button
class="edit-btn"
onclick="acceptRequest('${req.id}')">

Accept

</button>

<button
class="delete-btn"
onclick="declineRequest('${req.id}')">

Decline

</button>
`
:
req.status === "accepted"
?
`
<button
class="edit-btn"
onclick="completeSwap('${req.id}')">

✅ Complete Swap

</button>

<button
class="delete-btn" onclick="cancelSwap('${req.id}')"> ❌ Cancel Swap </button>
`
                : 
                ["completed","cancelled","declined"].includes(req.status)?
                `<button class="request-delete" onclick="deleteIncomingRequest('${req.id}')"> 
                🗑 Remove
                </button>
                `
                :""
            }

        </div>

    </div>

</div>


        `;
    }
}


// =============================
// RENDER OUTGOING
// =============================

function renderOutgoingRequests(
    requests, profiles
){

    const container =
        document.getElementById(
            "outgoingRequests"
        );

    container.innerHTML = "";

    if(!requests.length){

        container.innerHTML = `

            <div class="empty-state">

                <p>
                    No requests sent yet.
                </p>

            </div>

        `;

        return;
    }

    requests.forEach(req => {

        const owner = profiles.find(
            p => p.id ==req.owner_id
        );

        let badgeClass = "pending";

        if(req.status === "accepted"){
            badgeClass = "accepted";
        }else if(
            req.status === "declined"
        ){
            badgeClass = "declined";
        }else if(req.status === "completed"){
            badgeClass = "completed";
        }

        container.innerHTML += `

            <div class="request-card">

                <div class="request-user">

                    <img src="${owner?.avatar_url || '../assets/user.jpg'}" class="request-avatar">
                    <div>
                    <h3>
                        ${
                            owner?.full_name || 'Reader'
                        }
                    </h3>
                    <p>Book Owner</p>
                    </div>
                </div>

            <div class="swap-books">

                <div class="swap-book">

                    <img
                        src="${
                            req.books?.cover_url ||
                            '../assets/book1.jpg'
                        }">

                    <h4>
                        Requested:
                    </h4>

                    <p>
                        ${
                            req.books?.title ||
                            ''
                        }
                    </p>

                </div>

                <div class="swap-arrow">
                    ⇄
                </div>

                <div class="swap-book">

                    <img
                        src="${
                            req.offered_book?.cover_url ||
                            '../assets/book1.jpg'
                        }">

                    <h4>
                        Offered:
                    </h4>

                    <p>
                        ${
                            req.offered_book?.title ||
                            ''
                        }
                    </p>

                </div>

            </div>

            <div class="request-footer">

                <span
                    class="status-badge ${badgeClass}">

                    ${
                        req.status === "completed"? "✅ Swapped" : req.status
                    }

                </span>

                <button
                    class="view-btn"
                    onclick="openChat('${
                        req.owner_id
                    }')">

                    💬 Message

                </button>

                ${
                    ["completed","cancelled","declined"].includes(req.status)?
                    `<button class="request-delete" onclick="deleteOutgoingRequest('${req.id}')">
                    🗑 Remove
                    </button>
                    `
                    : ""
                }

                </div>

            </div>

        `;
    });
}


// =============================
// ACCEPT REQUEST
// =============================

async function acceptRequest(id){

    const {
        data: request,
        error: requestError
    } =
    await supabaseClient
    .from("swap_requests")
    .select("*")
    .eq("id", id)
    .single();

    const {
        data: ownerProfile
    } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq(
        "id",request.owner_id)
        .single();

        const {
            data: book           
        } = await supabaseClient
        .from("books")
        .select("title")
        .eq("id",
            request.book_id)
            .single();

    if(requestError){

        showToast(requestError.message);

        return;
    }

    // Accept selected request

    await supabaseClient
    .from("swap_requests")
    .update({

        status:"accepted"

    })
    .eq("id", id);

    await createNotification(

    request.requester_id,

    "Swap Request Accepted",

    `${ownerProfile.full_name} has accepted your request for "${book.title}".`

);

    // Reserve book

    await supabaseClient
    .from("books")
    .update({

        status:"reserved"

    })
    .eq(
        "id",
        request.book_id
    );

    // Decline all other requests

    await supabaseClient
    .from("swap_requests")
    .update({

        status:"declined"

    })
    .eq(
        "book_id",
        request.book_id
    )
    .neq(
        "id",
        id
    )
    .eq(
        "status",
        "pending"
    );

    showToast(
        "Request accepted."
    );

    loadIncomingRequests();

    loadOutgoingRequests();
}


// =============================
// DECLINE REQUEST
// =============================

async function declineRequest(id){

    const {
        data: request
    } = await supabaseClient
    .from("swap_requests")
    .select("*")
    .eq("id", id)
    .single();
    
    const {
        data: ownerProfile
    } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq("id", request.owner_id)
    .single();
    
    const {
        data: book
    } = await supabaseClient
    .from("books")
    .select("title")
    .eq("id", request.book_id)
    .single();

    const {
        error
    } =
    await supabaseClient
    .from("swap_requests")
    .update({

        status:"declined"

    })
    .eq("id", id);

    await createNotification(

    request.requester_id,

    "Swap Request Declined",

    `${ownerProfile.full_name} has declined your request for "${book.title}".`

);

    if(error){

        showToast(error.message);

        return;
    }

    showToast(
        "Request declined."
    );

    loadIncomingRequests();
}

async function completeSwap(id){

    try{

        const {
            data:{session}
        } =
        await supabaseClient
        .auth
        .getSession();

        if(!session){

           showToast ("Session expired. Please login again.");

            return;

        }

        const response =
        await fetch(

            "https://qpbfqfmsioorjmfsckfb.functions.supabase.co/complete-swap",

            {

                method:"POST",

                headers:{

                    Authorization:
                    `Bearer ${session.access_token}`,

                    apikey: SUPABASE_PUBLISHABLE_KEY,

                    "Content-Type":"application/json"

                },

                body:JSON.stringify({

                    swapId:id

                })

            }

        );

        console.log("SESSION:", session);
        console.log("TOKEN:", session?.access_token);

        const result =
        await response.json();

        console.log(result);

        if(!response.ok){

           showToast (

                result.error ||
                "Failed to complete swap."

            );

            return;

        }

        showToast(

            result.message ||
            "Swap completed successfully."

        );

        await loadIncomingRequests();

        await loadOutgoingRequests();

    }

    catch(error){

        console.error(error);

        showToast(

            "Something went wrong."

        );

    }

}



async function cancelSwap(id){

    try{

        const {

            data:{session}

        } = await supabaseClient.auth.getSession();

        const response = await fetch(

            "https://qpbfqfmsioorjmfsckfb.functions.supabase.co/cancel-swap",

            {

                method:"POST",

                headers:{

                    Authorization:`Bearer ${session.access_token}`,

                    apikey:SUPABASE_PUBLISHABLE_KEY,

                    "Content-Type":"application/json"

                },

                body:JSON.stringify({

                    swapId:id

                })

            }

        );

        const result = await response.json();

        if(!response.ok){

            showToast(result.error);

            return;

        }

        showToast(result.message);

        await loadIncomingRequests();

        await loadOutgoingRequests();

    }

    catch(error){

        console.error(error);

        showToast("Failed to cancel swap.");

    }

}

async function deleteIncomingRequest(requestId){

    const { error } =
    await supabaseClient
    .from("swap_requests")
    .update({
        owner_deleted:true
    })
    .eq("id",requestId);

    if(error){

        showToast(error.message);

        return;

    }

    await permanentlyDelete(requestId);

    showToast("Request removed.");

    loadIncomingRequests();

}

async function deleteOutgoingRequest(requestId){

    const { error } =
    await supabaseClient
    .from("swap_requests")
    .update({
        requester_deleted:true
    })
    .eq("id",requestId);

    if(error){

        showToast(error.message);

        return;

    }

    await permanentlyDelete(requestId);

    showToast("Request removed.");

    loadOutgoingRequests();

}

async function permanentlyDelete(requestId){

    const {

        data

    } =

    await supabaseClient

    .from("swap_requests")

    .select("owner_deleted, requester_deleted")

    .eq("id",requestId)

    .single();

    if(

        data.owner_deleted &&

        data.requester_deleted

    ){

        await supabaseClient

        .from("swap_requests")

        .delete()

        .eq("id",requestId);

    }

}


function openChat(userId){

    window.location.href =
        `messages.html?user=${userId}`;
}

