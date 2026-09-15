import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "دور على صنايعي | صنايعي.كوم",
    description:
        "دور على الصنايعي المناسب لشغلك في منطقتك. تصفح الصنايعية الموثقين واختر الشخص المناسب لخدمتك.",
    alternates: {
        canonical: "/client/find",
    },
    openGraph: {
        title: "دور على صنايعي | صنايعي.كوم",
        description:
            "دور على الصنايعي المناسب لشغلك في منطقتك على صنايعي.كوم.",
        url: "/client/find",
        type: "website",
        locale: "ar_EG",
        siteName: "صنايعي.كوم",
    },
    twitter: {
        card: "summary",
        title: "دور على صنايعي | صنايعي.كوم",
        description:
            "دور على الصنايعي المناسب لشغلك في منطقتك.",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function ClientFindLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}