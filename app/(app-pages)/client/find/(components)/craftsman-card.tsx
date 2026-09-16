import Link from "next/link";
import {
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Craftsman = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    experience_years: number | null;
    work_type: string | null;
    verification_status: "pending" | "verified" | "rejected";
    is_available: boolean;
    average_response_time_minutes: number | null;
    response_rate: number;
    completion_rate: number;
    distance_km: number | null;
};

function formatExperience(years: number | null) {
    if (years === null) return "الخبرة غير محددة";
    if (years === 0) return "أقل من سنة";
    if (years === 1) return "سنة واحدة";
    if (years === 2) return "سنتان";

    return `${years} سنوات`;
}

function formatResponseTime(minutes: number | null) {
    if (minutes === null) return null;

    if (minutes < 60) {
        return `${minutes} دقيقة`;
    }

    const hours = Math.round(minutes / 60);

    return hours === 1
        ? "ساعة تقريباً"
        : `${hours} ساعات تقريباً`;
}

function formatDistance(distanceKm: number | null) {
    if (
        distanceKm === null ||
        !Number.isFinite(distanceKm)
    ) {
        return null;
    }

    if (distanceKm < 1) {
        return "أقل من 1 كم منك";
    }

    if (distanceKm < 10) {
        return `${distanceKm.toFixed(1)} كم منك`;
    }

    return `${Math.round(distanceKm)} كم منك`;
}

function getInitials(name: string) {
    const words = name.trim().split(/\s+/);

    if (!words.length) return "ص";

    if (words.length === 1) {
        return words[0].slice(0, 2);
    }

    return `${words[0][0] || ""}${words[1][0] || ""}`;
}

export default function CraftsmanCard({
    craftsman,
}: {
    craftsman: Craftsman;
}) {
    const responseTime = formatResponseTime(
        craftsman.average_response_time_minutes
    );

    const distance = formatDistance(
        craftsman.distance_km
    );

    return (
        <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30 hover:shadow-sm">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                    {craftsman.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={craftsman.avatar_url}
                            alt={craftsman.full_name}
                            className="size-16 rounded-full border border-border object-cover"
                        />
                    ) : (
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted text-base font-semibold text-muted-foreground">
                            {getInitials(
                                craftsman.full_name
                            )}
                        </div>
                    )}

                    <span
                        className="absolute bottom-0 left-0 size-4 rounded-full border-2 border-card"
                        style={{
                            backgroundColor:
                                craftsman.is_available
                                    ? "hsl(var(--available))"
                                    : "hsl(var(--unavailable))",
                        }}
                    />
                </div>

                <div className="min-w-0 flex-1">
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-muted-foreground">
                        {craftsman.work_type && (
                            <Badge variant="secondary">
                                {craftsman.work_type}
                            </Badge>
                        )}

                        {craftsman.is_available && (
                            <Badge
                                variant="outline"
                                className="border-[hsl(var(--available))]/30 bg-[hsl(var(--available))]/10 text-[hsl(var(--available))]"
                            >
                                متاح دلوقتي
                            </Badge>
                        )}

                        {distance && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-3.5 shrink-0" />
                                {distance}
                            </span>
                        )}
                    </div>

                    {/* Name + action */}
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <Link
                            href={`/profile/${craftsman.id}`}
                            className="group flex min-w-0 items-center gap-1.5"
                        >
                            <span className="truncate text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                                {craftsman.full_name}
                            </span>
                        </Link>

                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                        >
                            <Link
                                href={`/profile/${craftsman.id}`}
                            >
                                عرض الملف الشخصي
                            </Link>
                        </Button>
                    </div>

                    {/* Bio */}
                    {craftsman.bio && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {craftsman.bio}
                        </p>
                    )}

                    {/* Stats */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <BriefcaseBusiness className="size-4 shrink-0" />
                            {formatExperience(
                                craftsman.experience_years
                            )}
                        </span>

                        {responseTime && (
                            <span className="inline-flex items-center gap-1.5">
                                <Clock3 className="size-4 shrink-0" />
                                يرد خلال {responseTime}
                            </span>
                        )}

                        {craftsman.completion_rate > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="size-4 shrink-0" />
                                {craftsman.completion_rate}% إتمام
                            </span>
                        )}

                        {craftsman.response_rate > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="size-4 shrink-0" />
                                {craftsman.response_rate}% رد
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}