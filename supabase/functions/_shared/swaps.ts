export async function completeRequest(

    supabaseAdmin: any,

    swapId: string

) {

    const { error } =
    await supabaseAdmin
    .from("swap_requests")
    .update({

        status: "completed",

        completed_at: new Date(),

        updated_at: new Date()

    })
    .eq("id", swapId);

    if (error) {

        throw new Error(error.message);

    }

}

export async function cancelRequest(

    supabaseAdmin:any,

    swapId:string

){

    const { error } =

    await supabaseAdmin

    .from("swap_requests")

    .update({

        status:"cancelled",

        updated_at:new Date()

    })

    .eq("id",swapId);

    if(error){

        throw new Error(error.message);

    }

}