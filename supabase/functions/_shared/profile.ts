export async function deleteProfile(
    supabaseAdmin: any,
    userId: string
) {

    const { error } =
    await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("id", userId);

    if (error) {

        throw new Error(error.message);

    }

}