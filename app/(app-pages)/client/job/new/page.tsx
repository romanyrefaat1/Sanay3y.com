"use client";

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowRight,
    BadgeCheck,
    Check,
    ImagePlus,
    MapPin,
    Upload,
    X,
} from "lucide-react";
import { z } from "zod";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
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

type TargetCraftsman = {
    id: string;
    full_name: string;
    avatar_url: string | null;
    is_active: boolean;
    verification_status: string;
    is_available: boolean;
    work_type: string;
};

function getFieldError(
    field: FieldName,
    values: JobDraft,
) {
    const result = createJobSchema.safeParse(values);

    if (result.success) {
        return "";
    }

    return (
        result.error.issues.find(
            (issue) => issue.path[0] === field,
        )?.message || ""
    );
}

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("");
}

export default function CreateJobPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
  const paramsDescription = searchParams.get('description');

    const supabase = useMemo(
        () => createClient(),
        [],
    );

    const {
        user,
        profile,
        clientProfile,
        isLoading,
    } = useUser();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [serviceType, setServiceType] = useState("");
    const [budget, setBudget] = useState("");

    const [image, setImage] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const [touched, setTouched] = useState<
        Partial<Record<FieldName, boolean>>
    >({});

    const [isDraftLoaded, setIsDraftLoaded] =
        useState(false);

    const [craftsmanId, setCraftsmanId] =
        useState<string | null>(null);

    const [targetCraftsman, setTargetCraftsman] =
        useState<TargetCraftsman | null>(null);

    const [isLoadingCraftsman, setIsLoadingCraftsman] =
        useState(false);

    const [craftsmanError, setCraftsmanError] =
        useState("");

    /*
     * Read optional targeted craftsman.
     */
    useEffect(() => {
        const params = new URLSearchParams(
            window.location.search,
        );

        const id = params.get("craftsman")?.trim();

        if (!id) {
            setCraftsmanId(null);
            return;
        }

        setCraftsmanId(id);
    }, []);

    /*
     * Resolve targeted craftsman.
     */
    useEffect(() => {
        if (!craftsmanId) {
            setTargetCraftsman(null);
            setCraftsmanError("");
            setIsLoadingCraftsman(false);
            return;
        }

        let isMounted = true;

        const loadCraftsman = async () => {
            setIsLoadingCraftsman(true);
            setCraftsmanError("");
            setTargetCraftsman(null);

            try {
                const {
                    data: profileData,
                    error: profileError,
                } = await supabase
                    .from("profiles")
                    .select(
                        `
                        id,
                        full_name,
                        avatar_url,
                        is_active,
                        role
                        `,
                    )
                    .eq("id", craftsmanId)
                    .maybeSingle();

                if (profileError) {
                    throw profileError;
                }

                if (!profileData) {
                    if (isMounted) {
                        setCraftsmanError(
                            "الصنايعي المطلوب مش موجود أو الرابط غير صحيح.",
                        );
                    }

                    return;
                }

                if (profileData.role !== "craftsman") {
                    if (isMounted) {
                        setCraftsmanError(
                            "الحساب الموجود في الرابط مش حساب صنايعي.",
                        );
                    }

                    return;
                }

                if (!profileData.is_active) {
                    if (isMounted) {
                        setCraftsmanError(
                            "حساب الصنايعي ده غير متاح حاليًا.",
                        );
                    }

                    return;
                }

                const {
                    data: craftsmanData,
                    error: craftsmanProfileError,
                } = await supabase
                    .from("craftsman_profiles")
                    .select(
                        `
                        id,
                        verification_status,
                        is_available,
                        work_type
                        `,
                    )
                    .eq("id", profileData.id)
                    .maybeSingle();

                if (craftsmanProfileError) {
                    throw craftsmanProfileError;
                }

                if (!craftsmanData) {
                    if (isMounted) {
                        setCraftsmanError(
                            "بيانات الصنايعي غير مكتملة حاليًا.",
                        );
                    }

                    return;
                }

                if (isMounted) {
                    setTargetCraftsman({
                        id: profileData.id,
                        full_name:
                            profileData.full_name,
                        avatar_url:
                            profileData.avatar_url,
                        is_active:
                            profileData.is_active,
                        verification_status:
                            craftsmanData.verification_status,
                        is_available:
                            craftsmanData.is_available,
                        work_type:
                            craftsmanData.work_type,
                    });
                }
            } catch (error) {
                console.error(
                    "Failed to load target craftsman:",
                    error,
                );

                if (isMounted) {
                    setCraftsmanError(
                        "حصل خطأ أثناء تحميل بيانات الصنايعي. تقدر تكمل نشر الشغلانة بشكل عادي.",
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoadingCraftsman(false);
                }
            }
        };

        loadCraftsman();

        return () => {
            isMounted = false;
        };
    }, [craftsmanId, supabase]);

    const draftKey = user
        ? `${JOB_DRAFT_PREFIX}:${user.id}`
        : null;

    /*
     * Restore draft.
     */
    useEffect(() => {
    if (!user || !draftKey) {
        return;
    }

    let isMounted = true;

    try {
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
            const draft = JSON.parse(savedDraft) as Partial<JobDraft>;

            if (!isMounted) {
                return;
            }

            setTitle(draft.title ?? "");

            // URL description takes priority over saved draft
            setDescription(
                paramsDescription ?? draft.description ?? "",
            );

            setServiceType(draft.serviceType ?? "");
            setBudget(draft.budget ?? "");
        } else if (paramsDescription) {
            setDescription(paramsDescription);
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
}, [user, draftKey, paramsDescription]);

    /*
     * Save draft.
     */
    useEffect(() => {
        if (
            !user ||
            !draftKey ||
            !isDraftLoaded
        ) {
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

    const descriptionError = getFieldError(
        "description",
        values,
    );

    const serviceTypeError = getFieldError(
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

    /*
     * Location now comes from profiles.location.
     *
     * The UI does not expose or ask about the old
     * client_profiles.area field.
     */
    const hasLocation = Boolean(profile?.location);

    const isTargetedOffer = Boolean(
        craftsmanId && targetCraftsman,
    );

    const targetIsValid =
        !craftsmanId ||
        Boolean(targetCraftsman);

    const canSubmit =
        hasValidForm &&
        hasLocation &&
        Boolean(user) &&
        profile?.role === "client" &&
        Boolean(clientProfile) &&
        targetIsValid &&
        !isLoadingCraftsman &&
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
                URL.revokeObjectURL(imagePreview);
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

        const filePath =
            `${user.id}/${fileName}`;

        const {
            error: uploadError,
        } = await supabase.storage
            .from("job-images")
            .upload(
                filePath,
                image,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: image.type,
                },
            );

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: {
                publicUrl,
            },
        } = supabase.storage
            .from("job-images")
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setSubmitError("");

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
         * Location is required.
         * The UI talks about location, not area.
         */
        if (!profile.location) {
            setSubmitError(
                "لا يمكنك نشر شغلانة قبل تحديد موقعك.",
            );
            return;
        }

        if (
            craftsmanId &&
            !targetCraftsman
        ) {
            setSubmitError(
                "الصنايعي المطلوب غير متاح. راجع الرابط وحاول مرة أخرى.",
            );
            return;
        }

        const result =
            createJobSchema.safeParse(values);

        if (!result.success) {
            const firstIssue =
                result.error.issues[0];

            if (firstIssue?.path[0]) {
                setTouched((current) => ({
                    ...current,
                    [firstIssue.path[0] as FieldName]:
                        true,
                }));
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

            /*
             * jobs.area is still NOT NULL in the
             * existing database schema.
             *
             * We keep the existing database value
             * here for compatibility, but it is no
             * longer part of the UI or location UX.
             */
            const { data, error: insertError } =
                await supabase
                    .from("jobs")
                    .insert({
                        client_id: user.id,
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

                        /*
                         * Required by the current
                         * jobs schema.
                         */
                        area:
                            clientProfile.area?.trim() ||
                            "غير محدد",

                        image_url:
                            imageUrl,

                        status: "open",

                        targeted_at_user:
                            targetCraftsman?.id ??
                            null,
                    })
                    .select("id")
                    .single();

            if (insertError) {
                throw insertError;
            }

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
            <div className="mx-auto w-full max-w-3xl px-4 py-6">
                <div className="text-sm text-muted-foreground">
                    جاري تحميل الصفحة...
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowRight className="h-4 w-4" />
                    العودة إلى لوحة التحكم
                </Link>

                {isTargetedOffer ? (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border">
                            <AvatarImage
                                src={
                                    targetCraftsman.avatar_url ??
                                    undefined
                                }
                                alt={
                                    targetCraftsman.full_name
                                }
                            />

                            <AvatarFallback>
                                {getInitials(
                                    targetCraftsman.full_name,
                                )}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold">
                                    ابعت عرض جديد للصنايعي{" "}
                                    <Link
                                        href={`/profile/${targetCraftsman.id}`}
                                        className="text-primary underline-offset-4 hover:underline"
                                    >
                                        {
                                            targetCraftsman.full_name
                                        }
                                    </Link>
                                </h1>

                                {targetCraftsman.verification_status ===
                                    "verified" && (
                                    <Badge className="gap-1 bg-verified text-verified-foreground hover:bg-verified">
                                        <BadgeCheck className="h-3.5 w-3.5" />
                                        موثّق
                                    </Badge>
                                )}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                اشرح له تفاصيل الشغلانة
                                وحدد ميزانيتك عشان
                                تبعت له عرضك.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold">
                            انشر شغلانتك
                        </h1>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            اشرح للصنايعية أنت محتاج
                            إيه وحدد ميزانيتك عشان
                            تلاقي الشخص المناسب.
                        </p>
                    </>
                )}
            </div>

            {/* Craftsman error */}
            {craftsmanId &&
                !isLoadingCraftsman &&
                craftsmanError && (
                    <div className="mb-6 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
                        <p className="text-sm font-medium">
                            {craftsmanError}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            تقدر تكمل وتنشر الشغلانة
                            بشكل عادي، وهتظهر
                            للصنايعية المناسبين.
                        </p>
                    </div>
                )}

            {/* Loading target */}
            {craftsmanId &&
                isLoadingCraftsman && (
                    <div className="mb-6 rounded-lg border bg-muted/20 px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                            جاري تحميل بيانات الصنايعي...
                        </p>
                    </div>
                )}

            {/* Target craftsman */}
            {isTargetedOffer && (
                <Card className="mb-6">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <Avatar className="h-11 w-11 border">
                                    <AvatarImage
                                        src={
                                            targetCraftsman.avatar_url ??
                                            undefined
                                        }
                                        alt={
                                            targetCraftsman.full_name
                                        }
                                    />

                                    <AvatarFallback>
                                        {getInitials(
                                            targetCraftsman.full_name,
                                        )}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        العرض هيتبعت إلى
                                    </p>

                                    <Link
                                        href={`/profile/${targetCraftsman.id}`}
                                        className="block truncate font-semibold text-primary underline-offset-4 hover:underline"
                                    >
                                        {
                                            targetCraftsman.full_name
                                        }
                                    </Link>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {
                                            targetCraftsman.work_type
                                        }
                                    </p>
                                </div>
                            </div>

                            <Badge
                                className={
                                    targetCraftsman.is_available
                                        ? "shrink-0 bg-available text-available-foreground hover:bg-available"
                                        : "shrink-0 bg-unavailable text-unavailable-foreground hover:bg-unavailable"
                                }
                            >
                                {targetCraftsman.is_available
                                    ? "متاح"
                                    : "غير متاح"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                {/* Job details */}
                <Card>
                    <CardContent className="p-6">
                        <div>
                            <h2 className="font-semibold">
                                {isTargetedOffer
                                    ? "تفاصيل العرض"
                                    : "تفاصيل الشغلانة"}
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {isTargetedOffer
                                    ? "اكتب تفاصيل الشغلانة بوضوح عشان الصنايعي يعرف المطلوب والميزانية."
                                    : "اكتب التفاصيل بأكبر قدر ممكن من الوضوح."}
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
                                        اكتب عنوانًا قصيرًا
                                        يوضح المطلوب.
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
                                    value={serviceType}
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
                                        (service) => (
                                            <option
                                                key={service}
                                                value={service}
                                            >
                                                {service}
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
                                    value={description}
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
                                        {description.length}
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
                                        السعر الذي أنت مستعد
                                        لدفعه مقابل
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
                                        من موقعك
                                    </span>
                                </div>

                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    موقعك هيساعد الصنايعية
                                    يعرفوا مكان الشغل
                                    ويحددوا الصنايعية
                                    القريبين منك.
                                </p>
                            </div>
                        </div>

                        <Separator className="my-5" />

                        {hasLocation ? (
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                                        <Check className="h-5 w-5" />
                                    </div>

                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            الموقع
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            تم تحديد موقعك
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
                                            لازم تحدد موقعك أولاً
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            مش هتقدر تنشر شغلانة
                                            قبل ما تحدد موقعك
                                            من ملفك الشخصي.
                                        </p>

                                        <Link
                                            href="/client/profile/edit?backTo=/client/job/new&name='شغلانة جديدة'"
                                            className="mt-3 inline-block"
                                        >
                                            <Button
                                                type="button"
                                                size="sm"
                                            >
                                                تحديد الموقع
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
                                    صورة للمكان أو المشكلة
                                    ممكن تساعد الصنايعي
                                    يفهم الشغلانة بشكل أفضل.
                                </p>
                            </div>
                        </div>

                        <Separator className="my-5" />

                        {image ? (
                            <div className="relative overflow-hidden rounded-lg border">
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="معاينة الصورة"
                                        className="max-h-80 w-full object-cover"
                                    />
                                )}

                                <button
                                    type="button"
                                    onClick={removeImage}
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
                                    PNG أو JPG بحد أقصى 5 ميجابايت
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
                                {isTargetedOffer
                                    ? `جاهز تبعت عرضك لـ ${targetCraftsman.full_name}؟`
                                    : "جاهز تنشر الشغلانة؟"}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {isTargetedOffer
                                    ? "راجع تفاصيل الشغلانة والميزانية قبل إرسال العرض."
                                    : hasLocation
                                      ? "بعد النشر هتظهر الشغلانة للصنايعية المناسبين بالقرب منك."
                                      : "حدد موقعك أولاً عشان تقدر تنشر الشغلانة."}
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
                                    ? "جاري الإرسال..."
                                    : isTargetedOffer
                                      ? "إرسال العرض"
                                      : "نشر الشغلانة"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}