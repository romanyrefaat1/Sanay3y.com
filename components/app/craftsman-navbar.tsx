"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Briefcase,
  MessageSquare,
  User,
  BadgeCheck,
} from "lucide-react";

import { useUser } from "@/contexts/user-context";

const craftsmanNavItems = [
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  {
    href: "/craftsman/find",
    label: "الشغلانات المتاحة",
    icon: Search,
  },
  {
    href: "/chats",
    label: "الرسائل",
    icon: MessageSquare,
  },
  {
    href: "/craftsman/my-work",
    label: "شغلي",
    icon: Briefcase,
  },
  {
    href: "/profile",
    label: "حسابي",
    icon: User,
    isProfile: true,
  },
];

export function CraftsmanNavbar({
  isVerified = false,
}: {
  isVerified?: boolean;
}) {
  const pathname = usePathname();
  const { profile } = useUser();

  const profileHref = profile?.id
    ? `/profile/${profile.id}`
    : "/profile";

  return (
    <>
      {/* Desktop top navbar */}
      <nav className="hidden h-16 items-center gap-8 border-b border-primary/20 bg-primary px-6 md:flex">
        <Link
          href="/dashboard"
          className="shrink-0 text-lg font-bold text-primary-foreground"
          style={{
            fontFamily: "var(--font-cairo)",
          }}
        >
          صنايعي
          <span className="text-white/70">.</span>
          كوم
        </Link>

        <div className="h-6 w-px bg-white/20" />

        <div className="flex h-full items-stretch">
          {craftsmanNavItems.map((item) => {
            const href = item.isProfile
              ? profileHref
              : item.href;

            const active = item.isProfile
              ? !!profile?.id &&
                pathname === `/profile/${profile.id}`
              : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={[
                  "relative flex h-full items-center px-4 text-[15px]",
                  "transition-colors",
                  active
                    ? "font-bold text-white"
                    : "font-medium text-white/75 hover:text-white",
                ].join(" ")}
                style={{
                  fontFamily: "var(--font-cairo)",
                }}
              >
                {item.label}

                {active && (
                  <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-t-full bg-white" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="mr-auto flex items-center gap-4">
          {isVerified && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
              <BadgeCheck className="h-3.5 w-3.5" />
              حساب موثق
            </span>
          )}
        </div>
      </nav>

      {/* Mobile bottom navbar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 w-full max-w-screen border-t border-border bg-background md:hidden">
        <div className="flex w-full min-w-0">
          {craftsmanNavItems.map((item) => {
            const href = item.isProfile
              ? profileHref
              : item.href;

            const active = item.isProfile
              ? !!profile?.id &&
                pathname === `/profile/${profile.id}`
              : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={[
                  "relative flex min-w-0 flex-1 flex-col",
                  "min-h-[58px] items-center justify-center gap-1 py-2.5",
                  "transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {active && (
                  <span className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-primary" />
                )}

                <item.icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={active ? 2.4 : 2}
                />

                <span className="max-w-full truncate px-1 text-[10.5px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}