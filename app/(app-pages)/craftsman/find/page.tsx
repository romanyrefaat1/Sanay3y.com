import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

import FindFilters from "./find-filters";
import JobList from "./job-list";

type SearchParams = {
    service?: string;
    area?: string;
    minBudget?: string;
    maxBudget?: string;
};

type PageProps = {
    searchParams: Promise<SearchParams>;
};

async function CraftsmanFindContent({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const service = searchParams.service?.trim() || "";
    const area = searchParams.area?.trim() || "";

    const minBudget = Number(searchParams.minBudget);
    const maxBudget = Number(searchParams.maxBudget);

    let query = supabase
        .from("jobs")
        .select(
            `
            id,
            client_id,
            title,
            description,
            service_type,
            budget,
            area,
            image_url,
            status,
            created_at,
            client:profiles!jobs_client_id_fkey (
                id,
                full_name
            )
            `
        )
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50);

    if (service) {
        query = query.eq("service_type", service);
    }

    if (area) {
        query = query.ilike("area", `%${area}%`);
    }

    if (Number.isFinite(minBudget) && minBudget >= 0) {
        query = query.gte("budget", minBudget);
    }

    if (Number.isFinite(maxBudget) && maxBudget >= 0) {
        query = query.lte("budget", maxBudget);
    }

    const { data: jobs, error } = await query;

    if (error) {
        console.error("Failed to fetch jobs:", error);

        return (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
                <p className="text-sm font-medium text-destructive">
                    حصل خطأ أثناء تحميل الشغلانات
                </p>

                <p className="mt-1 text-sm text-destructive/80">
                    جرب تحدّث الصفحة تاني
                </p>
            </div>
        );
    }

    const jobIds = jobs?.map((job) => job.id) ?? [];

    let appliedJobIds = new Set<string>();

    /*
     * Guests can browse jobs, but only authenticated craftsmen
     * need to know which jobs they have already applied to.
     */
    if (user && jobIds.length > 0) {
        const { data: applications, error: applicationsError } =
            await supabase
                .from("job_applications")
                .select("job_id")
                .eq("craftsman_id", user.id)
                .in("job_id", jobIds);

        if (applicationsError) {
            console.error(
                "Failed to fetch application status:",
                applicationsError
            );
        } else {
            appliedJobIds = new Set(
                applications?.map(
                    (application) => application.job_id
                ) ?? []
            );
        }
    }

    return (
        <div className="flex flex-col gap-6 lg:flex-row-reverse lg:items-start">
            <FindFilters
                service={service}
                area={area}
                minBudget={searchParams.minBudget ?? ""}
                maxBudget={searchParams.maxBudget ?? ""}
            />

            <JobList
                jobs={jobs ?? []}
                appliedJobIds={Array.from(appliedJobIds)}
            />
        </div>
    );
}

function Loading() {
    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
            <div className="space-y-3">
                <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
                <div className="h-5 w-80 animate-pulse rounded-lg bg-muted" />
            </div>

            <div className="mt-8 h-14 animate-pulse rounded-lg bg-muted" />

            <div className="mt-4 flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-9 w-20 animate-pulse rounded-full bg-muted"
                    />
                ))}
            </div>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row-reverse">
                <div className="h-64 w-full animate-pulse rounded-lg bg-muted lg:w-72" />

                <div className="flex-1 space-y-4">
                    <div className="h-40 animate-pulse rounded-lg bg-muted" />
                    <div className="h-40 animate-pulse rounded-lg bg-muted" />
                </div>
            </div>
        </div>
    );
}

export default async function CraftsmanFindPage({
    searchParams,
}: PageProps) {
    const params = await searchParams;

    return (
        <Suspense fallback={<Loading />}>
            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
                <nav className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span>الرئيسية</span>
                    <span className="text-muted-foreground/50">‹</span>
                    <span className="text-foreground">
                        الشغلانات المتاحة
                    </span>
                </nav>

                <div className="mb-8">
                    <h1>الشغلانات المتاحة</h1>

                    <p className="mt-2 text-[15px] text-muted-foreground">
                        دور على شغلانات مناسبة ليك وقدّم عليها
                    </p>
                </div>

                <CraftsmanFindContent searchParams={params} />
            </main>
        </Suspense>
    );
}