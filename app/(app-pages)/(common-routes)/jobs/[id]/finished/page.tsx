import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Heart,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReviewForm from "./(components)/review-form";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function FinishedJobPage({
    params,
}: PageProps) {
    const { id } = await params;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select(`
            id,
            title,
            status,
            client_id,
            selected_craftsman_id
        `)
        .eq("id", id)
        .single();

    if (jobError || !job) {
        notFound();
    }

    if (job.status !== "completed") {
        redirect(`/jobs/${id}`);
    }

    const isClient = job.client_id === user.id;
    const isCraftsman = job.selected_craftsman_id === user.id;

    if (!isClient && !isCraftsman) {
        redirect(`/jobs/${id}`);
    }

    const revieweeId = isClient
        ? job.selected_craftsman_id
        : job.client_id;

    if (!revieweeId) {
        redirect(`/jobs/${id}`);
    }

    const { data: reviewee } = await supabase
        .from("profiles")
        .select(`
            id,
            full_name,
            avatar_url
        `)
        .eq("id", revieweeId)
        .single();

    if (!reviewee) {
        redirect(`/jobs/${id}`);
    }

    const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("job_id", id)
        .eq("reviewer_id", user.id)
        .maybeSingle();

    const alreadyReviewed = !!existingReview;

    return (
        <main className="min-h-[calc(100vh-4rem)] bg-muted/30 py-8 sm:py-12">
            <div className="mx-auto w-full max-w-2xl px-4">
                <div className="mb-6">
                    <Button
                        asChild
                        variant="ghost"
                        className="gap-2"
                    >
                        <Link href={`/jobs/${id}`}>
                            <ArrowLeft className="size-4" />
                            الرجوع للشغلانة
                        </Link>
                    </Button>
                </div>

                {/* Success header */}
                <section className="relative overflow-hidden rounded-3xl border bg-background p-6 text-center shadow-sm sm:p-10">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute left-[15%] top-10 size-2 animate-float rounded-full bg-primary/30" />
                        <div className="absolute right-[18%] top-20 size-3 animate-float-delayed rounded-full bg-primary/20" />
                        <div className="absolute left-[25%] bottom-16 size-2 animate-float-delayed rounded-full bg-primary/20" />
                        <div className="absolute right-[25%] bottom-10 size-2 animate-float rounded-full bg-primary/30" />
                    </div>

                    <div className="relative">
                        <div className="mx-auto mb-5 flex size-20 animate-success-pop items-center justify-center rounded-full bg-primary/10">
                            <CheckCircle2 className="size-11 text-primary animate-success-check" />
                        </div>

                        <div className="mb-2 flex items-center justify-center gap-2 text-sm font-medium text-primary">
                            <Sparkles className="size-4" />
                            <span>الشغلانة خلصت</span>
                            <Sparkles className="size-4" />
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            أحسنت، كده خلصنا!
                        </h1>

                        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
                            الشغلانة{" "}
                            <span className="font-semibold text-foreground">
                                {job.title}
                            </span>{" "}
                            اتسجلت كمكتملة.
                        </p>
                    </div>
                </section>

                {alreadyReviewed ? (
                    <Card className="mt-6 overflow-hidden border-primary/20">
                        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
                                <Heart className="size-7 fill-primary text-primary" />
                            </div>

                            <h2 className="text-xl font-bold">
                                شكرًا على تقييمك
                            </h2>

                            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                                تقييمك ساعد شخص تاني ياخد قرار أحسن،
                                وساعد مجتمع صنايعي.كوم يبقى أفضل.
                            </p>

                            <Button
                                asChild
                                className="mt-6"
                            >
                                <Link href={`/jobs/${id}`}>
                                    العودة للشغلانة
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Why review */}
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <ImpactItem
                                icon={Heart}
                                title="ساعد غيرك"
                                description="رأيك ممكن يوفر على شخص تاني وقت وحيرة."
                            />

                            <ImpactItem
                                icon={ShieldCheck}
                                title="ابني الثقة"
                                description="التقييمات بتخلي التعامل أوضح للجميع."
                            />

                            <ImpactItem
                                icon={Clock3}
                                title="مش هتاخد دقيقة"
                                description="كام اختيار بسيط وخلاص."
                            />
                        </div>

                        <div className="mt-8">
                            <ReviewForm
                                jobId={job.id}
                                revieweeName={reviewee.full_name}
                                revieweeAvatar={reviewee.avatar_url}
                                reviewerRole={
                                    isClient
                                        ? "client"
                                        : "craftsman"
                                }
                            />
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

function ImpactItem({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof Heart;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border bg-background p-4 text-center transition-transform duration-200 hover:-translate-y-0.5">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Icon className="size-5 text-primary" />
            </div>

            <p className="text-sm font-semibold">{title}</p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {description}
            </p>
        </div>
    );
}