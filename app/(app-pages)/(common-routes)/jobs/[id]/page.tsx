"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/contexts/user-context";
import JobApplicationForm from "@/components/jobs/job-application-form";
import { JobApplicationsList } from "@/components/jobs/job-applications-list";

type Job = {
    id: string;
    client_id: string;
    title: string;
    description: string;
    service_type: string;
    budget: number;
    area: string;
    image_url: string | null;
    status:
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled";
    selected_craftsman_id: string | null;
    created_at: string;
    updated_at: string;
};

type JobClient = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
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
};

const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "medium",
    }).format(new Date(date));
};

export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const supabase = useMemo(
        () => createClient(),
        [],
    );

    const {
        user,
        profile,
        isLoading: userLoading,
    } = useUser();

    const jobId = params.id as string;

    const [job, setJob] =
        useState<Job | null>(null);

    const [jobClient, setJobClient] =
        useState<JobClient | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!jobId) {
            return;
        }

        let mounted = true;

        const loadJob = async () => {
            try {
                setIsLoading(true);
                setError("");

                const {
                    data: jobData,
                    error: jobError,
                } = await supabase
                    .from("jobs")
                    .select("*")
                    .eq("id", jobId)
                    .single();

                if (jobError) {
                    throw jobError;
                }

                if (!mounted) {
                    return;
                }

                setJob(jobData as Job);

                /*
                 * Only fetch the public client information
                 * needed for the Job page.
                 */
                const {
                    data: clientData,
                    error: clientError,
                } = await supabase
                    .from("profiles")
                    .select(
                        "id, full_name, avatar_url, created_at",
                    )
                    .eq(
                        "id",
                        jobData.client_id,
                    )
                    .single();

                if (
                    clientError &&
                    clientError.code !==
                        "PGRST116"
                ) {
                    throw clientError;
                }

                if (mounted) {
                    setJobClient(
                        clientData as
                            | JobClient
                            | null,
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to load job:",
                    error,
                );

                if (mounted) {
                    setError(
                        "لم نتمكن من تحميل الشغلانة.",
                    );
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadJob();

        return () => {
            mounted = false;
        };
    }, [jobId, supabase]);

    if (isLoading || userLoading) {
        return (
            <div
                dir="rtl"
                className="mx-auto w-full max-w-6xl px-4 py-6"
            >
                <div className="text-sm text-muted-foreground">
                    جاري تحميل الشغلانة...
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div
                dir="rtl"
                className="mx-auto w-full max-w-3xl px-4 py-6"
            >
                <Card>
                    <CardContent className="p-8 text-center">
                        <XCircle className="mx-auto h-8 w-8 text-destructive" />

                        <h1 className="mt-4 text-xl font-bold">
                            الشغلانة غير متاحة
                        </h1>

                        <p className="mt-2 text-sm text-muted-foreground">
                            {error ||
                                "لم يتم العثور على الشغلانة المطلوبة."}
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

    const status =
        statusConfig[job.status];

    const isOwner =
        user?.id === job.client_id;

    const isCraftsman =
        profile?.role === "craftsman";

    return (
        <div
            dir="rtl"
            className="mx-auto w-full max-w-6xl px-4 py-6"
        >
            {/* Header */}
            <div className="mb-6">
                <Link
                    href={
                        isOwner
                            ? "/dashboard"
                            : "/jobs"
                    }
                    className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowRight className="h-4 w-4" />

                    {isOwner
                        ? "العودة إلى لوحة التحكم"
                        : "العودة إلى الشغلانات"}
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className={
                                    status.className
                                }
                            >
                                {status.label}
                            </Badge>

                            <Badge variant="secondary">
                                {
                                    job.service_type
                                }
                            </Badge>
                        </div>

                        <h1 className="text-2xl font-bold leading-9 sm:text-3xl">
                            {job.title}
                        </h1>

                        <p className="mt-2 text-sm text-muted-foreground">
                            نُشرت في{" "}
                            {formatDate(
                                job.created_at,
                            )}
                        </p>
                    </div>

                    {isOwner &&
                        job.status ===
                            "open" && (
                            <Link
                                href={`/jobs/${job.id}/edit`}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Edit3 className="h-4 w-4" />
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
                                src={
                                    job.image_url
                                }
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
                                    <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

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
                                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

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
                                    <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

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
                                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

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
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />

                                    <div>
                                        <h2 className="font-semibold">
                                            تم اختيار صنايعي
                                        </h2>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            الشغلانة مرتبطة حاليًا
                                            بالصنايعي الذي تم
                                            اختياره.
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
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                    {jobClient?.avatar_url ? (
                                        <img
                                            src={
                                                jobClient.avatar_url
                                            }
                                            alt={
                                                jobClient.full_name
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserRound className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate font-semibold">
                                        {
                                            jobClient?.full_name
                                        }
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
                                className="flex items-center justify-between rounded-md px-2 py-2 text-sm"
                            >
                                <Button variant={"ghost"} className="w-full flex justify-start">
                                <UserRound className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                    عرض الملف
                                </span>

                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Action */}
                            {isOwner && (
                    <Card>
                        <CardContent className="p-5">
                                <>
                                    <p className="font-semibold">
                                        ديه شغلانتك
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        تقدر تعدلها من هنا
                                    </p>

                                    {job.status ===
                                        "open" && (
                                        <Link
                                            href={`/jobs/${job.id}/edit`}
                                            className="mt-4 block"
                                        >
                                            <Button
                                                variant="outline"
                                                className="w-full gap-2"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                                تعديل الشغلانة
                                            </Button>
                                        </Link>
                                    )}
                                </>
                        </CardContent>
                    </Card>
                            )}

                    {/* Messages */}
                    {user && (
                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <MessageSquare className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="font-semibold">
                                            الرسائل
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            تقدر تستخدم الرسائل
                                            للتواصل مع المستخدمين
                                            بعد بدء التقديمات.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            

<div className="mt-[4rem] flex flex-col gap-4">
    <JobApplicationForm
    jobId={job.id}
    jobBudget={job.budget}
    jobStatus={job.status}
    clientId={job.client_id}
/>
  <JobApplicationsList jobId={job.id} />
</div>
        </div>
    );
}