"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  PlusCircle,
  MessageSquare,
  ClipboardList,
  User,
} from "lucide-react";

import { Button } from "../ui/button";
import { useUser } from "@/contexts/user-context";
import {
  MobileBottomNav,
  type MobileNavItem,
} from "./mobile-bottom-nav";

const clientNavItems: MobileNavItem[] = [
  {
    href: "/dashboard",
    label: "الرئيسية",
    icon: Home,
    mobileIcon: (
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        {/* Light mode */}
        <Image
          src="/brand/logos/letter-no-bg.png"
          width={200}
          height={24}
          alt="صنايعي.كوم"
          className="h-6 w-6 object-contain dark:hidden"
        />
        {/* Dark mode */}
        <Image
          src="/brand/logos/letter-no-bg-darkmode.png"
          width={200}
          height={24}
          alt="صنايعي.كوم"
          className="h-6 w-6 object-contain hidden dark:block"
        />
      </span>
    ),
  },
  {
    href: "/client/find",
    label: "دور على صنايعي",
    icon: Search,
  },
  {
    href: "/client/job/new",
    label: "أضف شغلانة",
    icon: PlusCircle,
  },
  {
    href: "/chats",
    label: "الرسائل",
    icon: MessageSquare,
  },
  {
    href: "/client/my-job-offers",
    label: "عروضي",
    icon: ClipboardList,
  },
  {
    href: "/profile",
    label: "حسابي",
    icon: User,
    isProfile: true,
  },
];

export function ClientNavbar() {
  const pathname = usePathname();
  const { profile } = useUser();

  const profileHref = profile?.id
    ? `/profile/${profile.id}`
    : "/profile";

  const resolveHref = (item: MobileNavItem) =>
    item.isProfile ? profileHref : item.href;

  const isActive = (item: MobileNavItem) =>
    item.isProfile
      ? !!profile?.id && pathname === `/profile/${profile.id}`
      : pathname === item.href;

  return (
    <>
      {/* Desktop top navbar */}
      <nav className="hidden h-16 items-center gap-8 border-b border-border bg-secondary px-6 md:flex">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center"
          aria-label="صنايعي.كوم"
        >
          {/* Light mode */}
          <Image
            src="/brand/logos/wordmark-no-bg.png"
            width={160}
            height={40}
            alt="صنايعي.كوم"
            className="object-contain dark:hidden"
            priority
          />

          {/* Dark mode */}
          <Image
            src="/brand/logos/wordmark-no-bg-darkmode.png"
            width={160}
            height={40}
            alt=""
            className="hidden object-contain dark:block"
            priority
          />
        </Link>

        <div className="h-6 w-px bg-border" />

        <div className="flex h-full items-stretch">
          {clientNavItems
            .filter((item) => item.href !== "/client/job/new")
            .map((item) => {
              const href = resolveHref(item);
              const active = isActive(item);

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={[
                    "relative flex h-full items-center px-4 text-[15px]",
                    "transition-colors",
                    active
                      ? "font-bold text-primary"
                      : "font-medium text-secondary-foreground hover:text-foreground",
                  ].join(" ")}
                  style={{
                    fontFamily: "var(--font-cairo)",
                  }}
                >
                  {item.label}

                  {active && (
                    <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-t-full bg-primary" />
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
          <Button variant="default">
            <PlusCircle className="h-4 w-4" />
            اعمل شغلانة جديدة
          </Button>
        </Link>
      </nav>

      {/* Mobile bottom navbar */}
      <MobileBottomNav
        items={clientNavItems}
        isActive={isActive}
        resolveHref={resolveHref}
      />
    </>
  );
}