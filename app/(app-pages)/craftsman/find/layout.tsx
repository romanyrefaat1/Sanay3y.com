import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "الشغلانات المتاحة | صنايعي.كوم",
    description:
        "تصفح الشغلانات المتاحة ولاقِ فرص شغل مناسبة ليك في منطقتك على صنايعي.كوم.",
    alternates: {
        canonical: "/craftsman/find",
    },
    openGraph: {
        title: "الشغلانات المتاحة | صنايعي.كوم",
        description:
            "تصفح الشغلانات المتاحة وقدم على الشغل المناسب ليك.",
        url: "/craftsman/find",
        type: "website",
        locale: "ar_EG",
        siteName: "صنايعي.كوم",
    },
    twitter: {
        card: "summary",
        title: "الشغلانات المتاحة | صنايعي.كوم",
        description:
            "تصفح الشغلانات المتاحة وقدم على الشغل المناسب ليك.",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function CraftsmanFindLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}