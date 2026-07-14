document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await Promise.all([
         loadUser(),
        
         loadWishlist(),

         loadUnreadMessages(),

         loadNotifications(),
        ]);

        document.getElementById("closeViewModal")
        .addEventListener("click",
            () => {
                document.getElementById("viewBookModal")
                .classList.add("hidden");
            }
        );


        document
        .getElementById("closeSwapModal")
        .addEventListener(
            "click",
            () => {

                document
                .getElementById("swapModal")
                .classList.add("hidden");
            });

            document
            .getElementById("submitSwapRequest")
            .addEventListener("click", 
                submitSwapRequest
            );

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

    }
);

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

    document
    .getElementById(
        "sidebarUserName"
    )
    .textContent =
    profile?.full_name ||
    "Reader";

    document
    .getElementById(
        "profilePicture"
    )
    .src =
    profile?.avatar_url ||
    "../assets/user.jpg";

    document
    .getElementById(
        "sidebarProfilePic"
    )
    .src =
    profile?.avatar_url ||
    "../assets/user.jpg";
}

async function loadWishlist(){

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
    .from("wishlist")
    .select(`
        id,
        books(
            *
        )
    `)
    .eq("user_id", user.id);

    if(error){

        console.error(error);

        return;
    }

    const validItems = [];

for(const item of data){

    const book =
        item.books;

    if(
        !book ||
        book.status === "swapped" || book.status === "reserved"
    ){

        await supabaseClient
        .from("wishlist")
        .delete()
        .eq("id", item.id);

        continue;
    }

    validItems.push(item);
}

renderWishlist(validItems);
return;

}

function renderWishlist(items){

    const container =
        document.getElementById(
            "wishlistContainer"
        );

    container.innerHTML = "";

    if(!items.length){

        container.innerHTML = `
            <div class="empty-state">
                <p>
                    No saved books yet.
                </p>
            </div>
        `;

        return;
    }

    items.forEach(item => {

        const book =
            item.books;

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

                <div class="book-actions">

                    <button
                        class="view-btn"
                        onclick="viewBook('${book.id}')">

                        👁 View Details

                    </button>

                    <button class="request-btn" onclick="openSwapModal ('${book.id}')">
                     🔄 Request Swap
                    </button>

                    <button class="delete-btn" onclick="removeWishlist('${book.id}')">
                     🗑 Remove
                    </button>

                </div>

            </div>

        `;
    });
}


async function removeWishlist(bookId){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    // Get book title for activity log
    const {
        data: book
    } =
    await supabaseClient
    .from("books")
    .select("title")
    .eq("id", bookId)
    .single();

    const { error } =
    await supabaseClient
    .from("wishlist")
    .delete()
    .eq("user_id", user.id)
    .eq("book_id", bookId);

    if(error){

        showToast(error.message);

        return;

    }

    // Activity Log
    const { error: activityError } =
    await supabaseClient
    .from("activity_log")
    .insert({
        user_id: user.id,
        activity: `Removed "${book.title}" from wishlist.`
    });

    if(activityError){

        console.error(activityError);

    }

    showToast("Book removed from wishlist.");

    loadWishlist();

}

async function viewBook(id){

    const {data,error} =
        await supabaseClient
        .from("books")
        .select("*")
        .eq("id",id)
        .single();

    if(error){

        console.error(error);

        return;
    }

    document
    .getElementById("viewCover")
    .src =
    data.cover_url ||
    "../assets/book1.jpg";

    document
    .getElementById("viewTitle")
    .textContent =
    data.title;

    document
    .getElementById("viewAuthor")
    .textContent =
    data.author;

    document
    .getElementById("viewGenre")
    .textContent =
    data.genre;

    document
    .getElementById("viewStatus")
    .textContent =
    data.status;

    document
    .getElementById("viewCondition")
    .textContent =
    data.condition;

    document
    .getElementById("viewDescription")
    .textContent =
    data.description;

    document
    .getElementById(
        "viewBookModal"
    )
    .classList.remove(
        "hidden"
    );
}

async function openSwapModal(ownerBookId){

    selectedBookId =
        ownerBookId;

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    const {
        data:myBooks,
        error
    } =
    await supabaseClient
        .from("books")
        .select("*")
        .eq("user_id", user.id);

    if(error){

        showToast(error.message);

        return;
    }

    const select =
        document.getElementById(
            "myBooksSelect"
        );

    select.innerHTML = "";

    myBooks.forEach(book => {

        select.innerHTML += `

            <option value="${book.id}">

                ${book.title}

            </option>

        `;

    });

    document
        .getElementById("swapModal")
        .classList.remove("hidden");
}



async function submitSwapRequest(){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    const requesterBookId =
        document.getElementById(
            "myBooksSelect"
        ).value;

    const {
        data:ownerBook
    } =
    await supabaseClient
        .from("books")
        .select("*")
        .eq("id", selectedBookId)
        .single();

    const { error } =
        await supabaseClient
        .from("swap_requests")
        .insert({

            book_id:
                selectedBookId,

            requester_book_id:
                requesterBookId,

            requester_id:
                user.id,

            owner_id:
                ownerBook.user_id,

            status:
                "pending"

        });

    if(error){

        showToast(error.message);

        return;
    }

    showToast(
        "Swap request sent successfully."
    );

    document
        .getElementById("swapModal")
        .classList.add("hidden");
}
