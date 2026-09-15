import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const baseUrl = process.env.APP_URL
    ? process.env.APP_URL.replace(/\/$/, "")
    : "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient();

    /*
     * ============================================================
     * STATIC PUBLIC ROUTES
     * ============================================================
     */

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${baseUrl}/client/find`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/craftsman/find`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
    ];

    /*
     * ============================================================
     * PUBLIC PROFILES
     *
     * Include active clients and craftsmen only.
     * Admin/team profiles are excluded.
     * ============================================================
     */

    const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, role, updated_at")
        .eq("is_active", true)
        .in("role", ["client", "craftsman"]);

    if (profilesError) {
        console.error(
            "Failed to fetch profiles for sitemap:",
            profilesError,
        );
    }

    const profileRoutes: MetadataRoute.Sitemap = (profiles ?? []).map(
        (profile) => ({
            url: `${baseUrl}/profile/${profile.id}`,
            lastModified: profile.updated_at
                ? new Date(profile.updated_at)
                : new Date(),
            changeFrequency: "weekly" as const,
            priority: profile.role === "craftsman" ? 0.8 : 0.6,
        }),
    );

    /*
     * ============================================================
     * PUBLIC JOBS
     *
     * Only index jobs that are intended to be publicly discoverable.
     * Open jobs are the strongest candidates for SEO.
     * ============================================================
     */

    const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, updated_at, status")
        .in("status", [
            "open",
            "in_progress",
            "completed",
        ]);

    if (jobsError) {
        console.error(
            "Failed to fetch jobs for sitemap:",
            jobsError,
        );
    }

    const jobRoutes: MetadataRoute.Sitemap = (jobs ?? []).map(
        (job) => ({
            url: `${baseUrl}/jobs/${job.id}`,
            lastModified: job.updated_at
                ? new Date(job.updated_at)
                : new Date(),
            changeFrequency:
                job.status === "open"
                    ? ("daily" as const)
                    : ("weekly" as const),
            priority: job.status === "open" ? 0.8 : 0.6,
        }),
    );

    return [
        ...staticRoutes,
        ...profileRoutes,
        ...jobRoutes,
    ];
}