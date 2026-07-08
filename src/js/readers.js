document.addEventListener(
    "DOMContentLoaded",
    async () => {
    
        await  Promise.all([
         loadUser(),

         loadUnreadMessages(),

         loadNotifications(),

         loadReaders(),

         setupLogout()
        ]);

        document
        .getElementById(
            "closeReaderModal"
        )
        .addEventListener(
            "click",
            () => {

                document
                .getElementById(
                    "readerModal"
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
        "Reader";

    const avatar =
        profile?.avatar_url ||
        "../assets/user.jpg";

    document
    .getElementById(
        "sidebarUserName"
    )
    .textContent =
    fullName;

    document
    .getElementById(
        "profilePicture"
    )
    .src =
    avatar;

    document
    .getElementById(
        "sidebarProfilePic"
    )
    .src =
    avatar;
}

function setupLogout(){

    const logoutBtn =
        document.getElementById(
            "logout-Btn"
        );

    if(!logoutBtn) return;

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

async function loadReaders(){

    const {
        data:{session}
    } =
    await supabaseClient.auth.getSession();

    const user = session?.user;

    const {
        data:profiles,
        error
    } =
    await supabaseClient
    .from("profiles")
    .select("*")
    .eq("show_in_readers", true)
    .neq("id", user.id);

    if(error){

        console.error(error);

        return;
    }

    renderReaders(
        profiles
    );
}


async function renderReaders(
    readers
){

    const container =
        document.getElementById(
            "readersContainer"
        );

    container.innerHTML = "";

    for(
        const reader
        of readers
    ){

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
            reader.id
        )
        .eq(
            "status",
            "available"
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
            `owner_id.eq.${reader.id},requester_id.eq.${reader.id}`
        );

        container.innerHTML += `

        <div class="reader-card">

            <div class="reader-top">

                <img
                    src="${
                        reader.avatar_url ||
                        '../assets/user.jpg'
                    }"
                    class="reader-avatar">

                <div>

                    <h3>
                        ${
                            reader.full_name
                        }
                    </h3>

                    <p>
                        ${
                            reader.location ||
                            'Location not set'
                        }
                    </p>

                </div>

            </div>

            <p>

                ${
                    (reader.bio ||
                    'Book lover')
                    .substring(0, 120)
                }
                ...

            </p>

            <p>

                📚 ${booksCount}
                Books Available

            </p>

            <p>

                🔄 ${swapsCount}
                Completed Swaps

            </p>

            <div class="reader-actions">

                <button
                    class="view-btn"
                    onclick="viewReader('${
                        reader.id
                    }')">

                    View Profile

                </button>

                <button
                    class="request-btn"
                    onclick="messageReader('${
                        reader.id
                    }')">

                    Message

                </button>

            </div>

        </div>

        `;
    }
}

function messageReader(
    userId
){

    window.location.href =
        `messages.html?user=${userId}`;
}


async function viewReader(
    userId
){

    const {
        data:reader
    } =
    await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

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
        userId
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
        `owner_id.eq.${userId},requester_id.eq.${userId}`
    );

    document.getElementById(
        "readerAvatar"
    ).src =
    reader.avatar_url ||
    "../assets/user.jpg";

    document.getElementById(
        "readerName"
    ).textContent =
    reader.full_name;

    document.getElementById(
        "readerLocation"
    ).textContent =
    reader.location ||
    "Unknown";

    document.getElementById(
        "readerBio"
    ).textContent =
    reader.bio ||
    "";

    document.getElementById(
        "readerGenres"
    ).textContent =
    reader.favorite_genres ||
    "";

    document.getElementById(
        "readerBooks"
    ).textContent =
    booksCount;

    document.getElementById(
        "readerSwaps"
    ).textContent =
    swapsCount;

    document
    .getElementById(
        "readerModal"
    )
    .classList.remove(
        "hidden"
    );
}
