"use client";

import Link from "next/link";
import {
    BriefcaseBusiness,
    ChevronLeft,
    MessageSquare,
    Search,
    UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { TelegramConnectAlert } from "../connect-telegram-alert";

type ChatItem = {
    id: string;
    job_id: string;
    created_at: string;
    updated_at: string;

    job: {
        id: string;
        title: string;
        service_type: string;
        status: string;
        area: string;
    } | null;

    otherUser: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    } | null;

    latestMessage: {
        id: string;
        chat_id: string;
        sender_id: string;
        content: string;
        created_at: string;
    } | null;
};

type ChatInboxProps = {
    initialChats: ChatItem[];
    currentUserId: string;
};

const jobStatusConfig: Record<
    string,
    {
        label: string;
        className: string;
    }
> = {
    in_progress: {
        label: "قيد التنفيذ",
        className:
            "border-blue-500/20 bg-blue-500/10 text-blue-700",
    },

    completion_requested: {
        label: "في انتظار التأكيد",
        className:
            "border-amber-500/20 bg-amber-500/10 text-amber-700",
    },

    completed: {
        label: "مكتملة",
        className:
            "border-green-500/20 bg-green-500/10 text-green-700",
    },

    cancelled: {
        label: "ملغاة",
        className:
            "border-destructive/20 bg-destructive/10 text-destructive",
    },
};

const formatTime = (date: string) => {
    return new Intl.DateTimeFormat(
        "ar-EG",
        {
            hour: "numeric",
            minute: "2-digit",
        },
    ).format(new Date(date));
};

const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(
        "ar-EG",
        {
            dateStyle: "medium",
        },
    ).format(new Date(date));
};

const getInitials = (name: string) => {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("");
};

export default function ChatInbox({
    initialChats,
}: ChatInboxProps) {
    const [search, setSearch] =
        useState("");

    const filteredChats = useMemo(() => {
        const query =
            search.trim().toLocaleLowerCase();

        if (!query) {
            return initialChats;
        }

        return initialChats.filter(
            (chat) => {
                const name =
                    chat.otherUser?.full_name ??
                    "";

                const title =
                    chat.job?.title ?? "";

                return (
                    name
                        .toLocaleLowerCase()
                        .includes(query) ||
                    title
                        .toLocaleLowerCase()
                        .includes(query)
                );
            },
        );
    }, [initialChats, search]);

    return (
        <div
            className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6"
        >
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <MessageSquare className="size-6" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold">
                            الرسائل
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            كل محادثات الشغلانات في مكان واحد.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search */}
            {initialChats.length > 0 && (
                <div className="mb-5">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value,
                                )
                            }
                            placeholder="دور على محادثة أو اسم صنايعي..."
                            className="h-11 pr-10"
                        />
                    </div>
                </div>
            )}

                <TelegramConnectAlert />

            {/* Empty */}
            {initialChats.length === 0 ? (
                <Card>
                    <CardContent className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <MessageSquare className="size-8" />
                        </div>

                        <h2 className="mt-5 text-xl font-bold">
                            مفيش رسائل لسه
                        </h2>

                        <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                            لما يتم اختيار صنايعي وتبدأ الشغلانة،
                            هتقدروا تتواصلوا هنا مباشرة.
                        </p>

                        <Button
                            asChild
                            className="mt-6 gap-2"
                        >
                            <Link href="/craftsman/find">
                                <BriefcaseBusiness className="size-4" />
                                شوف الشغلانات
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : filteredChats.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Search className="mx-auto size-7 text-muted-foreground" />

                        <p className="mt-3 font-semibold">
                            مفيش نتائج
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            جرب اسم مختلف أو كلمة تانية.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <CardHeader className="border-b bg-muted/20 px-4 py-3 sm:px-5">
                        <p className="text-sm font-medium text-muted-foreground">
                            {filteredChats.length}{" "}
                            {filteredChats.length === 1
                                ? "محادثة"
                                : "محادثات"}
                        </p>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div>
                            {filteredChats.map(
                                (chat, index) => {
                                    const status =
                                        chat.job
                                            ? jobStatusConfig[
                                                  chat
                                                      .job
                                                      .status
                                              ]
                                            : null;

                                    return (
                                        <div
                                            key={
                                                chat.id
                                            }
                                        >
                                            <Link
                                                href={`/chats/${chat.job_id}`}
                                                className="group block px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-12 shrink-0">
                                                        <AvatarImage
                                                            src={
                                                                chat
                                                                    .otherUser
                                                                    ?.avatar_url ??
                                                                undefined
                                                            }
                                                        />

                                                        <AvatarFallback>
                                                            {chat
                                                                .otherUser
                                                                ?.full_name
                                                                ? getInitials(
                                                                      chat
                                                                          .otherUser
                                                                          .full_name,
                                                                  )
                                                                : "؟"}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="truncate font-semibold">
                                                                    {chat
                                                                        .otherUser
                                                                        ?.full_name ??
                                                                        "مستخدم"}
                                                                </p>

                                                                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                                                    {chat
                                                                        .job
                                                                        ?.title ??
                                                                        "شغلانة"}
                                                                </p>
                                                            </div>

                                                            {chat.latestMessage && (
                                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                                    {formatTime(
                                                                        chat
                                                                            .latestMessage
                                                                            .created_at,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="mt-2 flex items-center gap-2">
                                                            {status && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`shrink-0 ${status.className}`}
                                                                >
                                                                    {
                                                                        status.label
                                                                    }
                                                                </Badge>
                                                            )}

                                                            <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                                                                {chat
                                                                    .latestMessage
                                                                    ?.content ??
                                                                    "ابدأ المحادثة..."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <ChevronLeft className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                                                </div>
                                            </Link>

                                            {index <
                                                filteredChats.length -
                                                    1 && (
                                                <Separator />
                                            )}
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}