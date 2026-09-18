import { notFound } from "next/navigation";
import {
    Activity,
    BadgeCheck,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    Send,
    ShieldCheck,
    Star,
    UserRound,
    Wrench,
    XCircle,
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { createClient } from "@/lib/supabase/server";

type ProfilePageProps = {
    params: Promise<{
        id: string;
    }>;
};

type Review = {
    id: string;
    work_rating: number | null;
    respect_rating: number | null;
    client_experience: string | null;
    issue_type: string | null;
    comment: string | null;
    created_at: string;
    reviewer_id: string;
    job_id: string;
    reviewer: {
        id: string;
        full_name: string;
        avatar_url: string | null;
    } | null;
    job: {
        id: string;
        title: string;
    } | null;
};

type PublicCraftsmanProfile = {
    bio: string | null;
    experience_years: number | null;
    areas: string[];
    verification_status: string;
    is_available: boolean;
    average_response_time_minutes: number | null;
    response_rate: number;
    completion_rate: number;
    work_type: string;
};

type PrivateCraftsmanProfile = {
    phone: string | null;
    shop_address: string | null;
    temporary_area: string | null;
    temporary_location_until: string | null;
};

type ClientProfile = {
    gender: string | null;
    created_at: string;
};

type ClientRecentJob = {
    id: string;
    title: string;
    service_type: string;
    area: string;
    status: string;
    created_at: string;
    selected_craftsman_id: string | null;
};

const roleLabels = {
    client: "عميل",
    craftsman: "صنايعي",
    admin: "مسؤول",
    team: "فريق صنايعي",
} as const;

const RATING_JOB_THRESHOLD = 5;

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("");
}

function formatExperience(years: number | null) {
    if (years === null || years === undefined) {
        return "غير محددة";
    }

    if (years === 0) {
        return "أقل من سنة";
    }

    if (years === 1) {
        return "سنة واحدة";
    }

    if (years === 2) {
        return "سنتان";
    }

    if (years >= 3 && years <= 10) {
        return `${years} سنوات`;
    }

    return `${years} سنة`;
}

function formatResponseTime(minutes: number | null) {
    if (minutes === null || minutes === undefined) {
        return "غير محدد";
    }

    if (minutes < 60) {
        return `${minutes} دقيقة`;
    }

    const hours = Math.round(minutes / 60);

    if (hours === 1) {
        return "ساعة تقريبًا";
    }

    return `${hours} ساعات تقريبًا`;
}

function formatReviewDate(date: string) {
    return new Intl.DateTimeFormat("ar-EG", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(date));
}

function formatDate(date: string) {
    return new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
    }).format(new Date(date));
}

function formatDistance(distanceKm: number | null) {
    if (distanceKm === null || !Number.isFinite(distanceKm)) {
        return "المسافة غير متاحة";
    }

    if (distanceKm < 1) {
        return "أقل من 1 كم منك";
    }

    if (distanceKm < 10) {
        return `${distanceKm.toFixed(1)} كم منك`;
    }

    return `${Math.round(distanceKm)} كم منك`;
}

