const searchInput = document.getElementById("searchInput");

const searchResults = document.getElementById("searchResults");

if(searchInput){
    searchInput.addEventListener(
        "input", searchEverything
    );
}

async function searchEverything() {
    
    const query = searchInput.value
    .trim();

    if (query.length < 2){
        searchResults.classList.add("hidden");
        return;
    }

    //BOOKS
    const{
        data:books,
        error:bookError
    } = await supabaseClient
    .from("books")
    .select("*")
    .or(
        `title.ilike.%${query}%,author.ilike.%${query}%,genre.ilike.%${query}%`
    )
    .eq("status", "available")
    .limit(5);

    if(bookError){
        console.log(bookError);
    }

    //READERS
    const {
        data:readers,
        error:readerError
    } = await supabaseClient
    .from("profiles")
    .select("*")
    .or(
        `full_name.ilike.%${query}%,location.ilike.%${query}%`
    )
    .eq("show_in_readers", true)
    .limit(5);

    
    if(readerError){
        console.log(readerError);
    }

    renderSearchResults(books || [], readers || []);
}

function renderSearchResults(
    books, readers
){
    searchResults.innerHTML = "";

    if(
        !books.length && !readers.length
    ){
        searchResults.innerHTML = 
        `
        <div class="search-item">
          No results found
        </div>
        `;


        searchResults.classList.remove("hidden");

        return;
    }

    if(books.length){
        searchResults.innerHTML += 
        `
        <div class="search-category">
          📚 Books
        </div>
        `;

        books.forEach(book=>{
            searchResults.innerHTML += 
            `
            <div class="search-item" onclick="openBook('${book.id}')">
               <strong>
                    ${book.title}
                </strong>

                <br>

                ${book.author}

            </div>
            `;
        });
    }

    if (readers.length){
        searchResults.innerHTML += 
        `
        <div class="search-category">
            👤 Readers
        </div>
        `;
        readers.forEach(reader=>{

            searchResults.innerHTML +=
            `
            <div
                class="search-item"
                onclick="openReader('${reader.id}')">

                <strong>
                    ${reader.full_name}
                </strong>

                <br>

                ${reader.location || ''}

            </div>
            `;
        });

    }

    searchResults.classList.remove("hidden");
    
}

//OPEN FUNCTIONS

function openBook(id){
    window.location.href = `browse.html?book=${id}`;

}

function openReader(id){

    window.location.href = `readers.html?reader=${id}`;
}

document.addEventListener(
    "click",
    e=>{

        if(
            !searchInput.contains(
                e.target
            ) &&
            !searchResults.contains(
                e.target
            )
        ){

            searchResults
            .classList.add(
                "hidden"
            );

        }

    }
);

