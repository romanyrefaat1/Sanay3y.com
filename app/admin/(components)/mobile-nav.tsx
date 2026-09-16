"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Hammer,
  History,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";

const links = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/jobs", label: "الشغلانات", icon: BriefcaseBusiness },
  { href: "/admin/craftsmen", label: "الصنايعية", icon: Hammer },
  { href: "/admin/applications", label: "الapplications", icon: Hammer },
  { href: "/admin/activity", label: "النشاط", icon: History },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="فتح القائمة"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-md hover:bg-muted"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-full z-50 flex flex-col gap-1 border-b bg-background px-4 py-3 shadow-sm">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}