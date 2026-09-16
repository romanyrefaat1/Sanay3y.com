"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpLeft,
  ChevronDown,
  Clock3,
  Menu,
  ShieldCheck,
  X,
  Zap,
  Wrench,
} from "lucide-react";

// TODO before shipping: replace with a real Supabase count query.
// Do not hardcode this — it must reflect the actual craftsman table,
// filtered to Faisal. If it drops below what's shown here, the page lies.
const CRAFTSMEN_IN_FAISAL = 50;

const exampleApplicants = [
  { name: "أحمد محمد", experience: "8 سنين خبرة", initials: "أم" },
  { name: "محمد علي", experience: "5 سنين خبرة", initials: "مع" },
  { name: "محمود حسن", experience: "10 سنين خبرة", initials: "مح" },
];

export default function HomePage() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError("اكتب إيه اللي محتاج يتعمل الأول.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const params = new URLSearchParams({ description: trimmedDescription });
    router.push(`/client/job/new?${params.toString()}`);
  }

  function scrollToHero() {
    document
      .getElementById("hero")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground"
    >
      {/* =========================================================
          NAVBAR
          ========================================================= */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-cairo text-[20px] font-bold tracking-tight"
            aria-label="صنايعي.كوم - الرئيسية"
          >
            صنايعي<span className="text-primary">.</span>كوم
          </Link>

          <nav className="hidden items-center gap-6 md:flex" aria-label="التنقل الرئيسي">
            <Link
              href="/craftsman/auth/sign-up"
              className="text-sm font-semibold text-foreground/80 underline decoration-primary/40 decoration-2 underline-offset-4 transition-colors hover:text-foreground"
            >
              أنا صنايعي
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-9 items-center justify-center bg-foreground px-4 text-sm font-bold text-background transition-opacity hover:opacity-85"
            >
              دخول
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center border border-border md:hidden"
            aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="mx-auto flex w-full max-w-7xl flex-col px-4 py-2 sm:px-6" aria-label="قائمة الهاتف">
              <Link
                href="/craftsman/auth/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-border py-4 text-sm font-semibold"
              >
                أنا صنايعي
              </Link>
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-4 text-sm font-semibold"
              >
                دخول
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* =========================================================
          HERO — headline carries the doubt/confusion (the real
          insight, per CRO analysis), subline carries the one
          honest proof point we have: real craftsman density in
          Faisal. No fake completion stats — we haven't shipped
          a finished job yet, so we don't claim one.
          ========================================================= */}
      <section id="hero" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            متاح حاليًا — فيصل، الجيزة
          </div>

          <h1 className="mt-6 font-cairo text-[13vw] font-bold leading-[0.95] tracking-tight sm:text-[9vw] lg:text-[100px]">
            مش عارف
            <br />
            تجيب مين؟
          </h1>

          <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">
            <span className="font-bold text-foreground">
              +{CRAFTSMEN_IN_FAISAL} صنايعي في فيصل
            </span>{" "}
            مستنيين يشتغلوا. اكتب المشكلة زي ما هي، من غير مصطلحات، وهيشوفوا طلبك.
          </p>
        </div>

        {/* Job-ticket input: the signature element. Reads like a
            torn notice, not a dashboard card. */}
        <div className="mx-auto mt-10 w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <form onSubmit={handleSubmit} noValidate>
              <div
                className={`relative border-2 bg-card transition-colors ${
                  error ? "border-destructive" : "border-border focus-within:border-primary"
                }`}
              >
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <span className="font-cairo text-sm font-bold text-muted-foreground">
                    طلب جديد
                  </span>
                  <span className="text-xs text-muted-foreground/70">
                    {description.length}/2000
                  </span>
                </div>

                <label htmlFor="job-description" className="sr-only">
                  اكتب الشغل اللي محتاج يتعمل
                </label>
                <textarea
                  id="job-description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="مثلاً: الكهربا بتفصل كل شوية ومش عارف السبب"
                  maxLength={2000}
                  rows={5}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "job-description-error" : undefined}
                  className="block min-h-[160px] w-full resize-none border-0 bg-transparent px-5 py-5 font-cairo text-xl font-bold leading-8 text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0"
                />

                <div className="flex items-center justify-between px-5 pb-5">
                  <p className="text-xs text-muted-foreground/70">اكتبها بطريقتك، من غير مصطلحات.</p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "جاري الفتح..." : "اطلب صنايعي دلوقتي"}
                    {!isSubmitting && <ArrowLeft className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p id="job-description-error" className="mt-2 text-sm font-semibold text-destructive">
                  {error}
                </p>
              )}
            </form>

            {/* Live-updating outcome strip — grounded, not a fake dashboard */}
            <div className="flex flex-col justify-between border-2 border-dashed border-border p-6">
              <div>
                <p className="text-xs font-bold text-muted-foreground/70">
                  مثال توضيحي — مش بيانات حقيقية
                </p>
                <p className="mt-4 font-cairo text-2xl font-bold leading-9">
                  {description.trim() || "الكهربا بتفصل كل شوية ومش عارف السبب"}
                </p>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-primary" />
                  كهرباء · فيصل
                </div>
              </div>

              <div className="mt-8 space-y-2.5">
                {exampleApplicants.map((applicant) => (
                  <div
                    key={applicant.name}
                    className="flex items-center gap-3 border-b border-border pb-2.5 last:border-b-0"
                  >
                    <span className="font-cairo text-sm font-bold text-primary">
                      {applicant.initials}
                    </span>
                    <span className="text-sm font-semibold">{applicant.name}</span>
                    <span className="mr-auto text-xs text-muted-foreground/70">
                      {applicant.experience}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TWO PATHS — the section that was completely missing.
          Client and craftsman get equal visual weight, distinct
          CTA styling so neither reads as secondary. This is the
          direct fix for "50+ craftsmen and the page never speaks
          to them."
          ========================================================= */}
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-x-reverse sm:divide-border">
            <div className="flex flex-col justify-between gap-6 sm:pl-10">
              <div>
                <p className="font-cairo text-2xl font-bold">عندك شغل؟</p>
                <p className="mt-2 max-w-xs text-sm leading-7 text-muted-foreground">
                  اكتب المشكلة، واستنى الصنايعية يتقدموا لطلبك.
                </p>
              </div>
              <button
                type="button"
                onClick={scrollToHero}
                className="inline-flex h-11 w-fit items-center justify-center gap-2 bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                ابدأ طلبك
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col justify-between gap-6 sm:pr-10">
              <div>
                <p className="font-cairo text-2xl font-bold">إنت صنايعي؟</p>
                <p className="mt-2 max-w-xs text-sm leading-7 text-muted-foreground">
                  استقبل طلبات شغل حقيقية من عملاء في فيصل، وحدد المناطق اللي تناسبك.
                </p>
              </div>
              <Link
                href="/craftsman/auth/sign-up"
                className="inline-flex h-11 w-fit items-center justify-center gap-2 border-2 border-primary px-6 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                سجل كصنايعي
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FLOW — connected horizontal arrows, not numbered cards.
          ========================================================= */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="max-w-lg font-cairo text-3xl font-bold leading-tight sm:text-4xl">
            من الوصف للشغل الخلصان — من غير لف ودوران.
          </h2>

          <div className="mt-12 flex flex-col gap-0 sm:flex-row sm:items-stretch">
            {[
              { label: "اكتب المشكلة", detail: "بطريقتك، من غير مصطلحات" },
              { label: "الصنايعية يتقدموا", detail: "القريبين منك ومتخصصين في نوع الشغل" },
              { label: "اختار وابدأ", detail: "قارن، اتفق، وابدأ التنفيذ" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex flex-1 items-stretch">
                <div className="flex-1 py-2">
                  <p className="font-cairo text-lg font-bold">{step.label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden w-16 shrink-0 items-center justify-center sm:flex">
                    <ArrowLeft className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          PROFILE + TRUST — folds verification into the same
          section as "what you see before choosing." Only ship
          the verification line if phone verification is actually
          enforced in the DB — otherwise cut it, don't soften it.
          ========================================================= */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="border-2 border-border bg-card p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-accent font-cairo text-lg font-bold text-accent-foreground">
                  أم
                </div>
                <div>
                  <h3 className="font-cairo text-xl font-bold">أحمد محمد</h3>
                  <p className="mt-1 text-sm text-muted-foreground">كهربائي · فيصل</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Clock3 className="h-3.5 w-3.5" />
                    متاح اليوم
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-6">
                <div>
                  <p className="text-xs text-muted-foreground/70">الخبرة</p>
                  <p className="mt-1 font-cairo text-lg font-bold">8 سنين</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70">التقييمات</p>
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">
                    تظهر بعد 5 أعمال مكتملة
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-6">
                {[Zap, Wrench, Zap].map((Icon, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center border border-border bg-muted/40"
                  >
                    <Icon className="h-5 w-5 text-primary/60" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold text-primary">
                قبل ما تختار
              </p>
              <p className="mt-4 font-cairo text-3xl font-bold leading-snug sm:text-4xl">
                مش مجرد اسم ورقم.
              </p>
              <p className="mt-5 max-w-md text-base leading-8 text-muted-foreground">
                تراجع خبرة كل صنايعي وأعماله السابقة قبل ما تتفق معاه. لو عنده
                عدد أعمال مكتملة كافي، تقدر تشوف تقييماته كمان.
              </p>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground/80">
                مبنعرضش تقييم لملف لسه مبيعملش عدد كافي من الشغل — عشان
                رأي واحد أو اتنين ميدّيش صورة حقيقية.
              </p>

              {/* TODO: only keep this block if phone verification is
                  actually enforced before a craftsman profile goes live. */}
              <div className="mt-6 flex items-center gap-2.5 border-t border-border pt-6 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                بنتحقق من رقم كل صنايعي قبل ما يظهر في المنصة.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          LOCAL COVERAGE — reframes "no completed jobs yet" as an
          honest early-launch statement instead of hiding it.
          ========================================================= */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-cairo text-3xl font-bold sm:text-4xl">
                بنطلق دلوقتي في فيصل.
              </p>
              <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
                حاليًا بخدمات الكهرباء والسباكة المنزلية بس — مش عايزين
                نوعدك بأكتر من اللي عندنا فعلاً. كن من أول اللي يجربوا الخدمة.
              </p>
            </div>

            <div className="flex gap-3">
              <span className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-sm font-semibold">
                <Zap className="h-4 w-4 text-primary" /> كهرباء
              </span>
              <span className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-sm font-semibold">
                <Wrench className="h-4 w-4 text-primary" /> سباكة
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ — added a pricing-expectation answer per the CRO
          fix (no fake price range, just the honest process).
          ========================================================= */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="font-cairo text-3xl font-bold sm:text-4xl">
            أسئلة ممكن تكون في بالك.
          </h2>

          <div className="mt-10 border-t border-border">
            {[
              {
                q: "هل لازم أكون عارف اسم الخدمة؟",
                a: "لا. اكتب المشكلة أو الشغل اللي محتاج يتعمل بطريقتك، وكمل باقي تفاصيل الطلب بعد كده.",
              },
              {
                q: "هل أنا اللي باختار الصنايعي؟",
                a: "أيوه. الصنايعية يتقدموا للطلب، وأنت تراجع المعلومات المتاحة عنهم وتختار الشخص اللي يناسبك.",
              },
              {
                q: "في سعر ثابت للخدمة؟",
                a: "لأ، مفيش سعر ثابت. الصنايعي بيشوف تفاصيل شغلك ويديك سعر يناسب الحالة، وأنت تتفق معاه قبل ما يبدأ.",
              },
              {
                q: "هل لازم أعمل حساب قبل ما أبدأ؟",
                a: "تقدر تبدأ بكتابة وصف الشغل مباشرة. هتحتاج حساب عشان تكمل وتنشر الطلب.",
              },
              {
                q: "هل الخدمة متاحة في كل المناطق؟",
                a: "حاليًا بنبدأ من فيصل، بخدمات السباكة والكهرباء المنزلية. التغطية هتتوسع مع نمو المنصة.",
              },
            ].map((item) => (
              <details key={item.q} className="group border-b border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-cairo text-base font-bold sm:text-lg">
                  <span>{item.q}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground/70 transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-2xl pb-6 text-sm leading-7 text-muted-foreground sm:text-base">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA — flat primary, two paths again so a craftsman
          who scrolled all the way down still isn't stranded.
          ========================================================= */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col items-start justify-between gap-8 bg-primary px-6 py-14 text-primary-foreground sm:px-10 lg:flex-row lg:items-center">
            <p className="font-cairo text-3xl font-bold leading-tight sm:text-4xl">
              عندك شغل، ولا إنت صنايعي؟
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToHero}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-background px-7 text-sm font-bold text-foreground transition-transform hover:-translate-y-0.5"
              >
                اطلب صنايعي
                <ArrowUpLeft className="h-4 w-4" />
              </button>
              <Link
                href="/craftsman/auth/sign-up"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 border-2 border-background px-7 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                سجل كصنايعي
                <ArrowUpLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
          ========================================================= */}
      <footer className="bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
            <div>
              <Link href="/" className="font-cairo text-xl font-bold tracking-tight">
                صنايعي<span className="text-primary">.</span>كوم
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
                ابدأ من الشغل، مش من البحث عن صنايعي.
              </p>
            </div>

            <div>
              <h3 className="font-cairo text-sm font-bold">للعملاء</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link href="/client/job/new" className="text-muted-foreground hover:text-foreground">إنشاء طلب</Link>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">طلباتي</Link>
                <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">دخول</Link>
              </div>
            </div>

            <div>
              <h3 className="font-cairo text-sm font-bold">للصنايعية</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link href="/craftsman/auth/sign-up" className="text-muted-foreground hover:text-foreground">انضم كصنايعي</Link>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">الخصوصية</Link>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">الشروط والأحكام</Link>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">تواصل معنا</Link>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <p className="text-center text-xs text-muted-foreground/70">© 2026 صنايعي.كوم</p>
          </div>
        </div>
      </footer>
    </main>
  );
}