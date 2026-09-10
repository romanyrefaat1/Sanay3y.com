import { ClientSignupForm } from "@/components/auth/client-sign-up-form";
import Link from "next/link";

export default function ClientSignupPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            صنايعي.كوم ←
          </Link>

          <div className="mt-8">
            <h1 className="text-3xl font-semibold tracking-tight">
              لاقي الصنايعي المناسب
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              أنشئ حسابك وابحث عن صنايعية موثوقين قريبين منك.
            </p>
          </div>
        </div>

        <ClientSignupForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </main>
  );
}