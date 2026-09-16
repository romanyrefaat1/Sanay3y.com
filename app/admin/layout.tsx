import Link from "next/link";
import {
  BriefcaseBusiness,
  Hammer,
  History,
  LayoutDashboard,
} from "lucide-react";

import { requireAdmin } from "./_lib/require-admin";
import { MobileNav } from "./(components)/mobile-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background"
    >
      <div className="relative border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/admin"
            className="font-bold"
          >
            صنايعي.كوم
            <span className="mr-2 text-sm font-normal text-muted-foreground">
              Admin
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <LayoutDashboard className="size-4" />
              الرئيسية
            </Link>

            <Link
              href="/admin/jobs"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <BriefcaseBusiness className="size-4" />
              الشغلانات
            </Link>

            <Link
              href="/admin/craftsmen"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <Hammer className="size-4" />
              الصنايعية
            </Link>

            <Link
              href="/admin/activity"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <History className="size-4" />
              النشاط
            </Link>
          </nav>

          {/* Mobile nav (hamburger + dropdown) */}
          <MobileNav />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}