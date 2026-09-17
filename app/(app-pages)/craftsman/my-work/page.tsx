import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    Search,
    XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { createClient } from "@/lib/supabase/server";
import { TelegramConnectAlert } from "@/components/connect-telegram-alert";

type JobApplication = {
    id: string;
    job_id: string;
    proposed_price: number;
    message: string;
    status: string;
    created_at: string;
    updated_at: string;

    job: {
        id: string;
        title: string;
        description: string | null;
        service_type: string;
        budget: number | null;
        area: string;
        status: string;
        image_url: string | null;
        created_at: string;
        scheduled_at: string | null;
        agreed_scheduled_at: string | null;
    } | null;
};

type MonthGroup = {
    key: string;
    label: string;
    applications: JobApplication[];
};

const arabicMonths = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
];

function formatMonth(dateString: string) {
    const date = new Date(dateString);

    return `${arabicMonths[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(dateString));
}

function formatBudget(budget: number | null) {
    if (budget === null) {
        return "غير محدد";
    }

    return `${new Intl.NumberFormat("ar-EG").format(budget)} ج.م`;
}

function formatPrice(price: number) {
    return `${new Intl.NumberFormat("ar-EG").format(price)} ج.م`;
}

function getApplicationStatus(status: string) {
    switch (status) {
        case "pending":
            return {
                label: "في انتظار الرد",
                className:
                    "border-blue-200 bg-blue-50 text-blue-700",
                icon: Clock3,
            };

        case "accepted":
            return {
                label: "تم قبولك",
                className:
                    "border-green-200 bg-green-50 text-green-700",
                icon: CheckCircle2,
            };

        case "rejected":
            return {
                label: "لم يتم اختيارك",
                className:
                    "border-red-200 bg-red-50 text-red-700",
                icon: XCircle,
            };

        case "withdrawn":
            return {
                label: "تم سحب الطلب",
                className:
                    "border-slate-200 bg-slate-50 text-slate-700",
                icon: XCircle,
            };

        default:
            return {
                label: "طلب تقديم",
                className:
                    "border-slate-200 bg-slate-50 text-slate-700",
                icon: Clock3,
            };
    }
}

function getJobStatus(status: string) {
    switch (status) {
        case "open":
            return {
                label: "مفتوحة",
                className:
                    "border-blue-200 bg-blue-50 text-blue-700",
            };

        case "in_progress":
            return {
                label: "قيد التنفيذ",
                className:
                    "border-amber-200 bg-amber-50 text-amber-700",
            };

        case "completion_requested":
            return {
                label: "بانتظار تأكيد الإنجاز",
                className:
                    "border-purple-200 bg-purple-50 text-purple-700",
            };

        case "completed":
            return {
                label: "مكتملة",
                className:
                    "border-green-200 bg-green-50 text-green-700",
            };

        case "cancelled":
            return {
                label: "ملغاة",
                className:
                    "border-red-200 bg-red-50 text-red-700",
            };

        default:
            return {
                label: "غير معروف",
                className:
                    "border-slate-200 bg-slate-50 text-slate-700",
            };
    }
}

function groupApplicationsByMonth(
    applications: JobApplication[],
): MonthGroup[] {
    const groups = new Map<string, MonthGroup>();

    for (const application of applications) {
        const date = new Date(application.created_at);

        const year = date.getFullYear();
        const month = date.getMonth();

        const key = `${year}-${String(month + 1).padStart(2, "0")}`;

        if (!groups.has(key)) {
            groups.set(key, {
                key,
                label: formatMonth(application.created_at),
                applications: [],
            });
        }

        groups.get(key)!.applications.push(application);
    }

    return Array.from(groups.values());
}

function ApplicationStatusBadge({
    status,
}: {
    status: string;
}) {
    const statusData = getApplicationStatus(status);
    const Icon = statusData.icon;

    return (
        <Badge
            variant="outline"
            className={`gap-1.5 px-2.5 py-1 text-sm font-medium ${statusData.className}`}
        >
            <Icon className="size-3.5" />
            {statusData.label}
        </Badge>
    );
}

function JobStatusBadge({ status }: { status: string }) {
    const statusData = getJobStatus(status);

    return (
        <Badge
            variant="secondary"
            className={`text-sm ${statusData.className}`}
        >
            {statusData.label}
        </Badge>
    );
}

export default async function CraftsmanMyWorkPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: applications, error } = await supabase
        .from("job_applications")
        .select(
            `
                id,
                job_id,
                proposed_price,
                message,
                status,
                created_at,
                updated_at,
                job:jobs (
                    id,
                    title,
                    description,
                    service_type,
                    budget,
                    area,
                    status,
                    image_url,
                    created_at,
                    scheduled_at,
                    agreed_scheduled_at
                )
            `,
        )
        .eq("craftsman_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(
            "Failed to load craftsman applications:",
            error,
        );
    }

    const craftsmanApplications =
        (applications ?? []) as unknown as JobApplication[];

    const monthGroups =
        groupApplicationsByMonth(craftsmanApplications);

    const activeApplications = craftsmanApplications.filter(
        (application) => {
            if (!application.job) return false;

            return (
                application.status === "accepted" &&
                (
                    application.job.status === "in_progress" ||
                    application.job.status ===
                        "completion_requested"
                )
            );
        },
    ).length;

    const completedJobs = craftsmanApplications.filter(
        (application) =>
            application.status === "accepted" &&
            application.job?.status === "completed",
    ).length;

    const pendingApplications = craftsmanApplications.filter(
        (application) => application.status === "pending",
    ).length;

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <BriefcaseBusiness className="size-4" />
                                <span>حسابي</span>
                                <span>/</span>
                                <span>شغلاناتي</span>
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                شغلاناتي
                            </h1>

                            <p className="mt-2 max-w-2xl text-muted-foreground">
                                كل الشغلانات اللي قدمت عليها، سواء
                                لسه مستني الرد أو اشتغلت عليها قبل
                                كده.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <BriefcaseBusiness className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    إجمالي التقديمات
                                </p>

                                <p className="mt-0.5 text-2xl font-bold">
                                    {craftsmanApplications.length}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                                <Clock3 className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    في انتظار الرد
                                </p>

                                <p className="mt-0.5 text-2xl font-bold">
                                    {pendingApplications}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                                <BriefcaseBusiness className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    شغلانات حالية
                                </p>

                                <p className="mt-0.5 text-2xl font-bold">
                                    {activeApplications}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-green-500/10 text-green-600">
                                <CheckCircle2 className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    شغلانات مكتملة
                                </p>

                                <p className="mt-0.5 text-2xl font-bold">
                                    {completedJobs}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <TelegramConnectAlert />

                {/* Empty state */}
                {craftsmanApplications.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <div className="mb-5 flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <BriefcaseBusiness className="size-7" />
                            </div>

                            <h2 className="text-2xl font-bold">
                                لسه مفيش شغلانات
                            </h2>

                            <p className="mt-2 max-w-md text-muted-foreground">
                                لما تقدم على شغلانة، هتظهر هنا
                                وتقدر تتابع حالة تقديمك وتفاصيل
                                الشغلانة من نفس المكان.
                            </p>

                            <Link
                                href="/craftsman/find"
                                className="mt-6"
                            >
                                <span className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90">
                                    <Search className="size-4" />
                                    دور على شغلانات
                                </span>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-10">
                        {monthGroups.map((group) => (
                            <section key={group.key}>
                                {/* Month heading */}
                                <div className="mb-4 flex items-center gap-4">
                                    <div className="shrink-0">
                                        <h2 className="text-xl font-bold sm:text-2xl">
                                            {group.label}
                                        </h2>

                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {group.applications.length}{" "}
                                            {group.applications.length ===
                                            1
                                                ? "تقديم"
                                                : "تقديمات"}
                                        </p>
                                    </div>

                                    <Separator className="flex-1" />
                                </div>

                                {/* Applications */}
                                <div className="space-y-3">
                                    {group.applications.map(
                                        (application) => {
                                            const job =
                                                application.job;

                                            if (!job) {
                                                return null;
                                            }

                                            return (
                                                <Link
                                                    key={
                                                        application.id
                                                    }
                                                    href={`/jobs/${job.id}`}
                                                    className="block"
                                                >
                                                    <Card className="transition-colors hover:border-primary/40 hover:bg-accent/30">
                                                        <CardHeader className="pb-3">
                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                <div className="min-w-0">
                                                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                                                        <ApplicationStatusBadge
                                                                            status={
                                                                                application.status
                                                                            }
                                                                        />

                                                                        <JobStatusBadge
                                                                            status={
                                                                                job.status
                                                                            }
                                                                        />
                                                                    </div>

                                                                    <h3 className="truncate text-lg font-semibold sm:text-xl">
                                                                        {
                                                                            job.title
                                                                        }
                                                                    </h3>
                                                                </div>

                                                                <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                                                                    <CalendarDays className="size-4" />
                                                                    {formatDate(
                                                                        application.created_at,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </CardHeader>

                                                        <CardContent className="pt-0">
                                                            {job.description && (
                                                                <p className="mb-5 line-clamp-2 max-w-3xl text-muted-foreground">
                                                                    {
                                                                        job.description
                                                                    }
                                                                </p>
                                                            )}

                                                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <BriefcaseBusiness className="size-4" />
                                                                    {
                                                                        job.service_type
                                                                    }
                                                                </span>

                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <MapPin className="size-4" />
                                                                    {
                                                                        job.area
                                                                    }
                                                                </span>

                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <Banknote className="size-4" />
                                                                    عرضك:{" "}
                                                                    <span className="font-medium text-foreground">
                                                                        {formatPrice(
                                                                            application.proposed_price,
                                                                        )}
                                                                    </span>
                                                                </span>

                                                                <span className="inline-flex items-center gap-1.5">
                                                                    السعر المطلوب:{" "}
                                                                    <span className="font-medium text-foreground">
                                                                        {formatBudget(
                                                                            job.budget,
                                                                        )}
                                                                    </span>
                                                                </span>

                                                                <span className="ms-auto hidden items-center gap-1 text-sm font-medium text-primary sm:inline-flex">
                                                                    عرض التفاصيل
                                                                    <ArrowLeft className="size-4" />
                                                                </span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </Link>
                                            );
                                        },
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}