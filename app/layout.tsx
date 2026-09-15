import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { UserProvider } from "@/contexts/user-context";

import "./globals.css";

const siteUrl = (
    process.env.NEXT_PUBLIC_APP_URL_FULL || "http://localhost:3000"
).replace(/\/$/, "");

const siteName = "صنايعي.كوم";

const defaultDescription =
    "صنايعي.كوم منصة تربطك بالصنايعية المناسبين لشغلك. دور على صنايعي في منطقتك، تصفح خبرته وتقييماته، أو لاقي شغلانات مناسبة ليك.";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),

    title: {
        default: `${siteName} - دور على صنايعي مناسب لشغلك`,
        template: `%s | ${siteName}`,
    },

    description: defaultDescription,

    applicationName: siteName,

    authors: [
        {
            name: siteName,
        },
    ],

    creator: siteName,
    publisher: siteName,

    alternates: {
        canonical: "/",
    },

    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
        },
    },

    keywords: [
        "صنايعي",
        "صنايعية",
        "صنايعي في منطقتك",
        "سباك",
        "كهربائي",
        "نجار",
        "فني",
        "حرفي",
        "خدمات منزلية",
        "شغلانات",
        "وظائف صنايعية",
    ],

    openGraph: {
        type: "website",
        locale: "ar_EG",
        url: "/",
        siteName,
        title: `${siteName} - دور على صنايعي مناسب لشغلك`,
        description: defaultDescription,
    },

    twitter: {
        card: "summary_large_image",
        title: `${siteName} - دور على صنايعي مناسب لشغلك`,
        description: defaultDescription,
    },

    verification: {
        google: "Sai167nQznsV1gUqyWpdBrUPe6QxEf4KWxcfPfkng44",
    },
};

const cairo = Cairo({
    variable: "--font-cairo",
    display: "swap",
    subsets: ["arabic"],
});

const tajawal = Tajawal({
    variable: "--font-tajawal",
    display: "swap",
    subsets: ["arabic"],
    weight: ["400", "500", "700"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="ar"
            dir="rtl"
            suppressHydrationWarning
        >
            <body
                className={`${cairo.variable} ${tajawal.variable} antialiased`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <UserProvider>
                        {children}
                    </UserProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}