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
import { MobileBottomNav, type MobileNavItem } from "./mobile-bottom-nav";
import Image from "next/image";

const craftsmanNavItems: MobileNavItem[] = [
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

  const resolveHref = (item: MobileNavItem) =>
    item.isProfile ? profileHref : item.href;

  const isActive = (item: MobileNavItem) =>
    item.isProfile
      ? !!profile?.id && pathname === `/profile/${profile.id}`
      : pathname === item.href;

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
               <Image src={"/brand/logos/wordmark-no-bg.png"} width={200} height={200} alt="Logo of a craftsman marketplace: صنايعي.كوم" />

        </Link>

        <div className="h-6 w-px bg-white/20" />

        <div className="flex h-full items-stretch">
          {craftsmanNavItems.map((item) => {
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
      <MobileBottomNav
        items={craftsmanNavItems}
        isActive={isActive}
        resolveHref={resolveHref}
      />
    </>
  );
}