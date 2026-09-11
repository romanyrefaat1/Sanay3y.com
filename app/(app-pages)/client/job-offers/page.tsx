import Link from "next/link";
import {
    ArrowLeft,
    Banknote,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    Plus,
    Search,
    XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { createClient } from "@/lib/supabase/server";

type Job = {
    id: string;
    title: string;
    description: string | null;
    service_type: string;
    budget: number | null;
    area: string;
    status: string;
    image_url: string | null;
    targeted_at_user: string | null;
    created_at: string;
};

type MonthGroup = {
    key: string;
    label: string;
    jobs: Job[];
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

function getStatus(status: string) {
    switch (status) {
        case "open":
            return {
                label: "مفتوحة",
                className:
                    "border-blue-200 bg-blue-50 text-blue-700",
                icon: Search,
            };

        case "in_progress":
            return {
                label: "قيد التنفيذ",
                className:
                    "border-amber-200 bg-amber-50 text-amber-700",
                icon: Clock3,
            };

        case "completed":
            return {
                label: "مكتملة",
                className:
                    "border-green-200 bg-green-50 text-green-700",
                icon: CheckCircle2,
            };

        case "cancelled":
            return {
                label: "ملغاة",
                className:
                    "border-red-200 bg-red-50 text-red-700",
                icon: XCircle,
            };

        default:
            return {
                label: "جديدة",
                className:
                    "border-slate-200 bg-slate-50 text-slate-700",
                icon: Clock3,
            };
    }
}

function groupJobsByMonth(jobs: Job[]): MonthGroup[] {
    const groups = new Map<string, MonthGroup>();

    for (const job of jobs) {
        const date = new Date(job.created_at);

        const year = date.getFullYear();
        const month = date.getMonth();

        const key = `${year}-${String(month + 1).padStart(2, "0")}`;

        if (!groups.has(key)) {
            groups.set(key, {
                key,
                label: formatMonth(job.created_at),
                jobs: [],
            });
        }

        groups.get(key)!.jobs.push(job);
    }

    return Array.from(groups.values());
}

function JobStatusBadge({ status }: { status: string }) {
    const statusData = getStatus(status);
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

export default async function ClientMyWorkPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: jobs, error } = await supabase
        .from("jobs")
        .select(
            `
                id,
                title,
                description,
                service_type,
                budget,
                area,
                status,
                image_url,
                targeted_at_user,
                created_at
            `,
        )
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to load client jobs:", error);
    }

    const clientJobs = (jobs ?? []) as Job[];

    const monthGroups = groupJobsByMonth(clientJobs);

    const activeJobs = clientJobs.filter(
        (job) =>
            job.status === "open" ||
            job.status === "in_progress",
    ).length;

    const completedJobs = clientJobs.filter(
        (job) => job.status === "completed",
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
                                كل الشغلانات اللي أنشأتها على صنايعي،
                                مرتبة من الأحدث للأقدم.
                            </p>
                        </div>

                        <Button asChild size="lg" className="shrink-0 lg:hidden">
                            <Link href="/client/job/new">
                                <Plus className="size-4" />
                                شغلانة جديدة
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-10 grid gap-4 sm:grid-cols-3">
    <Card>
        <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <BriefcaseBusiness className="size-5" />
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                    إجمالي الشغلانات
                </p>

                <p className="mt-0.5 text-2xl font-bold">
                    {clientJobs.length}
                </p>
            </div>
        </CardContent>
    </Card>

    <Card>
        <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
                <Clock3 className="size-5" />
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                    شغلانات نشطة
                </p>

                <p className="mt-0.5 text-2xl font-bold">
                    {activeJobs}
                </p>
            </div>
        </CardContent>
    </Card>

    <Card>
        <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
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

                {/* Empty state */}
                {clientJobs.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <div className="mb-5 flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <BriefcaseBusiness className="size-7" />
                            </div>

                            <h2 className="text-2xl font-bold">
                                لسه مفيش شغلانات
                            </h2>

                            <p className="mt-2 max-w-md text-muted-foreground">
                                لما تنشئ شغلانة جديدة هتظهر هنا،
                                وتقدر تتابع حالتها وتفاصيلها من نفس المكان.
                            </p>

                            <Button asChild className="mt-6">
                                <Link href="/client/job/new">
                                    <Plus className="size-4" />
                                    أنشئ أول شغلانة
                                </Link>
                            </Button>
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
                                            {group.jobs.length}{" "}
                                            {group.jobs.length === 1
                                                ? "شغلانة"
                                                : "شغلانات"}
                                        </p>
                                    </div>

                                    <Separator className="flex-1" />
                                </div>

                                {/* Jobs */}
                                <div className="space-y-3">
                                    {group.jobs.map((job) => (
                                        <Link
                                            key={job.id}
                                            href={`/jobs/${job.id}`}
                                            className="block"
                                        >
                                            <Card className="transition-colors hover:border-primary/40 hover:bg-accent/30">
                                                <CardHeader className="pb-3">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="min-w-0">
                                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                                <JobStatusBadge
                                                                    status={
                                                                        job.status
                                                                    }
                                                                />

                                                                {job.targeted_at_user && (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-sm"
                                                                    >
                                                                        موجهة لصنايعي محدد
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <h3 className="truncate text-lg font-semibold sm:text-xl">
                                                                {job.title}
                                                            </h3>
                                                        </div>

                                                        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                                                            <CalendarDays className="size-4" />
                                                            {formatDate(
                                                                job.created_at,
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
                                                            {job.area}
                                                        </span>

                                                        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                                            <Banknote className="size-4 text-muted-foreground" />
                                                            {formatBudget(
                                                                job.budget,
                                                            )}
                                                        </span>

                                                        <span className="ms-auto hidden items-center gap-1 text-sm font-medium text-primary sm:inline-flex">
                                                            عرض التفاصيل
                                                            <ArrowLeft className="size-4" />
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}