import { Search } from "lucide-react";

import CraftsmanCard from "./craftsman-card";

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

export default function CraftsmanList({
    craftsmen,
}: {
    craftsmen: Craftsman[];
}) {
    if (craftsmen.length === 0) {
        return (
            <div className="flex-1 rounded-lg border border-border bg-card px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                    <Search className="size-6 text-muted-foreground" />
                </div>

                <h2 className="text-base font-semibold text-foreground">
                    مفيش صنايعية مناسبين
                </h2>

                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                    جرب تغيّر كلمة البحث أو توسّع المنطقة أو تشيل بعض
                    الفلاتر.
                </p>
            </div>
        );
    }

    return (
        <section className="flex-1">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-foreground">
                    {craftsmen.length} صنايعي
                </h2>

                <p className="text-sm text-muted-foreground">
                    صنايعية موثقين مناسبين لبحثك
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {craftsmen.map((craftsman) => (
                    <CraftsmanCard
                        key={craftsman.id}
                        craftsman={craftsman}
                    />
                ))}
            </div>
        </section>
    );
}