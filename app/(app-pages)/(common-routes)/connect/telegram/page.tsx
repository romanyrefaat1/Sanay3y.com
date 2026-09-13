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
        async function initialize() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

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

                if (profileError || !profile) {
                    throw new Error(
                        "تعذر تحديد نوع الحساب"
                    );
                }

                if (
                    profile.role !== "client" &&
                    profile.role !== "craftsman"
                ) {
                    throw new Error(
                        "نوع الحساب غير مدعوم"
                    );
                }

                setBotType(profile.role);

                const { data: connection } =
                    await supabase
                        .from("telegram_connections")
                        .select("id, is_active")
                        .eq("user_id", user.id)
                        .eq("bot_type", profile.role)
                        .eq("is_active", true)
                        .maybeSingle();

                if (connection) {
                    setConnected(true);
                }
            } catch (err) {
                console.error(err);

                setError(
                    err instanceof Error
                        ? err.message
                        : "حدث خطأ غير متوقع"
                );
            } finally {
                setLoading(false);
            }
        }

        initialize();
    }, []);

    useEffect(() => {
        if (!botType || connected) {
            return;
        }

        const interval = setInterval(async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                return;
            }

            const { data: connection } =
                await supabase
                    .from("telegram_connections")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("bot_type", botType)
                    .eq("is_active", true)
                    .maybeSingle();

            if (connection) {
                setConnected(true);
                setConnecting(false);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [botType, connected]);

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

            setTelegramUrl(data.url);

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
            <main className="min-h-screen flex items-center justify-center px-4">
                <Loader2 className="h-6 w-6 animate-spin" />
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-sm text-destructive">
                            {error}
                        </p>
                    </CardContent>
                </Card>
            </main>
        );
    }

    if (connected) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle2 className="h-7 w-7 text-green-500" />
                        </div>

                        <CardTitle>
                            تم ربط تيليجرام بنجاح
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-5 text-center">
                        <p className="text-sm text-muted-foreground">
                            حسابك متصل بتيليجرام. هنبعتلك
                            الإشعارات المهمة على البوت.
                        </p>

                        <Button asChild className="w-full">
                            <Link href="/dashboard">
                                العودة للوحة التحكم
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-10">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
                        <Send className="h-7 w-7 text-blue-500" />
                    </div>

                    <CardTitle className="text-xl">
                        اربط حسابك بتيليجرام
                    </CardTitle>

                    <p className="text-sm text-muted-foreground">
                        خليك متابع إشعارات صنايعي.كوم من
                        تيليجرام بسهولة.
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                <ShieldCheck className="h-5 w-5 text-blue-500" />
                            </div>

                            <div>
                                <p className="text-sm font-medium">
                                    1. افتح البوت
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    اضغط على الزر علشان تفتح
                                    البوت الخاص بحسابك.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                <Send className="h-5 w-5 text-blue-500" />
                            </div>

                            <div>
                                <p className="text-sm font-medium">
                                    2. اضغط Start
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    تيليجرام هيكمل عملية الربط
                                    تلقائيًا.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                            </div>

                            <div>
                                <p className="text-sm font-medium">
                                    3. تم الربط
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    الصفحة هتتحدث تلقائيًا بعد
                                    نجاح الربط.
                                </p>
                            </div>
                        </div>
                    </div>

                    {telegramUrl && (
                        <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                            <p className="text-xs text-muted-foreground">
                                لو تيليجرام ما فتحش تلقائيًا،
                                استخدم الزر مرة تانية.
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="w-full"
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
                                {telegramUrl
                                    ? "فتح تيليجرام"
                                    : "ربط تيليجرام"}
                            </>
                        )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                        مش هنطلب منك كلمة سر تيليجرام أو أي
                        بيانات حساسة.
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}