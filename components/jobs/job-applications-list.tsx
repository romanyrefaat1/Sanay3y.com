"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BadgeCheck,
    BriefcaseBusiness,
    Clock3,
    MapPin,
    UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import AcceptJobButton from "@/components/jobs/accept-job-button";
import { Button } from "../ui/button";

type JobApplicationsListProps = {
    jobId: string;
    isOwner: boolean;
    jobStatus: string;
    selectedCraftsmanId: string;
};

type Application = {
    id: string;
    job_id: string;
    craftsman_id: string;
    proposed_price: number;
    price_type: "fixed" | "starting_from" | string;
    message: string;
    status:
        | "pending"
        | "accepted"
        | "rejected"
        | "withdrawn"
        | string;
    created_at: string;
    updated_at: string;
};

type CraftsmanProfile = {
    id: string;
    experience_years: number | null;
    areas: string[];
    verification_status:
        | "pending"
        | "verified"
        | "rejected"
        | string;
    is_available: boolean;
    response_rate: number;
    completion_rate: number;
};

type Profile = {
    id: string;
    full_name: string;
    avatar_url: string | null;
};

type ApplicationWithCraftsman = Application & {
    craftsman: Profile | null;
    craftsmanProfile: CraftsmanProfile | null;
    distanceKm: number | null;
};

const applicationStatusConfig = {
    pending: {
        label: "قيد المراجعة",
        className:
            "border-amber-500/20 bg-amber-500/10 text-amber-700",
    },

    accepted: {
        label: "مقبول",
        className:
            "border-green-500/20 bg-green-500/10 text-green-700",
    },

    rejected: {
        label: "مرفوض",
        className:
            "border-destructive/20 bg-destructive/10 text-destructive",
    },

    withdrawn: {
        label: "منسحب",
        className:
            "border-muted-foreground/20 bg-muted text-muted-foreground",
    },
} as const;

const formatDate = (date: string) =>
    new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "medium",
    }).format(new Date(date));

function formatDistance(distanceKm: number | null) {
    if (
        distanceKm === null ||
        !Number.isFinite(distanceKm)
    ) {
        return "المسافة غير متاحة";
    }

    if (distanceKm < 1) {
        return "أقل من 1 كم";
    }

    if (distanceKm < 10) {
        return `${distanceKm.toFixed(1)} كم`;
    }

    return `${Math.round(distanceKm)} كم`;
}

