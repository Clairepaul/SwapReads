import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

import { markBookSwapped } from "../_shared/books.ts";
import { createNotification } from "../_shared/notifications.ts";
import { createActivity } from "../_shared/activity.ts";
import { completeRequest } from "../_shared/swaps.ts";

export default {

    fetch: withSupabase(

        {

            auth: ["publishable", "secret"]

        },

        async (req, ctx) => {

            try {

                const { swapId } = await req.json();

                if (!swapId) {

                    return Response.json(

                        {

                            error: "Swap ID is required."

                        },

                        {

                            status: 400

                        }

                    );

                }

                // Get swap request

                const {

                    data: swap,

                    error

                } = await ctx.supabaseAdmin

                    .from("swap_requests")

                    .select(`

                        *,

                        books!book_id(

                            title

                        ),

                        offered_book:books!requester_book_id(

                            title

                        )

                    `)

                    .eq("id", swapId)

                    .single();

                if (error || !swap) {

                    return Response.json(

                        {

                            error: "Swap request not found."

                        },

                        {

                            status: 404

                        }

                    );

                }

                if (swap.status !== "accepted") {

                    return Response.json(

                        {

                            error: "Swap is not accepted."

                        },

                        {

                            status: 400

                        }

                    );

                }

                // Mark owner's book swapped

                await markBookSwapped(

                    ctx.supabaseAdmin,

                    swap.book_id

                );

                // Mark requester's book swapped

                await markBookSwapped(

                    ctx.supabaseAdmin,

                    swap.requester_book_id

                );

                // Complete request

                await completeRequest(

                    ctx.supabaseAdmin,

                    swap.id

                );

                // Notifications

                await createNotification(

                    ctx.supabaseAdmin,

                    swap.owner_id,

                    "Swap Completed",

                    `Congratulations! Your swap for "${swap.books.title}" has been completed.`,

                    swap.book_id

                );

                await createNotification(

                    ctx.supabaseAdmin,

                    swap.requester_id,

                    "Swap Completed",

                    `Congratulations! Your swap for "${swap.books.title}" has been completed.`,

                    swap.book_id

                );

                // Activity

                await createActivity(

                    ctx.supabaseAdmin,

                    swap.owner_id,

                    `Completed a swap for "${swap.books.title}".`

                );

                await createActivity(

                    ctx.supabaseAdmin,

                    swap.requester_id,

                    `Completed a swap for "${swap.books.title}".`

                );

                return Response.json({

                    success: true,

                    message: "Swap completed successfully."

                });

            }

            catch (err) {

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