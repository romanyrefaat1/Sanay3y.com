import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import FindFilters from "./(components)/find-filters";
import CraftsmanList from "./(components)/craftsman-list";
import { TelegramConnectAlert } from "@/components/connect-telegram-alert";

type SearchParams = {
    q?: string;
    workType?: string;
    experience?: string;
    available?: string;
    distance?: string;
};

type PageProps = {
    searchParams: Promise<SearchParams>;
};

type Review = {
    reviewee_id: string;
    work_rating: number | null;
    respect_rating: number | null;
};

type Craftsman = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    experience_years: number | null;
    areas: string[];
    work_type: string | null;
    verification_status: string;
    is_available: boolean;
    average_response_time_minutes: number | null;
    response_rate: number;
    completion_rate: number;
    work_rating: number | null;
    respect_rating: number | null;
    review_count: number;
    distance_km: number | null;
};

const DEFAULT_DISTANCE_KM = 6;

async function ClientFindContent({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const q = searchParams.q?.trim() || "";
    const workType = searchParams.workType?.trim() || "";
    const availableOnly = searchParams.available === "1";

    const minExperience = Number(searchParams.experience);

    const parsedDistance = Number(searchParams.distance);

    const distanceKm =
        Number.isFinite(parsedDistance) && parsedDistance > 0
            ? parsedDistance
            : DEFAULT_DISTANCE_KM;

    /*
     * The client must have a saved location for distance-based
     * craftsman discovery.
     *
     * The RPC performs the PostGIS calculation inside the database.
     * Exact coordinates are never returned to the browser.
     */
    let nearbyCraftsmanIds: string[] | null = null;
    let distanceByCraftsman = new Map<string, number>();

    if (user) {
        const { data: nearbyCraftsmen, error } =
            await supabase.rpc(
                "get_nearby_craftsmen",
                {
                    max_distance_km: distanceKm,
                }
            );

        if (error) {
            console.error(
                "Failed to fetch nearby craftsmen:",
                error
            );

            return (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
                    <p className="text-sm font-medium text-destructive">
                        حصلت مشكلة أثناء تحميل الصنايعية
                    </p>

                    <p className="mt-1 text-sm text-destructive/80">
                        جرب تحدّث الصفحة تاني
                    </p>
                </div>
            );
        }

        nearbyCraftsmanIds =
            nearbyCraftsmen?.map(
                (row: {
                    craftsman_id: string;
                    distance_km: number | string;
                }) => row.craftsman_id
            ) ?? [];

        for (const row of nearbyCraftsmen ?? []) {
            const parsedDistance = Number(
                row.distance_km
            );

            if (Number.isFinite(parsedDistance)) {
                distanceByCraftsman.set(
                    row.craftsman_id,
                    parsedDistance
                );
            }
        }
    }

    let query = supabase
        .from("craftsman_profiles")
        .select(
            `
            id,
            bio,
            experience_years,
            areas,
            work_type,
            verification_status,
            is_available,
            average_response_time_minutes,
            response_rate,
            completion_rate,
            profiles!inner (
                id,
                full_name,
                avatar_url,
                is_active,
                role
            )
            `
        )
        .eq("verification_status", "verified")
        .eq("profiles.role", "craftsman")
        .eq("profiles.is_active", true)
        .order("is_available", {
            ascending: false,
        })
        .order("completion_rate", {
            ascending: false,
        })
        .order("response_rate", {
            ascending: false,
        })
        .limit(50);

    /*
     * Authenticated clients use their saved location
     * as the center of the search.
     */
    if (user) {
        if (nearbyCraftsmanIds.length === 0) {
            return (
                <div className="flex flex-col gap-6 lg:flex-row-reverse lg:items-start">
                    <FindFilters
                        q={q}
                        workType={workType}
                        experience={
                            searchParams.experience ?? ""
                        }
                        available={availableOnly}
                        distance={String(distanceKm)}
                    />

                    <CraftsmanList craftsmen={[]} />
                </div>
            );
        }

        query = query.in(
            "id",
            nearbyCraftsmanIds
        );
    }

    if (workType) {
        query = query.eq("work_type", workType);
    }

    if (
        Number.isFinite(minExperience) &&
        minExperience > 0
    ) {
        query = query.gte(
            "experience_years",
            minExperience
        );
    }

    if (availableOnly) {
        query = query.eq(
            "is_available",
            true
        );
    }

    const { data, error } = await query;

    if (error) {
        console.error(
            "Failed to fetch craftsmen:",
            error
        );

        return (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
                <p className="text-sm font-medium text-destructive">
                    حصلت مشكلة أثناء تحميل الصنايعية
                </p>

                <p className="mt-1 text-sm text-destructive/80">
                    جرب تحدّث الصفحة تاني
                </p>
            </div>
        );
    }

    let craftsmen: Craftsman[] = (
        data ?? []
    ).map((item: any) => ({
        id: item.id,
        full_name:
            item.profiles?.full_name ||
            "صنايعي",
        avatar_url:
            item.profiles?.avatar_url ||
            null,
        bio: item.bio || null,
        experience_years:
            item.experience_years ?? null,
        areas: item.areas || [],
        work_type:
            item.work_type || null,
        verification_status:
            item.verification_status,
        is_available:
            item.is_available ?? false,
        average_response_time_minutes:
            item.average_response_time_minutes ??
            null,
        response_rate:
            Number(item.response_rate || 0),
        completion_rate:
            Number(item.completion_rate || 0),
        work_rating: null,
        respect_rating: null,
        review_count: 0,
        distance_km:
            distanceByCraftsman.get(item.id) ??
            null,
    }));

    /*
     * Search by craftsman name or bio.
     */
    if (q) {
        const needle = q.toLowerCase();

        craftsmen = craftsmen.filter(
            (craftsman) =>
                craftsman.full_name
                    .toLowerCase()
                    .includes(needle) ||
                (craftsman.bio
                    ?.toLowerCase()
                    .includes(needle) ??
                    false)
        );
    }

    /*
     * Fetch reviews for visible craftsmen.
     */
    const craftsmanIds =
        craftsmen.map(
            (craftsman) => craftsman.id
        );

    if (craftsmanIds.length > 0) {
        const {
            data: reviews,
            error: reviewsError,
        } = await supabase
            .from("reviews")
            .select(
                `
                reviewee_id,
                work_rating,
                respect_rating
                `
            )
            .in(
                "reviewee_id",
                craftsmanIds
            )
            .eq(
                "reviewee_role",
                "craftsman"
            );

        if (reviewsError) {
            console.error(
                "Failed to fetch craftsman reviews:",
                reviewsError
            );
        } else {
            const reviewsByCraftsman =
                new Map<
                    string,
                    Review[]
                >();

            for (const review of (reviews ??
                []) as Review[]) {
                const existing =
                    reviewsByCraftsman.get(
                        review.reviewee_id
                    ) ?? [];

                existing.push(review);

                reviewsByCraftsman.set(
                    review.reviewee_id,
                    existing
                );
            }

            craftsmen = craftsmen.map(
                (craftsman) => {
                    const reviewsForCraftsman =
                        reviewsByCraftsman.get(
                            craftsman.id
                        ) ?? [];

                    const workRatings =
                        reviewsForCraftsman
                            .map(
                                (review) =>
                                    review.work_rating
                            )
                            .filter(
                                (
                                    rating
                                ): rating is number =>
                                    rating !==
                                    null
                            );

                    const respectRatings =
                        reviewsForCraftsman
                            .map(
                                (review) =>
                                    review.respect_rating
                            )
                            .filter(
                                (
                                    rating
                                ): rating is number =>
                                    rating !==
                                    null
                            );

                    const workRating =
                        workRatings.length >
                        0
                            ? workRatings.reduce(
                                  (
                                      sum,
                                      rating
                                  ) =>
                                      sum +
                                      rating,
                                  0
                              ) /
                              workRatings.length
                            : null;

                    const respectRating =
                        respectRatings.length >
                        0
                            ? respectRatings.reduce(
                                  (
                                      sum,
                                      rating
                                  ) =>
                                      sum +
                                      rating,
                                  0
                              ) /
                              respectRatings.length
                            : null;

                    return {
                        ...craftsman,
                        work_rating:
                            workRating,
                        respect_rating:
                            respectRating,
                        review_count:
                            reviewsForCraftsman.length,
                    };
                }
            );
        }
    }

    return (
        <div className="flex flex-col gap-6 lg:flex-row-reverse lg:items-start">
            <FindFilters
                q={q}
                workType={workType}
                experience={
                    searchParams.experience ?? ""
                }
                available={availableOnly}
                distance={String(distanceKm)}
            />

            <CraftsmanList
                craftsmen={craftsmen}
            />
        </div>
    );
}

function ContentLoading() {
    return (
        <div className="flex flex-col gap-6 lg:flex-row-reverse lg:items-start">
            <div className="h-64 w-full animate-pulse rounded-lg bg-muted lg:w-72" />

            <div className="flex-1 space-y-4">
                <div className="h-32 animate-pulse rounded-lg bg-muted" />
                <div className="h-32 animate-pulse rounded-lg bg-muted" />
                <div className="h-32 animate-pulse rounded-lg bg-muted" />
            </div>
        </div>
    );
}

export default async function ClientFindPage({
    searchParams,
}: PageProps) {
    const params = await searchParams;

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
            <nav className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>الرئيسية</span>

                <span className="text-muted-foreground/50">
                    ‹
                </span>

                <span className="text-foreground">
                    دور على صنايعي
                </span>
            </nav>

            <div className="mb-8">
                <h1>دور على صنايعي</h1>

                <p className="mt-2 text-[15px] text-muted-foreground">
                    لاقي الصنايعي المناسب لشغلك القريب منك
                </p>
            </div>

            <TelegramConnectAlert />

            <Suspense
                key={JSON.stringify(params)}
                fallback={<ContentLoading />}
            >
                <ClientFindContent
                    searchParams={params}
                />
            </Suspense>
        </main>
    );
}