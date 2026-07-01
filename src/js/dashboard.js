document.addEventListener("DOMContentLoaded", async () => {

    // Check if user is logged in

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    // Load user information
    await Promise.all([
         loadUser(),
         loadUnreadMessages(),
         loadNotifications(),
         loadDashboardStats(),
         loadAvailableBooks(),
         loadPendingRequests(),
         loadRecommendedBooks(),
         loadRecentActivity()
    ]);


    // Logout functionality

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
    

});



async function loadUser() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    const user = session?.user;

    

    const {
        data: profile
    } = await supabaseClient
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

    // Sidebar name

    const sidebarUserName =
        document.getElementById("sidebarUserName");

    if (sidebarUserName) {

        sidebarUserName.textContent =
            fullName;
    }

    // Welcome message

    const welcomeMsg =
        document.getElementById("welcome-msg");

    if (welcomeMsg) {

        welcomeMsg.textContent =
            `Welcome Back, ${fullName} 👋`;
    }

    // Header image

    const profilePicture =
        document.getElementById("profilePicture");

    if (profilePicture) {

        profilePicture.src =
            avatar;
    }

    // Sidebar image

    const sidebarProfilePic =
        document.getElementById("sidebarProfilePic");

    if (sidebarProfilePic) {

        sidebarProfilePic.src =
            avatar;
    }
}

    

async function loadDashboardStats() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    const user = session?.user;


    const {
    data: messages
} =
await supabaseClient
.from("messages")
.select("*");

const chatUsers =
    new Set();

messages.forEach(msg => {

    if(
        msg.sender_id === user.id
    ){

        chatUsers.add(
            msg.receiver_id
        );
    }

    if(
        msg.receiver_id === user.id
    ){

        chatUsers.add(
            msg.sender_id
        );
    }

});

const messageCard =
    document.getElementById(
        "messageCardCount"
    );

if(messageCard){

    messageCard.textContent =
        chatUsers.size;
}

    if (!user) return;

    const { data: books, error } =
        await supabaseClient
        .from("books")
        .select("*")
        .eq("user_id", user.id);

    if (error) {

        console.error(error);

        return;
    }

    // Update My Books card

    const bookCount =
        document.getElementById("bookCount");

    if (bookCount) {

        bookCount.textContent =
            books.length;
    }

    //update Request Count
    const {
    data: pendingRequests} =
    await supabaseClient
    .from("swap_requests")
    .select("*")
    .eq("owner_id", user.id)
    .eq("status", "pending");
        document.getElementById(
            "requestCount"
        ).textContent =
                pendingRequests?.length || 0;

    //update Completed Swaps
    
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
    
    document
    .getElementById(
        "swapsCount"
    )
    .textContent =
    swapsCount || 0;

    // Update Dashboard My Books section

    const container =
        document.getElementById("myBkContainer");

    if (!container) return;

    container.innerHTML = "";

    if (books.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No Books Yet</h3>
                <p>Add your first book to start swapping.</p>
            </div>
        `;

        return;
    }
    

    const recentBooks = books.slice(0, 4);
    recentBooks.forEach(book => {

        container.innerHTML += `

            <div class="book-card">

                <img
                    src="${book.cover_url || '../assets/book1.jpg'}"
                    class="book-cover">

                <div class="book-info">

                    <h3>${book.title}</h3>

                    <p>${book.author}</p>

                    <p>${book.genre || ''}</p>

                </div>

            </div>

        `;
    });
}

async function loadAvailableBooks() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();


    const user = session?.user;

    const { data: books, error } =
        await supabaseClient
        .from("books")
        .select("*")
        .neq("user_id", user.id)
        .neq("status", "swapped")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        return;
    }

    const container =
        document.getElementById(
            "availableBKContainer"
        );

    if (!container) return;

    container.innerHTML = "";

    if (books.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <p>No books available from other readers.</p>
            </div>
        `;

        return;
    }

    books.slice(0, 8).forEach(book => {

        container.innerHTML += `

            <div class="book-card">

                <img
                    src="${book.cover_url || '../assets/book1.jpg'}"
                    class="book-cover">

                <div class="book-info">

                    <h3>${book.title}</h3>

                    <p>${book.author}</p>

                    <p>${book.genre || ''}</p>

                    <p>
                        <strong>Status:</strong>
                        ${book.status}
                    </p>

                </div>

                <div class="book-actions">

                    <button
                        class="view-btn"
                        onclick="viewAvailableBook('${book.id}')">

                        👁 View Details

                    </button>

                </div>

            </div>

        `;
    });
}


