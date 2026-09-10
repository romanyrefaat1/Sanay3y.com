"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    BadgeCheck,
    BriefcaseBusiness,
    CheckCircle2,
    ChevronDown,
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import {
    Avatar,
    AvatarBadge,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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
            craftsman.areas.forEach((item) => {
                if (item?.trim()) {
                    values.add(item.trim());
                }
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
        >
            {/* Breadcrumb */}
                <div className="mx-auto flex w-full max-w-6xl items-center px-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link
                                        href="/"
                                        className="text-sm"
                                    >
                                        الرئيسية
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>

                            <BreadcrumbSeparator />

                            <BreadcrumbItem>
                                <BreadcrumbPage className="text-sm font-medium">
                                    ابحث عن صنايعي
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:py-9">
                {/* Page header */}
                <section>
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            ابحث عن صنايعي
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                            لاقي الصنايعي المناسب لشغلك في منطقتك
                        </p>
                    </div>

                    {/* Search */}
                    <div className="mt-6 max-w-3xl">
                        <div className="relative">
                            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="ابحث باسم الصنايعي أو التخصص أو المنطقة..."
                                className="h-12 rounded-lg bg-background pr-11 pl-11 text-sm shadow-sm"
                            />

                            {search && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSearch("")}
                                    className="absolute left-1.5 top-1/2 size-9 -translate-y-1/2 text-muted-foreground"
                                    aria-label="مسح البحث"
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Work types */}
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

                {/* Active filters */}
                {(hasFilters || search) && (
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                            الفلاتر النشطة
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
                            className="h-8 px-2 text-sm text-primary"
                        >
                            مسح الكل
                        </Button>
                    </div>
                )}

                {/* Results + filters */}
                <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px]">
                    {/* Results */}
                    <section className="min-w-0 lg:order-1">
                        <div className="mb-4 flex items-center justify-between gap-4">
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

                            {/* Mobile filters */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0 gap-2 lg:hidden"
                                    >
                                        <SlidersHorizontal className="size-4" />
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
                                        <SheetTitle>
                                            تصفية النتائج
                                        </SheetTitle>
                                    </SheetHeader>

                                    <div className="mt-7">
                                        <FilterContent
                                            workType={workType}
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
                    </section>

                    {/* Desktop filters */}
                    <aside className="hidden lg:order-2 lg:block">
                        <div className="sticky top-6">
                            <Card className="bg-background">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-base font-bold">
                                                تصفية النتائج
                                            </h2>

                                            <p className="mt-1 text-sm leading-5 text-muted-foreground">
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
                                                className="h-8 px-2 text-primary"
                                            >
                                                مسح
                                            </Button>
                                        )}
                                    </div>

                                    <Separator className="my-5" />

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
            className="h-8 max-w-[220px] gap-1 rounded-full px-3 text-sm font-medium"
        >
            <span className="truncate">{label}</span>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="size-5 shrink-0 rounded-full p-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                aria-label={`إزالة ${label}`}
            >
                <X className="size-3.5" />
            </Button>
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
        <div className="space-y-5">
            <div className="space-y-2">
                <Label
                    htmlFor="experience"
                    className="text-sm font-semibold"
                >
                    الخبرة
                </Label>

                <Select
                    value={experience}
                    onValueChange={setExperience}
                >
                    <SelectTrigger
                        id="experience"
                        className="h-10 text-sm"
                    >
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

            <div className="space-y-2">
                <Label
                    htmlFor="area"
                    className="text-sm font-semibold"
                >
                    المنطقة
                </Label>

                <Select
                    value={area}
                    onValueChange={setArea}
                >
                    <SelectTrigger
                        id="area"
                        className="h-10 text-sm"
                    >
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

            <div className="flex items-start gap-3">
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

                <Label
                    htmlFor="available-only"
                    className="cursor-pointer"
                >
                    <span className="block text-sm font-semibold">
                        متاح للعمل الآن
                    </span>

                    <span className="mt-1 block text-sm font-normal leading-5 text-muted-foreground">
                        اعرض الصنايعية المتاحين للطلبات الجديدة
                    </span>
                </Label>
            </div>
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

    const hasAreas = craftsman.areas.length > 0;

    return (
        <Card className="bg-background transition-shadow duration-200 hover:shadow-md">
            <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4 sm:gap-5">
                    {/* Avatar */}
                    <Avatar className="size-16 shrink-0 border bg-muted shadow-sm sm:size-20">
                        <AvatarImage
                            src={
                                craftsman.avatar_url ??
                                undefined
                            }
                            alt={craftsman.full_name}
                            className="object-cover"
                        />

                        <AvatarFallback className="text-base font-bold text-muted-foreground sm:text-lg">
                            {getInitials(
                                craftsman.full_name,
                            )}
                        </AvatarFallback>

                        <AvatarBadge
                            className={
                                craftsman.is_available
                                    ? "size-4 border-[3px] border-background bg-[hsl(var(--available))] sm:size-[18px]"
                                    : "size-4 border-[3px] border-background bg-muted-foreground/40 sm:size-[18px]"
                            }
                        />
                    </Avatar>

                    <div className="min-w-0 flex-1">
                        {/* Location + profession */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-muted-foreground">
                            {hasAreas && (
                                <span className="flex min-w-0 items-center gap-1.5">
                                    <MapPin className="size-4 shrink-0" />

                                    <span className="truncate">
                                        {craftsman.areas
                                            .slice(0, 3)
                                            .join("، ")}

                                        {craftsman.areas.length >
                                            3 &&
                                            ` +${craftsman.areas.length - 3}`}
                                    </span>
                                </span>
                            )}

                            {craftsman.work_type && (
                                <>
                                    {hasAreas && (
                                        <span className="text-muted-foreground/40">
                                            •
                                        </span>
                                    )}

                                    <Badge
                                        variant="secondary"
                                        className="h-6 rounded-md px-2 text-xs font-medium"
                                    >
                                        {craftsman.work_type}
                                    </Badge>
                                </>
                            )}
                        </div>

                        {/* Name + CTA */}
                        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <Link
                                href={`/profile/${craftsman.id}`}
                                className="group flex min-w-0 items-center gap-2"
                            >
                                <span className="truncate text-lg font-bold text-foreground transition-colors group-hover:text-primary sm:text-xl">
                                    {craftsman.full_name}
                                </span>

                                <BadgeCheck
                                    className="size-5 shrink-0 text-[hsl(var(--verified))]"
                                    aria-label="حساب موثق"
                                />
                            </Link>

                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="h-9 shrink-0 px-4 text-sm font-semibold"
                            >
                                <Link
                                    href={`/profile?id=${craftsman.id}`}
                                >
                                    عرض الملف الشخصي
                                </Link>
                            </Button>
                        </div>

                        {/* Bio */}
                        {craftsman.bio && (
                            <CollapsibleBio
                                bio={craftsman.bio}
                                profileUrl={`/profile?id=${craftsman.id}`}
                            />
                        )}

                        <Separator className="my-4" />

                        {/* Professional information */}
                        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
                            <InfoItem
                                icon={BriefcaseBusiness}
                                label={formatExperience(
                                    craftsman.experience_years,
                                )}
                            />

                            {responseTime && (
                                <InfoItem
                                    icon={Clock3}
                                    label={`يرد خلال ${responseTime}`}
                                />
                            )}

                            {craftsman.completion_rate >
                                0 && (
                                <InfoItem
                                    icon={CheckCircle2}
                                    label={`${craftsman.completion_rate}% إتمام`}
                                />
                            )}

                            {craftsman.response_rate > 0 && (
                                <InfoItem
                                    icon={CheckCircle2}
                                    label={`${craftsman.response_rate}% رد`}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function CollapsibleBio({
    bio,
    profileUrl,
}: {
    bio: string;
    profileUrl: string;
}) {
    const [open, setOpen] = useState(false);

    const shouldCollapse = bio.length > 180;

    if (!shouldCollapse) {
        return (
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
                {bio}
            </p>
        );
    }

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="mt-3"
        >
            <div className="relative">
                <p
                    className={
                        open
                            ? "text-[15px] leading-7 text-muted-foreground"
                            : "line-clamp-2 text-[15px] leading-7 text-muted-foreground"
                    }
                >
                    {bio}
                </p>

                {!open && (
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="link"
                            size="sm"
                            className="h-auto px-0 text-sm font-semibold text-primary"
                        >
                            عرض المزيد
                        </Button>
                    </CollapsibleTrigger>
                )}

                {open && (
                    <div className="mt-1 flex items-center gap-3">
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="link"
                                size="sm"
                                className="h-auto px-0 text-sm font-semibold text-primary"
                            >
                                عرض أقل
                            </Button>
                        </CollapsibleTrigger>

                        <Link
                            href={profileUrl}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                            الملف الشخصي
                        </Link>
                    </div>
                )}
            </div>
        </Collapsible>
    );
}

function InfoItem({
    icon: Icon,
    label,
}: {
    icon: typeof BriefcaseBusiness;
    label: string;
}) {
    return (
        <span className="flex items-center gap-2">
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
        </span>
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
        <Card className="bg-background">
            <CardContent className="flex min-h-[340px] flex-col items-center justify-center p-8 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    {isError ? (
                        <X className="size-6 text-destructive" />
                    ) : (
                        <Search className="size-6 text-muted-foreground" />
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
        <Card className="bg-background">
            <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4 sm:gap-5">
                    <Skeleton className="size-16 shrink-0 rounded-full sm:size-20" />

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-3">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-6 w-44" />
                            </div>

                            <Skeleton className="h-9 w-32 shrink-0" />
                        </div>

                        <div className="mt-4 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>

                        <Separator className="my-4" />

                        <div className="flex gap-5">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}