export function JobApplicationsList({
    jobId,
    isOwner,
    jobStatus,
    selectedCraftsmanId,
}: JobApplicationsListProps) {
    const [applications, setApplications] =
        useState<ApplicationWithCraftsman[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function loadApplications() {
            try {
                setIsLoading(true);
                setError(null);

                const supabase = createClient();

                /*
                 * ============================================================
                 * GET APPLICATIONS
                 * ============================================================
                 */

                const {
                    data: applicationData,
                    error: applicationsError,
                } = await supabase
                    .from("job_applications")
                    .select(
                        `
                        id,
                        job_id,
                        craftsman_id,
                        proposed_price,
                        price_type,
                        message,
                        status,
                        created_at,
                        updated_at
                        `,
                    )
                    .eq("job_id", jobId)
                    .order("created_at", {
                        ascending: false,
                    });

                if (applicationsError) {
                    throw applicationsError;
                }

                if (!mounted) {
                    return;
                }

                if (
                    !applicationData ||
                    applicationData.length === 0
                ) {
                    setApplications([]);
                    return;
                }

                /*
                 * ============================================================
                 * CRAFTSMAN IDS
                 * ============================================================
                 */

                const craftsmanIds = [
                    ...new Set(
                        applicationData.map(
                            (application) =>
                                application.craftsman_id,
                        ),
                    ),
                ];

                /*
                 * ============================================================
                 * PUBLIC PROFILES
                 * ============================================================
                 */

                const {
                    data: profileData,
                    error: profileError,
                } = await supabase
                    .from("profiles")
                    .select(
                        "id, full_name, avatar_url",
                    )
                    .in("id", craftsmanIds);

                if (profileError) {
                    throw profileError;
                }

                /*
                 * ============================================================
                 * CRAFTSMAN PROFILES
                 * ============================================================
                 */

                const {
                    data: craftsmanProfileData,
                    error: craftsmanProfileError,
                } = await supabase
                    .from("craftsman_profiles")
                    .select(
                        [
                            "id",
                            "experience_years",
                            "areas",
                            "verification_status",
                            "is_available",
                            "response_rate",
                            "completion_rate",
                        ].join(", "),
                    )
                    .in("id", craftsmanIds);

                if (craftsmanProfileError) {
                    throw craftsmanProfileError;
                }

                /*
                 * ============================================================
                 * PROFILE MAPS
                 * ============================================================
                 */

                const profileMap = new Map<
                    string,
                    Profile
                >(
                    (profileData ?? []).map(
                        (profile) => [
                            profile.id,
                            profile as Profile,
                        ],
                    ),
                );

                const craftsmanProfileMap =
                    new Map<
                        string,
                        CraftsmanProfile
                    >(
                        (
                            craftsmanProfileData ??
                            []
                        ).map(
                            (profile) => [
                                profile.id,
                                profile as CraftsmanProfile,
                            ],
                        ),
                    );

                /*
                 * ============================================================
                 * DISTANCES
                 * ============================================================
                 *
                 * get_distance_from_user() calculates the distance
                 * between the currently authenticated user and the
                 * target profile using the saved PostGIS locations.
                 *
                 * This component is intended for the job owner, so
                 * the authenticated user is the owner.
                 *
                 * No coordinates are exposed to the browser.
                 */

                const distanceMap = new Map<
                    string,
                    number | null
                >();

                if (isOwner) {
                    await Promise.all(
                        craftsmanIds.map(
                            async (craftsmanId) => {
                                try {
                                    const {
                                        data,
                                        error,
                                    } =
                                        await supabase.rpc(
                                            "get_distance_from_user",
                                            {
                                                target_user_id:
                                                    craftsmanId,
                                            },
                                        );

                                    if (error) {
                                        console.error(
                                            `Failed to calculate distance for ${craftsmanId}:`,
                                            error,
                                        );

                                        distanceMap.set(
                                            craftsmanId,
                                            null,
                                        );

                                        return;
                                    }

                                    distanceMap.set(
                                        craftsmanId,
                                        typeof data ===
                                            "number"
                                            ? data
                                            : null,
                                    );
                                } catch (error) {
                                    console.error(
                                        `Failed to calculate distance for ${craftsmanId}:`,
                                        error,
                                    );

                                    distanceMap.set(
                                        craftsmanId,
                                        null,
                                    );
                                }
                            },
                        ),
                    );
                }

                /*
                 * ============================================================
                 * COMBINE DATA
                 * ============================================================
                 */

                const combinedApplications =
                    applicationData.map(
                        (application) => ({
                            ...(application as Application),

                            craftsman:
                                profileMap.get(
                                    application.craftsman_id,
                                ) ?? null,

                            craftsmanProfile:
                                craftsmanProfileMap.get(
                                    application.craftsman_id,
                                ) ?? null,

                            distanceKm:
                                distanceMap.get(
                                    application.craftsman_id,
                                ) ?? null,
                        }),
                    );

                if (mounted) {
                    setApplications(
                        combinedApplications,
                    );
                }
            } catch (error) {
                console.error(
                    "Failed to load job applications:",
                    error,
                );

                if (mounted) {
                    setError(
                        "لم نتمكن من تحميل التقديمات.",
                    );
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadApplications();

        return () => {
            mounted = false;
        };
    }, [jobId, isOwner]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Clock3 className="size-4 animate-pulse" />
                        جاري تحميل التقديمات...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-sm text-destructive">
                        {error}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">
                        المتقدمين
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {applications.length === 0
                            ? "لسه مفيش حد قدم على الشغلانة."
                            : applications.length ===
                                1
                              ? "متقدم واحد على الشغلانة"
                              : `${applications.length} متقدمين على الشغلانة`}
                    </p>
                </div>
            </div>

            {applications.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground" />

                        <p className="mt-3 font-semibold">
                            مفيش تقديمات لسه
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            لما الصنايعية يبدأوا
                            يقدموا، هتظهر عروضهم هنا.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {applications.map(
                        (application) => {
                            const craftsman =
                                application.craftsman;

                            const craftsmanProfile =
                                application.craftsmanProfile;

                            const applicationStatus =
                                applicationStatusConfig[
                                    application.status as keyof typeof applicationStatusConfig
                                ] ??
                                applicationStatusConfig.pending;

                            const canAccept =
                                isOwner &&
                                jobStatus ===
                                    "open" &&
                                application.status ===
                                    "pending";

                            const distanceLabel =
                                formatDistance(
                                    application.distanceKm,
                                );

                            return (
                                <Card
                                    key={
                                        application.id
                                    }
                                >
                                    <CardContent className="p-5 sm:p-6">
                                        {/* Applicant header */}
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                                    {craftsman?.avatar_url ? (
                                                        <img
                                                            src={
                                                                craftsman.avatar_url
                                                            }
                                                            alt={
                                                                craftsman.full_name
                                                            }
                                                            className="size-full object-cover"
                                                        />
                                                    ) : (
                                                        <UserRound className="size-5 text-muted-foreground" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Link
                                                            href={`/profile/${application.craftsman_id}`}
                                                            className="font-semibold hover:underline"
                                                        >
                                                            {craftsman?.full_name ??
                                                                "صنايعي"}
                                                        </Link>

                                                        {craftsmanProfile?.verification_status ===
                                                            "verified" && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="gap-1"
                                                            >
                                                                <BadgeCheck className="size-3.5" />
                                                                حساب
                                                                موثّق
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                                        {craftsmanProfile?.experience_years !==
                                                            null &&
                                                            craftsmanProfile?.experience_years !==
                                                                undefined && (
                                                                <span>
                                                                    {
                                                                        craftsmanProfile.experience_years
                                                                    }{" "}
                                                                    {craftsmanProfile.experience_years ===
                                                                    1
                                                                        ? "سنة"
                                                                        : "سنين"}{" "}
                                                                    خبرة
                                                                </span>
                                                            )}

                                                        {craftsmanProfile?.is_available && (
                                                            <span className="text-green-600">
                                                                متاح
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <Badge
                                                variant="outline"
                                                className={
                                                    applicationStatus.className
                                                }
                                            >
                                                {
                                                    applicationStatus.label
                                                }
                                            </Badge>
                                        </div>

                                        {/* Distance */}
                                        {isOwner && (
                                            <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                                                <MapPin className="size-4 shrink-0" />

                                                <span>
                                                    {application.distanceKm !==
                                                    null
                                                        ? `${distanceLabel} منك`
                                                        : "المسافة غير متاحة"}
                                                </span>
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock3 className="size-3.5" />

                                            {formatDate(
                                                application.created_at,
                                            )}
                                        </div>

                                        <Separator className="my-5" />

                                        {/* Offer information */}
                                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    السعر{" "}
                                                    {application.price_type ===
                                                    "fixed"
                                                        ? "المقترح"
                                                        : "يبدأ من"}
                                                </p>

                                                <p className="mt-1 text-base font-semibold">
                                                    {Number(
                                                        application.proposed_price,
                                                    ).toLocaleString(
                                                        "ar-EG",
                                                    )}{" "}
                                                    جنيه
                                                </p>

                                                <span className="text-xs leading-5 text-muted-foreground">
                                                    {application.price_type ===
                                                    "fixed"
                                                        ? "هو ده السعر اللي هتحاسب عليه"
                                                        : "السعر ده هو أقل سعر الصنايعي مستعد ياخده وهيقرر السعر الحقيقي لما يوصل ويعاين الحالة"}
                                                </span>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    نسبة الرد
                                                </p>

                                                <p className="mt-1 text-base font-semibold">
                                                    {Number(
                                                        craftsmanProfile?.response_rate ??
                                                            0,
                                                    ).toLocaleString(
                                                        "ar-EG",
                                                    )}
                                                    %
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    نسبة إتمام
                                                    الأعمال
                                                </p>

                                                <p className="mt-1 text-base font-semibold">
                                                    {Number(
                                                        craftsmanProfile?.completion_rate ??
                                                            0,
                                                    ).toLocaleString(
                                                        "ar-EG",
                                                    )}
                                                    %
                                                </p>
                                            </div>
                                        </div>

                                        {/* Message */}
                                        <div className="mt-5 bg-muted/50 px-2 py-5">
                                            <p className="text-xs text-muted-foreground">
                                                الرسالة
                                            </p>

                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
                                                {
                                                    application.message
                                                }
                                            </p>
                                        </div>

                                        {/* Areas */}
                                        {craftsmanProfile?.areas
                                            ?.length >
                                            0 && (
                                            <div className="mt-5">
                                                <p className="text-xs text-muted-foreground">
                                                    مناطق
                                                    العمل
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {craftsmanProfile.areas.map(
                                                        (
                                                            area,
                                                        ) => (
                                                            <Badge
                                                                key={
                                                                    area
                                                                }
                                                                variant="outline"
                                                                className="gap-1"
                                                            >
                                                                <MapPin className="size-3.5" />

                                                                {
                                                                    area
                                                                }
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Accept */}
                                        {canAccept && (
                                            <div className="mt-6 border-t pt-5">
                                                <AcceptJobButton
                                                    jobId={
                                                        jobId
                                                    }
                                                    applicationId={
                                                        application.id
                                                    }
                                                    craftsmanName={
                                                        craftsman?.full_name ??
                                                        "الصنايعي"
                                                    }
                                                />
                                            </div>
                                        )}

                                        {/* Accepted */}
                                        {application.status ===
                                            "accepted" && (
                                            <div>
                                                <div className="mt-6 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700">
                                                    <BadgeCheck className="size-4" />

                                                    تم قبول هذا
                                                    الصنايعي
                                                </div>

                                                {isOwner &&
                                                    jobStatus ===
                                                        "in_progress" &&
                                                    application.craftsman_id ===
                                                        selectedCraftsmanId && (
                                                        <div className="mt-4">
                                                            <span>
                                                                عايز تكلم
                                                                الصنايعي ده؟
                                                                {" "}
                                                                <Link
                                                                    href={`/chats/${jobId}`}
                                                                    className="underline"
                                                                >
                                                                    دوس هنا
                                                                </Link>
                                                            </span>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        },
                    )}
                </div>
            )}
        </section>
    );
}