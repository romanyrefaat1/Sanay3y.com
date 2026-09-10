"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    BadgeCheck,
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    MapPin,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { createClient } from "@/lib/supabase/client";

type Craftsman = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    experience_years: number | null;
    areas: string[];
    shop_address: string | null;
    work_type: string | null;
    verification_status: "pending" | "verified" | "rejected";
    is_available: boolean;
    average_response_time_minutes: number | null;
    response_rate: number;
    completion_rate: number;
};

const WORK_TYPES = [
    "سباك",
    "كهربائي",
    "نجار",
    "نقاش",
    "فني تكييف",
    "حداد",
    "مبلط",
    "عامل سيراميك",
    "ألوميتال",
    "زجاج",
    "أخرى",
];

const EXPERIENCE_OPTIONS = [
    { value: "any", label: "كل الخبرات" },
    { value: "1", label: "أكثر من سنة" },
    { value: "3", label: "أكثر من 3 سنوات" },
    { value: "5", label: "أكثر من 5 سنوات" },
    { value: "10", label: "أكثر من 10 سنوات" },
];

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

    if (hours === 1) {
        return "ساعة تقريباً";
    }

    return `${hours} ساعات تقريباً`;
}

function getInitials(name: string) {
    const words = name.trim().split(/\s+/);

    if (!words.length) return "ص";

    if (words.length === 1) {
        return words[0].slice(0, 2);
    }

    return `${words[0][0] || ""}${words[1][0] || ""}`;
}