async function viewAvailableBook(id){

    const { data, error } =
        await supabaseClient
        .from("books")
        .select("*")
        .eq("id", id)
        .single();

    if(error){

        console.error(error);

        return;
    }

    document.getElementById("viewCover").src =
        data.cover_url || "../assets/book1.jpg";

    document.getElementById("viewTitle").textContent =
        data.title;

    document.getElementById("viewAuthor").textContent =
        data.author;

    document.getElementById("viewGenre").textContent =
        data.genre;

    document.getElementById("viewStatus").textContent =
        data.status;

    document.getElementById("viewCondition").textContent =
        data.condition;

    document.getElementById("viewDescription").textContent =
        data.description;

    document
        .getElementById("viewBookModal")
        .classList.remove("hidden");
}

//Recent Pending requests

async function loadPendingRequests(){

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
    .select(`
        *,
        books!book_id(
            title
        )
    `)
    .eq("owner_id", user.id)
    .eq("status", "pending")
    .order(
        "created_at",
        {
            ascending:false
        }
    )
    .limit(5);

    if(error){

        console.error(error);

        return;
    }

    const {
        data: profiles
    } =
    await supabaseClient
    .from("profiles")
    .select("*");

    renderPendingRequests(
        requests,
        profiles
    );
}

function renderPendingRequests(
    requests,
    profiles
){

    const container =
        document.getElementById(
            "pendingRequestsContainer"
        );

    container.innerHTML = "";

    if(!requests.length){

        container.innerHTML = `
            <div class="empty-state">
                No pending requests.
            </div>
        `;

        return;
    }

    requests.forEach(req => {

        const requester =
            profiles.find(
                p => p.id === req.requester_id
            );

        container.innerHTML += `

        <div class="request-card">

            <div class="request-user">

                <img
                    src="${
                        requester?.avatar_url ||
                        '../assets/user.jpg'
                    }"
                    class="request-avatar">

                <div>

                    <h4>
                        ${
                            requester?.full_name ||
                            'Reader'
                        }
                    </h4>

                    <p>
                        Requested:
                        ${
                            req.books?.title ||
                            ''
                        }
                    </p>

                </div>

            </div>

        </div>

        `;
    });
}

const dashboardAddBookBtn =
    document.getElementById("addBookBtn");

const dashboardPageBookModal =
    document.getElementById("bookModal");

if (dashboardAddBookBtn && !dashboardPageBookModal) {

    dashboardAddBookBtn.addEventListener("click", () => {

        window.location.href =
            "mybooks.html";

    });
}

async function loadRecommendedBooks(){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    if(!user) return;

    // Get user profile

    const {
        data:profile
    } =
    await supabaseClient
    .from("profiles")
    .select("favorite_genres")
    .eq("id", user.id)
    .single();

    const genres =
        profile?.favorite_genres || [];

    if(!genres.length){

        document
        .getElementById(
            "RecommendedBks"
        )
        .innerHTML = `
            <div class="empty-state">
                Select favourite genres in your profile
                to get recommendations.
            </div>
        `;

        return;
    }

    const {
        data:books,
        error
    } =
    await supabaseClient
    .from("books")
    .select("*")
    .neq("user_id", user.id)
    .eq("status", "available")
    .in("genre", genres)
    .limit(8);

    if(error){

        console.error(error);

        return;
    }

    renderRecommendedBooks(
        books
    );
}

function renderRecommendedBooks(
    books
){

    const container =
    document.getElementById(
        "RecommendedBks"
    );

    container.innerHTML = "";

    if(!books.length){

        container.innerHTML = `
            <div class="empty-state">
                No recommendations available yet.
            </div>
        `;

        return;
    }

    books.forEach(book => {

        container.innerHTML += `

        <div class="book-card">

            <img
                src="${
                    book.cover_url ||
                    '../assets/book1.jpg'
                }"
                class="book-cover">

            <div class="book-info">

                <h3>
                    ${book.title}
                </h3>

                <p>
                    ${book.author}
                </p>

                <p>
                    ${book.genre}
                </p>

            </div>

        </div>

        `;

    });

}


async function loadRecentActivity(){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    const {
        data
    } =
    await supabaseClient
    .from("activity_log")
    .select("*")
    .eq(
        "user_id",
        user.id
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
        "activityContainer"
    );

    container.innerHTML = "";

    if(!data.length){

        container.innerHTML = `
            <div class="empty-state">
                No activity yet.
            </div>
        `;

        return;
    }

    data.forEach(item => {

        container.innerHTML += `

        <div class="activity-item">

            <p>
                ${item.activity}
            </p>

            <small>
                ${
                    new Date(
                        item.created_at
                    )
                    .toLocaleString()
                }
            </small>

        </div>

        `;

    });

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const closeBtn =
            document.getElementById(
                "closeViewModal"
            );

        if (closeBtn) {

            closeBtn.addEventListener(
                "click",
                () => {

                    document
                        .getElementById(
                            "viewBookModal"
                        )
                        .classList.add(
                            "hidden"
                        );

                }
            );

        }

    }
);
