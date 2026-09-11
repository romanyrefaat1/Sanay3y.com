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

const clientNavItems = [
{ href: "/dashboard", label: "الرئيسية", icon: Home },
{ href: "/client/find", label: "دور على صنايعي", icon: Search },
{ href: "/client/job/new", label: "أضف شغلانة", icon: PlusCircle },
{ href: "/chats", label: "الرسائل", icon: MessageSquare },
{ href: "/profile", label: "حسابي", icon: User },
];

export function ClientNavbar() {
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
      {clientNavItems
        .filter((item) => item.href !== "/client/job/new")
        .map((item) => {
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

    {/* Primary action */}
    <Link
      href="/client/job/new"
      className="mr-auto"
      style={{ fontFamily: "var(--font-cairo)" }}
    >
        <Button variant={"secondary"}>
      <PlusCircle className="h-4 w-4 flex items-center gap-2" />
      اعمل شغلانة جديدة
      </Button>
    </Link>
  </nav>

  {/* Mobile bottom navbar */}
  <nav
     
    className="md:hidden fixed bottom-0 inset-x-0 z-50 w-full border-t border-border bg-background"
  >
    <div className="flex w-full min-w-0">
      {clientNavItems.map((item) => {
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
