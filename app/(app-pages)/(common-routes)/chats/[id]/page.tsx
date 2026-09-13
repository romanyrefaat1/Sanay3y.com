import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import ChatConversation from "@/components/chat/chat-conversation";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function ChatConversationPage({
    params,
}: PageProps) {
    const { id: jobId } = await params;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    /*
     * Load the job first.
     *
     * We need the status before deciding whether we should:
     * - create/get an active chat through the RPC
     * - or open an existing completed chat as read-only
     */
    const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select(
            `
            id,
            client_id,
            selected_craftsman_id,
            title,
            service_type,
            status,
            area,
            budget,
            requested_at,
            agreed_scheduled_at
            `,
        )
        .eq("id", jobId)
        .single();

    if (jobError || !job) {
        console.error(
            "Failed to load job:",
            jobError,
        );

        notFound();
    }

    /*
     * Only the client or selected craftsman can access
     * the conversation.
     */
    const isParticipant =
        user.id === job.client_id ||
        user.id === job.selected_craftsman_id;

    if (!isParticipant) {
        notFound();
    }

    let chatId: string | null = null;

    /*
     * Completed jobs are read-only.
     *
     * IMPORTANT:
     * Do NOT call get_or_create_job_chat here because we don't
     * want to create a new chat for a completed job.
     *
     * We only look for the chat that already existed.
     */
    if (job.status === "completed") {
        const { data: existingChat, error: existingChatError } =
            await supabase
                .from("chats")
                .select(
                    "id, job_id, client_id, craftsman_id, created_at, updated_at",
                )
                .eq("job_id", job.id)
                .eq("client_id", job.client_id)
                .eq(
                    "craftsman_id",
                    job.selected_craftsman_id!,
                )
                .maybeSingle();

        if (existingChatError) {
            console.error(
                "Failed to load completed job chat:",
                existingChatError,
            );

            notFound();
        }

        /*
         * A completed job can only be viewed if a chat already
         * existed while the job was active.
         */
        if (!existingChat) {
            notFound();
        }

        chatId = existingChat.id;
    } else {
        /*
         * For active jobs, use the existing RPC.
         *
         * This keeps your existing authorization + chat creation
         * logic for normal conversations.
         */
        const {
            data: createdOrExistingChatId,
            error: chatError,
        } = await supabase.rpc(
            "get_or_create_job_chat",
            {
                p_job_id: job.id,
            },
        );

        if (chatError || !createdOrExistingChatId) {
            console.error(
                "Failed to get/create job chat:",
                chatError,
            );

            notFound();
        }

        chatId = createdOrExistingChatId;
    }

    /*
     * Load the actual chat.
     */
    const {
        data: chat,
        error: chatLoadError,
    } = await supabase
        .from("chats")
        .select(
            "id, job_id, client_id, craftsman_id, created_at, updated_at",
        )
        .eq("id", chatId)
        .single();

    if (chatLoadError || !chat) {
        console.error(
            "Failed to load chat:",
            chatLoadError,
        );

        notFound();
    }

    /*
     * Make absolutely sure the authenticated user belongs
     * to this chat.
     */
    if (
        user.id !== chat.client_id &&
        user.id !== chat.craftsman_id
    ) {
        notFound();
    }

    const otherUserId =
        chat.client_id === user.id
            ? chat.craftsman_id
            : chat.client_id;

    const [
        { data: otherUser },
        { data: messages },
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select(
                "id, full_name, avatar_url",
            )
            .eq("id", otherUserId)
            .single(),

        supabase
            .from("messages")
            .select(
                "id, chat_id, sender_id, content, created_at",
            )
            .eq("chat_id", chat.id)
            .order("created_at", {
                ascending: true,
            }),
    ]);

    if (!otherUser) {
        notFound();
    }

    /*
     * Messages are allowed only while the job is being worked on
     * or while completion is waiting for confirmation.
     *
     * A completed chat remains visible but is read-only.
     */
    const canSend =
        job.status === "in_progress" ||
        job.status === "completion_requested";

    return (
        <ChatConversation
            chat={{
                id: chat.id,
                jobId: chat.job_id,
                clientId: chat.client_id,
                craftsmanId: chat.craftsman_id,
            }}
            currentUserId={user.id}
            otherUser={otherUser}
            job={{
                id: job.id,
                title: job.title,
                service_type: job.service_type,
                status: job.status,
                area: job.area,
                budget: job.budget,
                requested_at: job.requested_at,
                agreed_scheduled_at:
                    job.agreed_scheduled_at,
            }}
            initialMessages={messages ?? []}
            canSend={canSend}
        />
    );
}