function StarRating({
    rating,
    size = "h-4 w-4",
}: {
    rating: number | null;
    size?: string;
}) {
    if (rating === null) {
        return (
            <span className="text-sm text-muted-foreground">
                غير متوفر
            </span>
        );
    }

    return (
        <div className="flex items-center gap-0.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`${size} ${
                        star <= rating
                            ? "fill-warning text-warning"
                            : "text-muted-foreground/30"
                    }`}
                />
            ))}
        </div>
    );
}

function getIssueTypeLabel(issueType: string) {
    switch (issueType) {
        case "late_unavailable":
            return "تأخير أو عدم التواجد";
        case "changed_requirements":
            return "تغيير في المتطلبات";
        case "communication":
            return "مشكلة في التواصل";
        case "payment_issue":
            return "مشكلة في الدفع";
        case "other":
            return "مشكلة أخرى";
        default:
            return issueType;
    }
}

export default async function ProfilePage({
    params,
}: ProfilePageProps) {
    const { id } = await params;

    const supabase = await createClient();

    /*
     * Authentication is optional.
     * Guests can view public profiles.
     * Owners additionally get private fields.
     */
    const {
        data: { user },
    } = await supabase.auth.getUser();

    /*
     * ============================================================
     * BASE PROFILE
     * ============================================================
     */

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
            `
            id,
            full_name,
            role,
            is_active,
            avatar_url,
            created_at
            `,
        )
        .eq("id", id)
        .maybeSingle();

    if (profileError || !profile) {
        notFound();
    }

    const isCraftsman = profile.role === "craftsman";
    const isClient = profile.role === "client";
    const isActive = profile.is_active;
    const isOwnProfile = !!user && profile.id === user.id;

    /*
     * ============================================================
     * DISTANCE FROM CURRENT USER
     * ============================================================
     *
     * The RPC calculates the distance server-side.
     * No latitude/longitude is exposed to the browser.
     *
     * We don't calculate a distance for the user's own profile.
     * Guests don't have a location to compare against.
     */

    let distanceKm: number | null = null;

    if (user && !isOwnProfile) {
        const { data, error } = await supabase.rpc(
            "get_distance_from_user",
            {
                target_user_id: id,
            },
        );

        if (error) {
            console.error(
                "Failed to calculate profile distance:",
                error,
            );
        } else if (typeof data === "number") {
            distanceKm = data;
        }
    }

    const distanceLabel =
        user && !isOwnProfile
            ? formatDistance(distanceKm)
            : null;

    /*
     * ============================================================
     * ROLE-SPECIFIC PROFILE DATA
     * ============================================================
     */

    let craftsman: PublicCraftsmanProfile | null = null;
    let craftsmanPrivate: PrivateCraftsmanProfile | null = null;
    let client: ClientProfile | null = null;

    if (isCraftsman) {
        const { data, error } = await supabase
            .from("craftsman_profiles")
            .select(
                `
                bio,
                experience_years,
                areas,
                verification_status,
                is_available,
                average_response_time_minutes,
                response_rate,
                completion_rate,
                work_type
                `,
            )
            .eq("id", id)
            .maybeSingle();

        if (error || !data) {
            notFound();
        }

        craftsman = {
            bio: data.bio ?? null,
            experience_years: data.experience_years ?? null,
            areas: data.areas ?? [],
            verification_status: data.verification_status,
            is_available: data.is_available ?? false,
            average_response_time_minutes:
                data.average_response_time_minutes ?? null,
            response_rate: Number(data.response_rate ?? 0),
            completion_rate: Number(data.completion_rate ?? 0),
            work_type: data.work_type ?? "أخرى",
        };

        /*
         * Private craftsman fields.
         * These are never fetched for other users.
         */
        if (isOwnProfile) {
            const { data: privateData, error: privateError } =
                await supabase
                    .from("craftsman_profiles")
                    .select(
                        `
                        phone,
                        shop_address,
                        temporary_area,
                        temporary_location_until
                        `,
                    )
                    .eq("id", id)
                    .maybeSingle();

            if (privateError) {
                console.error(
                    "Failed to fetch private craftsman profile:",
                    privateError,
                );
            } else if (privateData) {
                craftsmanPrivate = privateData;
            }
        }
    }

    if (isClient) {
        /*
         * IMPORTANT:
         * area was removed from client_profiles.
         *
         * The client's exact location now lives privately in
         * profiles.location and is deliberately NOT selected here.
         */
        const { data, error } = await supabase
            .from("client_profiles")
            .select(
                `
                gender,
                created_at
                `,
            )
            .eq("id", id)
            .maybeSingle();

        if (error || !data) {
            notFound();
        }

        client = {
            gender: data.gender,
            created_at: data.created_at,
        };
    }

    /*
     * ============================================================
     * CRAFTSMAN DATA
     * ============================================================
     */

    let craftsmanReviews: Review[] = [];
    let completedJobs = 0;

    /*
     * ============================================================
     * CLIENT DATA
     * ============================================================
     */

    let clientTotalJobs = 0;
    let clientCompletedJobs = 0;
    let clientActiveJobs = 0;

    let clientRecentJobs: ClientRecentJob[] = [];

    let clientReviews: Review[] = [];

    /*
     * ============================================================
     * CRAFTSMAN STATS + REVIEWS
     * ============================================================
     */

    if (isCraftsman) {
        const {
            count: completedJobsCount,
            error: completedJobsError,
        } = await supabase
            .from("jobs")
            .select("id", {
                count: "exact",
                head: true,
            })
            .eq("selected_craftsman_id", id)
            .eq("status", "completed");

        if (completedJobsError) {
            console.error(
                "Failed to count craftsman completed jobs:",
                completedJobsError,
            );
        } else {
            completedJobs = completedJobsCount ?? 0;
        }

        const { data: reviewRows, error: reviewsError } = await supabase
            .from("reviews")
            .select(
                `
                id,
                work_rating,
                respect_rating,
                client_experience,
                issue_type,
                comment,
                created_at,
                reviewer_id,
                job_id
                `,
            )
            .eq("reviewee_id", id)
            .eq("reviewee_role", "craftsman")
            .order("created_at", {
                ascending: false,
            });

        if (reviewsError) {
            console.error(
                "Failed to fetch craftsman reviews:",
                reviewsError,
            );
        } else {
            const rows = reviewRows ?? [];

            const reviewerIds = [
                ...new Set(rows.map((review) => review.reviewer_id)),
            ];

            const jobIds = [
                ...new Set(rows.map((review) => review.job_id)),
            ];

            const [{ data: reviewers }, { data: jobs }] =
                await Promise.all([
                    reviewerIds.length
                        ? supabase
                              .from("profiles")
                              .select("id, full_name, avatar_url")
                              .in("id", reviewerIds)
                        : Promise.resolve({ data: [] }),

                    jobIds.length
                        ? supabase
                              .from("jobs")
                              .select("id, title")
                              .in("id", jobIds)
                        : Promise.resolve({ data: [] }),
                ]);

            const reviewerMap = new Map(
                (reviewers ?? []).map((reviewer) => [
                    reviewer.id,
                    reviewer,
                ]),
            );

            const jobMap = new Map(
                (jobs ?? []).map((job) => [job.id, job]),
            );

            craftsmanReviews = rows.map((review) => ({
                id: review.id,
                work_rating: review.work_rating,
                respect_rating: review.respect_rating,
                client_experience: review.client_experience,
                issue_type: review.issue_type,
                comment: review.comment,
                created_at: review.created_at,
                reviewer_id: review.reviewer_id,
                job_id: review.job_id,
                reviewer:
                    reviewerMap.get(review.reviewer_id) ?? null,
                job: jobMap.get(review.job_id) ?? null,
            }));
        }
    }

    /*
     * ============================================================
     * CLIENT STATS + REVIEWS
     * ============================================================
     */

    if (isClient) {
        const [
            { count: totalJobs },
            { count: completedJobsCount },
            { count: activeJobsCount },
            { data: recentJobs },
            { data: reviewRows, error: reviewsError },
        ] = await Promise.all([
            supabase
                .from("jobs")
                .select("id", {
                    count: "exact",
                    head: true,
                })
                .eq("client_id", id),

            supabase
                .from("jobs")
                .select("id", {
                    count: "exact",
                    head: true,
                })
                .eq("client_id", id)
                .eq("status", "completed"),

            supabase
                .from("jobs")
                .select("id", {
                    count: "exact",
                    head: true,
                })
                .eq("client_id", id)
                .in("status", [
                    "open",
                    "in_progress",
                    "completion_requested",
                ]),

            supabase
                .from("jobs")
                .select(
                    `
                    id,
                    title,
                    service_type,
                    area,
                    status,
                    created_at,
                    selected_craftsman_id
                    `,
                )
                .eq("client_id", id)
                .order("created_at", {
                    ascending: false,
                })
                .limit(5),

            supabase
                .from("reviews")
                .select(
                    `
                    id,
                    work_rating,
                    respect_rating,
                    client_experience,
                    issue_type,
                    comment,
                    created_at,
                    reviewer_id,
                    job_id
                    `,
                )
                .eq("reviewee_id", id)
                .eq("reviewee_role", "client")
                .order("created_at", {
                    ascending: false,
                }),
        ]);

        clientTotalJobs = totalJobs ?? 0;
        clientCompletedJobs = completedJobsCount ?? 0;
        clientActiveJobs = activeJobsCount ?? 0;
        clientRecentJobs = recentJobs ?? [];

        if (reviewsError) {
            console.error(
                "Failed to fetch client reviews:",
                reviewsError,
            );
        } else {
            const rows = reviewRows ?? [];

            const reviewerIds = [
                ...new Set(rows.map((review) => review.reviewer_id)),
            ];

            const jobIds = [
                ...new Set(rows.map((review) => review.job_id)),
            ];

            const [{ data: reviewers }, { data: jobs }] =
                await Promise.all([
                    reviewerIds.length
                        ? supabase
                              .from("profiles")
                              .select("id, full_name, avatar_url")
                              .in("id", reviewerIds)
                        : Promise.resolve({ data: [] }),

                    jobIds.length
                        ? supabase
                              .from("jobs")
                              .select("id, title")
                              .in("id", jobIds)
                        : Promise.resolve({ data: [] }),
                ]);

            const reviewerMap = new Map(
                (reviewers ?? []).map((reviewer) => [
                    reviewer.id,
                    reviewer,
                ]),
            );

            const jobMap = new Map(
                (jobs ?? []).map((job) => [job.id, job]),
            );

            clientReviews = rows.map((review) => ({
                id: review.id,
                work_rating: review.work_rating,
                respect_rating: review.respect_rating,
                client_experience: review.client_experience,
                issue_type: review.issue_type,
                comment: review.comment,
                created_at: review.created_at,
                reviewer_id: review.reviewer_id,
                job_id: review.job_id,
                reviewer:
                    reviewerMap.get(review.reviewer_id) ?? null,
                job: jobMap.get(review.job_id) ?? null,
            }));
        }
    }

    /*
     * ============================================================
     * RATINGS
     * ============================================================
     */

    const activeReviews = isCraftsman
        ? craftsmanReviews
        : clientReviews;

    const workRatings = activeReviews
        .map((review) => review.work_rating)
        .filter(
            (rating): rating is number =>
                typeof rating === "number",
        );

    const respectRatings = activeReviews
        .map((review) => review.respect_rating)
        .filter(
            (rating): rating is number =>
                typeof rating === "number",
        );

    const averageWorkRating =
        workRatings.length > 0
            ? workRatings.reduce(
                  (sum, rating) => sum + rating,
                  0,
              ) / workRatings.length
            : null;

    const averageRespectRating =
        respectRatings.length > 0
            ? respectRatings.reduce(
                  (sum, rating) => sum + rating,
                  0,
              ) / respectRatings.length
            : null;

    const canShowOverallRating =
        isCraftsman &&
        completedJobs >= RATING_JOB_THRESHOLD;

    const initials = getInitials(profile.full_name);

    const isVerified =
        isCraftsman &&
        craftsman?.verification_status === "verified";

    const isAvailable =
        isCraftsman &&
        craftsman?.is_available === true;

    const hasTemporaryLocation =
        isOwnProfile &&
        !!craftsmanPrivate?.temporary_area &&
        !!craftsmanPrivate?.temporary_location_until &&
        new Date(
            craftsmanPrivate.temporary_location_until,
        ) > new Date();

    const clientStatusLabel = {
        open: "مفتوح",
        in_progress: "قيد التنفيذ",
        completion_requested: "في انتظار الإتمام",
        completed: "مكتمل",
        cancelled: "ملغي",
    } as const;

    return (
        <main className="min-h-screen bg-background py-8 md:py-10">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* ======================================================
                    PROFILE HEADER
                ======================================================= */}

                <Card className="overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-start">
                            <Avatar className="h-28 w-28 shrink-0 border-4 border-background shadow-sm md:h-32 md:w-32">
                                <AvatarImage
                                    src={
                                        profile.avatar_url ??
                                        undefined
                                    }
                                    alt={profile.full_name}
                                />

                                <AvatarFallback className="text-2xl font-semibold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-bold md:text-3xl">
                                        {profile.full_name}
                                    </h1>

                                    {isCraftsman && isVerified && (
                                        <Badge className="gap-1 bg-verified text-verified-foreground hover:bg-verified">
                                            <BadgeCheck className="h-4 w-4" />
                                            موثّق
                                        </Badge>
                                    )}

                                    {!isActive && (
                                        <Badge variant="secondary">
                                            الحساب غير نشط
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        {isCraftsman ? (
                                            <Wrench className="h-4 w-4" />
                                        ) : (
                                            <UserRound className="h-4 w-4" />
                                        )}

                                        <span>
                                            {roleLabels[
                                                profile.role as keyof typeof roleLabels
                                            ] ?? profile.role}
                                        </span>
                                    </div>

                                    {isCraftsman &&
                                        craftsman?.work_type && (
                                            <>
                                                <span className="hidden text-border sm:inline">
                                                    |
                                                </span>

                                                <span>
                                                    {craftsman.work_type}
                                                </span>
                                            </>
                                        )}

                                    {isCraftsman && (
                                        <>
                                            <span className="hidden text-border sm:inline">
                                                |
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`h-2 w-2 rounded-full ${
                                                        isAvailable
                                                            ? "bg-available"
                                                            : "bg-unavailable"
                                                    }`}
                                                />

                                                <span>
                                                    {isAvailable
                                                        ? "متاح للعمل"
                                                        : "غير متاح حاليًا"}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {isClient &&
                                        distanceLabel && (
                                            <>
                                                <span className="hidden text-border sm:inline">
                                                    |
                                                </span>

                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4" />

                                                    <span>
                                                        {distanceLabel}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                </div>

                                {isCraftsman &&
                                craftsman?.areas?.length ? (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {craftsman.areas.map(
                                            (area) => (
                                                <Badge
                                                    key={area}
                                                    variant="secondary"
                                                    className="font-normal"
                                                >
                                                    <MapPin className="ml-1 h-3.5 w-3.5" />
                                                    {area}
                                                </Badge>
                                            ),
                                        )}
                                    </div>
                                ) : null}
                            </div>

                            {isCraftsman &&
                                isActive &&
                                profile.id !== user?.id && (
                                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                                        <Link
                                            href={`/client/job/new?craftsman=${id}`}
                                        >
                                            <Button className="gap-2 bg-primary">
                                                <Send className="h-4 w-4" />
                                                ابعت للصنايعي ده عرض جديد
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                        {/* ==================================================
                            CRAFTSMAN
                        =================================================== */}

                        {isCraftsman && craftsman && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            نظرة عامة
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="grid grid-cols-2 divide-x divide-x-reverse md:grid-cols-5">
                                            <div className="px-4 text-center first:pr-0">
                                                {canShowOverallRating &&
                                                averageWorkRating !==
                                                    null ? (
                                                    <>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Star className="h-5 w-5 fill-warning text-warning" />

                                                            <span className="text-2xl font-bold">
                                                                {averageWorkRating.toFixed(
                                                                    1,
                                                                )}
                                                            </span>
                                                        </div>

                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            التقييم
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-sm font-semibold">
                                                            لم يظهر بعد
                                                        </p>

                                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                            يظهر بعد إتمام{" "}
                                                            {
                                                                RATING_JOB_THRESHOLD
                                                            }{" "}
                                                            أعمال
                                                        </p>
                                                    </>
                                                )}
                                            </div>

                                            <div className="px-4 text-center">
                                                <p className="text-2xl font-bold">
                                                    {completedJobs}
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    عمل مكتمل
                                                </p>
                                            </div>

                                            <div className="mt-6 border-t px-4 pt-6 text-center md:mt-0 md:border-t-0 md:pt-0">
                                                <p className="text-2xl font-bold">
                                                    {
                                                        craftsmanReviews.length
                                                    }
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    تقييم
                                                </p>
                                            </div>

                                            <div className="mt-6 border-t px-4 pt-6 text-center md:mt-0 md:border-t-0 md:pt-0">
                                                <p className="text-lg font-bold">
                                                    {
                                                        craftsman.completion_rate
                                                    }
                                                    %
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    معدل الإتمام
                                                </p>
                                            </div>

                                            <div className="mt-6 border-t px-4 pt-6 text-center md:mt-0 md:border-t-0 md:pt-0">
                                                <p className="text-lg font-bold">
                                                    {
                                                        craftsman.response_rate
                                                    }
                                                    %
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    معدل الرد
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {craftsman.bio && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                نبذة عني
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent>
                                            <p className="whitespace-pre-line text-muted-foreground">
                                                {craftsman.bio}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            الخبرة
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                                                <BriefcaseBusiness className="h-5 w-5" />
                                            </div>

                                            <div>
                                                <p className="font-medium">
                                                    سنوات الخبرة
                                                </p>

                                                <p className="mt-1 text-muted-foreground">
                                                    {formatExperience(
                                                        craftsman.experience_years,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {craftsman.areas?.length ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                مناطق العمل
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {craftsman.areas.map(
                                                    (area) => (
                                                        <Badge
                                                            key={area}
                                                            variant="secondary"
                                                            className="px-3 py-1.5 font-normal"
                                                        >
                                                            <MapPin className="ml-1.5 h-4 w-4" />
                                                            {area}
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : null}

                                {isOwnProfile &&
                                    craftsmanPrivate?.shop_address && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    مكان العمل
                                                </CardTitle>
                                            </CardHeader>

                                            <CardContent>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                                                        <MapPin className="h-5 w-5" />
                                                    </div>

                                                    <div>
                                                        <p className="font-medium">
                                                            عنوان المحل
                                                        </p>

                                                        <p className="mt-1 text-muted-foreground">
                                                            {
                                                                craftsmanPrivate.shop_address
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                {hasTemporaryLocation && (
                                                    <>
                                                        <Separator className="my-5" />

                                                        <div className="flex items-start gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
                                                                <MapPin className="h-5 w-5" />
                                                            </div>

                                                            <div>
                                                                <p className="font-medium">
                                                                    متواجد مؤقتًا في
                                                                </p>

                                                                <p className="mt-1 text-muted-foreground">
                                                                    {
                                                                        craftsmanPrivate.temporary_area
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <CardTitle>
                                                    تقييمات العملاء
                                                </CardTitle>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    آراء العملاء بعد إتمام الأعمال
                                                </p>
                                            </div>

                                            {canShowOverallRating &&
                                                averageWorkRating !==
                                                    null && (
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <Star className="h-5 w-5 fill-warning text-warning" />

                                                        <span className="font-semibold">
                                                            {averageWorkRating.toFixed(
                                                                1,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        {craftsmanReviews.length === 0 ? (
                                            <div className="rounded-lg border border-dashed p-8 text-center">
                                                <Star className="mx-auto h-8 w-8 text-muted-foreground/50" />

                                                <p className="mt-3 font-medium">
                                                    لا توجد تقييمات بعد
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    ستظهر تقييمات العملاء بعد إتمام الأعمال.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {craftsmanReviews.map(
                                                    (review) => (
                                                        <ReviewItem
                                                            key={review.id}
                                                            review={review}
                                                            fallbackName="العميل"
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {/* ==================================================
                            CLIENT
                        =================================================== */}

                        {isClient && client && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="h-5 w-5 text-primary" />
                                            نظرة عامة
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                            <StatBox
                                                icon={
                                                    <BriefcaseBusiness className="h-4 w-4" />
                                                }
                                                label="الطلبات المنشورة"
                                                value={clientTotalJobs}
                                            />

                                            <StatBox
                                                icon={
                                                    <CheckCircle2 className="h-4 w-4" />
                                                }
                                                label="أعمال مكتملة"
                                                value={clientCompletedJobs}
                                            />

                                            <StatBox
                                                icon={
                                                    <Clock3 className="h-4 w-4" />
                                                }
                                                label="طلبات نشطة"
                                                value={clientActiveJobs}
                                            />

                                            <StatBox
                                                icon={<MessageSquareIcon />}
                                                label="التقييمات"
                                                value={
                                                    clientReviews.length
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            عن العميل
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-5">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                    المسافة
                                                </div>

                                                <p className="font-medium">
                                                    {isOwnProfile
                                                        ? "أنت"
                                                        : distanceLabel ??
                                                          "المسافة غير متاحة"}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <UserRound className="h-4 w-4" />
                                                    النوع
                                                </div>

                                                <p className="font-medium">
                                                    {client.gender ===
                                                    "male"
                                                        ? "ذكر"
                                                        : client.gender ===
                                                            "female"
                                                          ? "أنثى"
                                                          : "غير محدد"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                                                <CalendarDays className="h-4 w-4" />
                                                عضو منذ
                                            </div>

                                            <p className="font-medium">
                                                {formatDate(
                                                    profile.created_at,
                                                )}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BriefcaseBusiness className="h-5 w-5 text-primary" />
                                            نشاط العميل
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        {clientRecentJobs.length ===
                                        0 ? (
                                            <div className="rounded-xl border border-dashed border-border p-8 text-center">
                                                <BriefcaseBusiness className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />

                                                <p className="text-sm text-muted-foreground">
                                                    لا توجد طلبات منشورة حتى الآن
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border">
                                                {clientRecentJobs.map(
                                                    (job) => (
                                                        <div
                                                            key={job.id}
                                                            className="flex flex-col gap-4 py-5 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                                                        >
                                                            <div className="min-w-0 space-y-2">
                                                                <p className="truncate font-medium">
                                                                    {
                                                                        job.title
                                                                    }
                                                                </p>

                                                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                                    <span>
                                                                        {
                                                                            job.service_type
                                                                        }
                                                                    </span>

                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="h-3.5 w-3.5" />
                                                                        {
                                                                            job.area
                                                                        }
                                                                    </span>

                                                                    <span>
                                                                        {formatDate(
                                                                            job.created_at,
                                                                        )}
                                                                    </span>

                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="shrink-0"
                                                                    >
                                                                        {clientStatusLabel[
                                                                            job.status as keyof typeof clientStatusLabel
                                                                        ] ??
                                                                            job.status}
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            <Link
                                                                href={`/client/jobs/${job.id}`}
                                                                className="shrink-0"
                                                            >
                                                                <Button
                                                                    variant={
                                                                        job.status ===
                                                                        "open"
                                                                            ? "default"
                                                                            : "secondary"
                                                                    }
                                                                >
                                                                    شوف الشغلانة
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Star className="h-5 w-5 text-warning" />
                                                    تقييمات الصنايعية
                                                </CardTitle>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    آراء الصنايعية بعد إتمام الأعمال
                                                </p>
                                            </div>

                                            <Badge variant="secondary">
                                                {clientReviews.length} تقييم
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        {clientReviews.length ===
                                        0 ? (
                                            <div className="rounded-lg border border-dashed p-8 text-center">
                                                <Star className="mx-auto h-8 w-8 text-muted-foreground/50" />

                                                <p className="mt-3 font-medium">
                                                    لا توجد تقييمات بعد
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    ستظهر تقييمات الصنايعية بعد إتمام الأعمال.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {clientReviews.map(
                                                    (review) => (
                                                        <ReviewItem
                                                            key={review.id}
                                                            review={review}
                                                            fallbackName="صنايعي"
                                                            showJobPrefix
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>

                    {/* ======================================================
                        SIDEBAR
                    ======================================================= */}

                    <aside className="space-y-6">
                        {isCraftsman && craftsman && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        حالة الحساب
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <UserRound className="h-5 w-5 text-muted-foreground" />
                                            <span>
                                                حالة الحساب
                                            </span>
                                        </div>

                                        <Badge
                                            className={
                                                isActive
                                                    ? "bg-available text-available-foreground hover:bg-available"
                                                    : "bg-unavailable text-unavailable-foreground hover:bg-unavailable"
                                            }
                                        >
                                            {isActive
                                                ? "نشط"
                                                : "غير نشط"}
                                        </Badge>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                                            <span>
                                                التحقق من الهوية
                                            </span>
                                        </div>

                                        {isVerified ? (
                                            <Badge className="gap-1 bg-verified text-verified-foreground hover:bg-verified">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                موثّق
                                            </Badge>
                                        ) : craftsman.verification_status ===
                                          "pending" ? (
                                            <Badge className="bg-pending text-pending-foreground hover:bg-pending">
                                                قيد المراجعة
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">
                                                غير موثّق
                                            </Badge>
                                        )}
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
                                            <span>
                                                حالة العمل
                                            </span>
                                        </div>

                                        <Badge
                                            className={
                                                isAvailable
                                                    ? "bg-available text-available-foreground hover:bg-available"
                                                    : "bg-unavailable text-unavailable-foreground hover:bg-unavailable"
                                            }
                                        >
                                            {isAvailable
                                                ? "متاح"
                                                : "غير متاح"}
                                        </Badge>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <Clock3 className="h-5 w-5 text-muted-foreground" />
                                            <span>
                                                سرعة الرد
                                            </span>
                                        </div>

                                        <span className="text-sm font-medium">
                                            {formatResponseTime(
                                                craftsman.average_response_time_minutes,
                                            )}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {isClient && client && (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            حالة الحساب
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <UserRound className="h-5 w-5 text-muted-foreground" />
                                                <span>
                                                    حالة الحساب
                                                </span>
                                            </div>

                                            {isActive ? (
                                                <Badge className="gap-1 bg-available text-available-foreground hover:bg-available">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    نشط
                                                </Badge>
                                            ) : (
                                                <Badge className="gap-1 bg-unavailable text-unavailable-foreground hover:bg-unavailable">
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    غير نشط
                                                </Badge>
                                            )}
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-muted-foreground" />

                                                <span>
                                                    المسافة
                                                </span>
                                            </div>

                                            <span className="text-sm font-medium">
                                                {isOwnProfile
                                                    ? "أنت"
                                                    : distanceLabel ??
                                                      "غير متاحة"}
                                            </span>
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-5 w-5 text-muted-foreground" />

                                                <span>
                                                    عضو منذ
                                                </span>
                                            </div>

                                            <span className="text-sm font-medium">
                                                {formatDate(
                                                    profile.created_at,
                                                )}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            التقييم
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="space-y-5">
                                        {clientReviews.length > 0 ? (
                                            <>
                                                <div>
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span className="text-sm font-medium">
                                                            جودة التعامل في الشغل
                                                        </span>

                                                        <span className="text-sm font-semibold">
                                                            {averageWorkRating !==
                                                            null
                                                                ? averageWorkRating.toFixed(
                                                                      1,
                                                                  )
                                                                : "—"}
                                                        </span>
                                                    </div>

                                                    <StarRating
                                                        rating={
                                                            averageWorkRating
                                                        }
                                                    />
                                                </div>

                                                <Separator />

                                                <div>
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span className="text-sm font-medium">
                                                            الاحترام والتعامل
                                                        </span>

                                                        <span className="text-sm font-semibold">
                                                            {averageRespectRating !==
                                                            null
                                                                ? averageRespectRating.toFixed(
                                                                      1,
                                                                  )
                                                                : "—"}
                                                        </span>
                                                    </div>

                                                    <StarRating
                                                        rating={
                                                            averageRespectRating
                                                        }
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="rounded-lg bg-muted/30 p-4 text-center">
                                                <Star className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />

                                                <p className="text-sm font-medium">
                                                    لم يتم تقييم العميل بعد
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                    سيظهر تقييم العميل بعد حصوله
                                                    على تقييمات من الصنايعية.
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
}

/*
 * ============================================================
 * SMALL UI COMPONENTS
 * ============================================================
 */

function StatBox({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                {icon}

                <span className="text-sm">
                    {label}
                </span>
            </div>

            <p className="text-2xl font-bold">
                {value}
            </p>
        </div>
    );
}

function ReviewItem({
    review,
    fallbackName,
    showJobPrefix = false,
}: {
    review: Review;
    fallbackName: string;
    showJobPrefix?: boolean;
}) {
    return (
        <div className="py-6 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                        src={
                            review.reviewer?.avatar_url ??
                            undefined
                        }
                        alt={
                            review.reviewer?.full_name ??
                            fallbackName
                        }
                    />

                    <AvatarFallback>
                        {getInitials(
                            review.reviewer?.full_name ??
                                fallbackName,
                        )}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold">
                                {review.reviewer?.full_name ??
                                    fallbackName}
                            </p>

                            {review.job && (
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {showJobPrefix
                                        ? "عن شغلانة: "
                                        : ""}
                                    {review.job.title}
                                </p>
                            )}
                        </div>

                        <span className="text-xs text-muted-foreground">
                            {formatReviewDate(
                                review.created_at,
                            )}
                        </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-muted/40 p-3">
                            <p className="mb-2 text-sm font-medium">
                                جودة الشغل
                            </p>

                            <div className="flex items-center gap-2">
                                <StarRating
                                    rating={review.work_rating}
                                />

                                {review.work_rating !== null && (
                                    <span className="text-sm font-medium">
                                        {review.work_rating}/5
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg bg-muted/40 p-3">
                            <p className="mb-2 text-sm font-medium">
                                الاحترام والتعامل
                            </p>

                            <div className="flex items-center gap-2">
                                <StarRating
                                    rating={review.respect_rating}
                                />

                                {review.respect_rating !== null && (
                                    <span className="text-sm font-medium">
                                        {review.respect_rating}/5
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {review.comment && (
                        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                            {review.comment}
                        </p>
                    )}

                    {review.issue_type && (
                        <Badge
                            variant="secondary"
                            className="mt-3 font-normal"
                        >
                            {getIssueTypeLabel(
                                review.issue_type,
                            )}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}

function MessageSquareIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        </svg>
    );
}