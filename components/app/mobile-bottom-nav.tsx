"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, X, type LucideIcon } from "lucide-react";

export type MobileNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isProfile?: boolean;
};

export function MobileBottomNav({
  items,
  isActive,
  resolveHref,
  maxVisible = 5,
}: {
  items: MobileNavItem[];
  isActive: (item: MobileNavItem) => boolean;
  resolveHref: (item: MobileNavItem) => string;
  /** Total slots shown in the bar, including "More" and the pinned profile tab. */
  maxVisible?: number;
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Profile stays pinned at the end. Everything else is split into
  // what's visible in the bar and what goes behind "More".
  const profileItem = items.find((item) => item.isProfile);
  const restItems = items.filter((item) => !item.isProfile);

  const primarySlots = profileItem ? maxVisible - 2 : maxVisible - 1;
  const primaryItems = restItems.slice(0, primarySlots);
  const overflowItems = restItems.slice(primarySlots);

  const hasOverflow = overflowItems.length > 0;
  const overflowIsActive = overflowItems.some((item) => isActive(item));

  useEffect(() => {
    if (!isMoreOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMoreOpen]);

  const tabClass = (active: boolean) =>
    [
      "relative flex min-w-0 flex-1 flex-col",
      "items-center justify-center gap-1",
      "min-h-[58px] py-2.5",
      "transition-colors",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
    ].join(" ");

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-border bg-background md:hidden">
        <div className="flex w-full min-w-0">
          {primaryItems.map((item) => {
            const href = resolveHref(item);
            const active = isActive(item);

            return (
              <Link key={item.href} href={href} className={tabClass(active)}>
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

          {hasOverflow && (
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              className={tabClass(overflowIsActive)}
              aria-haspopup="true"
              aria-expanded={isMoreOpen}
            >
              {overflowIsActive && (
                <span className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-primary" />
              )}
              <MoreHorizontal
                className="h-5 w-5 shrink-0"
                strokeWidth={overflowIsActive ? 2.4 : 2}
              />
              <span className="max-w-full truncate px-1 text-[10.5px] font-medium leading-none">
                المزيد
              </span>
            </button>
          )}

          {profileItem && (
            <Link
              href={resolveHref(profileItem)}
              className={tabClass(isActive(profileItem))}
            >
              {isActive(profileItem) && (
                <span className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-primary" />
              )}
              <profileItem.icon
                className="h-5 w-5 shrink-0"
                strokeWidth={isActive(profileItem) ? 2.4 : 2}
              />
              <span className="max-w-full truncate px-1 text-[10.5px] font-medium leading-none">
                {profileItem.label}
              </span>
            </Link>
          )}
        </div>
      </nav>

      {/* Overflow sheet */}
      {hasOverflow && (
        <div
          className={[
            "fixed inset-0 z-[60] md:hidden",
            isMoreOpen ? "pointer-events-auto" : "pointer-events-none",
          ].join(" ")}
          aria-hidden={!isMoreOpen}
        >
          <div
            onClick={() => setIsMoreOpen(false)}
            className={[
              "absolute inset-0 bg-black/40 transition-opacity",
              isMoreOpen ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />

          <div
            className={[
              "absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-background shadow-lg transition-transform duration-200",
              "pb-[calc(env(safe-area-inset-bottom)+16px)]",
              isMoreOpen ? "translate-y-0" : "translate-y-full",
            ].join(" ")}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="text-sm font-semibold text-foreground">
                كل الأقسام
              </span>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                aria-label="إغلاق"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 p-5">
              {overflowItems.map((item) => {
                const href = resolveHref(item);
                const active = isActive(item);

                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={() => setIsMoreOpen(false)}
                    className={[
                      "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
                      active
                        ? "border-primary/40 bg-accent text-primary"
                        : "border-border text-foreground hover:bg-accent",
                    ].join(" ")}
                  >
                    <item.icon
                      className="h-5 w-5"
                      strokeWidth={active ? 2.4 : 2}
                    />
                    <span className="text-xs font-medium leading-tight">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}