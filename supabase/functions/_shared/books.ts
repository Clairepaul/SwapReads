export async function markBookSwapped(
    supabaseAdmin: any,
    bookId: string
) {

    const { error } =
    await supabaseAdmin
    .from("books")
    .update({

        status: "swapped"

    })
    .eq("id", bookId);

    if (error) {

        throw new Error(error.message);

    }

}

export async function markBookAvailable(

    supabaseAdmin:any,

    bookId:string

){

    const { error } =

    await supabaseAdmin

    .from("books")

    .update({

        status:"available"

    })

    .eq("id",bookId);

    if(error){

        throw new Error(error.message);

    }

}