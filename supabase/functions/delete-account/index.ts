import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { deleteProfile } from "../_shared/profile.ts";

Deno.serve(async (req) => {

    if (req.method === "OPTIONS") {
    return new Response("ok", {
        headers: corsHeaders,
    });
}

    try {

        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {

            return Response.json(
                {
                    success: false,
                    error: "Missing Authorization header."
                },
                {
                    status: 401,
                    headers: corsHeaders
                }
            );

        }

        // Client using the user's JWT
        const supabase = createClient(

            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,

            {
                global: {

                    headers: {

                        Authorization: authHeader

                    }

                }

            }

        );

        // Admin client
        const supabaseAdmin = createClient(

            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

        );

        // Get authenticated user
        const {

            data: { user },

            error: authError

        } = await supabase.auth.getUser();

        if (authError || !user) {

            return Response.json(

                {

                    success: false,

                    error:
                        authError?.message ||
                        "Unauthorized"

                },

                {

                    status: 401,
                    headers:corsHeaders

                }

            );

        }

        const userId = user.id;

        // ============================
        // DELETE WISHLIST
        // ============================

        await supabaseAdmin

            .from("wishlist")

            .delete()

            .eq("user_id", userId);

        // ============================
        // DELETE NOTIFICATIONS
        // ============================

        await supabaseAdmin

            .from("notifications")

            .delete()

            .eq("user_id", userId);

        // ============================
        // DELETE ACTIVITY LOG
        // ============================

        await supabaseAdmin

            .from("activity_log")

            .delete()

            .eq("user_id", userId);

        // ============================
        // DELETE SWAP REQUESTS
        // ============================

        await supabaseAdmin

            .from("swap_requests")

            .delete()

            .or(

                `owner_id.eq.${userId},requester_id.eq.${userId}`

            );

        // ============================
        // DELETE MESSAGES
        // ============================

        await supabaseAdmin

            .from("messages")

            .delete()

            .or(

                `sender_id.eq.${userId},receiver_id.eq.${userId}`

            );

        // ============================
        // DELETE BOOKS
        // ============================

        const {

            data: books,

            error: booksError

        } = await supabaseAdmin

            .from("books")

            .select("id")

            .eq("user_id", userId);

        if (booksError) {

            throw booksError;

        }

        if (books && books.length > 0) {

            for (const book of books) {

                await supabaseAdmin

                    .from("books")

                    .delete()

                    .eq("id", book.id);

            }

        }

        // ============================
        // DELETE PROFILE
        // ============================

        await deleteProfile(

            supabaseAdmin,

            userId

        );

        // ============================
        // DELETE AUTH USER
        // ============================

        const {

            error: deleteUserError

        } = await supabaseAdmin

            .auth

            .admin

            .deleteUser(userId);

        if (deleteUserError) {

            throw deleteUserError;

        }

        return Response.json(

            {

                success: true,

                message:
                    "Account deleted successfully."

            },
            {
                headers: corsHeaders
            }

        );

    }

    catch (err: any) {

        console.error(err);

        return Response.json(

            {

                success: false,

                error:
                    err.message ||
                    "Unexpected server error."

            },

            {

                status: 500,
                headers:corsHeaders

            }

        );

    }

});