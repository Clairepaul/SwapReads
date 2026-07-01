export async function createActivity(

    supabaseAdmin: any,

    userId: string,

    activity: string

) {

    const { error } =
    await supabaseAdmin
    .from("activity_log")
    .insert({

        user_id: userId,

        activity

    });

    if (error) {

        throw new Error(error.message);

    }

}