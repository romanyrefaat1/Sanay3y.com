"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";

export function GuestNavbar() {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop top navbar */}
            <nav className="hidden h-16 items-center border-b border-primary/20 bg-primary px-6 md:flex">
                <Link
                    href="/"
                    className="shrink-0 text-lg font-bold text-primary-foreground"
                    style={{ fontFamily: "var(--font-cairo)" }}
                >
                    صنايعي<span className="text-white/70">.</span>كوم
                </Link>

                <div className="mx-6 h-6 w-px bg-white/20" />

                <div
                    className="flex h-full items-stretch"
                    style={{ fontFamily: "var(--font-cairo)" }}
                >
                    <Link
                        href="/client/find"
                        className={[
                            "relative flex h-full items-center px-4 text-[15px]",
                            "transition-colors",
                            pathname === "/client/find"
                                ? "font-bold text-white"
                                : "font-medium text-white/75 hover:text-white",
                        ].join(" ")}
                    >
                        دور على صنايعي

                        {pathname === "/client/find" && (
                            <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-t-full bg-white" />
                        )}
                    </Link>
                    <Link
                        href="/craftsman/find"
                        className={[
                            "relative flex h-full items-center px-4 text-[15px]",
                            "transition-colors",
                            pathname === "/client/find"
                                ? "font-bold text-white"
                                : "font-medium text-white/75 hover:text-white",
                        ].join(" ")}
                    >
                        دور على عميل

                        {pathname === "/craftsman/find" && (
                            <span className="absolute inset-x-4 bottom-0 h-[2px] rounded-t-full bg-white" />
                        )}
                    </Link>
                </div>

                <div
                    className="mr-auto flex items-center gap-2"
                    style={{ fontFamily: "var(--font-cairo)" }}
                >
                    <Link href="/auth/login">
                        <Button
                            variant="ghost"
                            className="text-white hover:bg-white/10 hover:text-white"
                        >
                            تسجيل الدخول
                        </Button>
                    </Link>

                    <Link href="/client/auth/sign-up">
                        <Button variant="secondary">
                            إنشاء حساب
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* Mobile bottom navbar */}
            <nav className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-border bg-background md:hidden">
                <div
                    className="grid grid-cols-3"
                    style={{ fontFamily: "var(--font-cairo)" }}
                >
                    <Link
                        href="/"
                        className={[
                            "relative flex min-h-[58px] flex-col items-center justify-center",
                            "gap-1 py-2.5 text-center transition-colors",
                            pathname === "/"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground",
                        ].join(" ")}
                    >
                        {pathname === "/" && (
                            <span className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-primary" />
                        )}

                        <span className="text-[11px] font-medium">
                            الرئيسية
                        </span>
                    </Link>

                    <Link
                        href="/auth/login"
                        className={[
                            "relative flex min-h-[58px] flex-col items-center justify-center",
                            "gap-1 py-2.5 text-center transition-colors",
                            pathname === "/auth/login"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground",
                        ].join(" ")}
                    >
                        {pathname === "/auth/login" && (
                            <span className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-primary" />
                        )}

                        <span className="text-[11px] font-medium">
                            تسجيل الدخول
                        </span>
                    </Link>

                    <Link
                        href="/client/auth/sign-up"
                        className="flex min-h-[58px] items-center justify-center"
                    >
                        <Button
                            size="sm"
                            className="mx-3 w-full"
                        >
                            إنشاء حساب
                        </Button>
                    </Link>
                </div>
            </nav>
        </>
    );
}