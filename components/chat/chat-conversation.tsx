"use client";

import Link from "next/link";
import {
    ArrowRight,
    BriefcaseBusiness,
    CheckCircle2,
    ChevronLeft,
    Loader2,
    MapPin,
    MessageSquare,
    MoreVertical,
    Send,
    UserRound,
} from "lucide-react";
import {
    FormEvent,
    useEffect,
    useRef,
    useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type Message = {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    created_at: string;
};

type ChatConversationProps = {
    chat: {
        id: string;
        jobId: string;
        clientId: string;
        craftsmanId: string;
    };

    currentUserId: string;

    otherUser: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    };

    job: {
        id: string;
        title: string;
        service_type: string;
        status: string;
        area: string;
        budget: number;
    };

    initialMessages: Message[];

    canSend: boolean;
};

const statusConfig: Record<
    string,
    {
        label: string;
        className: string;
    }
> = {
    in_progress: {
        label: "قيد التنفيذ",
        className:
            "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    },

    completion_requested: {
        label: "في انتظار تأكيد الإكمال",
        className:
            "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },

    completed: {
        label: "مكتملة",
        className:
            "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    },

    cancelled: {
        label: "ملغاة",
        className:
            "border-destructive/20 bg-destructive/10 text-destructive",
    },
};

const formatTime = (date: string) =>
    new Intl.DateTimeFormat("ar-EG", {
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(date));

const formatDate = (date: string) =>
    new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "long",
    }).format(new Date(date));

const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("");

export default function ChatConversation({
    chat,
    currentUserId,
    otherUser,
    job,
    initialMessages,
    canSend: initialCanSend,
}: ChatConversationProps) {
    const [messages, setMessages] =
        useState<Message[]>(initialMessages);

    const [message, setMessage] = useState("");

    const [isSending, setIsSending] =
        useState(false);

    const [sendError, setSendError] =
        useState<string | null>(null);

    const [canSend, setCanSend] =
        useState(initialCanSend);

    const bottomRef =
        useRef<HTMLDivElement | null>(null);

    const textareaRef =
        useRef<HTMLTextAreaElement | null>(null);

    const supabaseRef = useRef(
        createClient(),
    );

    const status =
        statusConfig[job.status] ?? null;

    const isOwn = (senderId: string) =>
        senderId === currentUserId;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages.length]);

    useEffect(() => {
        const supabase =
            supabaseRef.current;

        const channel = supabase
            .channel(`chat:${chat.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `chat_id=eq.${chat.id}`,
                },
                (payload) => {
                    const incoming =
                        payload.new as Message;

                    setMessages((current) => {
                        if (
                            current.some(
                                (item) =>
                                    item.id ===
                                    incoming.id,
                            )
                        ) {
                            return current;
                        }

                        return [
                            ...current,
                            incoming,
                        ];
                    });
                },
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(
                channel,
            );
        };
    }, [chat.id]);

    useEffect(() => {
        const handleJobUpdate =
            async () => {
                const supabase =
                    supabaseRef.current;

                const { data } =
                    await supabase
                        .from("jobs")
                        .select("status")
                        .eq("id", job.id)
                        .single();

                if (!data) {
                    return;
                }

                setCanSend(
                    data.status ===
                        "in_progress" ||
                        data.status ===
                            "completion_requested",
                );
            };

        void handleJobUpdate();
    }, [job.id]);

    function handleTextareaKeyDown(
        event: React.KeyboardEvent<HTMLTextAreaElement>,
    ) {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();

            event.currentTarget.form?.requestSubmit();
        }
    }

    async function handleSend(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const content = message.trim();

        if (
            !content ||
            isSending ||
            !canSend
        ) {
            return;
        }

        try {
            setIsSending(true);
            setSendError(null);

            const supabase =
                supabaseRef.current;

            const {
                data: newMessage,
                error,
            } = await supabase
                .from("messages")
                .insert({
                    chat_id: chat.id,
                    sender_id: currentUserId,
                    content,
                })
                .select(
                    "id, chat_id, sender_id, content, created_at",
                )
                .single();

            if (error) {
                throw error;
            }

            if (newMessage) {
                setMessages((current) => {
                    if (
                        current.some(
                            (item) =>
                                item.id ===
                                newMessage.id,
                        )
                    ) {
                        return current;
                    }

                    return [
                        ...current,
                        newMessage as Message,
                    ];
                });
            }

            setMessage("");

            requestAnimationFrame(() => {
                textareaRef.current?.focus();
            });
        } catch (error) {
            console.error(
                "Failed to send message:",
                error,
            );

            setSendError(
                "الرسالة ما اتبعتتش. حاول تاني.",
            );
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div
            dir="rtl"
            className="mx-auto flex h-[calc(100dvh-64px)] w-full max-w-[1500px] flex-col px-0 sm:px-4 lg:px-6"
        >
            <div className="flex min-h-0 flex-1 overflow-hidden border-x bg-background shadow-sm sm:my-4 sm:rounded-xl sm:border">
                {/* Conversation */}
                <div className="flex min-w-0 flex-1 flex-col">
                    {/* Top navigation */}
                    <header className="shrink-0 border-b bg-background">
                        <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                            >
                                <Link href="/chats">
                                    <ArrowRight className="size-5" />
                                </Link>
                            </Button>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h1 className="truncate font-semibold">
                                        الرسائل
                                    </h1>

                                    <span className="hidden text-muted-foreground sm:inline">
                                        /
                                    </span>

                                    <span className="hidden truncate text-sm text-muted-foreground sm:inline">
                                        {job.title}
                                    </span>
                                </div>
                            </div>

                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="hidden gap-2 sm:inline-flex"
                            >
                                <Link
                                    href={`/jobs/${job.id}`}
                                >
                                    <BriefcaseBusiness className="size-4" />
                                    الشغلانة
                                </Link>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                    >
                                        <MoreVertical className="size-5" />
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    dir="rtl"
                                    className="w-52"
                                >
                                    <DropdownMenuItem
                                        asChild
                                    >
                                        <Link
                                            href={`/jobs/${job.id}`}
                                        >
                                            <BriefcaseBusiness />
                                            فتح الشغلانة
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        asChild
                                    >
                                        <Link
                                            href={`/profile/${otherUser.id}`}
                                        >
                                            <UserRound />
                                            عرض الملف
                                        </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        asChild
                                    >
                                        <Link href="/chats">
                                            <MessageSquare />
                                            كل الرسائل
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* Conversation identity */}
                    <div className="shrink-0 border-b bg-muted/20">
                        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
                            <Avatar className="size-11 shrink-0 border">
                                <AvatarImage
                                    src={
                                        otherUser.avatar_url ??
                                        undefined
                                    }
                                />

                                <AvatarFallback className="text-sm font-semibold">
                                    {getInitials(
                                        otherUser.full_name,
                                    )}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Link
                                        href={`/profile/${otherUser.id}`}
                                        className="truncate font-semibold hover:underline"
                                    >
                                        {
                                            otherUser.full_name
                                        }
                                    </Link>

                                    {status && (
                                        <Badge
                                            variant="outline"
                                            className={status.className}
                                        >
                                            {
                                                status.label
                                            }
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <Link
                                        href={`/jobs/${job.id}`}
                                        className="truncate hover:text-foreground hover:underline"
                                    >
                                        {job.title}
                                    </Link>

                                    <span className="hidden items-center gap-1.5 md:inline-flex">
                                        <MapPin className="size-3.5" />
                                        {job.area}
                                    </span>

                                    <span className="hidden md:inline">
                                        {Number(
                                            job.budget,
                                        ).toLocaleString(
                                            "ar-EG",
                                        )}{" "}
                                        جنيه
                                    </span>
                                </div>
                            </div>

                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="hidden gap-1.5 text-muted-foreground lg:inline-flex"
                            >
                                <Link
                                    href={`/profile/${otherUser.id}`}
                                >
                                    الملف
                                    <ChevronLeft className="size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20">
                        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-3 py-6 sm:px-6">
                            {messages.length ===
                            0 ? (
                                <div className="flex flex-1 items-center justify-center py-16">
                                    <div className="max-w-md text-center">
                                        <div className="mx-auto flex size-16 items-center justify-center rounded-full border bg-background shadow-sm">
                                            <MessageSquare className="size-7 text-primary" />
                                        </div>

                                        <h2 className="mt-5 text-xl font-bold">
                                            ابدأ المحادثة
                                        </h2>

                                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                                            اتفقوا على التفاصيل،
                                            اسأل عن أي حاجة،
                                            وخلي كل التواصل
                                            الخاص بالشغلانة
                                            هنا.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mx-auto flex w-full max-w-3xl flex-col gap-1">
                                    <div className="mb-6 flex justify-center">
                                        <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                                            {formatDate(
                                                messages[0]
                                                    .created_at,
                                            )}
                                        </span>
                                    </div>

                                    {messages.map(
                                        (item, index) => {
                                            const own =
                                                isOwn(
                                                    item.sender_id,
                                                );

                                            const previous =
                                                messages[
                                                    index -
                                                        1
                                                ];

                                            const sameSender =
                                                previous &&
                                                previous.sender_id ===
                                                    item.sender_id;

                                            return (
                                                <div
                                                    key={
                                                        item.id
                                                    }
                                                    className={`flex ${
                                                        own
                                                            ? "justify-start"
                                                            : "justify-end"
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex max-w-[88%] flex-col ${
                                                            own
                                                                ? "items-start"
                                                                : "items-end"
                                                        } sm:max-w-[72%]`}
                                                    >
                                                        <div
                                                            className={`px-4 py-3 ${
                                                                own
                                                                    ? `bg-primary text-primary-foreground ${
                                                                          sameSender
                                                                              ? "rounded-xl"
                                                                              : "rounded-xl rounded-tr-sm"
                                                                      }`
                                                                    : `border bg-background shadow-sm ${
                                                                          sameSender
                                                                              ? "rounded-xl"
                                                                              : "rounded-xl rounded-tl-sm"
                                                                      }`
                                                            }`}
                                                        >
                                                            <p className="whitespace-pre-wrap break-words text-[15px] leading-7">
                                                                {
                                                                    item.content
                                                                }
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={`mt-1 px-1 text-[11px] text-muted-foreground ${
                                                                own
                                                                    ? "text-right"
                                                                    : "text-left"
                                                            }`}
                                                        >
                                                            {formatTime(
                                                                item.created_at,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}

                                    <div
                                        ref={
                                            bottomRef
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Composer */}
                    <div className="shrink-0 border-t bg-background">
                        <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-4">
                            {!canSend ? (
                                <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background">
                                        <CheckCircle2 className="size-5 text-muted-foreground" />
                                    </div>

                                    <div>
                                        <p className="font-semibold">
                                            المحادثة مقفولة
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            {job.status ===
                                            "completed"
                                                ? "الشغلانة اكتملت، لذلك لم يعد إرسال رسائل جديدة متاحًا."
                                                : "الشغلانة اتقفلت، لذلك لم يعد إرسال رسائل جديدة متاحًا."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    onSubmit={
                                        handleSend
                                    }
                                    className="mx-auto max-w-4xl"
                                >
                                    {sendError && (
                                        <div className="mb-2 text-sm font-medium text-destructive">
                                            {
                                                sendError
                                            }
                                        </div>
                                    )}

                                    <div className="flex items-end gap-2 rounded-xl border bg-muted/20 p-2 shadow-sm">
                                        <Textarea
                                            ref={
                                                textareaRef
                                            }
                                            value={
                                                message
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setMessage(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            onKeyDown={
                                                handleTextareaKeyDown
                                            }
                                            placeholder="اكتب رسالتك..."
                                            rows={1}
                                            maxLength={
                                                5000
                                            }
                                            disabled={
                                                isSending
                                            }
                                            className="max-h-32 min-h-11 resize-none border-0 bg-transparent px-2 py-2.5 shadow-none focus-visible:ring-0"
                                        />

                                        <Button
                                            type="submit"
                                            size="icon"
                                            className="size-11 shrink-0"
                                            disabled={
                                                isSending ||
                                                !message.trim()
                                            }
                                            aria-label="إرسال الرسالة"
                                        >
                                            {isSending ? (
                                                <Loader2 className="size-5 animate-spin" />
                                            ) : (
                                                <Send className="size-5" />
                                            )}
                                        </Button>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between px-1">
                                        <p className="text-xs text-muted-foreground">
                                            Enter للإرسال ·
                                            Shift + Enter لسطر
                                            جديد
                                        </p>

                                        <p className="text-xs tabular-nums text-muted-foreground">
                                            {message.length.toLocaleString(
                                                "ar-EG",
                                            )}
                                            /٥٠٠٠
                                        </p>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop context sidebar */}
                <aside className="hidden w-[300px] shrink-0 border-r bg-background xl:block">
                    <div className="sticky top-0 flex h-full flex-col">
                        <div className="border-b px-5 py-5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                تفاصيل الشغلانة
                            </p>

                            <h2 className="mt-2 text-lg font-bold leading-7">
                                {job.title}
                            </h2>

                            {status && (
                                <Badge
                                    variant="outline"
                                    className={`mt-3 ${status.className}`}
                                >
                                    {status.label}
                                </Badge>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {/* Person */}
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground">
                                    تتكلم مع
                                </p>

                                <div className="mt-3 flex items-center gap-3">
                                    <Avatar className="size-11 border">
                                        <AvatarImage
                                            src={
                                                otherUser.avatar_url ??
                                                undefined
                                            }
                                        />

                                        <AvatarFallback>
                                            {getInitials(
                                                otherUser.full_name,
                                            )}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="min-w-0">
                                        <p className="truncate font-semibold">
                                            {
                                                otherUser.full_name
                                            }
                                        </p>

                                        <Link
                                            href={`/profile/${otherUser.id}`}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            عرض الملف
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-6" />

                            {/* Job details */}
                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        نوع الخدمة
                                    </p>

                                    <p className="mt-1 font-medium">
                                        {
                                            job.service_type
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        المنطقة
                                    </p>

                                    <p className="mt-1 flex items-center gap-1.5 font-medium">
                                        <MapPin className="size-4 text-muted-foreground" />
                                        {job.area}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        الميزانية
                                    </p>

                                    <p className="mt-1 text-lg font-bold">
                                        {Number(
                                            job.budget,
                                        ).toLocaleString(
                                            "ar-EG",
                                        )}{" "}
                                        جنيه
                                    </p>
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <Button
                                asChild
                                variant="outline"
                                className="w-full gap-2"
                            >
                                <Link
                                    href={`/jobs/${job.id}`}
                                >
                                    <BriefcaseBusiness className="size-4" />
                                    فتح تفاصيل الشغلانة
                                </Link>
                            </Button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}