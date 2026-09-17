"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BadgeCheck,
    BriefcaseBusiness,
    Check,
    Edit3,
    MapPin,
    MessageSquare,
    Phone,
    Search,
    Star,
    UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/contexts/user-context";
import { createClient } from "@/lib/supabase/client";
import { TelegramConnectAlert } from "@/components/connect-telegram-alert";

type JobStats = {
    total: number;
    completed: number;
};

type VerificationStatus = "pending" | "verified" | "rejected";

export default function CraftsmanDashboardIndex() {
    const {
        profile,
        craftsmanProfile: craftsman,
        onboardingSteps,
        completedSteps,
        onboardingPercentage,
        isLoading,
    } = useUser();

    const [jobStats, setJobStats] = useState<JobStats>({
        total: 0,
        completed: 0,
    });

    const [isStatsLoading, setIsStatsLoading] = useState(true);

    const verificationText: Record<VerificationStatus, string> = {
        pending: "قيد التوثيق",
        verified: "حساب موثق",
        rejected: "التوثيق مرفوض",
    };

    useEffect(() => {
        if (!profile?.id || profile.role !== "craftsman") {
            setIsStatsLoading(false);
            return;
        }

        let cancelled = false;

        const fetchJobStats = async () => {
            setIsStatsLoading(true);

            const supabase = createClient();

            const { data, error } = await supabase
                .from("jobs")
                .select("id, status")
                .eq("selected_craftsman_id", profile.id);

            if (cancelled) {
                return;
            }

            if (error) {
                console.error(
                    "Failed to fetch craftsman job stats:",
                    error,
                );

                setJobStats({
                    total: 0,
                    completed: 0,
                });

                setIsStatsLoading(false);
                return;
            }

            const jobs = data ?? [];

            const completedJobs = jobs.filter(
                (job) => job.status === "completed",
            );

            setJobStats({
                total: jobs.length,
                completed: completedJobs.length,
            });

            setIsStatsLoading(false);
        };

        fetchJobStats();

        return () => {
            cancelled = true;
        };
    }, [profile?.id, profile?.role]);

    const completionRate =
        jobStats.total > 0
            ? Math.round(
                  (jobStats.completed / jobStats.total) * 100,
              )
            : 0;

    const experienceText =
        craftsman?.experience_years === null ||
        craftsman?.experience_years === undefined
            ? "غير محددة"
            : craftsman.experience_years === 0
              ? "أقل من سنة"
              : craftsman.experience_years === 1
                ? "سنة واحدة"
                : craftsman.experience_years === 2
                  ? "سنتان"
                  : craftsman.experience_years <= 10
                    ? `${craftsman.experience_years} سنوات`
                    : `${craftsman.experience_years} سنة`;

    const verificationStatus =
        (craftsman?.verification_status as VerificationStatus) ??
        "pending";

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold">
                        {isLoading
                            ? "..."
                            : `مرحباً ${profile?.full_name || ""}`}
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        لوحة التحكم
                    </p>
                </div>

                <div className="flex shrink-0 gap-2">
                    <Link href="/craftsman/find">
                        <Button size="sm" className="gap-2">
                            <Search className="h-4 w-4" />
                            دور على شغل
                        </Button>
                    </Link>

                    <Link href="/craftsman/profile/edit">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Edit3 className="h-4 w-4" />
                            تعديل الملف
                        </Button>
                    </Link>
                </div>
            </div>
            <TelegramConnectAlert />

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Profile */}
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                    {profile?.avatar_url ? (
                                        <img
                                            src={profile.avatar_url}
                                            alt={
                                                profile.full_name ||
                                                "صورة الملف الشخصي"
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserRound className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2 className="break-words text-base font-semibold leading-6">
                                        {isLoading
                                            ? "..."
                                            : profile?.full_name ||
                                              "بدون اسم"}
                                    </h2>

                                    {craftsman && (
                                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <BadgeCheck className="h-3.5 w-3.5 shrink-0" />

                                            <span>
                                                {
                                                    verificationText[
                                                        verificationStatus
                                                    ]
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-2 text-sm">
                                <Link
                                    href={
                                        profile?.id
                                            ? `/profile/${profile.id}`
                                            : "/profile"
                                    }
                                    className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-muted"
                                >
                                    <span>الملف العام</span>

                                    <UserRound className="h-4 w-4 text-muted-foreground" />
                                </Link>

                                <Link
                                    href="/chats"
                                    className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-muted"
                                >
                                    <span>الرسائل</span>

                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Identity Verification */}
                    <Link
                        href="/craftsman/veritfy-identity"
                        className="block"
                    >
                        <Card className="transition-colors hover:border-primary/40 hover:bg-muted/20">
                            <CardContent className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <BadgeCheck className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold">
                                            توثيق الهوية
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            وثّق هويتك لزيادة ثقة العملاء بحسابك
                                        </p>
                                    </div>
                                </div>

                                <span className="text-xs font-medium text-primary">
                                    توثيق
                                </span>
                            </CardContent>
                        </Card>
                    </Link>

                   {/* Onboarding */}
{onboardingSteps.some((item)=> item.completed !== true) && <Card>
    <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
            <div>
                <h2 className="font-semibold">
                    كمّل ملفك
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                    {completedSteps} من{" "}
                    {onboardingSteps.length} مكتملة
                </p>
            </div>

            <span className="text-sm font-semibold text-primary">
                {onboardingPercentage}%
            </span>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                    width: `${onboardingPercentage}%`,
                }}
            />
        </div>

        <div className="mt-5 space-y-2">
            {[
                ...onboardingSteps.filter(
                    (step) => !step.completed,
                ),
                ...onboardingSteps.filter(
                    (step) => step.completed,
                ),
            ].map((step) => (
                <div
                    key={step.label}
                    className={
                        step.completed
                            ? "flex items-center gap-3 rounded-md px-2 py-2"
                            : "flex items-center gap-3 rounded-md px-2 py-2"
                    }
                >
                    {step.completed ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Check className="h-3.5 w-3.5" />
                        </span>
                    ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-1">
                            <span className="h-2 w-2 rounded-full" />
                        </span>
                    )}

                    <span
                        className={
                            step.completed
                                ? "text-sm text-muted-foreground"
                                : "text-sm font-medium text-foreground"
                        }
                    >
                        {step.label}
                    </span>

                    {!step.completed && (
                        <span className="mr-auto text-xs font-medium text-primary">
                            مطلوب
                        </span>
                    )}
                </div>
            ))}
        </div>

        {completedSteps < onboardingSteps.length && (
            <Link
                href="/craftsman/profile/edit"
                className="mt-5 block"
            >
                <Button
                    size="sm"
                    className="w-full"
                >
                    كمّل ملفك
                </Button>
            </Link>
        )}
    </CardContent>
</Card>}

                    {/* Availability */}
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    حالة العمل
                                </span>

                                <span
                                    className={`flex items-center gap-2 text-sm ${
                                        craftsman?.is_available
                                            ? "text-green-600"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    <span
                                        className={`h-2 w-2 rounded-full ${
                                            craftsman?.is_available
                                                ? "bg-green-500"
                                                : "bg-muted-foreground"
                                        }`}
                                    />

                                    {craftsman?.is_available
                                        ? "متاح"
                                        : "غير متاح"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main */}
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">
                                    الأعمال
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    {isStatsLoading
                                        ? "..."
                                        : jobStats.total}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">
                                    معدل الإتمام
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    {isStatsLoading
                                        ? "..."
                                        : `${completionRate}%`}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">
                                    معدل الرد
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    {craftsman?.response_rate ?? 0}%
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">
                                    متوسط الرد
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    {craftsman?.average_response_time_minutes ??
                                        "—"}
                                </p>

                                {craftsman?.average_response_time_minutes !==
                                    null &&
                                    craftsman?.average_response_time_minutes !==
                                        undefined && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            دقيقة
                                        </p>
                                    )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Profile Information */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold">
                                    معلومات الملف
                                </h2>

                                <Link href="/craftsman/profile/edit">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        تعديل
                                    </Button>
                                </Link>
                            </div>

                            <Separator className="my-5" />

                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="flex gap-3">
                                    <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">
                                            الخبرة
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {experienceText}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">
                                            الهاتف
                                        </p>

                                        <p className="mt-1 break-words text-sm font-medium">
                                            {craftsman?.phone ||
                                                "غير مضاف"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                                    <div className="min-w-0">
                                        <p className="text-xs text-muted-foreground">
                                            عنوان الورشة
                                        </p>

                                        <p className="mt-1 break-words text-sm font-medium">
                                            {craftsman?.shop_address ||
                                                "غير مضاف"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Star className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            الحالة
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {craftsman?.is_available
                                                ? "متاح لاستقبال الأعمال"
                                                : "غير متاح حالياً"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-5" />

                            <div>
                                <p className="text-xs text-muted-foreground">
                                    النبذة
                                </p>

                                <p className="mt-2 whitespace-pre-line text-sm leading-7">
                                    {craftsman?.bio ||
                                        "لم تتم إضافة نبذة بعد."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Areas */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-semibold">
                                    مناطق العمل
                                </h2>

                                <Link href="/craftsman/profile/edit">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                    >
                                        تعديل
                                    </Button>
                                </Link>
                            </div>

                            {craftsman?.areas?.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {craftsman.areas.map((area) => (
                                        <span
                                            key={area}
                                            className="rounded-md border px-3 py-1.5 text-sm"
                                        >
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    لم تتم إضافة مناطق العمل.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}