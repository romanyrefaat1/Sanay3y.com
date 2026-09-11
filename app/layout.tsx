import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { UserProvider } from "@/contexts/user-context";

const defaultUrl = process.env.APP_URL
  ? `https://${process.env.APP_URL}`
  : "http://localhost:3000";

// Google Search Console Verification
export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "صنايعي.كوم",
  description: "منصة تربطك بالصنايعية المناسبين لشغلك",
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
    <html lang="ar"  dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} ${tajawal.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>{children}</UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}