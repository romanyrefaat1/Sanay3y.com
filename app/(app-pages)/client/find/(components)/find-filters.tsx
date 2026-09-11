import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FindFiltersProps = {
    q: string;
    workType: string;
    experience: string;
    area: string;
    available: boolean;
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
    { value: "", label: "كل الخبرات" },
    { value: "1", label: "أكثر من سنة" },
    { value: "3", label: "أكثر من 3 سنوات" },
    { value: "5", label: "أكثر من 5 سنوات" },
    { value: "10", label: "أكثر من 10 سنوات" },
];

function buildHref(overrides: Partial<FindFiltersProps>) {
    const merged = {
        q: overrides.q ?? "",
        workType: overrides.workType ?? "",
        experience: overrides.experience ?? "",
        area: overrides.area ?? "",
        available: overrides.available ?? false,
    };

    const params = new URLSearchParams();

    if (merged.q) params.set("q", merged.q);
    if (merged.workType) params.set("workType", merged.workType);
    if (merged.experience) params.set("experience", merged.experience);
    if (merged.area) params.set("area", merged.area);
    if (merged.available) params.set("available", "1");

    const query = params.toString();

    return `/client/find${query ? `?${query}` : ""}`;
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
    q,
    workType,
    experience,
    area,
    available,
}: FindFiltersProps) {
    const hasActiveFilters = Boolean(
        workType || experience || area || available
    );

    return (
        <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
            {/* Search bar */}
            <form
                method="GET"
                action="/client/find"
                className="relative"
            >
                {workType && (
                    <input type="hidden" name="workType" value={workType} />
                )}
                {experience && (
                    <input
                        type="hidden"
                        name="experience"
                        value={experience}
                    />
                )}
                {area && <input type="hidden" name="area" value={area} />}
                {available && (
                    <input type="hidden" name="available" value="1" />
                )}

                <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                    name="q"
                    defaultValue={q}
                    placeholder="ابحث باسم الصنايعي أو التخصص..."
                    className="h-12 rounded-lg bg-card pr-11 text-[15px] shadow-sm"
                />
            </form>

            {/* Work type pill chips — mobile scroll row */}
            <div className="flex flex-wrap gap-2 lg:hidden">
                <Link
                    href={buildHref({ q, experience, area, available })}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${pillClass(!workType)}`}
                >
                    الكل
                </Link>

                {WORK_TYPES.map((type) => (
                    <Link
                        key={type}
                        href={buildHref({
                            q,
                            workType: type,
                            experience,
                            area,
                            available,
                        })}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${pillClass(workType === type)}`}
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
                            href="/client/find"
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

                {/* Desktop work type list */}
                <div className="mb-5 hidden border-b border-border pb-5 lg:block">
                    <p className="mb-2.5 text-sm font-medium text-foreground">
                        نوع الخدمة
                    </p>

                    <div className="flex flex-col gap-1">
                        <Link
                            href={buildHref({
                                q,
                                experience,
                                area,
                                available,
                            })}
                            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${listItemClass(!workType)}`}
                        >
                            الكل
                        </Link>

                        {WORK_TYPES.map((type) => (
                            <Link
                                key={type}
                                href={buildHref({
                                    q,
                                    workType: type,
                                    experience,
                                    area,
                                    available,
                                })}
                                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${listItemClass(workType === type)}`}
                            >
                                {type}
                            </Link>
                        ))}
                    </div>
                </div>

                <form
                    method="GET"
                    action="/client/find"
                    className="space-y-4"
                >
                    {q && <input type="hidden" name="q" value={q} />}
                    {workType && (
                        <input type="hidden" name="workType" value={workType} />
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="experience">الخبرة</Label>

                        <select
                            id="experience"
                            name="experience"
                            defaultValue={experience}
                            className="border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            {EXPERIENCE_OPTIONS.map((option) => (
                                <option
                                    key={option.value || "any"}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="area">المنطقة</Label>

                        <Input
                            id="area"
                            name="area"
                            defaultValue={area}
                            placeholder="مثال: الجيزة، فيصل"
                        />
                    </div>

                    <div className="flex items-start gap-2.5 pt-1">
                        <input
                            type="checkbox"
                            id="available"
                            name="available"
                            value="1"
                            defaultChecked={available}
                            className="border-input text-primary focus-visible:ring-ring/50 mt-1 size-4 shrink-0 rounded-[4px] border shadow-xs focus-visible:ring-[3px]"
                        />

                        <Label
                            htmlFor="available"
                            className="cursor-pointer font-medium"
                        >
                            متاح للعمل الآن
                        </Label>
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