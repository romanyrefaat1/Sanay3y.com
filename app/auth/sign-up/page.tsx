import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Wrench } from "lucide-react";

export default function SignUpPage() {
  return (
    <div
      dir="rtl"
      className="flex min-h-svh w-full flex-col items-center justify-center bg-background p-6"
    >
      <div className="w-full max-w-3xl">
        {/* Big question + small description */}
        <div className="mb-10 text-center space-y-2">
          <h1 className="text-foreground">إنت هنا عشان إيه؟</h1>
          <p className="text-muted-foreground">
            اختار الوصف اللي يناسبك عشان نجهزلك التجربة الصح
          </p>
        </div>

        {/* Two cards — side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/client/auth/sign-up"
            className="group rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <User className="h-5 w-5" />
            </div>
            <h3 className="mb-1.5 text-card-foreground">عميل</h3>
            <p className="text-sm text-muted-foreground">
              عايز تطلب خدمة أو تدور على صنايعي موثوق لشغلانتك
            </p>
          </Link>

          <Link
            href="/craftsman/auth/sign-up"
            className="group rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Wrench className="h-5 w-5" />
            </div>
            <h3 className="mb-1.5 text-card-foreground">صنايعي</h3>
            <p className="text-sm text-muted-foreground">
              عايز تستقبل طلبات شغل وتوسع شبكة عملاءك
            </p>
          </Link>
        </div>

        {/* Go to login */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">عندك حساب بالفعل؟</p>
          <Button variant="outline" asChild>
            <Link href="/auth/login">تسجيل الدخول</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}