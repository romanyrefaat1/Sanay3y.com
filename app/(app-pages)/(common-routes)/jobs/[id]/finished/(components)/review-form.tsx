"use client";

import { useMemo, useState, useTransition } from "react";
import {
    Check,
    CheckCircle2,
    Heart,
    Loader2,
    MessageCircleHeart,
    Sparkles,
    Star,
    ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { submitReview } from "../actions";

type ReviewerRole = "client" | "craftsman";

type ReviewFormProps = {
    jobId: string;
    revieweeName: string;
    revieweeAvatar?: string | null;
    reviewerRole: ReviewerRole;
};

const issueTypes = [
    {
        value: "late_unavailable",
        label: "التأخير أو عدم التواجد",
    },
    {
        value: "changed_requirements",
        label: "تغيير المتطلبات",
    },
    {
        value: "communication",
        label: "التواصل",
    },
    {
        value: "payment_issue",
        label: "مشكلة في الدفع",
    },
    {
        value: "other",
        label: "سبب آخر",
    },
] as const;

const ratingMessages: Record<number, string> = {
    1: "واضح إن التجربة ما كانتش كويسة",
    2: "نتمنى التجربة الجاية تكون أفضل",
    3: "تجربة كويسة",
    4: "جميل جدًا!",
    5: "جامد! شكرًا على التقييم",
};

export default function ReviewForm({
    jobId,
    revieweeName,
    reviewerRole,
}: ReviewFormProps) {
    const [workRating, setWorkRating] = useState(0);
    const [respectRating, setRespectRating] = useState(0);

    const [clientExperience, setClientExperience] = useState<
        "good" | "had_issues" | null
    >(null);

    const [issueType, setIssueType] = useState<string | null>(
        null
    );

    const [comment, setComment] = useState("");

    const [submitted, setSubmitted] = useState(false);

    const [isPending, startTransition] =
        useTransition();

    const isClient = reviewerRole === "client";

    const canSubmit = isClient
        ? workRating > 0 &&
          respectRating > 0
        : clientExperience !== null &&
          (clientExperience === "good" || !!issueType);

    const progress = useMemo(() => {
        if (isClient) {
            let completed = 0;

            if (workRating > 0) completed++;
            if (respectRating > 0) completed++;

            if (comment.trim()) completed++;

            return Math.min(
                100,
                completed === 0
                    ? 0
                    : completed === 1
                      ? 50
                      : completed === 2
                        ? 80
                        : 100
            );
        }

        let completed = 0;

        if (clientExperience) completed++;

        if (
            clientExperience === "good" ||
            issueType
        ) {
            completed++;
        }

        if (comment.trim()) completed++;

        return Math.min(
            100,
            completed === 0
                ? 0
                : completed === 1
                  ? 50
                  : completed === 2
                    ? 80
                    : 100
        );
    }, [
        isClient,
        workRating,
        respectRating,
        clientExperience,
        issueType,
        comment,
    ]);

    const handleSubmit = () => {
        if (!canSubmit || isPending) return;

        startTransition(async () => {
            const result = await submitReview({
                jobId,
                workRating: isClient
                    ? workRating
                    : null,
                respectRating: isClient
                    ? respectRating
                    : null,
                clientExperience: isClient
                    ? null
                    : clientExperience,
                issueType: isClient
                    ? null
                    : issueType,
                comment: comment.trim() || null,
            });

            if (result?.error) {
                toast.error(result.error);
                return;
            }

            setSubmitted(true);
        });
    };

    if (submitted) {
        return (
            <SuccessState
                revieweeName={revieweeName}
            />
        );
    }

    return (
        <Card className="overflow-hidden border-primary/15 shadow-sm">
            {/* Progress */}
            <div className="h-1 w-full bg-muted">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{
                        width: `${progress}%`,
                    }}
                />
            </div>

            <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        {isClient ? (
                            <Star className="size-5 text-primary" />
                        ) : (
                            <Heart className="size-5 text-primary" />
                        )}
                    </div>

                    <div>
                        <CardTitle className="text-lg">
                            {isClient
                                ? `إيه رأيك في شغل ${revieweeName}؟`
                                : `إيه رأيك في التعامل مع ${revieweeName}؟`}
                        </CardTitle>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {isClient
                                ? "تقييمك بيساعد الناس تعرف الصنايعي المناسب ليهم."
                                : "تقييمك بيساعدنا نخلي التعامل على صنايعي.كوم أفضل للجميع."}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-7">
                {isClient ? (
                    <>
                        <RatingSection
                            title="جودة الشغل"
                            description="الشغل اتعمل بالمستوى المطلوب؟"
                            value={workRating}
                            onChange={setWorkRating}
                        />

                        <Separator />

                        <RatingSection
                            title="التعامل والاحترام"
                            description="كان التعامل محترم ومريح؟"
                            value={respectRating}
                            onChange={setRespectRating}
                        />
                    </>
                ) : (
                    <ClientExperienceSection
                        value={clientExperience}
                        issueType={issueType}
                        onExperienceChange={
                            setClientExperience
                        }
                        onIssueChange={setIssueType}
                    />
                )}

                <Separator />

                <div className="space-y-3">
                    <div>
                        <Label
                            htmlFor="review-comment"
                            className="text-sm font-semibold"
                        >
                            قولنا حاجة عنه
                            <span className="mr-1 font-normal text-muted-foreground">
                                (اختياري)
                            </span>
                        </Label>

                        <p className="mt-1 text-xs text-muted-foreground">
                            جملة بسيطة من تجربتك ممكن تساعد شخص تاني جدًا.
                        </p>
                    </div>

                    <Textarea
                        id="review-comment"
                        value={comment}
                        onChange={(event) =>
                            setComment(
                                event.target.value
                            )
                        }
                        placeholder={
                            isClient
                                ? "مثلاً: شغله ممتاز والتزم بالميعاد..."
                                : "مثلاً: العميل كان واضح ومحترم في التعامل..."
                        }
                        maxLength={500}
                        rows={4}
                        className="resize-none"
                    />

                    <div className="flex justify-end text-xs text-muted-foreground">
                        {comment.length}/500
                    </div>
                </div>

                <div className="rounded-2xl bg-primary/[0.06] p-4">
                    <div className="flex gap-3">
                        <div className="mt-0.5">
                            <Sparkles className="size-5 text-primary" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold">
                                تقييمك له تأثير
                            </p>

                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                كل تقييم صادق بتكتبه بيساعد مجتمع
                                صنايعي.كوم يبقى أحسن وأكثر ثقة.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        type="button"
                        className="h-12 w-full gap-2 text-base font-semibold transition-all duration-200"
                        disabled={!canSubmit || isPending}
                        onClick={handleSubmit}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="size-5 animate-spin" />
                                جاري حفظ تقييمك...
                            </>
                        ) : (
                            <>
                                <Heart className="size-5" />
                                إرسال التقييم
                            </>
                        )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                        التقييم اختياري — تقدر تسيبه من غير ما تكتب حاجة.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function RatingSection({
    title,
    description,
    value,
    onChange,
}: {
    title: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold">
                    {title}
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
            </div>

            <div
                className="flex items-center justify-center gap-2 sm:gap-3"
                dir="ltr"
            >
                {[1, 2, 3, 4, 5].map((star) => {
                    const selected = star <= value;

                    return (
                        <button
                            key={star}
                            type="button"
                            aria-label={`${star} من 5`}
                            onClick={() =>
                                onChange(star)
                            }
                            className={`
                                group relative flex size-12
                                items-center justify-center
                                rounded-xl
                                transition-all duration-200
                                hover:-translate-y-1
                                active:scale-90
                                ${
                                    selected
                                        ? "bg-primary/10"
                                        : "bg-muted/60 hover:bg-muted"
                                }
                            `}
                        >
                            <Star
                                className={`
                                    size-7 transition-all duration-200
                                    ${
                                        selected
                                            ? "scale-110 fill-primary text-primary"
                                            : "text-muted-foreground/50 group-hover:scale-110 group-hover:text-primary/60"
                                    }
                                `}
                            />

                            {selected && (
                                <span className="pointer-events-none absolute inset-0 animate-rating-ring rounded-xl border border-primary/30" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="min-h-5 text-center">
                {value > 0 && (
                    <p
                        key={value}
                        className="animate-rating-message text-xs font-medium text-primary"
                    >
                        {ratingMessages[value]}
                    </p>
                )}
            </div>
        </div>
    );
}

function ClientExperienceSection({
    value,
    issueType,
    onExperienceChange,
    onIssueChange,
}: {
    value: "good" | "had_issues" | null;
    issueType: string | null;
    onExperienceChange: (
        value: "good" | "had_issues"
    ) => void;
    onIssueChange: (value: string | null) => void;
}) {
    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-sm font-semibold">
                    تجربة التعامل
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                    التعامل مع العميل كان عامل إزاي؟
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceButton
                    selected={value === "good"}
                    icon={ThumbsUp}
                    title="تعامل جيد"
                    description="كل شيء كان تمام"
                    onClick={() =>
                        onExperienceChange("good")
                    }
                />

                <ChoiceButton
                    selected={value === "had_issues"}
                    icon={MessageCircleHeart}
                    title="حصلت مشكلة"
                    description="في حاجة محتاجة تتحسن"
                    onClick={() =>
                        onExperienceChange(
                            "had_issues"
                        )
                    }
                />
            </div>

            {value === "had_issues" && (
                <div className="animate-slide-down space-y-3">
                    <Label className="text-sm font-semibold">
                        إيه نوع المشكلة؟
                    </Label>

                    <div className="grid gap-2">
                        {issueTypes.map((issue) => {
                            const selected =
                                issueType ===
                                issue.value;

                            return (
                                <button
                                    key={issue.value}
                                    type="button"
                                    onClick={() =>
                                        onIssueChange(
                                            issue.value
                                        )
                                    }
                                    className={`
                                        flex items-center justify-between
                                        rounded-xl border p-3
                                        text-right text-sm
                                        transition-all duration-200
                                        ${
                                            selected
                                                ? "border-primary bg-primary/[0.06] text-primary"
                                                : "hover:border-primary/40 hover:bg-muted/50"
                                        }
                                    `}
                                >
                                    <span>
                                        {issue.label}
                                    </span>

                                    {selected && (
                                        <Check className="size-4 animate-success-pop" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function ChoiceButton({
    selected,
    icon: Icon,
    title,
    description,
    onClick,
}: {
    selected: boolean;
    icon: typeof ThumbsUp;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex items-center gap-3 rounded-2xl border
                p-4 text-right transition-all duration-200
                ${
                    selected
                        ? "border-primary bg-primary/[0.06] shadow-sm"
                        : "hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40"
                }
            `}
        >
            <div
                className={`
                    flex size-11 shrink-0 items-center justify-center
                    rounded-full transition-all duration-200
                    ${
                        selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                    }
                `}
            >
                <Icon className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                    {title}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                    {description}
                </p>
            </div>

            {selected && (
                <div className="animate-success-pop">
                    <CheckCircle2 className="size-5 text-primary" />
                </div>
            )}
        </button>
    );
}

function SuccessState({
    revieweeName,
}: {
    revieweeName: string;
}) {
    return (
        <Card className="relative overflow-hidden border-primary/20 shadow-sm">
            <CardContent className="relative px-6 py-12 text-center sm:px-10 sm:py-14">
                {/* Tiny celebration particles */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <span className="celebration-dot celebration-dot-1" />
                    <span className="celebration-dot celebration-dot-2" />
                    <span className="celebration-dot celebration-dot-3" />
                    <span className="celebration-dot celebration-dot-4" />
                    <span className="celebration-dot celebration-dot-5" />
                    <span className="celebration-dot celebration-dot-6" />
                </div>

                <div className="relative">
                    <div className="mx-auto mb-6 flex size-24 animate-success-pop items-center justify-center rounded-full bg-primary/10">
                        <div className="flex size-16 items-center justify-center rounded-full bg-primary/15">
                            <CheckCircle2 className="size-10 animate-success-check text-primary" />
                        </div>
                    </div>

                    <div className="mb-3 flex items-center justify-center gap-2 text-primary">
                        <Sparkles className="size-4 animate-pulse" />

                        <span className="text-sm font-semibold">
                            تقييمك اتسجل
                        </span>

                        <Sparkles className="size-4 animate-pulse" />
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        أنت كده عملت حاجة عظيمة
                    </h2>

                    <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
                        شكرًا إنك أخدت وقتك وقيّمت{" "}
                        <span className="font-semibold text-foreground">
                            {revieweeName}
                        </span>
                        .
                    </p>

                    <div className="mx-auto mt-7 max-w-md rounded-2xl bg-primary/[0.06] p-5">
                        <Heart className="mx-auto size-7 fill-primary text-primary" />

                        <p className="mt-3 text-base font-bold">
                            أنت كده ساعدت مجتمع
                            صنايعي.كوم يبقى أحسن
                        </p>

                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            تقييمك ممكن يساعد شخص تاني ياخد قرار
                            أفضل، ويخلي التعامل بين الناس أكثر ثقة.
                        </p>
                    </div>

                    <div className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-primary">
                        <Sparkles className="size-4" />
                        <span>شكرًا إنك شخص يعتمد عليه</span>
                        <Sparkles className="size-4" />
                    </div>

                    <Button
                        asChild
                        className="mt-8 h-11 px-7"
                    >
                        <a href="/dashboard">
                            تمام، نكمل
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}