export default function ClientFindPage() {
    const supabase = createClient();

    const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const [search, setSearch] = useState("");
    const [workType, setWorkType] = useState("all");
    const [experience, setExperience] = useState("any");
    const [area, setArea] = useState("all");
    const [availableOnly, setAvailableOnly] = useState(false);

    useEffect(() => {
        async function loadCraftsmen() {
            setIsLoading(true);
            setError(false);

            const { data, error } = await supabase
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
                `,
                )
                .eq("verification_status", "verified")
                .eq("profiles.role", "craftsman")
                .eq("profiles.is_active", true)
                .order("is_available", { ascending: false })
                .order("completion_rate", { ascending: false })
                .order("response_rate", { ascending: false });

            if (error) {
                console.error(error);
                setError(true);
                setCraftsmen([]);
                setIsLoading(false);
                return;
            }

            const mapped: Craftsman[] = (data || []).map(
                (item: any) => ({
                    id: item.id,
                    full_name:
                        item.profiles?.full_name || "صنايعي",
                    avatar_url:
                        item.profiles?.avatar_url || null,
                    bio: item.bio || null,
                    experience_years:
                        item.experience_years ?? null,
                    areas: item.areas || [],
                    shop_address:
                        item.shop_address || null,
                    work_type: item.work_type || null,
                    verification_status:
                        item.verification_status,
                    is_available:
                        item.is_available ?? false,
                    average_response_time_minutes:
                        item.average_response_time_minutes ??
                        null,
                    response_rate: Number(
                        item.response_rate || 0,
                    ),
                    completion_rate: Number(
                        item.completion_rate || 0,
                    ),
                }),
            );

            setCraftsmen(mapped);
            setIsLoading(false);
        }

        loadCraftsmen();
    }, []);

    const allAreas = useMemo(() => {
        const values = new Set<string>();

        craftsmen.forEach((craftsman) => {
            craftsmen.forEach((craftsman) => {
                craftsman.areas.forEach((item) => {
                    if (item?.trim()) {
                        values.add(item.trim());
                    }
                });
            });
        });

        return Array.from(values).sort((a, b) =>
            a.localeCompare(b, "ar"),
        );
    }, [craftsmen]);

    const filteredCraftsmen = useMemo(() => {
        const query = search.trim().toLowerCase();

        const minimumExperience =
            experience === "any"
                ? null
                : Number(experience);

        return craftsmen.filter((craftsman) => {
            if (
                workType !== "all" &&
                craftsman.work_type !== workType
            ) {
                return false;
            }

            if (
                minimumExperience !== null &&
                (craftsman.experience_years === null ||
                    craftsman.experience_years <
                        minimumExperience)
            ) {
                return false;
            }

            if (
                area !== "all" &&
                !craftsman.areas.includes(area)
            ) {
                return false;
            }

            if (
                availableOnly &&
                !craftsman.is_available
            ) {
                return false;
            }

            if (!query) return true;

            const searchableText = [
                craftsman.full_name,
                craftsman.work_type,
                craftsman.bio,
                craftsman.shop_address,
                ...craftsman.areas,
                craftsman.experience_years?.toString(),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [
        craftsmen,
        search,
        workType,
        experience,
        area,
        availableOnly,
    ]);

    const hasFilters =
        workType !== "all" ||
        experience !== "any" ||
        area !== "all" ||
        availableOnly;

    const activeFilterCount = [
        workType !== "all",
        experience !== "any",
        area !== "all",
        availableOnly,
    ].filter(Boolean).length;

    function clearFilters() {
        setWorkType("all");
        setExperience("any");
        setArea("all");
        setAvailableOnly(false);
    }

    function clearAll() {
        setSearch("");
        clearFilters();
    }

    return (
        <div
            dir="rtl"
            className="min-h-screen bg-background"
        >
            <div className="border-b bg-card">
                <div className="mx-auto flex h-12 w-full max-w-6xl items-center px-4 text-sm">
                    <Link
                        href="/"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        الرئيسية
                    </Link>

                    <span className="mx-2 text-muted-foreground/40">
                        /
                    </span>

                    <span className="font-medium text-foreground">
                        ابحث عن صنايعي
                    </span>
                </div>
            </div>

            <main className="mx-auto w-full max-w-6xl px-4 py-8">
                <section className="mb-7">
                    <div className="mb-5">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            ابحث عن صنايعي
                        </h1>

                        <p className="mt-2 text-base text-muted-foreground">
                            اختار الصنايعي المناسب لشغلك في
                            منطقتك
                        </p>
                    </div>

                    <div className="relative max-w-3xl">
                        <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="ابحث باسم الصنايعي أو التخصص أو المنطقة..."
                            className="h-13 rounded-xl bg-card pr-11 text-base shadow-sm"
                        />

                        {search && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setSearch("")}
                                className="absolute left-2 top-1/2 h-9 w-9 -translate-y-1/2 text-muted-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="mt-4 overflow-x-auto pb-1">
                        <div className="flex min-w-max gap-2">
                            <Button
                                type="button"
                                variant={
                                    workType === "all"
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() =>
                                    setWorkType("all")
                                }
                                className="h-9 rounded-full px-4 text-sm"
                            >
                                الكل
                            </Button>

                            {WORK_TYPES.map((type) => (
                                <Button
                                    key={type}
                                    type="button"
                                    variant={
                                        workType === type
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() =>
                                        setWorkType(
                                            workType === type
                                                ? "all"
                                                : type,
                                        )
                                    }
                                    className="h-9 rounded-full px-4 text-sm"
                                >
                                    {type}
                                </Button>
                            ))}
                        </div>
                    </div>
                </section>

                {(hasFilters || search) && (
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                            الفلاتر:
                        </span>

                        {search && (
                            <FilterBadge
                                label={`بحث: ${search}`}
                                onRemove={() =>
                                    setSearch("")
                                }
                            />
                        )}

                        {workType !== "all" && (
                            <FilterBadge
                                label={workType}
                                onRemove={() =>
                                    setWorkType("all")
                                }
                            />
                        )}

                        {experience !== "any" && (
                            <FilterBadge
                                label={
                                    EXPERIENCE_OPTIONS.find(
                                        (item) =>
                                            item.value ===
                                            experience,
                                    )?.label ||
                                    experience
                                }
                                onRemove={() =>
                                    setExperience("any")
                                }
                            />
                        )}

                        {area !== "all" && (
                            <FilterBadge
                                label={area}
                                onRemove={() =>
                                    setArea("all")
                                }
                            />
                        )}

                        {availableOnly && (
                            <FilterBadge
                                label="متاح للعمل الآن"
                                onRemove={() =>
                                    setAvailableOnly(false)
                                }
                            />
                        )}

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearAll}
                            className="h-8 text-sm text-primary"
                        >
                            مسح الكل
                        </Button>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                    <main className="min-w-0 lg:order-1">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-base font-semibold">
                                    {isLoading
                                        ? "جاري تحميل الصنايعية..."
                                        : `${filteredCraftsmen.length} صنايعي`}
                                </p>

                                {!isLoading &&
                                    filteredCraftsmen.length >
                                        0 && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            صنايعية موثقين مناسبين
                                            لبحثك
                                        </p>
                                    )}
                            </div>

                            <div className="lg:hidden">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                        >
                                            <SlidersHorizontal className="h-4 w-4" />
                                            تصفية

                                            {activeFilterCount >
                                                0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="min-w-5 justify-center rounded-full px-1.5"
                                                >
                                                    {
                                                        activeFilterCount
                                                    }
                                                </Badge>
                                            )}
                                        </Button>
                                    </SheetTrigger>

                                    <SheetContent
                                        side="right"
                                        className="w-[320px] sm:w-[380px]"
                                    >
                                        <SheetHeader className="text-right">
                                            <SheetTitle className="text-lg">
                                                تصفية النتائج
                                            </SheetTitle>
                                        </SheetHeader>

                                        <div className="mt-7">
                                            <FilterContent
                                                workType={
                                                    workType
                                                }
                                                setWorkType={
                                                    setWorkType
                                                }
                                                experience={
                                                    experience
                                                }
                                                setExperience={
                                                    setExperience
                                                }
                                                area={area}
                                                setArea={setArea}
                                                areas={allAreas}
                                                availableOnly={
                                                    availableOnly
                                                }
                                                setAvailableOnly={
                                                    setAvailableOnly
                                                }
                                            />

                                            {hasFilters && (
                                                <Button
                                                    variant="outline"
                                                    className="mt-7 w-full"
                                                    onClick={
                                                        clearFilters
                                                    }
                                                >
                                                    مسح الفلاتر
                                                </Button>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {Array.from({
                                    length: 5,
                                }).map((_, index) => (
                                    <CraftsmanSkeleton
                                        key={index}
                                    />
                                ))}
                            </div>
                        ) : error ? (
                            <EmptyState
                                type="error"
                                onClear={() =>
                                    window.location.reload()
                                }
                            />
                        ) : filteredCraftsmen.length === 0 ? (
                            <EmptyState
                                type="empty"
                                hasFilters={
                                    hasFilters || !!search
                                }
                                onClear={clearAll}
                            />
                        ) : (
                            <div className="space-y-4">
                                {filteredCraftsmen.map(
                                    (craftsman) => (
                                        <CraftsmanRow
                                            key={craftsman.id}
                                            craftsman={
                                                craftsman
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        )}
                    </main>

                    <aside className="hidden lg:order-2 lg:block">
                        <div className="sticky top-6">
                            <Card>
                                <CardContent className="p-5">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-base font-bold">
                                                تصفية النتائج
                                            </h2>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                حدد اللي يناسب شغلك
                                            </p>
                                        </div>

                                        {hasFilters && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={
                                                    clearFilters
                                                }
                                                className="text-primary"
                                            >
                                                مسح
                                            </Button>
                                        )}
                                    </div>

                                    <FilterContent
                                        workType={workType}
                                        setWorkType={setWorkType}
                                        experience={experience}
                                        setExperience={
                                            setExperience
                                        }
                                        area={area}
                                        setArea={setArea}
                                        areas={allAreas}
                                        availableOnly={
                                            availableOnly
                                        }
                                        setAvailableOnly={
                                            setAvailableOnly
                                        }
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

function FilterBadge({
    label,
    onRemove,
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <Badge
            variant="secondary"
            className="h-8 gap-1.5 rounded-full px-3 text-sm font-medium"
        >
            <span className="max-w-[180px] truncate">
                {label}
            </span>

            <button
                type="button"
                onClick={onRemove}
                className="rounded-full opacity-70 transition-opacity hover:opacity-100"
                aria-label={`إزالة ${label}`}
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </Badge>
    );
}

function FilterContent({
    workType,
    setWorkType,
    experience,
    setExperience,
    area,
    setArea,
    areas,
    availableOnly,
    setAvailableOnly,
}: {
    workType: string;
    setWorkType: (value: string) => void;
    experience: string;
    setExperience: (value: string) => void;
    area: string;
    setArea: (value: string) => void;
    areas: string[];
    availableOnly: boolean;
    setAvailableOnly: (value: boolean) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <label className="mb-2 block text-sm font-semibold">
                    الخبرة
                </label>

                <Select
                    value={experience}
                    onValueChange={setExperience}
                >
                    <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                        {EXPERIENCE_OPTIONS.map(
                            (option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-sm"
                                >
                                    {option.label}
                                </SelectItem>
                            ),
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <label className="mb-2 block text-sm font-semibold">
                    المنطقة
                </label>

                <Select
                    value={area}
                    onValueChange={setArea}
                >
                    <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="كل المناطق" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            كل المناطق
                        </SelectItem>

                        {areas.map((item) => (
                            <SelectItem
                                key={item}
                                value={item}
                            >
                                {item}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                    id="available-only"
                    checked={availableOnly}
                    onCheckedChange={(checked) =>
                        setAvailableOnly(
                            checked === true,
                        )
                    }
                    className="mt-0.5"
                />

                <span>
                    <span className="block text-sm font-semibold">
                        متاح للعمل الآن
                    </span>

                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                        عرض الصنايعية المتاحين حالياً
                    </span>
                </span>
            </label>
        </div>
    );
}

function CraftsmanRow({
    craftsman,
}: {
    craftsman: Craftsman;
}) {
    const responseTime = formatResponseTime(
        craftsman.average_response_time_minutes,
    );

    return (
        <Card className="transition-shadow duration-200 hover:shadow-md">
            <CardContent className="p-5 sm:p-6">
                <div className="flex gap-4 sm:gap-5">
                    <div className="relative shrink-0">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border bg-muted shadow-sm sm:h-20 sm:w-20">
                            {craftsman.avatar_url ? (
                                <img
                                    src={
                                        craftsman.avatar_url
                                    }
                                    alt={
                                        craftsman.full_name
                                    }
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-base font-bold text-muted-foreground">
                                    {getInitials(
                                        craftsman.full_name,
                                    )}
                                </span>
                            )}
                        </div>

                        <span
                            className={`absolute bottom-0 left-0 h-4 w-4 rounded-full border-[3px] border-card ${
                                craftsman.is_available
                                    ? "bg-[hsl(var(--available))]"
                                    : "bg-muted-foreground/40"
                            }`}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Link
                                        href={`/profile?id=${craftsman.id}`}
                                        className="text-lg font-bold text-foreground transition-colors hover:text-primary"
                                    >
                                        {craftsman.full_name}
                                    </Link>

                                    <BadgeCheck className="h-5 w-5 shrink-0 text-[hsl(var(--verified))]" />

                                    {craftsman.work_type && (
                                        <Badge
                                            variant="secondary"
                                            className="h-7 rounded-md px-2.5 text-sm font-semibold"
                                        >
                                            {
                                                craftsman.work_type
                                            }
                                        </Badge>
                                    )}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Badge
                                        variant={
                                            craftsman.is_available
                                                ? "default"
                                                : "outline"
                                        }
                                        className={
                                            craftsman.is_available
                                                ? "h-7 bg-[hsl(var(--available))] px-2.5 text-sm font-medium hover:bg-[hsl(var(--available))]"
                                                : "h-7 px-2.5 text-sm font-medium"
                                        }
                                    >
                                        <span
                                            className={`ml-1.5 h-1.5 w-1.5 rounded-full ${
                                                craftsman.is_available
                                                    ? "bg-white"
                                                    : "bg-muted-foreground"
                                            }`}
                                        />

                                        {craftsman.is_available
                                            ? "متاح للعمل"
                                            : "غير متاح حالياً"}
                                    </Badge>
                                </div>
                            </div>

                            <Button
                                asChild
                                size="sm"
                                className="h-10 shrink-0 px-5 text-sm font-semibold"
                            >
                                <Link
                                    href={`/profile?id=${craftsman.id}`}
                                >
                                    عرض الملف الشخصي
                                </Link>
                            </Button>
                        </div>

                        {craftsman.bio && (
                            <p className="mt-4 line-clamp-2 text-[15px] leading-7 text-muted-foreground">
                                {craftsman.bio}
                            </p>
                        )}

                        <div className="mt-4">
                            <Separator />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
                            {craftsman.areas.length > 0 && (
                                <span className="flex min-w-0 items-center gap-2">
                                    <MapPin className="h-4 w-4 shrink-0" />

                                    <span className="truncate">
                                        {craftsman.areas
                                            .slice(0, 3)
                                            .join("، ")}

                                        {craftsman.areas
                                            .length > 3 &&
                                            ` +${craftsman.areas.length - 3}`}
                                    </span>
                                </span>
                            )}

                            <span className="flex items-center gap-2">
                                <BriefcaseBusiness className="h-4 w-4 shrink-0" />
                                {formatExperience(
                                    craftsman.experience_years,
                                )}
                            </span>

                            {responseTime && (
                                <span className="flex items-center gap-2">
                                    <Clock3 className="h-4 w-4 shrink-0" />
                                    يرد خلال {responseTime}
                                </span>
                            )}

                            {craftsman.completion_rate >
                                0 && (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    {craftsman.completion_rate}%
                                    إتمام
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyState({
    type,
    hasFilters = false,
    onClear,
}: {
    type: "empty" | "error";
    hasFilters?: boolean;
    onClear: () => void;
}) {
    const isError = type === "error";

    return (
        <Card>
            <CardContent className="flex min-h-[340px] flex-col items-center justify-center p-8 text-center">
                <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full ${
                        isError
                            ? "bg-destructive/10"
                            : "bg-primary/10"
                    }`}
                >
                    {isError ? (
                        <X className="h-7 w-7 text-destructive" />
                    ) : (
                        <Search className="h-7 w-7 text-primary" />
                    )}
                </div>

                <h2 className="mt-5 text-lg font-bold">
                    {isError
                        ? "حصلت مشكلة"
                        : "مفيش صنايعية مناسبين"}
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    {isError
                        ? "مش قادرين نعرض الصنايعية دلوقتي. حاول مرة تانية."
                        : "جرب تغير كلمة البحث أو توسع المنطقة أو تشيل بعض الفلاتر."}
                </p>

                <Button
                    variant="outline"
                    className="mt-6"
                    onClick={onClear}
                >
                    {isError
                        ? "حاول مرة تانية"
                        : hasFilters
                          ? "عرض كل الصنايعية"
                          : "مسح البحث"}
                </Button>
            </CardContent>
        </Card>
    );
}

function CraftsmanSkeleton() {
    return (
        <Card>
            <CardContent className="animate-pulse p-5 sm:p-6">
                <div className="flex gap-4">
                    <div className="h-16 w-16 shrink-0 rounded-full bg-muted sm:h-20 sm:w-20" />

                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-4">
                            <div className="space-y-3">
                                <div className="h-5 w-40 rounded bg-muted" />
                                <div className="h-7 w-24 rounded-md bg-muted" />
                            </div>

                            <div className="h-10 w-32 rounded-md bg-muted" />
                        </div>

                        <div className="mt-5 space-y-2">
                            <div className="h-4 w-full rounded bg-muted" />
                            <div className="h-4 w-4/5 rounded bg-muted" />
                        </div>

                        <div className="mt-5 border-t pt-4">
                            <div className="h-4 w-3/5 rounded bg-muted" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}