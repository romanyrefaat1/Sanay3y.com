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

type SearchParams = {
    status?: string;
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
                    "border-blue-500/30 bg-blue-500/10 text-blue-400",
                icon: Search,
            };

        case "in_progress":
            return {
                label: "قيد التنفيذ",
                className:
                    "border-amber-500/30 bg-amber-500/10 text-amber-400",
                icon: Clock3,
            };

        case "completed":
            return {
                label: "مكتملة",
                className:
                    "border-green-500/30 bg-green-500/10 text-green-400",
                icon: CheckCircle2,
            };

        case "cancelled":
            return {
                label: "ملغاة",
                className:
                    "border-red-500/30 bg-red-500/10 text-red-400",
                icon: XCircle,
            };

        default:
            return {
                label: "جديدة",
                className:
                    "border-muted-foreground/20 bg-muted/40 text-muted-foreground",
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

function StatCard({
    label,
    value,
    icon: Icon,
    href,
    active = false,
    iconClassName,
}: {
    label: string;
    value: number;
    icon: typeof BriefcaseBusiness;
    href: string;
    active?: boolean;
    iconClassName: string;
}) {
    return (
        <Link href={href} className="block">
            <Card
                className={`h-full transition-colors hover:border-primary/40 hover:bg-accent/30 ${
                    active ? "border-primary/50 bg-primary/[0.03]" : ""
                }`}
            >
                <CardContent className="flex items-center gap-4 p-5">
                    <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-md ${iconClassName}`}
                    >
                        <Icon className="size-5" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">
                            {label}
                        </p>

                        <p className="mt-0.5 text-2xl font-bold">
                            {value}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default async function ClientMyWorkPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const selectedStatus = params.status;

    const validStatuses = [
        "open",
        "in_progress",
        "completed",
    ];

    const activeStatus = validStatuses.includes(
        selectedStatus || "",
    )
        ? selectedStatus
        : undefined;

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

    const totalJobs = clientJobs.length;

    const openJobs = clientJobs.filter(
        (job) => job.status === "open",
    ).length;

    const inProgressJobs = clientJobs.filter(
        (job) => job.status === "in_progress",
    ).length;

    const completedJobs = clientJobs.filter(
        (job) => job.status === "completed",
    ).length;

    const filteredJobs = activeStatus
        ? clientJobs.filter(
              (job) => job.status === activeStatus,
          )
        : clientJobs;

    const monthGroups = groupJobsByMonth(filteredJobs);

    const getStatusHref = (status?: string) => {
        if (!status) {
            return "/client/my-job-offers";
        }

        return `/client/my-job-offers?status=${status}`;
    };

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

                        <Button
                            asChild
                            size="lg"
                            className="shrink-0 lg:hidden"
                        >
                            <Link href="/client/job/new">
                                <Plus className="size-4" />
                                شغلانة جديدة
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
    label="كل الطلبات"
    value={totalJobs}
    icon={BriefcaseBusiness}
    href={getStatusHref()}
    active={!activeStatus}
    iconClassName="bg-primary/10 text-primary"
/>

<StatCard
    label="مفتوحة"
    value={openJobs}
    icon={Search}
    href={getStatusHref("open")}
    active={activeStatus === "open"}
    iconClassName="bg-blue-500/10 text-blue-400"
/>

<StatCard
    label="قيد التنفيذ"
    value={inProgressJobs}
    icon={Clock3}
    href={getStatusHref("in_progress")}
    active={activeStatus === "in_progress"}
    iconClassName="bg-amber-500/10 text-amber-400"
/>

<StatCard
    label="مكتملة"
    value={completedJobs}
    icon={CheckCircle2}
    href={getStatusHref("completed")}
    active={activeStatus === "completed"}
    iconClassName="bg-green-500/10 text-green-400"
/>
                </div>

                {/* Active filter */}
                {activeStatus && (
                    <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                عرض:
                            </span>

                            <JobStatusBadge status={activeStatus} />

                            <span className="text-sm text-muted-foreground">
                                ({filteredJobs.length})
                            </span>
                        </div>

                        <Button
                            asChild
                            variant="ghost"
                            size="sm"
                        >
                            <Link href="/client/my-job-offers">
                                عرض الكل
                            </Link>
                        </Button>
                    </div>
                )}

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

                            <Button
                                asChild
                                className="mt-6"
                            >
                                <Link href="/client/job/new">
                                    <Plus className="size-4" />
                                    أنشئ أول شغلانة
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : filteredJobs.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <div className="mb-5 flex size-14 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Search className="size-7" />
                            </div>

                            <h2 className="text-2xl font-bold">
                                مفيش شغلانات بالحالة دي
                            </h2>

                            <p className="mt-2 max-w-md text-muted-foreground">
                                مفيش طلبات حالياً بالحالة اللي اخترتها.
                            </p>

                            <Button
                                asChild
                                variant="outline"
                                className="mt-6"
                            >
                                <Link href="/client/my-job-offers">
                                    عرض كل الشغلانات
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