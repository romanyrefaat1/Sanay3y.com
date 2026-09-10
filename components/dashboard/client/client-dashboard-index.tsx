"use client";

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

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/contexts/user-context";

export default function ClientDashboardIndex() {
    const { profile, clientProfile, isLoading } = useUser();

    const genderText = {
        male: "ذكر",
        female: "أنثى",
    };

    const onboardingSteps = [
        {
            label: "إضافة صورة شخصية",
            completed: Boolean(clientProfile?.avatar_url),
        },
        {
            label: "إضافة رقم الهاتف",
            completed: Boolean(clientProfile?.phone),
        },
        {
            label: "تحديد المنطقة",
            completed: Boolean(clientProfile?.area),
        },
        {
            label: "تحديد النوع",
            completed: Boolean(clientProfile?.gender),
        },
    ];

    const completedSteps = onboardingSteps.filter(
        (step) => step.completed,
    ).length;

    const onboardingPercentage = Math.round(
        (completedSteps / onboardingSteps.length) * 100,
    );

    return (
        <div
            dir="rtl"
            className="mx-auto w-full max-w-6xl px-4 py-6"
        >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {isLoading
                            ? "..."
                            : `مرحباً ${profile?.full_name || ""}`}
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        لوحة التحكم
                    </p>
                </div>

                <Link 
                                    href="/client/profile/edit?backTo=/dashboard&name='لوحة التحكم'"

                >
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

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Profile */}
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                    {clientProfile?.avatar_url ? (
                                        <img
                                            src={clientProfile.avatar_url}
                                            alt={
                                                profile?.full_name || ""
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
                                        <span>حساب عميل</span>
                                    </div>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-2 text-sm">
                                <Link
                                    href="/profile"
                                    className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted"
                                >
                                    <span>الملف العام</span>

                                    <UserRound className="h-4 w-4 text-muted-foreground" />
                                </Link>

                                <Link
                                    href="/messages"
                                    className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted"
                                >
                                    <span>الرسائل</span>

                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </Link>

                                <Link
                                    href="/client/find"
                                    className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted"
                                >
                                    <span>البحث عن صنايعي</span>

                                    <Search className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Find Craftsman */}
                    <Link href="/craftsmen" className="block">
                        <Card className="transition-colors hover:border-primary/40 hover:bg-muted/20">
                            <CardContent className="flex items-center justify-between p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Search className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold">
                                            ابحث عن صنايعي
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            ابحث عن أفضل الصنايعية في منطقتك
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
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold">
                                        أكمل ملفك
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

                            <div className="mt-5 space-y-3">
                                {onboardingSteps.map((step) => (
                                    <div
                                        key={step.label}
                                        className="flex items-center gap-3"
                                    >
                                        {step.completed ? (
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                <span className="text-xs">
                                                    ✓
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                                        )}

                                        <span
                                            className={
                                                step.completed
                                                    ? "text-sm"
                                                    : "text-sm text-muted-foreground"
                                            }
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {completedSteps <
                                onboardingSteps.length && (
                                <Link
                                    href="/client/profile/edit?backTo=/dashboard&name='لوحة التحكم'"
                                    className="mt-5 block"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        استكمال الملف
                                    </Button>
                                </Link>
                            )}
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
                                    الطلبات
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    0
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">
                                    قيد التنفيذ
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    0
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">
                                    مكتملة
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    0
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">
                                    المحادثات
                                </p>

                                <p className="mt-2 text-2xl font-bold">
                                    0
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Getting started */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="font-semibold">
                                        ابدأ في العثور على الصنايعي المناسب
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        ابحث عن الصنايعية حسب التخصص والمنطقة
                                        ثم تواصل مع الشخص المناسب لتنفيذ شغلك.
                                    </p>
                                </div>

                                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
                                    <UsersRound className="h-5 w-5" />
                                </div>
                            </div>

                            <Separator className="my-5" />

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/craftsmen"
                                    className="w-full sm:w-auto"
                                >
                                    <Button className="w-full gap-2 sm:w-auto">
                                        <Search className="h-4 w-4" />
                                        البحث عن صنايعي
                                    </Button>
                                </Link>

                                <Link
                                    href="/messages"
                                    className="w-full sm:w-auto"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2 sm:w-auto"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        الرسائل
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Profile information */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold">
                                    معلومات الحساب
                                </h2>

                                <Link 
                                    href="/client/profile/edit?backTo=/dashboard&name='لوحة التحكم'"

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
                                <div className="flex gap-3">
                                    <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            الهاتف
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {clientProfile?.phone ||
                                                "غير مضاف"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            المنطقة
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {clientProfile?.area ||
                                                "غير مضافة"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <VenusAndMars className="mt-0.5 h-4 w-4 text-muted-foreground" />

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            النوع
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {clientProfile?.gender
                                                ? genderText[
                                                      clientProfile.gender
                                                  ]
                                                : "غير محدد"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <BadgeCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            حالة الحساب
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {profile?.is_active
                                                ? "الحساب نشط"
                                                : "الحساب غير نشط"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold">
                                        منطقتك
                                    </h2>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        سنستخدم منطقتك لمساعدتك في العثور على
                                        صنايعية قريبين منك
                                    </p>
                                </div>

                                <Link 
                                    href="/client/profile/edit?backTo=/dashboard&name='لوحة التحكم'"

                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                    >
                                        تعديل
                                    </Button>
                                </Link>
                            </div>

                            {clientProfile?.area ? (
                                <div className="flex items-center gap-3 rounded-lg border p-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <MapPin className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            المنطقة الحالية
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {clientProfile.area}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-5 text-center">
                                    <MapPin className="mx-auto h-5 w-5 text-muted-foreground" />

                                    <p className="mt-2 text-sm text-muted-foreground">
                                        لم تتم إضافة منطقتك بعد
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Activity */}
                    <Card>
                        <CardContent className="flex items-center justify-between gap-4 p-6">
                            <div>
                                <h2 className="font-semibold">
                                    آخر النشاط
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    لا توجد أنشطة جديدة حالياً.
                                </p>
                            </div>

                            <Link href="/messages">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    الرسائل
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}