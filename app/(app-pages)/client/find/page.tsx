import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import FindFilters from "./(components)/find-filters";
import CraftsmanList from "./(components)/craftsman-list";

type SearchParams = {
    q?: string;
    workType?: string;
    experience?: string;
    area?: string;
    available?: string;
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
    shop_address: string | null;
    work_type: string | null;
    verification_status: string;
    is_available: boolean;
    average_response_time_minutes: number | null;
    response_rate: number;
    completion_rate: number;
    work_rating: number | null;
    respect_rating: number | null;
    review_count: number;
};

async function ClientFindContent({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const q = searchParams.q?.trim() || "";
    const workType = searchParams.workType?.trim() || "";
    const area = searchParams.area?.trim() || "";
    const availableOnly = searchParams.available === "1";

    const minExperience = Number(searchParams.experience);

    let query = supabase
        .from("craftsman_profiles")
        .select(
            `
            id,
            bio,
            experience_years,
            areas,
            shop_address,
            work_type,
            verification_status,
            is_available,
            average_response_time_minutes,
            response_rate,
            completion_rate,
            profiles!inner (
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
        .order("is_available", { ascending: false })
        .order("completion_rate", { ascending: false })
        .order("response_rate", { ascending: false })
        .limit(50);

    if (workType) {
        query = query.eq("work_type", workType);
    }

    if (area) {
        query = query.contains("areas", [area]);
    }

    if (Number.isFinite(minExperience) && minExperience > 0) {
        query = query.gte("experience_years", minExperience);
    }

    if (availableOnly) {
        query = query.eq("is_available", true);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Failed to fetch craftsmen:", error);

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

    let craftsmen: Craftsman[] = (data || []).map((item: any) => ({
        id: item.id,
        full_name: item.profiles?.full_name || "صنايعي",
        avatar_url: item.profiles?.avatar_url || null,
        bio: item.bio || null,
        experience_years: item.experience_years ?? null,
        areas: item.areas || [],
        shop_address: item.shop_address || null,
        work_type: item.work_type || null,
        verification_status: item.verification_status,
        is_available: item.is_available ?? false,
        average_response_time_minutes:
            item.average_response_time_minutes ?? null,
        response_rate: Number(item.response_rate || 0),
        completion_rate: Number(item.completion_rate || 0),

        // Filled below from actual reviews.
        work_rating: null,
        respect_rating: null,
        review_count: 0,
    }));

    /*
     * Name/bio search spans a joined table + a local column,
     * so narrow it here after fetching the capped result set.
     */
    if (q) {
        const needle = q.toLowerCase();

        craftsmen = craftsmen.filter(
            (craftsman) =>
                craftsman.full_name.toLowerCase().includes(needle) ||
                (craftsman.bio?.toLowerCase().includes(needle) ?? false)
        );
    }

    /*
     * Fetch all reviews for the craftsmen in one query.
     *
     * We intentionally keep work_rating and respect_rating separate.
     * They represent two different things and should not be merged into
     * one artificial rating.
     */
    const craftsmanIds = craftsmen.map((craftsman) => craftsman.id);

    if (craftsmanIds.length > 0) {
        const { data: reviews, error: reviewsError } = await supabase
            .from("reviews")
            .select(`
                reviewee_id,
                work_rating,
                respect_rating
            `)
            .in("reviewee_id", craftsmanIds)
            .eq("reviewee_role", "craftsman");

        if (reviewsError) {
            console.error("Failed to fetch craftsman reviews:", reviewsError);
        } else {
            const reviewsByCraftsman = new Map<string, Review[]>();

            for (const review of (reviews ?? []) as Review[]) {
                const existing =
                    reviewsByCraftsman.get(review.reviewee_id) ?? [];

                existing.push(review);

                reviewsByCraftsman.set(
                    review.reviewee_id,
                    existing
                );
            }

            craftsmen = craftsmen.map((craftsman) => {
                const reviewsForCraftsman =
                    reviewsByCraftsman.get(craftsman.id) ?? [];

                const workRatings = reviewsForCraftsman
                    .map((review) => review.work_rating)
                    .filter(
                        (rating): rating is number =>
                            rating !== null
                    );

                const respectRatings = reviewsForCraftsman
                    .map((review) => review.respect_rating)
                    .filter(
                        (rating): rating is number =>
                            rating !== null
                    );

                const workRating =
                    workRatings.length > 0
                        ? workRatings.reduce(
                              (sum, rating) => sum + rating,
                              0
                          ) / workRatings.length
                        : null;

                const respectRating =
                    respectRatings.length > 0
                        ? respectRatings.reduce(
                              (sum, rating) => sum + rating,
                              0
                          ) / respectRatings.length
                        : null;

                return {
                    ...craftsman,
                    work_rating: workRating,
                    respect_rating: respectRating,
                    review_count: reviewsForCraftsman.length,
                };
            });
        }
    }

    return (
        <div className="flex flex-col gap-6 lg:flex-row-reverse lg:items-start">
            <FindFilters
                q={q}
                workType={workType}
                experience={searchParams.experience ?? ""}
                area={area}
                available={availableOnly}
            />

            <CraftsmanList craftsmen={craftsmen} />
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
            {/* Static content — never suspended */}
            <nav className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>لوحة التحكم</span>
                <span className="text-muted-foreground/50">‹</span>
                <span className="text-foreground">
                    دور على صنايعي
                </span>
            </nav>

            <div className="mb-8">
                <h1>دور على صنايعي</h1>

                <p className="mt-2 text-[15px] text-muted-foreground">
                    لاقي الصنايعي المناسب لشغلك في منطقتك
                </p>
            </div>

            {/* Only the database-dependent part suspends */}
            <Suspense
                key={JSON.stringify(params)}
                fallback={<ContentLoading />}
            >
                <ClientFindContent searchParams={params} />
            </Suspense>
        </main>
    );
}