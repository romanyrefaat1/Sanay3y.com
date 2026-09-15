import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type Props = {
    children: React.ReactNode;
    params: Promise<{
        id: string;
    }>;
};

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://san3y.vercel.app";

const DEFAULT_JOB_IMAGE = `${SITE_URL}/og-image.jpg`;

function getAbsoluteUrl(url: string | null) {
    if (!url) return DEFAULT_JOB_IMAGE;

    try {
        return new URL(url, SITE_URL).toString();
    } catch {
        return DEFAULT_JOB_IMAGE;
    }
}

function truncateDescription(text: string, maxLength = 160) {
    const cleaned = text.replace(/\s+/g, " ").trim();

    if (cleaned.length <= maxLength) {
        return cleaned;
    }

    return `${cleaned.slice(0, maxLength).trim()}...`;
}

export async function generateMetadata({
    params,
}: Props): Promise<Metadata> {
    const { id } = await params;

    const supabase = await createClient();

    const { data: job, error } = await supabase
        .from("jobs")
        .select(`
            id,
            title,
            description,
            service_type,
            budget,
            area,
            image_url,
            status,
            created_at
        `)
        .eq("id", id)
        .single();

    if (error || !job) {
        return {
            title: "الشغلانة غير موجودة | صنايعي.كوم",
            description:
                "الشغلانة التي تبحث عنها غير موجودة أو لم تعد متاحة على صنايعي.كوم.",
            robots: {
                index: false,
                follow: false,
            },
        };
    }

    const title = `صنايعي.كوم | ${job.title}`;

    const description = truncateDescription(
        `${job.description} ${job.area ? `في ${job.area}.` : ""}`
    );

    const url = `${SITE_URL}/jobs/${job.id}`;

    const image = getAbsoluteUrl(job.image_url);

    return {
        title,
        description,

        alternates: {
            canonical: url,
        },

        openGraph: {
            title,
            description,
            url,
            siteName: "صنايعي.كوم",
            locale: "ar_EG",
            type: "website",

            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: job.title,
                },
            ],
        },

        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },

        robots: {
            index: job.status !== "cancelled",
            follow: true,
        },
    };
}

export default async function JobLayout({
    children,
}: Props) {
    return children;
}