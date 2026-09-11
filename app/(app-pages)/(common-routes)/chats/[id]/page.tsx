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
     * The route uses the JOB ID.
     *
     * This RPC:
     * - checks that the job exists
     * - checks that messaging is allowed
     * - checks that the current user is a participant
     * - creates the chat if it doesn't exist
     * - returns the chat ID
     */
    console.log("jobId", jobId)
    const {
        data: chatId,
        error: chatError,
    } = await supabase.rpc(
        "get_or_create_job_chat",
        {
            p_job_id: jobId,
        },
    );

    if (chatError || !chatId) {
        console.error(
            "Failed to get/create job chat:",
            chatError,
        );

        notFound();
    }

    /*
     * Now load the chat.
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
     * Make absolutely sure the authenticated user
     * belongs to this chat.
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
        { data: job },
        { data: otherUser },
        { data: messages },
    ] = await Promise.all([
        supabase
            .from("jobs")
            .select(
                "id, title, service_type, status, area, budget",
            )
            .eq("id", chat.job_id)
            .single(),

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

    if (!job || !otherUser) {
        notFound();
    }

    const canSend =
        job.status === "in_progress" ||
        job.status ===
            "completion_requested";

    return (
        <ChatConversation
            chat={{
                id: chat.id,
                jobId: chat.job_id,
                clientId: chat.client_id,
                craftsmanId:
                    chat.craftsman_id,
            }}
            currentUserId={user.id}
            otherUser={otherUser}
            job={job}
            initialMessages={messages ?? []}
            canSend={canSend}
        />
    );
}