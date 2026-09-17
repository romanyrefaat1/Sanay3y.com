"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Clock3,
  Menu,
  ShieldCheck,
  X,
  Zap,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
          NAVBAR — الصفحة مخصصة للعميل فقط (روابط "أنا صنايعي" اتشالت)
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

          <nav className="hidden items-center gap-4 md:flex" aria-label="التنقل الرئيسي">
            <Link href="/auth/login" className="inline-flex h-9">
              <Button variant="ghost" className="hover:bg-transparent">
                دخول
              </Button>
            </Link>

            <Link href="/client/auth/sign-up">
              <Button className="inline-flex h-9 items-center justify-center bg-foreground px-4 text-sm font-bold text-background transition-colors hover:bg-primary-foreground/90">
                اعمل حساب جديد
              </Button>
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
            <nav
              className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6"
              aria-label="قائمة الهاتف"
            >
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button
                  variant="ghost"
                  className="h-11 w-full justify-center text-sm font-semibold hover:bg-muted"
                >
                  دخول
                </Button>
              </Link>

              <Link
                href="/client/auth/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button className="h-11 w-full justify-center bg-foreground text-sm font-bold text-background hover:bg-primary">
                  اعمل حساب جديد
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* =========================================================
          HERO — يفتح بكلمات تعكس خوف العميل والتركيز على مشكلته
          ========================================================= */}
      <section id="hero" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            متاح حاليًا — فيصل، الجيزة
          </div>

          <h1 className="mt-6 font-cairo text-[12vw] font-bold leading-[0.95] tracking-tight sm:text-[8vw] lg:text-[88px]">
            صنايعية في فيصل
            <br />
            للسباكة والكهرباء
          </h1>

          <h2 className="mt-6 max-w-2xl font-cairo text-3xl font-bold leading-tight sm:text-4xl">
            مش عارف تجيب مين؟
          </h2>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            عندك مشكلة في البيت ومش عارف تبدأ منين؟ اكتب اللي حاصل زي ما هو، من غير ما تعرف اسم العطل أو المصطلح الصح، والصنايعية المناسبين يقدروا يشوفوا طلبك ويتقدموا لك.
          </p>

          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-foreground">
            مش لازم تلف وتسأل على صنايعي. إنت اكتب الشغل، وإحنا نساعدك تلاقي مين يناسبه.
          </p>
        </div>

        {/* Job input box */}
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
                  اكتب المشكلة زي ما هي
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

                <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground/70">
                    اكتبها بطريقتك — من غير ما تتصنّع فهم في حاجة مش شغلتك.
                  </p>
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

            {/* Outcome preview card */}
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
                <p className="text-xs font-bold text-muted-foreground">قائمة المتقدمين</p>
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

              <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                كل صنايعي هنا اتحقق رقمه قبل ما يظهرلك.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          TRUST — اعرف مين هتتعامل معاه قبل ما تختاره
          ========================================================= */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div className="border-2 border-border bg-background p-6 sm:p-8">
              <p className="text-xs font-bold text-muted-foreground/70">
                مثال توضيحي — مش بيانات حقيقية
              </p>
              <div className="mt-5 flex items-start gap-4">
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
                    تظهر بعد عدد أعمال كافي
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

              <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                كل صنايعي هنا اتحقق رقمه قبل ما يظهرلك.
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold text-primary">
                قبل ما تختار
              </p>
              <h2 className="mt-4 font-cairo text-3xl font-bold leading-snug sm:text-4xl">
                اعرف مين هتتعامل معاه قبل ما تختاره
              </h2>
              <p className="mt-5 max-w-md text-base leading-8 text-muted-foreground">
                مش هتختار شخص مجهول من غير أي معلومات. تقدر تشوف البيانات المتاحة عن الصنايعي وخبرته وتخصصه ومنطقة شغله قبل ما توافق عليه.
              </p>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground/80">
                وكل صنايعي بيتم <strong className="text-foreground">التحقق من رقم هاتفه قبل ظهوره على المنصة.</strong>
              </p>
              <p className="mt-4 max-w-md border-t border-border pt-4 text-sm leading-7 text-muted-foreground/80">
                التحقق من رقم الهاتف لا يعني إن المنصة تضمن جودة كل شغلانة، عشان كده بنخليك تشوف المعلومات المتاحة وتختار بنفسك.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRICE — اتفق على السعر قبل ما يبدأ الشغل
          ========================================================= */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold text-primary">قبل ما تبدأ</p>
            <h2 className="mt-4 font-cairo text-3xl font-bold leading-snug sm:text-4xl">
              قلقان يتغيّر عليك السعر في الآخر؟
            </h2>
            <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
              كتير من المشاكل بتحصل لأن محدش اتفق على السعر والتفاصيل من البداية. على صنايعي.كوم تقدر تتكلم مع الصنايعي وتتفقوا على السعر والتفاصيل <strong className="text-foreground">قبل ما يبدأ الشغل.</strong>
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground/80">
              مفيش سعر ثابت بتفرضه المنصة، والاتفاق النهائي بيكون بينك وبين الصنايعي.
            </p>
            <p className="mt-6 border-t border-border pt-5 text-sm font-semibold text-foreground">
              اتفق الأول، وبعدها ابدأ الشغل.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          FLOW (3 خطوات)
          ========================================================= */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="max-w-xl font-cairo text-3xl font-bold leading-tight sm:text-4xl">
            من الوصف للشغل الخلصان
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            مش لازم تلف وتسأل، ومش لازم تعرف اسم العطل. اكتب الشغل، شوف المتقدمين، واختار اللي يناسبك.
          </p>

          <div className="mt-12 flex flex-col gap-0 sm:flex-row sm:items-stretch">
            {[
              { label: "1. اكتب اللي حاصل", detail: "بطريقتك، من غير مصطلحات أو أسماء خدمات" },
              { label: "2. الصنايعية المناسبين يشوفوا طلبك", detail: "المتخصصين في نوع الشغل ومناطق الخدمة المناسبة يقدروا يتقدموا" },
              { label: "3. شوف واختار", detail: "قارن بين المتقدمين، اتكلم، واتفق على السعر والتفاصيل" },
              { label: "4. ابدأ الشغل", detail: "بعد ما تتفقوا، يبدأ تنفيذ الشغل" },
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
          BENEFITS — الفوائد التي تهم العميل والصنايعي
          ========================================================= */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <p className="text-xs font-bold text-primary">
                مش لازم تفضل فاتح الموقع
              </p>
              <h2 className="mt-4 font-cairo text-3xl font-bold leading-snug sm:text-4xl">
                خلي التحديثات المهمة توصلك.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-muted-foreground">
                مش كل شوية تدخل تشوف حد اتقدم على طلبك ولا لأ. اربط حسابك بتيليجرام وخلي التحديثات المهمة توصلك مباشرة.
              </p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div className="border border-border bg-background p-5">
                  <h3 className="font-cairo text-lg font-bold">للعميل</h3>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                    <p>حد اتقدم على طلبك؟ <strong className="text-foreground">هتعرف.</strong></p>
                    <p>فيه رسالة جديدة؟ <strong className="text-foreground">هتعرف.</strong></p>
                    <p>حصل تحديث مهم على طلبك؟ <strong className="text-foreground">هتعرف.</strong></p>
                  </div>
                </div>

                <div className="border border-border bg-background p-5">
                  <h3 className="font-cairo text-lg font-bold">وللصنايعي</h3>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                    <p>ظهر طلب مناسب لتخصصك ومنطقتك؟ <strong className="text-foreground">هتعرف.</strong></p>
                    <p>حد رد عليك؟ <strong className="text-foreground">هتعرف.</strong></p>
                    <p>حصل تحديث على طلب بتشارك فيه؟ <strong className="text-foreground">هتعرف.</strong></p>
                  </div>
                </div>
              </div>

              <p className="mt-6 border-t border-border pt-5 text-sm font-bold text-foreground">
                الموقع مش لازم يفضل مفتوح قدامك.
              </p>
            </div>

            <div className="flex flex-col justify-center border-2 border-dashed border-border bg-background p-6 sm:p-8">
              <p className="text-xs font-bold text-muted-foreground/70">
                الفكرة ببساطة
              </p>
              <h3 className="mt-4 font-cairo text-2xl font-bold leading-9">
                إنت تكتب الشغل مرة، والمنصة تساعدك تتابعه من غير ما تفتكر تدخل كل شوية.
              </h3>
              <div className="mt-8 space-y-4">
                {[
                  "تنشر طلبك",
                  "الصنايعية المناسبين يشوفوه ويتقدموا",
                  "التحديثات المهمة توصلك على تيليجرام",
                ].map((item, index) => (
                  <div key={item} className="flex items-start gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
                    <span className="font-cairo text-sm font-bold text-primary">0{index + 1}</span>
                    <span className="text-sm font-semibold leading-6">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CRAFTSMAN — فائدة التسجيل للصنايعي
          ========================================================= */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold text-primary">
                للصنايعية
              </p>
              <h2 className="mt-4 font-cairo text-3xl font-bold leading-snug sm:text-4xl">
                صنايعي؟ خلي الشغل المناسب يوصلك.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                بدل ما تفضل تدور على شغل أو تستنى حد يسأل عليك، حدد تخصصك والمناطق اللي بتشتغل فيها. لما يظهر طلب مناسب ليك، تقدر تشوف تفاصيله وتتقدم له. واربط تيليجرام عشان تعرف بالطلبات والتحديثات الجديدة من غير ما تفضل داخل الموقع.
              </p>
            </div>

            <Link href="/craftsman/auth/sign-up" className="shrink-0">
              <Button className="h-12 bg-primary px-7 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                سجل كصنايعي
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          بدأنا بفيصل وبخدمتين بس — التعديل من اعتذار لميزة
          ========================================================= */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-cairo text-3xl font-bold sm:text-4xl">
                بدأنا بفيصل، وبخدمتين بس — ليه؟
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                لأننا مش عايزين نفتح كل المناطق وكل الخدمات ونسيب الناس لوحدها. حاليًا بنركز على <strong className="text-foreground">فيصل</strong> وعلى <strong className="text-foreground">السباكة والكهرباء</strong>، ونبني شبكة من الصنايعية والعملاء في منطقة محددة قبل ما نتوسع.
              </p>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground/80">
                يعني لو إنت في فيصل ومحتاج سباك أو كهربائي، تقدر تبدأ من هنا.
              </p>
            </div>

            <div className="flex gap-3">
              <span className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2.5 text-sm font-semibold">
                <Zap className="h-4 w-4 text-primary" /> كهرباء
              </span>
              <span className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2.5 text-sm font-semibold">
                <Wrench className="h-4 w-4 text-primary" /> سباكة
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ — الترتيب الجديد حسب الأولوية
          ========================================================= */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="font-cairo text-3xl font-bold sm:text-4xl">
            أسئلة ممكن تكون في بالك.
          </h2>

          <div className="mt-10 border-t border-border">
            {[
              {
                q: "هل صنايعي.كوم موقع موثوق؟",
                a: "كل صنايعي بيتم التحقق من رقم هاتفه قبل ظهوره على المنصة، وتقدر تشوف المعلومات المتاحة عنه وخبرته قبل ما تختاره. إنت اللي بتوافق على الصنايعي، وإنت اللي بتتفق معاه على تفاصيل الشغل والسعر قبل البداية.",
              },
              {
                q: "هل السعر هيتغير بعد ما الصنايعي يخلص؟",
                a: "مفيش سعر ثابت بتحدده المنصة. إحنا بننصحك تتفق مع الصنايعي على السعر والتفاصيل قبل ما يبدأ الشغل عشان تقلل فرصة المفاجآت في النهاية. الاتفاق النهائي بيكون بينك وبين الصنايعي.",
              },
              {
                q: "هل لازم أكون عارف اسم الخدمة أو المصطلح التقني؟",
                a: "لا. اكتب المشكلة زي ما بتحس بيها وبالطريقة اللي تقدر توصفها بيها. مش لازم تعرف اسم العطل أو اسم الخدمة المطلوبة.",
              },
              {
                q: "هل أنا اللي باختار الصنايعي؟",
                a: "أيوه. الصنايعية يقدروا يتقدموا على طلبك، وإنت بتشوف المتقدمين وتختار اللي يناسبك قبل ما تبدأوا الشغل.",
              },
              {
                q: "هل لازم أعمل حساب قبل ما أبدأ؟",
                a: "تقدر تبدأ بكتابة تفاصيل طلبك، وعند إنشاء الطلب أو إكمال الخطوات المطلوبة هتحتاج تعمل حساب عشان تقدر تتابع طلبك وتتواصل مع الصنايعي.",
              },
              {
                q: "هل الخدمة متاحة في كل المناطق؟",
                a: "حاليًا صنايعي.كوم متاح في فيصل، الجيزة، وبنبدأ بخدمات السباكة والكهرباء. هنوسع المناطق والخدمات تدريجيًا بعد ما نبني شبكة قوية في البداية.",
              },
              {
                q: "هل التقييمات موجودة لكل الصنايعية؟",
                a: "مش بنعرض تقييمًا لملف لسه مبيعملش عدد كافي من الأعمال، لأن رأي واحد أو اتنين مش بالضرورة يكون صورة عادلة عن مستوى الصنايعي. لما يظهر تقييم على المنصة، بنكون حريصين إنه يكون مبني على عدد كافٍ من الأعمال.",
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
          FINAL CTA — زرار واحد مخصص للعميل
          ========================================================= */}
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col items-start justify-between gap-8 bg-primary px-6 py-14 text-primary-foreground sm:px-10 sm:flex-row sm:items-center">
            <p className="font-cairo text-3xl font-bold leading-tight sm:text-4xl">
              عندك شغل محتاج يتعمل؟
            </p>
            <button
              type="button"
              onClick={scrollToHero}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-background px-7 text-sm font-bold text-foreground transition-transform hover:-translate-y-0.5"
            >
              اطلب صنايعي دلوقتي
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER — رابط خفيف ومستقل للصنايعي في الأسفل
          ========================================================= */}
      <footer className="bg-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
            <div>
              <Link href="/" className="font-cairo text-xl font-bold tracking-tight">
                صنايعي<span className="text-primary">.</span>كوم
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
                ابدأ من الشغل، مش من البحث عن صنايعي.
              </p>
            </div>

            <div>
              <h3 className="font-cairo text-sm font-bold">روابط سريعة</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link href="/client/job/new" className="text-muted-foreground hover:text-foreground">إنشاء طلب</Link>
                <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">دخول</Link>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">الخصوصية</Link>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">الشروط والأحكام</Link>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground/70">© 2026 صنايعي.كوم</p>
            
            <div className="text-xs text-muted-foreground">
              <span>صنايعي؟ </span>
              <Link
                href="/craftsman/auth/sign-up"
                className="font-bold text-foreground underline hover:text-primary"
              >
                سجل هنا ←
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}