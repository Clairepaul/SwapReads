const booksContainer =
    document.getElementById(
        "browseBooksContainer"
    );

const genreFilter =
    document.getElementById(
        "genreFilter"
    );

let allBooks = [];

let selectBookId = null;

document.addEventListener(
    "DOMContentLoaded",
    async () => {


        await Promise.all([
            loadUser(),
            loadUnreadMessages(),
            loadNotifications(),
            loadBooks()
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

        genreFilter.addEventListener(
            "change",
            filterBooks
        );

        document
        .getElementById("closeViewModal")
        .addEventListener(
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

async function loadBooks(){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    if(!user) return;

    const {data,error} =
        await supabaseClient
        .from("books")
        .select("*")
        .neq("user_id", user.id)
        .eq("status","available")
        .order(
            "created_at",
            {ascending:false}
        );

    if(error){

        console.error(error);

        return;
    }

    const {
        data:wishlist
    } = await supabaseClient
    .from("wishlist")
    .select("book_id")
    .eq("user_id", user.id);
    
    const wishlistIds = 
    wishlist?.map(
        item => item.book_id
    ) || [];
    
    allBooks =
    data.map(book => ({

        ...book,

        isWishlisted:
            wishlistIds.includes(
                book.id
            )

    }));

    console.log("BROWSE BOOKS:", data);
    
    renderBooks(allBooks);
}

function renderBooks(books){

    booksContainer.innerHTML = "";

    books.forEach(book=>{

        booksContainer.innerHTML += `

            <div class="book-card">

                <img
                    src="${
                        book.cover_url ||
                        '../assets/book1.jpg'
                    }"
                    class="book-cover">

                <div class="book-info">

                    <h3>${book.title}</h3>

                    <p>${book.author}</p>

                    <p>${book.genre}</p>

                    <p>${book.status}</p>

                </div>

                <div class="book-actions">

                    <button
                        class="view-btn"
                        onclick="viewBook('${book.id}')">

                        👁 View Details

                    </button>

                    <button 
                        class="wishlist-btn ${book.isWishlisted ? 'saved' : ''}"  
                        onclick="toggleWishlist('${book.id}')"> 
                    
                      ❤️
                    
                    </button>

                    <button class="request-btn"
                    onclick="openSwapModal('${book.id}')">

                    🔄 Request Swap

                    </button>

                </div>

            </div>
        `;
    });
}

function filterBooks(){

    const genre =
        genreFilter.value;

    if(!genre){

        renderBooks(allBooks);

        return;
    }

    const filtered =
        allBooks.filter(
            book =>
            book.genre === genre
        );

    renderBooks(filtered);
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

async function requestSwap(bookId){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    const {
        data:book,
        error:bookError
    } = await supabaseClient
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();

    if(bookError){

        showToast(bookError.message, "error");

        return;
    }

    const { error } =
        await supabaseClient
        .from("swap_requests")
        .insert({

            book_id: book.id,

            requester_id: user.id,

            owner_id: book.user_id,

            status: "pending"

        });

    if(error){

        showToast(bookError.message, "error");

        return;
    }

    showToast("Swap request sent successfully.");
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
    } = await supabaseClient
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "available")
    .order("title");

    if(!myBooks || myBooks.length === 0){
        showToast(
            "You don't have any available books to offer.",
            "info"
        );
        
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

document
.getElementById("closeSwapModal")
.addEventListener(
    "click",
    () => {

        document
        .getElementById("swapModal")
        .classList.add("hidden");

    }
);

document
.getElementById(
    "submitSwapRequest"
)
.addEventListener(
    "click",
    submitSwapRequest
);

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
        data:existingRequest
    } =
    await supabaseClient
    .from("swap_requests")
    .select("id")
    .eq("book_id", selectedBookId)
    .eq("requester_id", user.id)
    .in("status", ["pending","accepted"])
    .limit(1);

    if(existingRequest && existingRequest.length){

        showToast(
            "You have already sent a request for this book.",
            "info"
        );

        return;
    }

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

        showToast(bookError.message, "error");

        return;
    }

    await supabaseClient
    .from("activity_log")
    .insert({
        user_id:user.id,
        activity:
        `Requested swap for "${ownerBook.title}"`
    });

    await createNotification(

    ownerBook.user_id,

    "New Swap Request",

    "Someone has requested to swap one of your books."
);

    showToast(
        "Swap request sent successfully."
    );

    document
        .getElementById("swapModal")
        .classList.add("hidden");
}


async function toggleWishlist(bookId){

    const {
        data:{user}
    } =
    await supabaseClient
    .auth
    .getUser();

    const {
        data:existing
    } =
    await supabaseClient
    .from("wishlist")
    .select("*")
    .eq("user_id", user.id)
    .eq("book_id", bookId);

    if(existing && existing.length){

        await supabaseClient
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("book_id", bookId);

    }else{

        await supabaseClient
        .from("wishlist")
        .insert({

            user_id:user.id,

            book_id:bookId

        });

    }

    await loadBooks();

    const book = allBooks.find( b => b.id === bookId);
    await supabaseClient
    .from("activity_log")
    .insert({
        user_id:user.id,
        activity:
        `Added "${book.title}" to wishlist`
    });

}