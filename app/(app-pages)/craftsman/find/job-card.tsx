import Link from "next/link";
import {
    CalendarDays,
    MapPin,
    Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Job = {
    id: string;
    title: string;
    description: string;
    service_type: string;
    budget: number;
    area: string;
    image_url: string | null;
    created_at: string;
    client:
        | {
              id: string;
              full_name: string | null;
          }
        | {
              id: string;
              full_name: string | null;
          }[]
        | null;
};

type JobCardProps = {
    job: Job;
    hasApplied: boolean;
};

function getClientName(job: Job) {
    if (!job.client) {
        return "عميل";
    }

    if (Array.isArray(job.client)) {
        return job.client[0]?.full_name || "عميل";
    }

    return job.client.full_name || "عميل";
}

function getInitial(name: string) {
    return name.trim().charAt(0) || "ع";
}

function formatDate(date: string) {
    return new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "long",
    }).format(new Date(date));
}

function formatBudget(budget: number) {
    return new Intl.NumberFormat("ar-EG").format(budget);
}

export default function JobCard({ job, hasApplied }: JobCardProps) {
    const clientName = getClientName(job);

    return (
        <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30 hover:shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                        {getInitial(clientName)}
                    </div>

                    <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                                {job.service_type}
                            </Badge>

                            <Badge
                                variant="outline"
                                className="border-[hsl(var(--available))]/30 bg-[hsl(var(--available))]/10 text-[hsl(var(--available))]"
                            >
                                متاحة
                            </Badge>

                            {hasApplied && (
                                <Badge
                                    variant="outline"
                                    className="border-primary/30 bg-accent text-accent-foreground"
                                >
                                    قدّمت بالفعل
                                </Badge>
                            )}
                        </div>

                        <h3 className="text-lg font-bold leading-7 text-foreground">
                            {job.title}
                        </h3>

                        <p className="text-sm text-muted-foreground">
                            بواسطة {clientName}
                        </p>
                    </div>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs text-muted-foreground">الميزانية</p>
                    <p className="mt-0.5 text-xl font-bold text-primary">
                        {formatBudget(job.budget)}
                        <span className="mr-1 text-sm font-medium text-muted-foreground">
                            ج.م
                        </span>
                    </p>
                </div>
            </div>

            <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {job.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 shrink-0" />
                    {job.area}
                </span>

                <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 shrink-0" />
                    {formatDate(job.created_at)}
                </span>

                <span className="inline-flex items-center gap-1.5">
                    <Wallet className="size-4 shrink-0" />
                    {formatBudget(job.budget)} ج.م
                </span>
            </div>

            <div className="mt-5">
                <Button
                    asChild
                    className="w-full sm:w-auto sm:px-8"
                    size="lg"
                >
                    <Link href={`/jobs/${job.id}`}>
                        {hasApplied ? "عرض حالة الطلب" : "عرض تفاصيل الشغلانة"}
                    </Link>
                </Button>
            </div>
        </div>
    );
}