"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    CheckCircle2,
    ExternalLink,
    Loader2,
    Send,
    ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type BotType = "client" | "craftsman";

export default function TelegramConnectionPage() {
    const [botType, setBotType] = useState<BotType | null>(null);
    const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function initialize() {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (cancelled) return;

            if (!user) {
                window.location.href = "/client/auth/sign-up";
                return;
            }

            const { data: profile, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

            if (cancelled) return;

            if (profileError || !profile) {
                throw new Error("تعذر تحديد نوع الحساب");
            }

            if (
                profile.role !== "client" &&
                profile.role !== "craftsman"
            ) {
                throw new Error("نوع الحساب غير مدعوم");
            }

            const currentBotType = profile.role as BotType;

            setBotType(currentBotType);

            const { data: connection, error: connectionError } =
                await supabase
                    .from("telegram_connections")
                    .select("id, is_active")
                    .eq("user_id", user.id)
                    .eq("bot_type", currentBotType)
                    .eq("is_active", true)
                    .maybeSingle();

            if (cancelled) return;

            if (connectionError) {
                throw connectionError;
            }

            if (connection) {
                setConnected(true);
                setLoading(false);
                return;
            }

            /*
             * The connection does not exist yet.
             * Listen for the Telegram webhook creating it.
             */
            const newChannel = supabase.channel(
                `telegram-connection-${user.id}`
            );

            channel = newChannel;

            newChannel.on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "telegram_connections",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (cancelled) return;

                    const record = payload.new as {
                        user_id?: string;
                        bot_type?: BotType;
                        is_active?: boolean;
                    };

                    if (
                        record.user_id === user.id &&
                        record.bot_type === currentBotType &&
                        record.is_active === true
                    ) {
                        setConnected(true);
                        setConnecting(false);
                    }
                }
            );

            if (cancelled) {
                await supabase.removeChannel(newChannel);
                return;
            }

            newChannel.subscribe((status) => {
                if (cancelled) return;

                console.log(
                    "Telegram realtime status:",
                    status
                );
            });

            setLoading(false);
        } catch (err) {
            if (cancelled) return;

            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "حدث خطأ غير متوقع"
            );

            setLoading(false);
        }
    }

    initialize();

    return () => {
        cancelled = true;

        if (channel) {
            supabase.removeChannel(channel);
            channel = null;
        }
    };
}, [supabase]);

    const handleConnect = async () => {
        if (!botType) {
            return;
        }

        setConnecting(true);
        setError(null);

        try {
            const response = await fetch(
                "/api/telegram/connect",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        botType,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                        "تعذر إنشاء رابط تيليجرام"
                );
            }

            // Already connected.
            if (data.alreadyConnected) {
                setConnected(true);
                setConnecting(false);
                return;
            }

            setTelegramUrl(data.url);

            // Try opening Telegram automatically.
            window.open(
                data.url,
                "_blank",
                "noopener,noreferrer"
            );
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : "حدث خطأ أثناء ربط تيليجرام"
            );

            setConnecting(false);
        }
    };

    if (loading) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
                بنجهز رابط تيليجرام...
            </p>
        </main>
    );
}

if (error) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                    <X className="h-6 w-6 text-destructive" />
                </div>

                <p className="text-sm font-medium text-foreground">
                    حصلت مشكلة في ربط تيليجرام
                </p>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {error}
                </p>

                <div className="mt-6 flex flex-col gap-2">
                    <Button onClick={() => window.location.reload()}>
                        حاول مرة أخرى
                    </Button>

                    <Button variant="ghost" asChild>
                        <Link href="/dashboard">العودة للوحة التحكم</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}

if (connected) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 animate-success-pop">
                    <CheckCircle2 className="h-7 w-7 text-success animate-success-check" />
                </div>

                <h1 className="text-2xl">تم ربط تيليجرام بنجاح</h1>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    حسابك متصل بتيليجرام. هنبعتلك الإشعارات المهمة على البوت.
                </p>

                <Button asChild className="mt-6 w-full">
                    <Link href="/dashboard">العودة للوحة التحكم</Link>
                </Button>
            </div>
        </main>
    );
}

return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Send className="h-7 w-7 text-primary" />
                </div>

                <h1 className="text-2xl">اربط حسابك بتيليجرام</h1>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    خليك متابع إشعارات صنايعي.كوم من تيليجرام بسهولة.
                </p>
            </div>

            <ol className="relative mt-8">
                <span
                    aria-hidden="true"
                    className="absolute start-4 top-4 bottom-4 w-px bg-border"
                />

                <li className="relative flex gap-4 pb-6">
                    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
                        1
                    </span>
                    <div className="pt-1">
                        <p className="text-sm font-medium text-foreground">
                            افتح البوت
                        </p>
                        <p className="text-xs text-muted-foreground">
                            اضغط على الزر علشان تفتح البوت الخاص بحسابك.
                        </p>
                    </div>
                </li>

                <li className="relative flex gap-4 pb-6">
                    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
                        2
                    </span>
                    <div className="pt-1">
                        <p className="text-sm font-medium text-foreground">
                            اضغط Start او زر البدأ
                        </p>
                        <p className="text-xs text-muted-foreground">
                            تيليجرام هيكمل عملية الربط تلقائيًا.
                        </p>
                    </div>
                </li>

                <li className="relative flex gap-4">
                    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
                        3
                    </span>
                    <div className="pt-1">
                        <p className="text-sm font-medium text-foreground">
                            تم الربط
                        </p>
                        <p className="text-xs text-muted-foreground">
                            الصفحة هتتحدث تلقائيًا بعد نجاح الربط.
                        </p>
                    </div>
                </li>
            </ol>

            {telegramUrl && (
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    لو تيليجرام ما فتحش تلقائيًا، اضغط الزر مرة تانية.
                </p>
            )}

            <Button
                onClick={handleConnect}
                disabled={connecting}
                className="mt-6 w-full"
                size="lg"
            >
                {connecting ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جاري فتح تيليجرام...
                    </>
                ) : (
                    <>
                        <ExternalLink className="h-4 w-4" />
                        {telegramUrl ? "فتح تيليجرام" : "ربط تيليجرام"}
                    </>
                )}
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
                مش هنطلب منك كلمة سر تيليجرام أو أي بيانات حساسة.
            </p>
        </div>
    </main>
);
}