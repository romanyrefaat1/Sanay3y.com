"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BadgeCheck,
    Edit3,
    MapPin,
    MessageSquare,
    Phone,
    Search,
    UserRound,
    UsersRound,
    VenusAndMars,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/contexts/user-context";
import { TelegramConnectAlert } from "@/components/connect-telegram-alert";

type DashboardStats = {
    totalJobs: number;
    openJobs: number;
    inProgress: number;
    completed: number;
};

const initialStats: DashboardStats = {
    totalJobs: 0,
    openJobs: 0,
    inProgress: 0,
    completed: 0,
};

export default function ClientDashboardIndex() {
    const {
    profile,
    clientProfile,
    onboardingSteps,
    completedSteps,
    onboardingPercentage,
    isLoading,
} = useUser();

    const [stats, setStats] =
        useState<DashboardStats>(initialStats);

    const [statsLoading, setStatsLoading] =
        useState(true);

    const genderText: Record<string, string> = {
        male: "ذكر",
        female: "أنثى",
    };

    useEffect(() => {
        if (!profile?.id) {
            setStatsLoading(false);
            return;
        }

        let cancelled = false;

        async function loadStats() {
            setStatsLoading(true);

            const supabase = createClient();

            const [
                totalJobsResult,
                openJobsResult,
                inProgressJobsResult,
                completedJobsResult,
            ] = await Promise.all([
                supabase
                    .from("jobs")
                    .select("id", {
                        count: "exact",
                        head: true,
                    })
                    .eq("client_id", profile.id),

                supabase
                    .from("jobs")
                    .select("id", {
                        count: "exact",
                        head: true,
                    })
                    .eq("client_id", profile.id)
                    .eq("status", "open"),

                supabase
                    .from("jobs")
                    .select("id", {
                        count: "exact",
                        head: true,
                    })
                    .eq("client_id", profile.id)
                    .eq("status", "in_progress"),

                supabase
                    .from("jobs")
                    .select("id", {
                        count: "exact",
                        head: true,
                    })
                    .eq("client_id", profile.id)
                    .eq("status", "completed"),
            ]);

            if (cancelled) return;

            if (totalJobsResult.error) {
                console.error(
                    "Failed to load total jobs:",
                    totalJobsResult.error,
                );
            }

            if (openJobsResult.error) {
                console.error(
                    "Failed to load open jobs:",
                    openJobsResult.error,
                );
            }

            if (inProgressJobsResult.error) {
                console.error(
                    "Failed to load in-progress jobs:",
                    inProgressJobsResult.error,
                );
            }

            if (completedJobsResult.error) {
                console.error(
                    "Failed to load completed jobs:",
                    completedJobsResult.error,
                );
            }

            setStats({
                totalJobs: totalJobsResult.count ?? 0,
                openJobs: openJobsResult.count ?? 0,
                inProgress:
                    inProgressJobsResult.count ?? 0,
                completed:
                    completedJobsResult.count ?? 0,
            });

            setStatsLoading(false);
        }

        loadStats();

        return () => {
            cancelled = true;
        };
    }, [profile?.id]);

    const editProfileHref =
        "/client/profile/edit?backTo=/dashboard&name='لوحة التحكم'";

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold">
                        {isLoading
                            ? "..."
                            : `مرحباً ${
                                  profile?.full_name || ""
                              }`}
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        لوحة التحكم
                    </p>
                </div>

                <Link href={editProfileHref}>
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

            <TelegramConnectAlert />

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                {/* Sidebar */}
                <aside className="space-y-4">
                    {/* Profile card */}
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                    {profile?.avatar_url ? (
                                        <img
                                            src={
                                                profile.avatar_url
                                            }
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

                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            حساب عميل
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-1 text-sm">
                                <Link
                                    href="/profile"
                                    className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-muted"
                                >
                                    <span>
                                        الملف العام
                                    </span>

                                    <UserRound className="h-4 w-4 text-muted-foreground" />
                                </Link>

                                <Link
                                    href="/chats"
                                    className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-muted"
                                >
                                    <span>
                                        الرسائل
                                    </span>

                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </Link>

                                <Link
                                    href="/client/find"
                                    className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-muted"
                                >
                                    <span>
                                        البحث عن صنايعي
                                    </span>

                                    <Search className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Find craftsman */}
                    <Link
                        href="/client/find"
                        className="block"
                    >
                        <Card className="transition-colors hover:border-primary/40 hover:bg-muted/20">
                            <CardContent className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Search className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold">
                                            دور على صنايعي
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            ابحث عن صنايعية قريبين منك
                                        </p>
                                    </div>
                                </div>

                                <span className="text-xs font-medium text-primary">
                                    بحث
                                </span>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Profile completion */}
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
                            : "flex items-center gap-3 px-2 py-2"
                    }
                >
                    {step.completed ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <span className="text-xs">
                                ✓
                            </span>
                        </span>
                    ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-1 border-primary">
                            <span className="h-1 w-1 rounded-full" />
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

        {completedSteps <
            onboardingSteps.length && (
            <Link
                href={editProfileHref}
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
                </aside>

                {/* Main */}
                <main className="space-y-6">
                    {/* Stats */}
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="كل الطلبات"
                            value={stats.totalJobs}
                            loading={statsLoading}
                            href="/client/my-job-offers"
                        />

                        <StatCard
                            label="مفتوحة"
                            value={stats.openJobs}
                            loading={statsLoading}
                            href="/client/my-job-offers?status=open"
                        />

                        <StatCard
                            label="قيد التنفيذ"
                            value={stats.inProgress}
                            loading={statsLoading}
                            href="/client/my-job-offers?status=in_progress"
                        />

                        <StatCard
                            label="مكتملة"
                            value={stats.completed}
                            loading={statsLoading}
                            href="/client/my-job-offers?status=completed"
                        />
                    </div>

                    {/* Main CTA */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <h2 className="font-semibold">
                                        محتاج صنايعي؟
                                    </h2>

                                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                                        ابحث عن الصنايعي المناسب
                                        لشغلك، شوف المتاحين
                                        وتواصل مع الشخص المناسب
                                        لتنفيذ الطلب.
                                    </p>
                                </div>

                                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
                                    <UsersRound className="h-5 w-5" />
                                </div>
                            </div>

                            <Separator className="my-5" />

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/client/find"
                                    className="w-full sm:w-auto"
                                >
                                    <Button className="w-full gap-2 sm:w-auto">
                                        <Search className="h-4 w-4" />
                                        ابحث عن صنايعي
                                    </Button>
                                </Link>

                                <Link
                                    href="/client/job/new"
                                    className="w-full sm:w-auto"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                    >
                                        اعرض شغلانة جديدة
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account information */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="font-semibold">
                                    معلومات الحساب
                                </h2>

                                <Link
                                    href={editProfileHref}
                                >
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
                                <InfoItem
                                    icon={Phone}
                                    label="الهاتف"
                                    value={
                                        clientProfile?.phone ||
                                        "غير مضاف"
                                    }
                                />

                                <InfoItem
                                    icon={VenusAndMars}
                                    label="النوع"
                                    value={
                                        clientProfile?.gender
                                            ? genderText[
                                                  clientProfile
                                                      .gender
                                              ] ||
                                              clientProfile.gender
                                            : "غير محدد"
                                    }
                                />

                                <InfoItem
                                    icon={MapPin}
                                    label="الموقع"
                                    value={
                                        profile?.location
                                            ? "تم تحديد الموقع"
                                            : "غير محدد"
                                    }
                                />

                                <InfoItem
                                    icon={BadgeCheck}
                                    label="حالة الحساب"
                                    value={
                                        profile?.is_active
                                            ? "الحساب نشط"
                                            : "الحساب غير نشط"
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold">
                                        موقعك
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        نستخدم موقعك للعثور على
                                        الصنايعية القريبين منك.
                                        موقعك الدقيق لا يظهر
                                        للمستخدمين الآخرين.
                                    </p>
                                </div>

                                <MapPin className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
                            </div>

                            <Separator className="my-5" />

                            {profile?.location ? (
                                <div className="flex items-center gap-3 rounded-lg border p-4">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <MapPin className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">
                                            تم تحديد موقعك
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            موقعك محفوظ بشكل
                                            خاص لاستخدامه في
                                            البحث عن الخدمات
                                            القريبة.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-5 text-center">
                                    <MapPin className="mx-auto h-5 w-5 text-muted-foreground" />

                                    <p className="mt-2 text-sm text-muted-foreground">
                                        لم يتم تحديد موقعك بعد
                                    </p>

                                    <Link
                                        href={
                                            editProfileHref
                                        }
                                        className="mt-4 inline-block"
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                        >
                                            تحديد الموقع
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Activity */}
                    <Card>
                        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold">
                                    آخر النشاط
                                </h2>

                                {statsLoading ? (
                                    <div className="mt-2 h-4 w-40 animate-pulse rounded bg-muted" />
                                ) : stats.totalJobs > 0 ? (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        لديك{" "}
                                        {
                                            stats.totalJobs
                                        }{" "}
                                        طلب
                                        {stats.totalJobs ===
                                        1
                                            ? ""
                                            : "ات"}{" "}
                                        في حسابك.
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        لم تنشر أي طلبات حتى
                                        الآن.
                                    </p>
                                )}
                            </div>

                            <Link
                                href="/client/my-job-offers"
                                className="shrink-0"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full gap-2 sm:w-auto"
                                >
                                    <Search className="h-4 w-4" />
                                    طلباتي
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    loading,
    href,
}: {
    label: string;
    value: number;
    loading: boolean;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="block"
        >
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/20">
                <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                        {label}
                    </p>

                    {loading ? (
                        <div className="mt-3 h-8 w-10 animate-pulse rounded-md bg-muted" />
                    ) : (
                        <p className="mt-2 text-2xl font-bold">
                            {value}
                        </p>
                    )}

                    <p className="mt-1 text-xs text-muted-foreground">
                        عرض الطلبات
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}

function InfoItem({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Phone;
    label: string;
    value: string;
}) {
    return (
        <div className="flex gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                    {label}
                </p>

                <p className="mt-1 break-words text-sm font-medium">
                    {value}
                </p>
            </div>
        </div>
    );
}