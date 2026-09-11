import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FindFiltersProps = {
    service: string;
    area: string;
    minBudget: string;
    maxBudget: string;
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

function buildHref(overrides: Partial<FindFiltersProps>) {
    const merged = {
        service: overrides.service ?? "",
        area: overrides.area ?? "",
        minBudget: overrides.minBudget ?? "",
        maxBudget: overrides.maxBudget ?? "",
    };

    const params = new URLSearchParams();

    if (merged.service) params.set("service", merged.service);
    if (merged.area) params.set("area", merged.area);
    if (merged.minBudget) params.set("minBudget", merged.minBudget);
    if (merged.maxBudget) params.set("maxBudget", merged.maxBudget);

    const query = params.toString();

    return `/craftsman/find${query ? `?${query}` : ""}`;
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
    area,
    minBudget,
    maxBudget,
}: FindFiltersProps) {
    const hasActiveFilters = Boolean(service || area || minBudget || maxBudget);

    return (
        <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
            {/* Search bar — searches area (service stays exact-match via pill chips) */}
            <form
                method="GET"
                action="/craftsman/find"
                className="relative"
            >
                {service && (
                    <input type="hidden" name="service" value={service} />
                )}
                {minBudget && (
                    <input type="hidden" name="minBudget" value={minBudget} />
                )}
                {maxBudget && (
                    <input type="hidden" name="maxBudget" value={maxBudget} />
                )}

                <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    name="area"
                    defaultValue={area}
                    placeholder="ابحث بالمنطقة..."
                    className="h-12 rounded-lg bg-card pr-11 text-[15px] shadow-sm"
                />
            </form>

            {/* Service pill chips — mobile scroll row */}
            <div className="flex flex-wrap gap-2 lg:hidden">
                <Link
                    href={buildHref({ area, minBudget, maxBudget })}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${pillClass(!service)}`}
                >
                    الكل
                </Link>

                {SERVICE_TYPES.map((type) => (
                    <Link
                        key={type}
                        href={buildHref({
                            service: type,
                            area,
                            minBudget,
                            maxBudget,
                        })}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${pillClass(service === type)}`}
                    >
                        {type}
                    </Link>
                ))}
            </div>

            {/* Sidebar filter panel */}
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

                {/* Desktop service list */}
                <div className="mb-5 hidden border-b border-border pb-5 lg:block">
                    <p className="mb-2.5 text-sm font-medium text-foreground">
                        نوع الخدمة
                    </p>

                    <div className="flex flex-col gap-1">
                        <Link
                            href={buildHref({ area, minBudget, maxBudget })}
                            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${listItemClass(!service)}`}
                        >
                            الكل
                        </Link>

                        {SERVICE_TYPES.map((type) => (
                            <Link
                                key={type}
                                href={buildHref({
                                    service: type,
                                    area,
                                    minBudget,
                                    maxBudget,
                                })}
                                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${listItemClass(service === type)}`}
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
                        <input type="hidden" name="service" value={service} />
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="area">المنطقة</Label>

                        <Input
                            id="area"
                            name="area"
                            defaultValue={area}
                            placeholder="مثال: الجيزة، فيصل"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>الميزانية (ج.م)</Label>

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

                    <Button type="submit" className="w-full">
                        <Search className="size-4" />
                        بحث
                    </Button>
                </form>
            </div>
        </div>
    );
}