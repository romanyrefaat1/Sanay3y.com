"use client";

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Check,
    ImagePlus,
    MapPin,
    Upload,
    X,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/contexts/user-context";

const serviceTypes = [
    "سباكة",
    "كهرباء",
    "نجارة",
    "دهانات",
    "تكييف وتبريد",
    "أجهزة منزلية",
    "نقل ونقل أثاث",
    "تنظيف",
    "صيانة",
    "أخرى",
];

const JOB_DRAFT_PREFIX = "sanay3a:create-job:draft";

const createJobSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "اكتب عنوان الشغلانة.")
        .max(
            120,
            "عنوان الشغلانة طويل جدًا. اختصره قليلًا.",
        ),

    description: z
        .string()
        .trim()
        .min(1, "اكتب وصف الشغلانة.")
        .max(
            2000,
            "الوصف طويل جدًا. الحد الأقصى 2000 حرف.",
        ),

    serviceType: z
        .string()
        .min(1, "اختار نوع الشغلانة."),

    budget: z
        .string()
        .trim()
        .min(1, "اكتب الميزانية.")
        .refine(
            (value) => {
                const number = Number(value);

                return (
                    Number.isFinite(number) &&
                    number >= 0
                );
            },
            "اكتب رقم صحيح للميزانية.",
        ),
});

type JobDraft = {
    title: string;
    description: string;
    serviceType: string;
    budget: string;
};

type FieldName =
    | "title"
    | "description"
    | "serviceType"
    | "budget";

function getFieldError(
    field: FieldName,
    values: JobDraft,
) {
    const result =
        createJobSchema.safeParse(values);

    if (result.success) {
        return "";
    }

    return (
        result.error.issues.find(
            (issue) => issue.path[0] === field,
        )?.message || ""
    );
}

