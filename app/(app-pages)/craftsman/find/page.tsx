import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";

import FindFilters from "./find-filters";
import JobList from "./job-list";

type SearchParams = {
    service?: string;
    minBudget?: string;
    maxBudget?: string;
    distance?: string;
};

type PageProps = {
    searchParams: Promise<SearchParams>;
};

const DEFAULT_DISTANCE_KM = 6;

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

    const minBudget = Number(searchParams.minBudget);
    const maxBudget = Number(searchParams.maxBudget);

    const parsedDistance = Number(searchParams.distance);

    const distanceKm =
        Number.isFinite(parsedDistance) && parsedDistance > 0
            ? parsedDistance
            : DEFAULT_DISTANCE_KM;

    let nearbyJobIds: string[] | null = null;

    /*
     * Distance is calculated from:
     * craftsman location -> client's private location
     *
     * The coordinates never get returned to the browser.
     */
    if (user) {
        const { data, error } = await supabase.rpc(
            "get_nearby_open_job_ids",
            {
                max_distance_km: distanceKm,
            }
        );

        if (error) {
            console.error(
                "Failed to fetch nearby jobs:",
                error
            );

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

        nearbyJobIds =
            data?.map((row: { job_id: string }) => row.job_id) ??
            [];
    }

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

    /*
     * Authenticated craftsmen only see jobs within
     * their selected radius.
     */
    if (user) {
        if (nearbyJobIds.length === 0) {
            return (
                <div className="flex flex-col gap-6 lg:flex-row-reverse lg:items-start">
                    <FindFilters
                        service={service}
                        minBudget={
                            searchParams.minBudget ?? ""
                        }
                        maxBudget={
                            searchParams.maxBudget ?? ""
                        }
                        distance={String(distanceKm)}
                    />

                    <JobList
                        jobs={[]}
                        appliedJobIds={[]}
                    />
                </div>
            );
        }

        query = query.in("id", nearbyJobIds);
    }

    if (service) {
        query = query.eq("service_type", service);
    }

    if (
        Number.isFinite(minBudget) &&
        minBudget >= 0
    ) {
        query = query.gte("budget", minBudget);
    }

    if (
        Number.isFinite(maxBudget) &&
        maxBudget >= 0
    ) {
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
     * Only authenticated users need application status.
     */
    if (user && jobIds.length > 0) {
        const {
            data: applications,
            error: applicationsError,
        } = await supabase
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
                minBudget={searchParams.minBudget ?? ""}
                maxBudget={searchParams.maxBudget ?? ""}
                distance={String(distanceKm)}
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

                    <span className="text-muted-foreground/50">
                        ‹
                    </span>

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

                <CraftsmanFindContent
                    searchParams={params}
                />
            </main>
        </Suspense>
    );
}