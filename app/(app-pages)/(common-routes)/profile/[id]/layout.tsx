import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

type ProfileLayoutProps = {
    children: React.ReactNode;
    params: Promise<{
        id: string;
    }>;
};

export async function generateMetadata({
    params,
}: ProfileLayoutProps): Promise<Metadata> {
    const { id } = await params;

    const supabase = await createClient();

    const { data: profile } = await supabase
        .from("profiles")
        .select(
            `
            id,
            full_name,
            role,
            avatar_url
            `,
        )
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();

    if (!profile) {
        return {
            title: "الملف الشخصي | صنايعي.كوم",
            description:
                "اعرض الملف الشخصي وتعرف على المزيد عن المستخدم على صنايعي.كوم.",
            robots: {
                index: false,
                follow: false,
            },
        };
    }

    const isCraftsman = profile.role === "craftsman";

    const roleLabel = isCraftsman
        ? "صنايعي"
        : profile.role === "client"
          ? "عميل"
          : "مستخدم";

    const title = `${profile.full_name} - ${roleLabel} | صنايعي.كوم`;

   const description = isCraftsman
    ? `تعرف على ${profile.full_name}، صنايعي على صنايعي.كوم، وشاهد خبرته ومناطق عمله وتقييماته.`
    : `تعرف على ${profile.full_name}، عميل على صنايعي.كوم، وشاهد نشاطه وتقييماته.`;

    return {
        title,
        description,
        alternates: {
            canonical: `/profile/${profile.id}`,
        },
        openGraph: {
            title,
            description,
            url: `/profile/${profile.id}`,
            type: "profile",
            locale: "ar_EG",
            siteName: "صنايعي.كوم",
            ...(profile.avatar_url
                ? {
                      images: [
                          {
                              url: profile.avatar_url,
                              alt: profile.full_name,
                          },
                      ],
                  }
                : {}),
        },
        twitter: {
            card: profile.avatar_url
                ? "summary_large_image"
                : "summary",
            title,
            description,
            ...(profile.avatar_url
                ? {
                      images: [profile.avatar_url],
                  }
                : {}),
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

export default function ProfileLayout({
    children,
}: ProfileLayoutProps) {
    return children;
}