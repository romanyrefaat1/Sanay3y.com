import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ChatInbox from "@/components/chat/chat-inbox";

export default async function ChatPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: chats, error } = await supabase
        .from("chats")
        .select(
            "id, job_id, client_id, craftsman_id, created_at, updated_at",
        )
        .or(
            `client_id.eq.${user.id},craftsman_id.eq.${user.id}`,
        )
        .order("updated_at", {
            ascending: false,
        });

    if (error) {
        console.error(
            "Failed to load chats:",
            error,
        );

        return (
            <div
                dir="rtl"
                className="mx-auto w-full max-w-5xl px-4 py-6"
            >
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
                    <h1 className="font-semibold text-destructive">
                        تعذر تحميل الرسائل
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        حصلت مشكلة أثناء تحميل المحادثات. حاول
                        مرة تانية.
                    </p>
                </div>
            </div>
        );
    }

    if (!chats || chats.length === 0) {
        return (
            <ChatInbox
                initialChats={[]}
                currentUserId={user.id}
            />
        );
    }

    const jobIds = [
        ...new Set(chats.map((chat) => chat.job_id)),
    ];

    const otherUserIds = [
        ...new Set(
            chats.map((chat) =>
                chat.client_id === user.id
                    ? chat.craftsman_id
                    : chat.client_id,
            ),
        ),
    ];

    const [
        { data: jobs, error: jobsError },
        { data: profiles, error: profilesError },
        { data: messages, error: messagesError },
    ] = await Promise.all([
        supabase
            .from("jobs")
            .select(
                "id, title, service_type, status, area",
            )
            .in("id", jobIds),

        supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", otherUserIds),

        supabase
            .from("messages")
            .select(
                "id, chat_id, sender_id, content, created_at",
            )
            .in(
                "chat_id",
                chats.map((chat) => chat.id),
            )
            .order("created_at", {
                ascending: false,
            }),
    ]);

    if (
        jobsError ||
        profilesError ||
        messagesError
    ) {
        console.error(
            "Failed to load chat metadata:",
            {
                jobsError,
                profilesError,
                messagesError,
            },
        );
    }

    const jobsMap = new Map(
        (jobs ?? []).map((job) => [
            job.id,
            job,
        ]),
    );

    const profilesMap = new Map(
        (profiles ?? []).map((profile) => [
            profile.id,
            profile,
        ]),
    );

    const latestMessageMap = new Map<
        string,
        {
            id: string;
            chat_id: string;
            sender_id: string;
            content: string;
            created_at: string;
        }
    >();

    for (const message of messages ?? []) {
        if (
            !latestMessageMap.has(
                message.chat_id,
            )
        ) {
            latestMessageMap.set(
                message.chat_id,
                message,
            );
        }
    }

    const initialChats = chats.map((chat) => {
        const otherUserId =
            chat.client_id === user.id
                ? chat.craftsman_id
                : chat.client_id;

        return {
            id: chat.id,
            job_id: chat.job_id,
            created_at: chat.created_at,
            updated_at: chat.updated_at,

            job:
                jobsMap.get(chat.job_id) ??
                null,

            otherUser:
                profilesMap.get(
                    otherUserId,
                ) ?? null,

            latestMessage:
                latestMessageMap.get(
                    chat.id,
                ) ?? null,
        };
    });

    return (
        <ChatInbox
            initialChats={initialChats}
            currentUserId={user.id}
        />
    );
}