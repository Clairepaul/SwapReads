import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

import { deleteProfile } from "../_shared/profile.ts";

export default {

    fetch: withSupabase(

        {

            auth: ["publishable", "secret"]

        },

        async (req, ctx) => {

            try {

                const {

                    data: {

                        user

                    }

                } =
                await ctx.supabase.auth.getUser();

                if (!user) {

                    return Response.json(

                        {

                            error: "Unauthorized"

                        },

                        {

                            status: 401

                        }

                    );

                }

                const userId = user.id;

                // Wishlist

                await ctx.supabaseAdmin

                    .from("wishlist")

                    .delete()

                    .eq("user_id", userId);

                // Notifications

                await ctx.supabaseAdmin

                    .from("notifications")

                    .delete()

                    .eq("user_id", userId);

                // Activity

                await ctx.supabaseAdmin

                    .from("activity_log")

                    .delete()

                    .eq("user_id", userId);

                // Swap requests

                await ctx.supabaseAdmin

                    .from("swap_requests")

                    .delete()

                    .or(

                        `owner_id.eq.${userId},requester_id.eq.${userId}`

                    );

                // Messages

                await ctx.supabaseAdmin

                    .from("messages")

                    .delete()

                    .or(

                        `sender_id.eq.${userId},receiver_id.eq.${userId}`

                    );

                // Books

                const {

                    data: books

                } =
                await ctx.supabaseAdmin

                    .from("books")

                    .select("*")

                    .eq("user_id", userId);

                if (books) {

                    for (const book of books) {

                        await ctx.supabaseAdmin

                            .from("books")

                            .delete()

                            .eq("id", book.id);

                    }

                }

                // Profile

                await deleteProfile(

                    ctx.supabaseAdmin,

                    userId

                );

                // Auth user

                await ctx.supabaseAdmin

                    .auth

                    .admin

                    .deleteUser(

                        userId

                    );

                return Response.json({

                    success: true,

                    message:

                    "Account deleted successfully."

                });

            }

            catch (err: any) {

                return Response.json(

                    {

                        success: false,

                        error: err.message

                    },

                    {

                        status: 500

                    }

                );

            }

        }

    )

};