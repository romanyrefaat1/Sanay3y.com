import { Search } from "lucide-react";

import JobCard from "./job-card";

type Job = {
    id: string;
    client_id: string;
    title: string;
    description: string;
    service_type: string;
    budget: number;
    area: string | null;
    image_url: string | null;
    status: string;
    created_at: string;
    client: {
        id: string;
        full_name: string;
    } | null;
};

export default function JobList({
    jobs,
    appliedJobIds,
}: {
    jobs: Job[];
    appliedJobIds: string[];
}) {
    if (jobs.length === 0) {
        return (
            <div className="flex-1 rounded-lg border border-border bg-card px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                    <Search className="size-6 text-muted-foreground" />
                </div>

                <h2 className="text-base font-semibold text-foreground">
                    مفيش شغلانات مناسبة
                </h2>

                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                    جرب توسّع المسافة أو تغيّر نوع الخدمة أو تعدّل الميزانية.
                </p>
            </div>
        );
    }

    return (
        <section className="flex-1">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-foreground">
                    {jobs.length} شغلانة
                </h2>

                <p className="text-sm text-muted-foreground">
                    شغلانات مفتوحة قريبة منك
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {jobs.map((job) => (
                    <JobCard
                        key={job.id}
                        job={job}
                        hasApplied={appliedJobIds.includes(
                            job.id
                        )}
                    />
                ))}
            </div>
        </section>
    );
}