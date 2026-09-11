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

const craftsmanNavItems = [
{ href: "/dashboard", label: "الرئيسية", icon: Home },
{ href: "/craftsman/find", label: "الشغلانات المتاحة", icon: Search },
{ href: "/craftsman/jobs", label: "شغلي", icon: Briefcase },
{ href: "/chats", label: "الرسائل", icon: MessageSquare },
{ href: "/profile", label: "حسابي", icon: User },
];

export function CraftsmanNavbar({
isVerified = false,
}: {
isVerified?: boolean;
}) {
const pathname = usePathname();

return (
<>
{/* Desktop top navbar */} <nav
     className="hidden md:flex items-center h-16 px-6 gap-8 border-b border-primary/20 bg-primary"
   >
<Link
href="/dashboard"
className="text-lg font-bold shrink-0 text-primary-foreground"
style={{ fontFamily: "var(--font-cairo)" }}
>
صنايعي<span className="text-white/70">.</span>كوم </Link>
    <div className="h-6 w-px bg-white/20" />

    <div className="flex items-stretch h-full">
      {craftsmanNavItems.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex items-center px-4 h-full text-[15px]",
              "relative transition-colors",
              active
                ? "text-white font-bold"
                : "text-white/75 font-medium hover:text-white",
            ].join(" ")}
            style={{ fontFamily: "var(--font-cairo)" }}
          >
            {item.label}

            {active && (
              <span className="absolute bottom-0 inset-x-4 h-[2px] rounded-t-full bg-white" />
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
  <nav
    className="md:hidden fixed bottom-0 inset-x-0 z-50 w-full border-t border-border bg-background max-w-screen"
  >
    <div className="flex w-full min-w-0">
      {craftsmanNavItems.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "relative flex min-w-0 flex-1 flex-col",
              "items-center justify-center gap-1",
              "py-2.5 min-h-[58px]",
              "transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {active && (
              <span className="absolute top-0 inset-x-5 h-[2px] rounded-b-full bg-primary" />
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