import { notFound } from "next/navigation";
import {
    BadgeCheck,
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    MapPin,
    Phone,
    Plus,
    Send,
    ShieldCheck,
    Star,
    UserRound,
    Wrench,
} from "lucide-react";

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
import Link from "next/link";

type ProfilePageProps = {
    params: Promise<{
        id: string;
    }>;
};

const roleLabels = {
    client: "عميل",
    craftsman: "صنايعي",
    admin: "مسؤول",
    team: "فريق صنايعي",
} as const;

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

export default async function ProfilePage({
    params,
}: ProfilePageProps) {
    const { id } = await params;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        notFound();
    }

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

    let craftsman = null;
    let client = null;

    if (profile.role === "craftsman") {
        const { data, error } = await supabase
            .from("craftsman_profiles")
            .select(
                `
                phone,
                bio,
                experience_years,
                areas,
                shop_address,
                verification_status,
                is_available,
                average_response_time_minutes,
                response_rate,
                completion_rate,
                temporary_area,
                temporary_location_until,
                work_type
                `,
            )
            .eq("id", id)
            .maybeSingle();

        if (error || !data) {
            notFound();
        }

        craftsman = data;
    }

    if (profile.role === "client") {
        const { data, error } = await supabase
            .from("client_profiles")
            .select(
                `
                phone,
                gender,
                area
                `,
            )
            .eq("id", id)
            .maybeSingle();

        if (error || !data) {
            notFound();
        }

        client = data;
    }

    const initials = getInitials(profile.full_name);

    const isCraftsman = profile.role === "craftsman";
    const isVerified =
        isCraftsman && craftsman?.verification_status === "verified";

    const isAvailable =
        isCraftsman && craftsman?.is_available === true;

    return (
        <main className="min-h-screen bg-background py-8 md:py-10">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Profile header */}
                <Card className="overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-start">
                            <Avatar className="h-28 w-28 shrink-0 border-4 border-background shadow-sm md:h-32 md:w-32">
                                <AvatarImage
                                    src={profile.avatar_url ?? undefined}
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

                                    {isVerified && (
                                        <Badge className="gap-1 bg-verified text-verified-foreground hover:bg-verified">
                                            <BadgeCheck className="h-4 w-4" />
                                            موثّق
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

                                    {isCraftsman && craftsman?.work_type && (
                                        <>
                                            <span className="hidden text-border sm:inline">
                                                |
                                            </span>

                                            <span>{craftsman.work_type}</span>
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
                                </div>

                                {isCraftsman && craftsman?.areas?.length ? (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {craftsman.areas.map((area) => (
                                            <Badge
                                                key={area}
                                                variant="secondary"
                                                className="font-normal"
                                            >
                                                <MapPin className="ml-1 h-3.5 w-3.5" />
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            {profile.id !== user.id && (
                                <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                                    {isCraftsman && (
                                        <Link href={`/client/job/new?craftsman=${id}`}>
                                        <Button className="gap-2">
                                            <Send className="h-4 w-4" />
                                         ابعت للصنايعي ده عرض جديد
                                        </Button>

                                        </Link>
                                    )}

                                    {/* <Button
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        إرسال رسالة
                                    </Button> */}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                        {/* Craftsman stats */}
                        {isCraftsman && craftsman && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>إحصائيات العمل</CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid grid-cols-2 divide-x divide-x-reverse md:grid-cols-4">
                                        <div className="px-4 text-center first:pr-0 last:pl-0">
                                            <p className="text-2xl font-bold text-primary">
                                                {craftsman.response_rate}%
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                معدل الرد
                                            </p>
                                        </div>

                                        <div className="px-4 text-center">
                                            <p className="text-2xl font-bold">
                                                {craftsman.completion_rate}%
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                معدل إتمام العمل
                                            </p>
                                        </div>

                                        <div className="mt-6 border-t px-4 pt-6 text-center md:mt-0 md:border-t-0 md:pt-0">
                                            <p className="text-2xl font-bold">
                                                {formatExperience(
                                                    craftsman.experience_years,
                                                )}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                الخبرة
                                            </p>
                                        </div>

                                        <div className="mt-6 border-t px-4 pt-6 text-center md:mt-0 md:border-t-0 md:pt-0">
                                            <p className="text-2xl font-bold">
                                                {formatResponseTime(
                                                    craftsman.average_response_time_minutes,
                                                )}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                متوسط وقت الرد
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* About */}
                        {isCraftsman && craftsman?.bio && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>نبذة عني</CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <p className="whitespace-pre-line text-muted-foreground">
                                        {craftsman.bio}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Areas */}
                        {isCraftsman && craftsman?.areas?.length ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>مناطق العمل</CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {craftsman.areas.map((area) => (
                                            <Badge
                                                key={area}
                                                variant="secondary"
                                                className="px-3 py-1.5 font-normal"
                                            >
                                                <MapPin className="ml-1.5 h-4 w-4" />
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        {/* Location */}
                        {isCraftsman && craftsman?.shop_address && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>مكان العمل</CardTitle>
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
                                                {craftsman.shop_address}
                                            </p>
                                        </div>
                                    </div>

                                    {craftsman.temporary_area &&
                                        craftsman.temporary_location_until && (
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
                                                                craftsman.temporary_area
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Client information */}
                        {profile.role === "client" && client && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>معلومات العميل</CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                                            <MapPin className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <p className="font-medium">
                                                المنطقة
                                            </p>
                                            <p className="text-muted-foreground">
                                                {client.area}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {isCraftsman && craftsman && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>حالة الحساب</CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                                            <span>التحقق من الهوية</span>
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
                                            <span>حالة العمل</span>
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
                                            <span>سرعة الرد</span>
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

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                                        <Star className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="font-semibold">
                                            التقييمات
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            ستظهر تقييمات العملاء بعد إتمام
                                            الأعمال.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </main>
    );
}