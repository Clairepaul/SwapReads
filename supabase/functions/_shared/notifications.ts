export async function createNotification(

    supabaseAdmin: any,

    userId: string,

    title: string,

    message: string,

    bookId?: string

) {

    const { error } =
    await supabaseAdmin
    .from("notifications")
    .insert({

        user_id: userId,

        title,

        message,

        book_id: bookId

    });

    if (error) {

        throw new Error(error.message);

    }

}