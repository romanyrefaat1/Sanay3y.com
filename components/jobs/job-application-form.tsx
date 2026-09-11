"use client";

import {
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import { z } from "zod";
import {
    Check,
    Send,
    Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/contexts/user-context";
import Link from "next/link";

type JobApplicationFormProps = {
    jobId: string;
    jobBudget: number;
    jobStatus:
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled";
    clientId: string;
    onSubmitted?: () => void;
};

const applicationSchema = z.object({
    proposedPrice: z
        .string()
        .trim()
        .min(
            1,
            "اكتب السعر اللي هتنفذ بيه الشغل.",
        )
        .refine(
            (value) => {
                const number = Number(value);

                return (
                    Number.isFinite(number) &&
                    number >= 0
                );
            },
            "اكتب سعر صحيح.",
        ),

    message: z
        .string()
        .trim()
        .max(
            1000,
            "الرسالة طويلة جدًا. الحد الأقصى 1000 حرف.",
        )
        .optional()
        .or(z.literal("")),
});

type ApplicationFormValues = {
    proposedPrice: string;
    message: string;
};

type FieldName =
    | "proposedPrice"
    | "message";

function getFieldError(
    field: FieldName,
    values: ApplicationFormValues,
) {
    const result =
        applicationSchema.safeParse(values);

    if (result.success) {
        return "";
    }

    return (
        result.error.issues.find(
            (issue) =>
                issue.path[0] === field,
        )?.message || ""
    );
}

export default function JobApplicationForm({
    jobId,
    jobBudget,
    jobStatus,
    clientId,
    onSubmitted,
}: JobApplicationFormProps) {
    const supabase = useMemo(
        () => createClient(),
        [],
    );

    const {
        user,
        profile,
        craftsmanProfile,
    } = useUser();

    const [proposedPrice, setProposedPrice] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [touched, setTouched] =
        useState<
            Partial<
                Record<FieldName, boolean>
            >
        >({});

    const [alreadyApplied, setAlreadyApplied] =
        useState(false);

    const [isCheckingApplication, setIsCheckingApplication] =
        useState(true);

    const values = useMemo(
        () => ({
            proposedPrice,
            message,
        }),
        [
            proposedPrice,
            message,
        ],
    );

    const proposedPriceError =
        getFieldError(
            "proposedPrice",
            values,
        );

    const messageError =
        getFieldError(
            "message",
            values,
        );

    const hasValidForm =
        !proposedPriceError &&
        !messageError;

    useEffect(() => {
        if (
            !user ||
            profile?.role !==
                "craftsman" ||
            !jobId
        ) {
            setIsCheckingApplication(
                false,
            );
            return;
        }

        let mounted = true;

        const checkApplication =
            async () => {
                try {
                    const {
                        data,
                        error,
                    } = await supabase
                        .from(
                            "job_applications",
                        )
                        .select("id, status")
                        .eq(
                            "job_id",
                            jobId,
                        )
                        .eq(
                            "craftsman_id",
                            user.id,
                        )
                        .maybeSingle();

                    if (error) {
                        throw error;
                    }

                    if (mounted) {
                        setAlreadyApplied(
                            Boolean(data),
                        );
                    }
                } catch (error) {
                    console.error(
                        "Failed to check application:",
                        error,
                    );
                } finally {
                    if (mounted) {
                        setIsCheckingApplication(
                            false,
                        );
                    }
                }
            };

        checkApplication();

        return () => {
            mounted = false;
        };
    }, [
        user,
        profile?.role,
        jobId,
        supabase,
    ]);

    const markTouched = (
        field: FieldName,
    ) => {
        setTouched((current) => ({
            ...current,
            [field]: true,
        }));

        setError("");
        setSuccess("");
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!user || !profile) {
            setError(
                "يجب تسجيل الدخول أولاً.",
            );
            return;
        }

        if (profile.role !== "craftsman") {
            setError(
                "فقط الصنايعية يمكنهم التقديم على الشغلانات.",
            );
            return;
        }

        /*
         * A craftsman account can exist without a
         * craftsman_profiles row yet.
         *
         * Treat that account as incomplete and
         * therefore not eligible to apply.
         */
        if (!craftsmanProfile) {
            setError(
                "لازم تكمل ملف الصنايعي وتوثق حسابك قبل التقديم على الشغلانات.",
            );
            return;
        }

        if (
            craftsmanProfile.verification_status !==
            "verified"
        ) {
            setError(
                "لازم يتم توثيق حسابك قبل التقديم على الشغلانات.",
            );
            return;
        }

        if (!craftsmanProfile.is_available) {
            setError(
                "حسابك غير متاح لاستقبال شغل حاليًا.",
            );
            return;
        }

        if (user.id === clientId) {
            setError(
                "لا يمكنك التقديم على شغلانتك.",
            );
            return;
        }

        if (jobStatus !== "open") {
            setError(
                "الشغلانة لم تعد مفتوحة للتقديم.",
            );
            return;
        }

        if (alreadyApplied) {
            setError(
                "أنت قدمت على الشغلانة دي بالفعل.",
            );
            return;
        }

        const result =
            applicationSchema.safeParse(
                values,
            );

        if (!result.success) {
            const firstIssue =
                result.error.issues[0];

            if (
                firstIssue?.path[0]
            ) {
                setTouched(
                    (current) => ({
                        ...current,
                        [firstIssue.path[0] as FieldName]:
                            true,
                    }),
                );
            }

            setError(
                firstIssue?.message ||
                    "راجع البيانات المدخلة.",
            );

            return;
        }

        try {
            setIsSubmitting(true);

            const {
                error: insertError,
            } = await supabase
                .from(
                    "job_applications",
                )
                .insert({
                    job_id:
                        jobId,
                    craftsman_id:
                        user.id,
                    proposed_price:
                        Number(
                            result
                                .data
                                .proposedPrice,
                        ),
                    message:
                        result.data.message?.trim() ||
                        null,
                    status:
                        "pending",
                });

            if (insertError) {
                if (
                    insertError.code ===
                    "23505"
                ) {
                    setAlreadyApplied(
                        true,
                    );

                    setError(
                        "أنت قدمت على الشغلانة دي بالفعل.",
                    );

                    return;
                }

                throw insertError;
            }

            setAlreadyApplied(
                true,
            );

            setSuccess(
                "تم تقديم طلبك بنجاح.",
            );

            setProposedPrice("");
            setMessage("");
            setTouched({});

            onSubmitted?.();
        } catch (error) {
            console.error(
                "Failed to create job application:",
                error,
            );

            setError(
                "حدث خطأ أثناء تقديم الطلب. حاول مرة أخرى.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (
        isCheckingApplication
    ) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">
                        جاري التحقق من حالة التقديم...
                    </p>
                </CardContent>
            </Card>
        );
    }

    /*
     * Don't show the application form if the
     * viewer isn't a craftsman.
     */
    if (
        !user ||
        profile?.role !==
            "craftsman"
    ) {
        return null;
    }

    /*
     * The Job owner isn't allowed to apply.
     */
    if (user.id === clientId) {
        return null;
    }

    /*
     * Already applied.
     */
    if (alreadyApplied) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                            <Check className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="font-semibold">
                                انت قدمت على الشغلانة
                            </p>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                طلبك اتسجل بالفعل.
                                هنبلغك لو حصل أي تحديث
                                على التقديم.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    /*
     * Job is no longer open.
     */
    if (jobStatus !== "open") {
        return null;
    }

    const isProfileIncomplete =
        !craftsmanProfile;

    const isVerified =
        craftsmanProfile?.verification_status ===
        "verified";

    const isAvailable =
        craftsmanProfile?.is_available === true;

    const canSubmit =
        hasValidForm &&
        !isProfileIncomplete &&
        isVerified &&
        isAvailable &&
        !isSubmitting;

    return (
        <Card className="bg-card border-secondary/50 hover:border-primary/30">
            <CardContent className="p-6">
                <div>
                    <h2 className="text-lg font-semibold">
                        قدم على الشغلانة
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        قدم سعرك واكتب رسالة قصيرة
                        للكلاينت.
                    </p>
                </div>

                <Separator className="my-5" />

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="space-y-5"
                >
                    {/* Proposed price */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="proposedPrice"
                                className="flex items-center gap-2 text-sm font-medium"
                            >
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                السعر المقترح
                            </label>

                            <span className="text-xs text-muted-foreground">
                                ميزانية العميل:{" "}
                                {jobBudget.toLocaleString(
                                    "ar-EG",
                                )}{" "}
                                جنيه
                            </span>
                        </div>

                        <div className="relative">
                            <Input
                                id="proposedPrice"
                                type="number"
                                min="0"
                                step="1"
                                value={
                                    proposedPrice
                                }
                                onFocus={() =>
                                    markTouched(
                                        "proposedPrice",
                                    )
                                }
                                onChange={(
                                    event,
                                ) => {
                                    markTouched(
                                        "proposedPrice",
                                    );

                                    setProposedPrice(
                                        event
                                            .target
                                            .value,
                                    );
                                }}
                                placeholder="مثال: 80"
                                className="pl-14"
                                aria-invalid={
                                    touched.proposedPrice &&
                                    Boolean(
                                        proposedPriceError,
                                    )
                                }
                            />

                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                جنيه
                            </span>
                        </div>

                        {!touched.proposedPrice && (
                            <p className="text-xs text-muted-foreground">
                                اكتب السعر اللي هتنفذ
                                بيه الشغلانة.
                            </p>
                        )}

                        {touched.proposedPrice &&
                            proposedPriceError && (
                                <p className="text-xs text-destructive">
                                    {
                                        proposedPriceError
                                    }
                                </p>
                            )}

                        {touched.proposedPrice &&
                            !proposedPriceError &&
                            proposedPrice && (
                                <p className="flex items-center gap-1 text-xs text-green-600">
                                    <Check className="h-3.5 w-3.5" />
                                    السعر صحيح
                                </p>
                            )}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="message"
                                className="text-sm font-medium"
                            >
                                رسالة للكلاينت
                            </label>

                            <span className="text-xs text-muted-foreground">
                                اختياري
                            </span>
                        </div>

                        <Textarea
                            id="message"
                            value={message}
                            onFocus={() =>
                                markTouched(
                                    "message",
                                )
                            }
                            onChange={(
                                event,
                            ) => {
                                markTouched(
                                    "message",
                                );

                                setMessage(
                                    event
                                        .target
                                        .value,
                                );
                            }}
                            placeholder="قول للكلاينت أي تفاصيل مهمة عن شغلك أو خبرتك في النوع ده من الشغل..."
                            maxLength={1000}
                            className="min-h-32 resize-none"
                            aria-invalid={
                                touched.message &&
                                Boolean(
                                    messageError,
                                )
                            }
                        />

                        <div className="flex items-center justify-between gap-3">
                            <div>
                                {!touched.message && (
                                    <p className="text-xs text-muted-foreground">
                                        رسالة قصيرة تساعد
                                        الكلاينت يعرف ليه
                                        يختارك.
                                    </p>
                                )}

                                {touched.message &&
                                    messageError && (
                                        <p className="text-xs text-destructive">
                                            {
                                                messageError
                                            }
                                        </p>
                                    )}

                                {touched.message &&
                                    !messageError &&
                                    message.trim() && (
                                        <p className="flex items-center gap-1 text-xs text-green-600">
                                            <Check className="h-3.5 w-3.5" />
                                            الرسالة مناسبة
                                        </p>
                                    )}
                            </div>

                            <span className="shrink-0 text-xs text-muted-foreground">
                                {message.length}/1000
                            </span>
                        </div>
                    </div>

                   {/* Profile / Verification warning */}
{isProfileIncomplete && (
    <div className="min-w-0 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-amber-700 dark:text-amber-400">
        <p className="break-words">
            لازم تكمل ملف الصنايعي وتوثق حسابك
            عشان تقدر تقدم على الشغلانات.
        </p>

        <Separator className="my-2" />

        <Link
            href={`/craftsman/profile/edit?backTo=/jobs/${jobId}&name=الشغلانة اللي كنت فيها دلوقتي`}
        >
            <Button
                variant="link"
                size="sm"
                className="h-auto max-w-full whitespace-normal p-0 text-right text-foreground/70 hover:text-foreground"
            >
                لو حابب تعدل ملفك تقدر تعدله من صفحة تعديل الملف دوس على الجملة دي دوس على الجملة دي
            </Button>
        </Link>
    </div>
)}

{!isProfileIncomplete &&
    !isVerified && (
        <div className="min-w-0 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-amber-700 dark:text-amber-400">
            <p className="break-words">
                لازم يكون حسابك موثق عشان تقدر تقدم
                على الشغلانات.
            </p>

            <Separator className="my-2" />

            <Link
                href={`/craftsman/profile/edit?backTo=/jobs/${jobId}&name=الشغلانة اللي كنت فيها دلوقتي`}
            >
                <Button
                    variant="link"
                    size="sm"
                    className="h-auto max-w-full whitespace-normal p-0 text-right text-foreground/70 hover:text-foreground"
                >
                    لو حابب تعدل ملفك تقدر تعدله من صفحة تعديل الملف دوس على الجملة دي دوس على الجملة دي
                </Button>
            </Link>
        </div>
    )}

{/* Availability warning */}
{craftsmanProfile &&
    !isAvailable && (
        <div className="min-w-0 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p className="break-words">
                حسابك ظاهر حاليًا كغير متاح، لذلك لن تقدر
                تقدم على هذه الشغلانة.
            </p>

            <Separator className="my-2" />

            <Link
                href={`/craftsman/profile/edit?backTo=/jobs/${jobId}&name=الشغلانة اللي كنت فيها دلوقتي`}
            >
                <Button
                    variant="link"
                    size="sm"
                    className="h-auto max-w-full whitespace-normal p-0 text-right text-foreground/70 hover:text-foreground"
                >
                    لو حابب تعدل ملفك تقدر تعدله من صفحة تعديل الملف دوس على الجملة دي دوس على الجملة دي
                </Button>
            </Link>
        </div>
    )}

{error && (
    <div className="min-w-0 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <p className="break-words">
            {error}
        </p>

        <Separator className="my-2" />

        <Link
            href={`/craftsman/profile/edit?backTo=/jobs/${jobId}&name=الشغلانة اللي كنت فيها دلوقتي`}
        >
            <Button
                variant="link"
                size="sm"
                className="h-auto max-w-full whitespace-normal p-0 text-right text-foreground/70 hover:text-foreground"
            >
                لو حابب تعدل ملفك تقدر تعدله من صفحة تعديل الملف دوس على الجملة دي دوس على الجملة دي
            </Button>
        </Link>
    </div>
)}

{success && (
    <div className="flex min-w-0 items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-600">
        <Check className="mt-0.5 h-4 w-4 shrink-0" />

        <p className="break-words">
            {success}
        </p>
    </div>
)}
                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="w-full gap-2"
                    >
                        {isSubmitting ? (
                            "جاري التقديم..."
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                تقديم الطلب
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}