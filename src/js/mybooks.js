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
    ]);
    // Logout functionality

    const logoutBtn =
        document.getElementById("logout-Btn");


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async (e) => {

                e.preventDefault();

                const {error} = 

                await supabaseClient.auth.signOut();

                if (error) {
                    console.error(error);
                    return;
                }

                window.location.href =
                    "login.html";
            }
        );
    }

});

async function loadUser() {

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    if (!user) return;

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

    const sidebarUserName =
        document.getElementById("sidebarUserName");

    if (sidebarUserName) {

        sidebarUserName.textContent =
            fullName;
    }

    const profilePicture =
        document.getElementById("profilePicture");

    if (profilePicture) {

        profilePicture.src =
            avatar;
    }

    const sidebarProfilePic =
        document.getElementById("sidebarProfilePic");

    if (sidebarProfilePic) {

        sidebarProfilePic.src =
            avatar;
    }
}


let editingBookId = null;
const myBooksContainer =
    document.getElementById("myBkContainer");

const bookForm =
    document.getElementById("bookForm");

const addBookBtn =
    document.getElementById("addBookBtn");

const bookModal =
    document.getElementById("bookModal");

const closeModal =
    document.getElementById("closeModal");

if (addBookBtn && bookModal) {
    addBookBtn.addEventListener("click", () => {

        editingBookId = null;
        bookForm.reset();
        document.getElementById("modalTitle").textContent = "Add Book";
        bookModal.classList.remove("hidden");

    });
}

if (closeModal && bookModal) {
    closeModal.addEventListener("click", () => {

        bookModal.classList.add("hidden");

    });
}

// UPLOAD COVER IMAGE

async function uploadCover(file){

    console.log("Uploading file...");

    const fileName =
        `${Date.now()}-${file.name}`;

    const result =
        await supabaseClient.storage
        .from("book-covers")
        .upload(fileName, file);

    console.log(result);

    if(result.error){

        console.error(result.error);

        throw result.error;
    }

    const { data } =
        supabaseClient.storage
        .from("book-covers")
        .getPublicUrl(fileName);

    return data.publicUrl;
}

// SAVE BOOK

bookForm.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();

        try{

            const {
                data:{session}
            } = await supabaseClient.auth.getSession();
            
            const user = session?.user;

            if(!user){

                showToast("Please login.");

                return;
            }

            const file =
                document.getElementById("cover")
                .files[0];

            let coverUrl = null;

            if(file){

                coverUrl =
                    await uploadCover(file);
            }

            const payload = {

                user_id: user.id,

                title:
                    document.getElementById("title").value,

                author:
                    document.getElementById("author").value,

                genre:
                    document.getElementById("genre").value,

                description:
                    document.getElementById("description").value,

                condition:
                    document.getElementById("condition").value,

                status:
                    document.getElementById("status").value

            };

            if(coverUrl){

                payload.cover_url =
                    coverUrl;
            }

            let result;

            console.log("Current User:", user); 
            console.log("Payload:", payload);

            if(editingBookId){

                result =
                    await supabaseClient
                    .from("books")
                    .update(payload)
                    .eq("id", editingBookId);

            }else{


                result =
                    await supabaseClient
                    .from("books")
                    .insert([payload]);

            }

            if(result.error){

                console.error(result.error);

                showToast(result.error.message);

                return;
            }

            await supabaseClient
            .from("activity_log")
            .insert(
                { user_id:user.id, 
                    activity: editingBookId
                    ? `Updated "${payload.title}"`:
                    `Added "${payload.title}"`
                });

            showToast("Book saved successfully!");

            bookModal.classList.add("hidden");

            bookForm.reset();

            editingBookId = null;

            loadBooks();

        }
        catch(error){

            console.error(error);

            showToast(error.message);

        }

    }
);

//LOAD BOOKS

async function loadBooks() {

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    if (!user) return;

    const { data, error } =
        await supabaseClient
        .from("books")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
            ascending: false
        });



    if(error){

        console.error(error);

        return;
    }

    renderBooks(data);
}

//Display books

function renderBooks(books){

    myBooksContainer.innerHTML = "";

    if(!books.length){

        myBooksContainer.innerHTML = `
            <div class="empty-state">
                <h3>No Books Yet</h3>
                <p>Add your first book to start swapping.</p>
            </div>
        `;

        return;
    }

    books.forEach(book => {


        const card =
        document.createElement("div");

        card.className = "book-card";

        card.innerHTML = `

            <img
                src="${book.cover_url || '../assets/book1.jpg'}"
                class="book-cover">

            <div class="book-info">

                <h3>${book.title}</h3>

                <p><strong>Author:</strong> ${book.author}</p>

                <p><strong>Genre:</strong> ${book.genre}</p>

                <p><strong>Status:</strong> ${book.status === "available"? "📚 Available" : book.status === "reserved"? "🔒 Reserved for Swap" : book.status === "swapped"?
                    "✅ Swapped" : book.status}</p>

                <p><strong>Condition:</strong> ${book.condition}</p>

            </div>

            <div class="book-actions">

                <button
                    class="view-btn"
                    onclick="viewBook('${book.id}')">

                    👁 View Details

                </button>

            <div class="action-buttons">
            ${
                book.status !== "swapped"?
                `

                <button
                    class="edit-btn"
                    onclick="editBook('${book.id}')">

                    Edit

                </button>
                `
                :
                `
                <button class="completed-btn" disabled>
                ✅ Swap Completed
                </button>
                `         
                }
                <button
                    class="delete-btn"
                    onclick="deleteBook('${book.id}')">

                    Delete

                </button>

                </div>

            </div>

        `;

        myBooksContainer.appendChild(card);

    });
}

//INITIAL LOAD
document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadBooks();

    }
);


async function editBook(id){

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

    editingBookId = id;

    document.getElementById("modalTitle")
        .textContent = "Edit Book";

    document.getElementById("title")
        .value = data.title;

    document.getElementById("author")
        .value = data.author;

    document.getElementById("genre")
        .value = data.genre;

    document.getElementById("description")
        .value = data.description;

    document.getElementById("condition")
        .value = data.condition;

    document.getElementById("status")
        .value = data.status;

    bookModal.classList.remove("hidden");
}

//DELETE BOOK

async function deleteBook(id){

    const confirmed =
        confirm(
            "Delete this book?"
        );

    if(!confirmed) return;

    const { error } =
        await supabaseClient
        .from("books")
        .delete()
        .eq("id", id);

    if(error){

        showToast(error.message);

        return;
    }

    loadBooks();
}

//VIEW BOOK
async function viewBook(id){

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

    document.getElementById("viewCondition").textContent =
        data.condition;

    document.getElementById("viewStatus").textContent =
        data.status;

    document.getElementById("viewDescription").textContent =
        data.description;

    document
        .getElementById("viewBookModal")
        .classList.remove("hidden");
}



const params =
    new URLSearchParams(window.location.search);

if (params.get("action") === "add") {

    document
        .getElementById("bookModal")
        .classList.remove("hidden");
}

document
.getElementById("closeViewModal")
.addEventListener("click", () => {

    document
        .getElementById("viewBookModal")
        .classList.add("hidden");

});
