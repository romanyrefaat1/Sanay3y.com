import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "صنايعي.كوم",
  description: "منصة تربطك بالصنايعية المناسبين لشغلك",
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} ${tajawal.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}