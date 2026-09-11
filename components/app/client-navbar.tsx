"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  PlusCircle,
  MessageSquare,
  User,
} from "lucide-react";

import { Button } from "../ui/button";
import { useUser } from "@/contexts/user-context";

const clientNavItems = [
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  { href: "/client/find", label: "دور على صنايعي", icon: Search },
  { href: "/client/job/new", label: "أضف شغلانة", icon: PlusCircle },
  { href: "/chats", label: "الرسائل", icon: MessageSquare },
  { href: "/client/job-offers", label: "عروضي", icon: MessageSquare },
  { href: "/profile", label: "حسابي", icon: User, isProfile: true },
];

export function ClientNavbar() {
  const pathname = usePathname();
  const { profile } = useUser();

  const profileHref = profile?.id ? `/profile/${profile.id}` : "/profile";

  return (
    <>
      {/* Desktop top navbar */}
      <nav className="hidden md:flex h-16 items-center gap-8 border-b border-primary/20 bg-primary px-6">
        <Link
          href="/dashboard"
          className="shrink-0 text-lg font-bold text-primary-foreground"
          style={{ fontFamily: "var(--font-cairo)" }}
        >
          صنايعي<span className="text-white/70">.</span>كوم
        </Link>

        <div className="h-6 w-px bg-white/20" />

        <div className="flex h-full items-stretch">
          {clientNavItems
            .filter((item) => item.href !== "/client/job/new")
            .map((item) => {
              const href = item.isProfile ? profileHref : item.href;

              const active = item.isProfile
                ? pathname.startsWith("/profile/")
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
                  style={{ fontFamily: "var(--font-cairo)" }}
                >
                  {item.label}

                  {active && (
                    <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-t-full bg-white" />
                  )}
                </Link>
              );
            })}
        </div>

        {/* Primary action */}
        <Link
          href="/client/job/new"
          className="mr-auto"
          style={{ fontFamily: "var(--font-cairo)" }}
        >
          <Button variant="secondary">
            <PlusCircle className="h-4 w-4" />
            اعمل شغلانة جديدة
          </Button>
        </Link>
      </nav>

      {/* Mobile bottom navbar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-border bg-background md:hidden">
        <div className="flex w-full min-w-0">
          {clientNavItems.map((item) => {
            const href = item.isProfile ? profileHref : item.href;

            const active = item.isProfile
              ? pathname.startsWith("/profile/")
              : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={[
                  "relative flex min-w-0 flex-1 flex-col",
                  "items-center justify-center gap-1",
                  "min-h-[58px] py-2.5",
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