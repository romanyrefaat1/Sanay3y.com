import Link from "next/link";
import {
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FindFiltersProps = {
    service: string;
    minBudget: string;
    maxBudget: string;
    distance: string;
};

const SERVICE_TYPES = [
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

const DISTANCE_OPTIONS = [
    { value: "2", label: "لحد 2 كم" },
    { value: "4", label: "لحد 4 كم" },
    { value: "6", label: "لحد 6 كم" },
    { value: "10", label: "لحد 10 كم" },
    { value: "20", label: "لحد 20 كم" },
];

const DEFAULT_DISTANCE = "6";

function buildHref(
    overrides: Partial<FindFiltersProps>
) {
    const merged = {
        service: overrides.service ?? "",
        minBudget: overrides.minBudget ?? "",
        maxBudget: overrides.maxBudget ?? "",
        distance:
            overrides.distance ?? DEFAULT_DISTANCE,
    };

    const params = new URLSearchParams();

    if (merged.service) {
        params.set("service", merged.service);
    }

    if (merged.minBudget) {
        params.set(
            "minBudget",
            merged.minBudget
        );
    }

    if (merged.maxBudget) {
        params.set(
            "maxBudget",
            merged.maxBudget
        );
    }

    if (
        merged.distance &&
        merged.distance !== DEFAULT_DISTANCE
    ) {
        params.set(
            "distance",
            merged.distance
        );
    }

    const query = params.toString();

    return `/craftsman/find${
        query ? `?${query}` : ""
    }`;
}

function pillClass(active: boolean) {
    return active
        ? "bg-primary text-primary-foreground"
        : "bg-card text-muted-foreground ring-1 ring-border hover:bg-secondary";
}

function listItemClass(active: boolean) {
    return active
        ? "bg-accent font-medium text-accent-foreground"
        : "text-muted-foreground hover:bg-secondary";
}

export default function FindFilters({
    service,
    minBudget,
    maxBudget,
    distance,
}: FindFiltersProps) {
    const currentDistance =
        distance || DEFAULT_DISTANCE;

    const hasActiveFilters = Boolean(
        service ||
            minBudget ||
            maxBudget ||
            currentDistance !== DEFAULT_DISTANCE
    );

    return (
        <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
            {/* Mobile service filters */}
            <div className="flex flex-wrap gap-2 lg:hidden">
                <Link
                    href={buildHref({
                        minBudget,
                        maxBudget,
                        distance: currentDistance,
                    })}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${pillClass(
                        !service
                    )}`}
                >
                    الكل
                </Link>

                {SERVICE_TYPES.map((type) => (
                    <Link
                        key={type}
                        href={buildHref({
                            service: type,
                            minBudget,
                            maxBudget,
                            distance: currentDistance,
                        })}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${pillClass(
                            service === type
                        )}`}
                    >
                        {type}
                    </Link>
                ))}
            </div>

            {/* Filter panel */}
            <div className="rounded-lg border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="size-4 text-muted-foreground" />

                        <h2 className="text-[15px] font-bold text-foreground">
                            تصفية النتائج
                        </h2>
                    </div>

                    {hasActiveFilters && (
                        <Link
                            href="/craftsman/find"
                            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-3.5" />
                            مسح
                        </Link>
                    )}
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                    حدد اللي يناسب شغلك
                </p>

                {/* Desktop service filters */}
                <div className="mb-5 hidden border-b border-border pb-5 lg:block">
                    <p className="mb-2.5 text-sm font-medium text-foreground">
                        نوع الخدمة
                    </p>

                    <div className="flex flex-col gap-1">
                        <Link
                            href={buildHref({
                                minBudget,
                                maxBudget,
                                distance: currentDistance,
                            })}
                            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${listItemClass(
                                !service
                            )}`}
                        >
                            الكل
                        </Link>

                        {SERVICE_TYPES.map((type) => (
                            <Link
                                key={type}
                                href={buildHref({
                                    service: type,
                                    minBudget,
                                    maxBudget,
                                    distance: currentDistance,
                                })}
                                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${listItemClass(
                                    service === type
                                )}`}
                            >
                                {type}
                            </Link>
                        ))}
                    </div>
                </div>

                <form
                    method="GET"
                    action="/craftsman/find"
                    className="space-y-4"
                >
                    {service && (
                        <input
                            type="hidden"
                            name="service"
                            value={service}
                        />
                    )}

                    {/* Distance */}
                    <div className="space-y-1.5">
                        <Label htmlFor="distance">
                            المسافة
                        </Label>

                        <select
                            id="distance"
                            name="distance"
                            defaultValue={currentDistance}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
                        >
                            {DISTANCE_OPTIONS.map(
                                (option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                )
                            )}
                        </select>

                        <p className="text-xs leading-5 text-muted-foreground">
                            المسافة محسوبة من موقعك إلى موقع العميل.
                        </p>
                    </div>

                    {/* Budget */}
                    <div className="space-y-1.5">
                        <Label>
                            الميزانية (ج.م)
                        </Label>

                        <div className="flex items-center gap-2">
                            <Input
                                name="minBudget"
                                type="number"
                                min="0"
                                defaultValue={minBudget}
                                placeholder="من"
                            />

                            <span className="shrink-0 text-muted-foreground">
                                –
                            </span>

                            <Input
                                name="maxBudget"
                                type="number"
                                min="0"
                                defaultValue={maxBudget}
                                placeholder="إلى"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                    >
                        <Search className="size-4" />
                        بحث
                    </Button>
                </form>
            </div>
        </div>
    );
}