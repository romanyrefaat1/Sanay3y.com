import Link from "next/link";
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Edit3,
    MapPin,
    MessageSquare,
    UserRound,
    Wallet,
    XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import JobApplicationForm from "@/components/jobs/job-application-form";
import { JobApplicationsList } from "@/components/jobs/job-applications-list";
import { FinishJobButton } from "@/components/jobs/finish-job-button";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

const statusConfig = {
    open: {
        label: "مفتوحة",
        className:
            "border-green-500/20 bg-green-500/10 text-green-600",
    },
    in_progress: {
        label: "قيد التنفيذ",
        className:
            "border-blue-500/20 bg-blue-500/10 text-blue-600",
    },
    completed: {
        label: "مكتملة",
        className:
            "border-primary/20 bg-primary/10 text-primary",
    },
    cancelled: {
        label: "ملغاة",
        className:
            "border-destructive/20 bg-destructive/10 text-destructive",
    },
} as const;

const formatDate = (date: string) =>
    new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "medium",
    }).format(new Date(date));

export default async function JobDetailsPage({
    params,
}: PageProps) {
    const { id } = await params;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

    if (jobError || !job) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-6">
                <Card>
                    <CardContent className="p-8 text-center">
                        <XCircle className="mx-auto size-8 text-destructive" />

                        <h1 className="mt-4 text-xl font-bold">
                            الشغلانة غير متاحة
                        </h1>

                        <p className="mt-2 text-sm text-muted-foreground">
                            لم يتم العثور على الشغلانة المطلوبة.
                        </p>

                        <Link
                            href="/dashboard"
                            className="mt-6 inline-block"
                        >
                            <Button>
                                العودة للوحة التحكم
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { data: jobClient } = await supabase
        .from("profiles")
        .select(
            "id, full_name, avatar_url, created_at",
        )
        .eq("id", job.client_id)
        .single();

    const isOwner = user?.id === job.client_id;

    const isSelectedCraftsman =
        user?.id === job.selected_craftsman_id;

    const status =
        statusConfig[
            job.status as keyof typeof statusConfig
        ] ?? statusConfig.open;

    const canApply =
        !!user &&
        !isOwner &&
        !isSelectedCraftsman &&
        job.status === "open";

    const messagesClosed =
        job.status === "completed" ||
        job.status === "cancelled";

    const canFinish =
        job.status === "in_progress" &&
        (isOwner || isSelectedCraftsman);

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href={
                        isOwner
                            ? "/dashboard"
                            : "/craftsman/find"
                    }
                    className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowRight className="size-4" />

                    {isOwner
                        ? "العودة إلى لوحة التحكم"
                        : "العودة إلى الشغلانات"}
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className={status.className}
                            >
                                {status.label}
                            </Badge>

                            <Badge variant="secondary">
                                {job.service_type}
                            </Badge>
                        </div>

                        <h1 className="text-2xl font-bold leading-9 sm:text-3xl">
                            {job.title}
                        </h1>

                        <p className="mt-2 text-sm text-muted-foreground">
                            نُشرت في{" "}
                            {formatDate(job.created_at)}
                        </p>
                    </div>

                    {isOwner &&
                        job.status === "open" && (
                            <Link
                                href={`/jobs/${job.id}/edit`}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Edit3 className="size-4" />
                                    تعديل الشغلانة
                                </Button>
                            </Link>
                        )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* Main */}
                <div className="space-y-6">
                    {/* Image */}
                    {job.image_url && (
                        <Card className="overflow-hidden">
                            <img
                                src={job.image_url}
                                alt={job.title}
                                className="max-h-[480px] w-full object-cover"
                            />
                        </Card>
                    )}

                    {/* Description */}
                    <Card>
                        <CardContent className="p-6 sm:p-7">
                            <h2 className="text-lg font-semibold">
                                تفاصيل الشغلانة
                            </h2>

                            <Separator className="my-5" />

                            <p className="whitespace-pre-wrap text-sm leading-8">
                                {job.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Job information */}
                    <Card>
                        <CardContent className="p-6 sm:p-7">
                            <h2 className="text-lg font-semibold">
                                معلومات الشغلانة
                            </h2>

                            <Separator className="my-5" />

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="flex gap-3">
                                    <Wallet className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            الميزانية
                                        </p>

                                        <p className="mt-1 text-base font-semibold">
                                            {job.budget.toLocaleString(
                                                "ar-EG",
                                            )}{" "}
                                            جنيه
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <MapPin className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            المنطقة
                                        </p>

                                        <p className="mt-1 text-base font-semibold">
                                            {job.area}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <CalendarDays className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            تاريخ النشر
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {formatDate(
                                                job.created_at,
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Clock3 className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            آخر تحديث
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {formatDate(
                                                job.updated_at,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected craftsman */}
                    {job.selected_craftsman_id && (
                        <Card>
                            <CardContent className="p-6 sm:p-7">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />

                                    <div>
                                        <h2 className="font-semibold">
                                            تم اختيار صنايعي
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            الشغلانة مرتبطة حاليًا
                                            بالصنايعي الذي تم
                                            اختياره.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Completion status */}
                    {job.status === "completed" && (
                        <Card>
                            <CardContent className="p-6 sm:p-7">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600" />

                                    <div>
                                        <h2 className="font-semibold">
                                            تم إنهاء الشغلانة
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            تم تسجيل الشغلانة كمكتملة.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Client */}
                    <Card>
                        <CardContent className="p-5">
                            <h2 className="font-semibold">
                                صاحب الشغلانة
                            </h2>

                            <Separator className="my-4" />

                            <div className="flex items-center gap-3">
                                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                    {jobClient?.avatar_url ? (
                                        <img
                                            src={
                                                jobClient.avatar_url
                                            }
                                            alt={
                                                jobClient.full_name
                                            }
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <UserRound className="size-5 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate font-semibold">
                                        {jobClient?.full_name ??
                                            "مستخدم"}
                                    </p>

                                    {jobClient?.created_at && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            عضو منذ{" "}
                                            {formatDate(
                                                jobClient.created_at,
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <Link
                                href={`/profile/${job.client_id}`}
                                className="block"
                            >
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2"
                                >
                                    <UserRound className="size-4 text-muted-foreground" />
                                    عرض الملف
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Owner actions */}
                    {isOwner && (
                        <Card>
                            <CardContent className="p-5">
                                <p className="font-semibold">
                                    ديه شغلانتك
                                </p>

                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    {job.status === "open"
                                        ? "تقدر تعدل تفاصيلها أو تختار صنايعي من التقديمات."
                                        : job.status === "in_progress"
                                          ? "الشغلانة قيد التنفيذ مع الصنايعي المختار. تقدر تنهيها لما تخلص."
                                          : job.status === "completed"
                                            ? "تم إنهاء الشغلانة."
                                            : "تم تحديث حالة الشغلانة ولا يمكن تعديل تفاصيلها الآن."}
                                </p>

                                {job.status === "open" && (
                                    <Link
                                        href={`/jobs/${job.id}/edit`}
                                        className="mt-4 block"
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                        >
                                            <Edit3 className="size-4" />
                                            تعديل الشغلانة
                                        </Button>
                                    </Link>
                                )}

                                {canFinish &&
                                    isOwner && (
                                        <div className="mt-4">
                                            <FinishJobButton
                                                jobId={job.id}
                                            />
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Craftsman actions */}
                    {isSelectedCraftsman && (
                        <Card>
                            <CardContent className="p-5">
                                <p className="font-semibold">
                                    الشغلانة دي معاك
                                </p>

                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    {job.status === "in_progress"
                                        ? "لو خلصت الشغلانة، تقدر تعلمها كمكتملة من هنا."
                                        : job.status === "completed"
                                          ? "تم إنهاء الشغلانة."
                                          : "تم تحديث حالة الشغلانة."}
                                </p>

                                {canFinish && (
                                    <div className="mt-4">
                                        <FinishJobButton
                                            jobId={job.id}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Messages */}
                    {user && !messagesClosed && (
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <MessageSquare className="size-5" />
                                    </div>

                                    <div>
                                        <p className="font-semibold">
                                            الرسائل
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            {job.selected_craftsman_id
                                                ? "تقدر دلوقتي تتواصل مع الصنايعي المختار بخصوص الشغلانة."
                                                : "الرسائل هتكون متاحة بعد اختيار الصنايعي وبدء تنفيذ الشغلانة."}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Applications */}
            <div className="mt-16 flex flex-col gap-4">
                {canApply && (
                    <JobApplicationForm
                        jobId={job.id}
                        jobBudget={job.budget}
                        jobStatus={job.status}
                        clientId={job.client_id}
                    />
                )}

                <JobApplicationsList
                    jobId={job.id}
                    isOwner={isOwner}
                    jobStatus={job.status}
                    selectedCraftsmanId={job.selected_craftsman_id}
                />
            </div>
        </div>
    );
}