export default function CreateJobPage() {
    const router = useRouter();
    const supabase = createClient();

    const {
        user,
        profile,
        clientProfile,
        isLoading,
    } = useUser();

    const [title, setTitle] = useState("");
    const [description, setDescription] =
        useState("");
    const [serviceType, setServiceType] =
        useState("");
    const [budget, setBudget] = useState("");

    const [image, setImage] =
        useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [submitError, setSubmitError] =
        useState("");

    const [touched, setTouched] = useState<
        Partial<Record<FieldName, boolean>>
    >({});

    const [isDraftLoaded, setIsDraftLoaded] =
        useState(false);

    const draftKey = user
        ? `${JOB_DRAFT_PREFIX}:${user.id}`
        : null;

    /*
     * Restore the saved draft once the authenticated
     * user is available.
     */
    useEffect(() => {
        if (!user || !draftKey) {
            return;
        }

        let isMounted = true;

        try {
            const savedDraft =
                localStorage.getItem(draftKey);

            if (savedDraft) {
                const draft = JSON.parse(
                    savedDraft,
                ) as Partial<JobDraft>;

                if (!isMounted) {
                    return;
                }

                setTitle(draft.title ?? "");
                setDescription(
                    draft.description ?? "",
                );
                setServiceType(
                    draft.serviceType ?? "",
                );
                setBudget(
                    draft.budget ?? "",
                );
            }
        } catch (error) {
            console.error(
                "Failed to restore job draft:",
                error,
            );
        } finally {
            if (isMounted) {
                setIsDraftLoaded(true);
            }
        }

        return () => {
            isMounted = false;
        };
    }, [user, draftKey]);

    /*
     * Save the draft only after the initial draft
     * has been restored.
     */
    useEffect(() => {
        if (!user || !draftKey || !isDraftLoaded) {
            return;
        }

        try {
            const draft: JobDraft = {
                title,
                description,
                serviceType,
                budget,
            };

            localStorage.setItem(
                draftKey,
                JSON.stringify(draft),
            );
        } catch (error) {
            console.error(
                "Failed to save job draft:",
                error,
            );
        }
    }, [
        user,
        draftKey,
        isDraftLoaded,
        title,
        description,
        serviceType,
        budget,
    ]);

    const values = useMemo<JobDraft>(
        () => ({
            title,
            description,
            serviceType,
            budget,
        }),
        [
            title,
            description,
            serviceType,
            budget,
        ],
    );

    const titleError = getFieldError(
        "title",
        values,
    );

    const descriptionError =
        getFieldError(
            "description",
            values,
        );

    const serviceTypeError =
        getFieldError(
            "serviceType",
            values,
        );

    const budgetError = getFieldError(
        "budget",
        values,
    );

    const hasValidForm =
        !titleError &&
        !descriptionError &&
        !serviceTypeError &&
        !budgetError;

    const hasArea = Boolean(
        clientProfile?.area?.trim(),
    );

    const canSubmit =
        hasValidForm &&
        hasArea &&
        Boolean(user) &&
        profile?.role === "client" &&
        Boolean(clientProfile) &&
        !isSubmitting;

    const markTouched = (
        field: FieldName,
    ) => {
        setTouched((current) => ({
            ...current,
            [field]: true,
        }));
    };

    const imagePreview = useMemo(() => {
        if (!image) {
            return null;
        }

        return URL.createObjectURL(image);
    }, [image]);

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(
                    imagePreview,
                );
            }
        };
    }, [imagePreview]);

    const handleImageChange = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setSubmitError(
                "من فضلك اختر صورة صالحة.",
            );
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setSubmitError(
                "حجم الصورة يجب ألا يتجاوز 5 ميجابايت.",
            );
            return;
        }

        setSubmitError("");
        setImage(file);
    };

    const removeImage = () => {
        setImage(null);
        setSubmitError("");
    };

    const uploadImage = async () => {
        if (!image || !user) {
            return null;
        }

        const extension =
            image.name
                .split(".")
                .pop()
                ?.toLowerCase() || "jpg";

        const fileName = `${crypto.randomUUID()}.${extension}`;

        const filePath = `${user.id}/${fileName}`;

        const {
            error: uploadError,
        } = await supabase.storage
            .from("job-images")
            .upload(
                filePath,
                image,
                {
                    cacheControl:
                        "3600",
                    upsert: false,
                    contentType:
                        image.type,
                },
            );

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: { publicUrl },
        } = supabase.storage
            .from("job-images")
            .getPublicUrl(
                filePath,
            );

        return publicUrl;
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setSubmitError("");

        /*
         * Account checks.
         */
        if (!user || !profile) {
            setSubmitError(
                "يجب تسجيل الدخول أولاً.",
            );
            return;
        }

        if (profile.role !== "client") {
            setSubmitError(
                "فقط العملاء يمكنهم نشر شغلانات.",
            );
            return;
        }

        if (!clientProfile) {
            setSubmitError(
                "يجب إكمال بيانات حسابك أولاً.",
            );
            return;
        }

        /*
         * A client cannot create a Job without
         * having an area set on their profile.
         */
        if (!clientProfile.area?.trim()) {
            setSubmitError(
                "لا يمكنك نشر شغلانة قبل تحديد منطقتك في الملف الشخصي.",
            );
            return;
        }

        /*
         * Final Zod validation.
         */
        const result =
            createJobSchema.safeParse(
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

            setSubmitError(
                firstIssue?.message ||
                    "راجع البيانات المدخلة.",
            );

            return;
        }

        try {
            setIsSubmitting(true);

            const imageUrl =
                await uploadImage();

            const {
                data,
                error: insertError,
            } = await supabase
                .from("jobs")
                .insert({
                    client_id:
                        user.id,

                    title:
                        result.data.title,

                    description:
                        result.data
                            .description,

                    service_type:
                        result.data
                            .serviceType,

                    budget: Number(
                        result.data.budget,
                    ),

                    area:
                        clientProfile.area.trim(),

                    image_url:
                        imageUrl,

                    status: "open",
                })
                .select("id")
                .single();

            if (insertError) {
                throw insertError;
            }

            /*
             * Delete the saved draft only after
             * the Job was successfully created.
             */
            if (draftKey) {
                localStorage.removeItem(
                    draftKey,
                );
            }

            router.push(
                `/jobs/${data.id}`,
            );

            router.refresh();
        } catch (error) {
            console.error(
                "Failed to create job:",
                error,
            );

            setSubmitError(
                "حدث خطأ أثناء نشر الشغلانة. حاول مرة أخرى.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div
                dir="rtl"
                className="mx-auto w-full max-w-3xl px-4 py-6"
            >
                <div className="text-sm text-muted-foreground">
                    جاري تحميل الصفحة...
                </div>
            </div>
        );
    }

    return (
        <div
            dir="rtl"
            className="mx-auto w-full max-w-3xl px-4 py-6"
        >
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowRight className="h-4 w-4" />
                    العودة إلى لوحة التحكم
                </Link>

                <h1 className="text-2xl font-bold">
                    انشر شغلانتك
                </h1>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    اشرح للصنايعية أنت محتاج إيه
                    وحدد ميزانيتك عشان تلاقي
                    الشخص المناسب.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                {/* Job details */}
                <Card>
                    <CardContent className="p-6">
                        <div>
                            <h2 className="font-semibold">
                                تفاصيل الشغلانة
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                اكتب التفاصيل بأكبر
                                قدر ممكن من الوضوح.
                            </p>
                        </div>

                        <Separator className="my-5" />

                        <div className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="title"
                                    className="text-sm font-medium"
                                >
                                    عنوان الشغلانة
                                </label>

                                <Input
                                    id="title"
                                    value={title}
                                    onFocus={() =>
                                        markTouched(
                                            "title",
                                        )
                                    }
                                    onChange={(event) => {
                                        markTouched(
                                            "title",
                                        );
                                        setTitle(
                                            event.target
                                                .value,
                                        );
                                    }}
                                    placeholder="مثال: إصلاح تسريب في الحنفية"
                                    maxLength={120}
                                    aria-invalid={
                                        touched.title &&
                                        Boolean(
                                            titleError,
                                        )
                                    }
                                />

                                {!touched.title && (
                                    <p className="text-xs text-muted-foreground">
                                        اكتب عنوانًا
                                        قصيرًا يوضح
                                        المطلوب.
                                    </p>
                                )}

                                {touched.title &&
                                    titleError && (
                                        <p className="text-xs text-destructive">
                                            {titleError}
                                        </p>
                                    )}

                                {touched.title &&
                                    !titleError &&
                                    title.trim() && (
                                        <p className="flex items-center gap-1 text-xs text-green-600">
                                            <Check className="h-3.5 w-3.5" />
                                            العنوان مناسب
                                        </p>
                                    )}
                            </div>

                            {/* Service type */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="serviceType"
                                    className="text-sm font-medium"
                                >
                                    نوع الشغلانة
                                </label>

                                <select
                                    id="serviceType"
                                    value={
                                        serviceType
                                    }
                                    onFocus={() =>
                                        markTouched(
                                            "serviceType",
                                        )
                                    }
                                    onChange={(event) => {
                                        markTouched(
                                            "serviceType",
                                        );
                                        setServiceType(
                                            event.target
                                                .value,
                                        );
                                    }}
                                    aria-invalid={
                                        touched.serviceType &&
                                        Boolean(
                                            serviceTypeError,
                                        )
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">
                                        اختر نوع الشغلانة
                                    </option>

                                    {serviceTypes.map(
                                        (
                                            service,
                                        ) => (
                                            <option
                                                key={
                                                    service
                                                }
                                                value={
                                                    service
                                                }
                                            >
                                                {
                                                    service
                                                }
                                            </option>
                                        ),
                                    )}
                                </select>

                                {!touched.serviceType && (
                                    <p className="text-xs text-muted-foreground">
                                        اختار النوع الأقرب
                                        للشغل المطلوب.
                                    </p>
                                )}

                                {touched.serviceType &&
                                    serviceTypeError && (
                                        <p className="text-xs text-destructive">
                                            {
                                                serviceTypeError
                                            }
                                        </p>
                                    )}

                                {touched.serviceType &&
                                    !serviceTypeError &&
                                    serviceType && (
                                        <p className="flex items-center gap-1 text-xs text-green-600">
                                            <Check className="h-3.5 w-3.5" />
                                            تم اختيار نوع
                                            الشغلانة
                                        </p>
                                    )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="description"
                                    className="text-sm font-medium"
                                >
                                    وصف الشغلانة
                                </label>

                                <Textarea
                                    id="description"
                                    value={
                                        description
                                    }
                                    onFocus={() =>
                                        markTouched(
                                            "description",
                                        )
                                    }
                                    onChange={(event) => {
                                        markTouched(
                                            "description",
                                        );
                                        setDescription(
                                            event.target
                                                .value,
                                        );
                                    }}
                                    placeholder="اشرح محتاج يتعمل إيه وأي تفاصيل ممكن تساعد الصنايعي يفهم الشغلانة..."
                                    className="min-h-36 resize-none"
                                    maxLength={2000}
                                    aria-invalid={
                                        touched.description &&
                                        Boolean(
                                            descriptionError,
                                        )
                                    }
                                />

                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        {!touched.description && (
                                            <p className="text-xs text-muted-foreground">
                                                اذكر المشكلة
                                                وأي تفاصيل
                                                مهمة
                                                للصنايعي.
                                            </p>
                                        )}

                                        {touched.description &&
                                            descriptionError && (
                                                <p className="text-xs text-destructive">
                                                    {
                                                        descriptionError
                                                    }
                                                </p>
                                            )}

                                        {touched.description &&
                                            !descriptionError &&
                                            description.trim() && (
                                                <p className="flex items-center gap-1 text-xs text-green-600">
                                                    <Check className="h-3.5 w-3.5" />
                                                    الوصف مناسب
                                                </p>
                                            )}
                                    </div>

                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {
                                            description.length
                                        }
                                        /2000
                                    </span>
                                </div>
                            </div>

                            {/* Budget */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="budget"
                                    className="text-sm font-medium"
                                >
                                    الميزانية
                                </label>

                                <div className="relative">
                                    <Input
                                        id="budget"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={budget}
                                        onFocus={() =>
                                            markTouched(
                                                "budget",
                                            )
                                        }
                                        onChange={(event) => {
                                            markTouched(
                                                "budget",
                                            );
                                            setBudget(
                                                event.target
                                                    .value,
                                            );
                                        }}
                                        placeholder="مثال: 100"
                                        className="pl-14"
                                        aria-invalid={
                                            touched.budget &&
                                            Boolean(
                                                budgetError,
                                            )
                                        }
                                    />

                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        جنيه
                                    </span>
                                </div>

                                {!touched.budget && (
                                    <p className="text-xs text-muted-foreground">
                                        السعر الذي أنت
                                        مستعد لدفعه مقابل
                                        الشغلانة.
                                    </p>
                                )}

                                {touched.budget &&
                                    budgetError && (
                                        <p className="text-xs text-destructive">
                                            {budgetError}
                                        </p>
                                    )}

                                {touched.budget &&
                                    !budgetError &&
                                    budget && (
                                        <p className="flex items-center gap-1 text-xs text-green-600">
                                            <Check className="h-3.5 w-3.5" />
                                            الميزانية صحيحة
                                        </p>
                                    )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Location */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <MapPin className="h-5 w-5" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-semibold">
                                        مكان الشغل
                                    </h2>

                                    <span className="text-xs text-muted-foreground">
                                        من ملفك
                                    </span>
                                </div>

                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    لازم تكون منطقتك محددة
                                    في ملفك الشخصي عشان
                                    الصنايعية القريبين منك
                                    يقدروا يلاقوا الشغلانة.
                                </p>
                            </div>
                        </div>

                        <Separator className="my-5" />

                        {hasArea ? (
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                                        <Check className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            المنطقة
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {
                                                clientProfile.area
                                            }
                                        </p>
                                    </div>
                                </div>

                                <Link href="/client/profile/edit?backTo=/client/job/new&name='شغلانة جديدة'">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                    >
                                        تعديل
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

                                    <div>
                                        <p className="text-sm font-medium">
                                            لازم تحدد منطقتك
                                            أولاً
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            مش هتقدر تنشر
                                            شغلانة قبل ما
                                            تضيف منطقتك في
                                            ملفك الشخصي.
                                        </p>

                                        <Link
                                            href="/client/profile/edit?backTo=/client/job/new&name='شغلانة جديدة'"
                                            className="mt-3 inline-block"
                                        >
                                            <Button
                                                type="button"
                                                size="sm"
                                            >
                                                إضافة المنطقة
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Image */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ImagePlus className="h-5 w-5" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="font-semibold">
                                        صورة الشغلانة
                                    </h2>

                                    <span className="text-xs text-muted-foreground">
                                        اختياري
                                    </span>
                                </div>

                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    صورة للمكان أو
                                    المشكلة ممكن
                                    تساعد الصنايعي
                                    يفهم الشغلانة
                                    بشكل أفضل.
                                </p>
                            </div>
                        </div>

                        <Separator className="my-5" />

                        {image ? (
                            <div className="relative overflow-hidden rounded-lg border">
                                {imagePreview && (
                                    <img
                                        src={
                                            imagePreview
                                        }
                                        alt="معاينة الصورة"
                                        className="max-h-80 w-full object-cover"
                                    />
                                )}

                                <button
                                    type="button"
                                    onClick={
                                        removeImage
                                    }
                                    className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border bg-background/90 shadow-sm hover:bg-background"
                                    aria-label="حذف الصورة"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors hover:bg-muted/30">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Upload className="h-5 w-5" />
                                </div>

                                <p className="mt-3 text-sm font-medium">
                                    ارفع صورة
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    PNG أو JPG بحد أقصى
                                    5 ميجابايت
                                </p>

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={
                                        handleImageChange
                                    }
                                />
                            </label>
                        )}
                    </CardContent>
                </Card>

                {/* Error */}
                {submitError && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {submitError}
                    </div>
                )}

                {/* Submit */}
                <Card>
                    <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold">
                                جاهز تنشر الشغلانة؟
                            </p>

                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {hasArea
                                    ? "بعد النشر هتظهر الشغلانة للصنايعية المناسبين في منطقتك."
                                    : "أضف منطقتك أولاً عشان تقدر تنشر الشغلانة."}
                            </p>
                        </div>

                        <div className="flex w-full gap-3 sm:w-auto">
                            <Link
                                href="/dashboard"
                                className="flex-1 sm:flex-none"
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                >
                                    إلغاء
                                </Button>
                            </Link>

                            <Button
                                type="submit"
                                disabled={!canSubmit}
                                className="flex-1 sm:flex-none"
                            >
                                {isSubmitting
                                    ? "جاري النشر..."
                                    : "نشر الشغلانة"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}