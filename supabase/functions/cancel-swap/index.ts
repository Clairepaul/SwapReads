import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

import { markBookAvailable } from "../_shared/books.ts";
import { createNotification } from "../_shared/notifications.ts";
import { createActivity } from "../_shared/activity.ts";
import { cancelRequest } from "../_shared/swaps.ts";

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

                // Get swap

                const {

                    data: swap,

                    error

                } = await ctx.supabaseAdmin

                    .from("swap_requests")

                    .select(`
                        *,
                        books!book_id(
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

                // Return owner's book

                await markBookAvailable(

                    ctx.supabaseAdmin,

                    swap.book_id

                );

                // Cancel accepted request

                await cancelRequest(

                    ctx.supabaseAdmin,

                    swap.id

                );

                // Notify accepted requester

                await createNotification(

                    ctx.supabaseAdmin,

                    swap.requester_id,

                    "Swap Cancelled",

                    `Your swap for "${swap.books.title}" has been cancelled. The book is available again.`,

                    swap.book_id

                );

                await createActivity(

                    ctx.supabaseAdmin,

                    swap.owner_id,

                    `Cancelled swap for "${swap.books.title}".`

                );

                await createActivity(

                    ctx.supabaseAdmin,

                    swap.requester_id,

                    `Swap cancelled for "${swap.books.title}".`

                );

                // Reopen declined requests

                const {

                    data: declined

                } = await ctx.supabaseAdmin

                    .from("swap_requests")

                    .select("*")

                    .eq("book_id", swap.book_id)

                    .eq("status", "declined");

                if (declined) {

                    for (const item of declined) {

                        await ctx.supabaseAdmin

                            .from("swap_requests")

                            .update({

                                status: "pending"

                            })

                            .eq("id", item.id);

                        await createNotification(

                            ctx.supabaseAdmin,

                            item.requester_id,

                            "Book Available Again",

                            `"${swap.books.title}" is available again and your request has been reopened.`,

                            swap.book_id

                        );

                    }

                }

                return Response.json({

                    success: true,

                    message: "Swap cancelled successfully."

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