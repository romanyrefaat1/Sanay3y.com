import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div
      dir="rtl"
      className="min-h-svh bg-background text-foreground lg:flex"
    >
      {/* Brand side */}
      <aside className="relative hidden min-h-svh w-1/2 border-l border-border bg-card lg:block">
        <div className="flex h-full flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <div>
            <a
              href="/"
              className="font-cairo text-xl font-bold tracking-tight"
              aria-label="صنايعي.كوم - الرئيسية"
            >
              صنايعي<span className="text-">.كوم</span>
            </a>
          </div>

          {/* Message */}
          <div className="max-w-xl">
            <p className="mb-5 text-sm font-medium text-primary">
              متاح حاليًا في فيصل، الجيزة
            </p>

            <h1 className="font-cairo text-4xl font-bold leading-[1.25] tracking-tight xl:text-5xl">
              ادخل شوف مين رد عليك
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground">
              طلباتك وعروض الصنايعية والرسايل الجديدة، كله هتلاقيه هنا.
              وإذا حد رد عليك، هيوصلك إشعار على طول حتى لو مش فاتح الموقع.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} صنايعي.كوم</span>

            <a
              href="/"
              className="transition-colors hover:text-foreground"
            >
              الرئيسية
            </a>
          </div>
        </div>
      </aside>

      {/* Login */}
      <main className="flex min-h-svh flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <a
              href="/"
              className="block text-center font-cairo text-xl font-bold tracking-tight"
              aria-label="صنايعي.كوم - الرئيسية"
            >
              صنايعي<span className="text-">.كوم</span>
            </a>
          </div>

          <LoginForm />
        </div>
      </main>
    </div>
  );
}