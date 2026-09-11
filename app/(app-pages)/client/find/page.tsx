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

    let craftsmen = (data || []).map((item: any) => ({
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
    }));

    // Name/bio search spans a joined table + a local column, which
    // Supabase's .or() can't express in one filter — narrow it here
    // instead, after the fetch (results are capped at 50 rows, so this
    // stays cheap).
    if (q) {
        const needle = q.toLowerCase();

        craftsmen = craftsmen.filter(
            (c) =>
                c.full_name.toLowerCase().includes(needle) ||
                (c.bio?.toLowerCase().includes(needle) ?? false)
        );
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

function Loading() {
    return (
        <div
            dir="rtl"
            className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
        >
            <div className="space-y-3">
                <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
                <div className="h-5 w-72 animate-pulse rounded-lg bg-muted" />
            </div>

            <div className="mt-8 h-14 animate-pulse rounded-lg bg-muted" />

            <div className="mt-4 flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-9 w-20 animate-pulse rounded-full bg-muted"
                    />
                ))}
            </div>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row-reverse">
                <div className="h-64 w-full animate-pulse rounded-lg bg-muted lg:w-72" />
                <div className="flex-1 space-y-4">
                    <div className="h-32 animate-pulse rounded-lg bg-muted" />
                    <div className="h-32 animate-pulse rounded-lg bg-muted" />
                </div>
            </div>
        </div>
    );
}

export default async function ClientFindPage({
    searchParams,
}: PageProps) {
    const params = await searchParams;

    return (
        <Suspense fallback={<Loading />}>
            <main
                dir="rtl"
                className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
            >
                <nav className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span>لوحة التحكم</span>
                    <span className="text-muted-foreground/50">‹</span>
                    <span className="text-foreground">ابحث عن صنايعي</span>
                </nav>

                <div className="mb-8">
                    <h1>ابحث عن صنايعي</h1>

                    <p className="mt-2 text-[15px] text-muted-foreground">
                        لاقي الصنايعي المناسب لشغلك في منطقتك
                    </p>
                </div>

                <ClientFindContent searchParams={params} />
            </main>
        </Suspense>
    );
}