"use client";

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useMemo,
    useState,
} from "react";
import Link from "next/link";
import {
    useRouter,
    useSearchParams,
} from "next/navigation";
import {
    ArrowRight,
    BriefcaseBusiness,
    Camera,
    Check,
    Clock3,
    MapPin,
    Phone,
    UserRound,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/contexts/user-context";

const craftsmanProfileSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, "اكتب اسمك بشكل صحيح.")
        .max(100, "الاسم طويل جدًا."),

    phone: z
        .string()
        .trim()
        .max(20, "رقم الهاتف طويل جدًا.")
        .optional()
        .or(z.literal("")),

    bio: z
        .string()
        .trim()
        .max(
            1500,
            "النبذة طويلة جدًا. الحد الأقصى 1500 حرف.",
        )
        .optional()
        .or(z.literal("")),

    experienceYears: z
        .string()
        .trim()
        .refine(
            (value) =>
                value === "" ||
                (Number.isInteger(Number(value)) &&
                    Number(value) >= 0),
            "اكتب عدد سنين خبرة صحيح.",
        ),

    isAvailable: z.boolean(),
});

type CraftsmanProfileForm = {
    fullName: string;
    phone: string;
    bio: string;
    experienceYears: string;
    isAvailable: boolean;
};

type FieldName =
    | "fullName"
    | "phone"
    | "bio"
    | "experienceYears";

function getFieldError(
    field: FieldName,
    values: CraftsmanProfileForm,
) {
    const result =
        craftsmanProfileSchema.safeParse(
            values,
        );

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

export default function CraftsmanProfileEditPage() {
    const router = useRouter();
    const searchParams =
        useSearchParams();

    const supabase = useMemo(
        () => createClient(),
        [],
    );

    const {
        user,
        profile,
        craftsmanProfile,
        isLoading,
        refreshUser,
    } = useUser();

    const [fullName, setFullName] =
        useState("");

    const [phone, setPhone] =
        useState("");

    const [bio, setBio] =
        useState("");

    const [experienceYears, setExperienceYears] =
        useState("");

    const [isAvailable, setIsAvailable] =
        useState(true);

    const [avatar, setAvatar] =
        useState<File | null>(null);

    const [isSaving, setIsSaving] =
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

    const [showBackDialog, setShowBackDialog] =
        useState(false);

    const backToParam =
        searchParams.get("backTo");

    const backName =
        searchParams.get("name") ||
        "الصفحة السابقة";

    const backTo =
        backToParam &&
        backToParam.startsWith("/") &&
        !backToParam.startsWith("//")
            ? backToParam
            : null;

    /*
     * Fill the form from the existing profile.
     *
     * Current craftsman profile fields used here:
     *
     * profiles:
     * - full_name
     * - avatar_url
     *
     * craftsman_profiles:
     * - phone
     * - bio
     * - experience_years
     * - is_available
     * - verification_status
     *
     * Location is stored privately in:
     * profiles.location
     *
     * areas and shop_address are intentionally
     * not edited here anymore.
     */
    useEffect(() => {
        if (!profile) {
            return;
        }

        setFullName(
            profile.full_name ?? "",
        );

        setPhone(
            craftsmanProfile?.phone ?? "",
        );

        setBio(
            craftsmanProfile?.bio ?? "",
        );

        setExperienceYears(
            craftsmanProfile?.experience_years !==
                null &&
            craftsmanProfile?.experience_years !==
                undefined
                ? String(
                      craftsmanProfile.experience_years,
                  )
                : "",
        );

        setIsAvailable(
            craftsmanProfile?.is_available ??
                true,
        );
    }, [
        profile,
        craftsmanProfile,
    ]);

    const values =
        useMemo<CraftsmanProfileForm>(
            () => ({
                fullName,
                phone,
                bio,
                experienceYears,
                isAvailable,
            }),
            [
                fullName,
                phone,
                bio,
                experienceYears,
                isAvailable,
            ],
        );

    const fullNameError =
        getFieldError(
            "fullName",
            values,
        );

    const phoneError =
        getFieldError(
            "phone",
            values,
        );

    const bioError =
        getFieldError(
            "bio",
            values,
        );

    const experienceYearsError =
        getFieldError(
            "experienceYears",
            values,
        );

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

    /*
     * Local avatar preview.
     */
    const avatarPreview =
        useMemo(() => {
            if (!avatar) {
                return null;
            }

            return URL.createObjectURL(
                avatar,
            );
        }, [avatar]);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(
                    avatarPreview,
                );
            }
        };
    }, [avatarPreview]);

    const displayedAvatar =
        avatarPreview ||
        profile?.avatar_url ||
        null;

    const handleAvatarChange = (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setAvatar(null);

            setError(
                "من فضلك اختر صورة بصيغة JPG أو PNG أو WEBP.",
            );

            event.target.value = "";
            return;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            setAvatar(null);

            setError(
                "حجم الصورة يجب ألا يتجاوز 5 ميجابايت.",
            );

            event.target.value = "";
            return;
        }

        setError("");
        setSuccess("");
        setAvatar(file);
    };

    const uploadAvatar = async () => {
        if (!avatar || !user) {
            return null;
        }

        const {
            data: {
                user: authUser,
            },
            error: authError,
        } =
            await supabase.auth.getUser();

        if (authError) {
            throw authError;
        }

        if (!authUser) {
            throw new Error(
                "NO_AUTHENTICATED_USER",
            );
        }

        if (authUser.id !== user.id) {
            throw new Error(
                "AUTH_USER_MISMATCH",
            );
        }

        const extension =
            avatar.name
                .split(".")
                .pop()
                ?.toLowerCase() || "";

        const extensionMap: Record<
            string,
            string
        > = {
            jpg: "jpg",
            jpeg: "jpg",
            png: "png",
            webp: "webp",
        };

        const normalizedExtension =
            extensionMap[extension];

        if (!normalizedExtension) {
            throw new Error(
                "UNSUPPORTED_IMAGE_TYPE",
            );
        }

        const filePath =
            `${authUser.id}/avatar.${normalizedExtension}`;

        const {
            error: uploadError,
        } = await supabase.storage
            .from("avatars")
            .upload(
                filePath,
                avatar,
                {
                    cacheControl:
                        "3600",
                    upsert: true,
                    contentType:
                        avatar.type,
                },
            );

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: {
                publicUrl,
            },
        } =
            supabase.storage
                .from("avatars")
                .getPublicUrl(
                    filePath,
                );

        return `${publicUrl}?v=${Date.now()}`;
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

        if (
            profile.role !==
            "craftsman"
        ) {
            setError(
                "هذه الصفحة مخصصة للصنايعية فقط.",
            );
            return;
        }

        const result =
            craftsmanProfileSchema.safeParse(
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
            setIsSaving(true);

            /*
             * Upload avatar only when a new image
             * has been selected.
             */
            const avatarUrl =
                await uploadAvatar();

            /*
             * Update main profile.
             */
            const profileUpdate: {
                full_name: string;
                avatar_url?: string;
            } = {
                full_name:
                    result.data.fullName,
            };

            if (avatarUrl) {
                profileUpdate.avatar_url =
                    avatarUrl;
            }

            const {
                error: profileError,
            } = await supabase
                .from("profiles")
                .update(
                    profileUpdate,
                )
                .eq(
                    "id",
                    user.id,
                );

            if (profileError) {
                throw profileError;
            }

            /*
             * Update craftsman profile.
             *
             * Deliberately does NOT update:
             * - areas
             * - shop_address
             * - verification_status
             *
             * Location is stored separately in
             * profiles.location.
             */
            const parsedExperience =
                result.data
                    .experienceYears
                    ? Number(
                          result.data
                              .experienceYears,
                      )
                    : null;

            const {
                error:
                    craftsmanProfileError,
            } = await supabase
                .from(
                    "craftsman_profiles",
                )
                .upsert(
                    {
                        id: user.id,
                        phone:
                            result.data
                                .phone
                                .trim() ||
                            null,
                        bio:
                            result.data
                                .bio
                                .trim() ||
                            null,
                        experience_years:
                            parsedExperience,
                        is_available:
                            result.data
                                .isAvailable,
                    },
                    {
                        onConflict:
                            "id",
                    },
                );

            if (
                craftsmanProfileError
            ) {
                throw craftsmanProfileError;
            }

            await refreshUser();

            setAvatar(null);

            setSuccess(
                "تم حفظ التعديلات بنجاح.",
            );

            if (backTo) {
                setShowBackDialog(
                    true,
                );
            }
        } catch (caughtError) {
            console.error(
                "Failed to save craftsman profile:",
                caughtError,
            );

            const saveError =
                caughtError as {
                    message?: string;
                    statusCode?: number;
                };

            if (
                saveError.message ===
                "NO_AUTHENTICATED_USER"
            ) {
                setError(
                    "تعذر التحقق من حسابك. سجل دخولك مرة تانية وحاول.",
                );
            } else if (
                saveError.message ===
                "AUTH_USER_MISMATCH"
            ) {
                setError(
                    "حصل تعارض في جلسة الحساب. أعد تحميل الصفحة وحاول مرة أخرى.",
                );
            } else if (
                saveError.message?.includes(
                    "row-level security",
                )
            ) {
                setError(
                    "تعذر رفع الصورة بسبب صلاحيات التخزين.",
                );
            } else if (
                saveError.statusCode ===
                    400 ||
                saveError.message
                    ?.toLowerCase()
                    .includes("mime")
            ) {
                setError(
                    "صيغة الصورة غير مسموحة.",
                );
            } else if (
                saveError.message?.includes(
                    "exceeded",
                ) ||
                saveError.message?.includes(
                    "size",
                )
            ) {
                setError(
                    "حجم الصورة أكبر من الحد المسموح.",
                );
            } else {
                setError(
                    "حدث خطأ أثناء حفظ التعديلات. حاول مرة أخرى.",
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-6">
                <p className="text-sm text-muted-foreground">
                    جاري تحميل الملف...
                </p>
            </div>
        );
    }

    if (
        !profile ||
        profile.role !==
            "craftsman"
    ) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">
                            هذه الصفحة مخصصة
                            للصنايعية فقط.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const verificationStatus =
        craftsmanProfile
            ?.verification_status;

    const verificationLabel =
        verificationStatus ===
        "verified"
            ? "الحساب موثق"
            : verificationStatus ===
                "rejected"
            ? "تم رفض التوثيق"
            : "التوثيق قيد المراجعة";

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

                <h1 className="text-2xl font-bold">
                    تعديل ملف الصنايعي
                </h1>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    حدّث بياناتك عشان العملاء
                    يقدروا يعرفوا عنك ويختاروك
                    للشغلانات المناسبة.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                {/* Avatar */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                    {displayedAvatar ? (
                                        <img
                                            src={
                                                displayedAvatar
                                            }
                                            alt={
                                                profile.full_name ||
                                                "الصورة الشخصية"
                                            }
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserRound className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>

                                <label
                                    htmlFor="avatar"
                                    className="absolute bottom-0 left-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
                                >
                                    <Camera className="h-4 w-4" />

                                    <input
                                        id="avatar"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={
                                            handleAvatarChange
                                        }
                                    />
                                </label>
                            </div>

                            <div>
                                <h2 className="font-semibold">
                                    الصورة الشخصية
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    اختياري
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    JPG أو PNG أو WEBP
                                    بحد أقصى 5 ميجابايت.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Basic information */}
                <Card>
                    <CardContent className="p-6">
                        <div>
                            <h2 className="font-semibold">
                                البيانات الأساسية
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                البيانات اللي بتظهر
                                على حسابك.
                            </p>
                        </div>

                        <Separator className="my-5" />

                        <div className="space-y-6">
                            {/* Full name */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <UserRound className="h-4 w-4 text-muted-foreground" />

                                    <label
                                        htmlFor="fullName"
                                        className="text-sm font-medium"
                                    >
                                        الاسم بالكامل
                                    </label>
                                </div>

                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onFocus={() =>
                                        markTouched(
                                            "fullName",
                                        )
                                    }
                                    onChange={(event) => {
                                        markTouched(
                                            "fullName",
                                        );

                                        setFullName(
                                            event.target.value,
                                        );
                                    }}
                                    placeholder="مثال: أحمد محمد"
                                    maxLength={100}
                                    aria-invalid={
                                        touched.fullName &&
                                        Boolean(
                                            fullNameError,
                                        )
                                    }
                                />

                                {!touched.fullName && (
                                    <p className="text-xs text-muted-foreground">
                                        الاسم اللي هيظهر
                                        للعملاء.
                                    </p>
                                )}

                                {touched.fullName &&
                                    fullNameError && (
                                        <p className="text-xs text-destructive">
                                            {
                                                fullNameError
                                            }
                                        </p>
                                    )}

                                {touched.fullName &&
                                    !fullNameError &&
                                    fullName.trim() && (
                                        <p className="flex items-center gap-1 text-xs text-green-600">
                                            <Check className="h-3.5 w-3.5" />
                                            الاسم مناسب
                                        </p>
                                    )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />

                                    <label
                                        htmlFor="phone"
                                        className="text-sm font-medium"
                                    >
                                        رقم الهاتف
                                    </label>

                                    <span className="text-xs text-muted-foreground">
                                        اختياري
                                    </span>
                                </div>

                                <Input
                                    id="phone"
                                    type="tel"
                                    dir="ltr"
                                    value={phone}
                                    onFocus={() =>
                                        markTouched(
                                            "phone",
                                        )
                                    }
                                    onChange={(event) => {
                                        markTouched(
                                            "phone",
                                        );

                                        setPhone(
                                            event.target.value,
                                        );
                                    }}
                                    placeholder="01xxxxxxxxx"
                                    maxLength={20}
                                    aria-invalid={
                                        touched.phone &&
                                        Boolean(
                                            phoneError,
                                        )
                                    }
                                />

                                {!touched.phone && (
                                    <p className="text-xs text-muted-foreground">
                                        رقم الهاتف لا يظهر
                                        بشكل عام للعملاء.
                                    </p>
                                )}

                                {touched.phone &&
                                    phoneError && (
                                        <p className="text-xs text-destructive">
                                            {phoneError}
                                        </p>
                                    )}

                                {touched.phone &&
                                    !phoneError &&
                                    phone.trim() && (
                                        <p className="flex items-center gap-1 text-xs text-green-600">
                                            <Check className="h-3.5 w-3.5" />
                                            رقم الهاتف صحيح
                                        </p>
                                    )}
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <UserRound className="h-4 w-4 text-muted-foreground" />

                                    <label
                                        htmlFor="bio"
                                        className="text-sm font-medium"
                                    >
                                        نبذة عنك
                                    </label>

                                    <span className="text-xs text-muted-foreground">
                                        اختياري
                                    </span>
                                </div>

                                <Textarea
                                    id="bio"
                                    value={bio}
                                    onFocus={() =>
                                        markTouched(
                                            "bio",
                                        )
                                    }
                                    onChange={(event) => {
                                        markTouched(
                                            "bio",
                                        );

                                        setBio(
                                            event.target.value,
                                        );
                                    }}
                                    placeholder="اكتب نبذة بسيطة عن شغلك والخدمات اللي بتقدمها..."
                                    maxLength={1500}
                                    className="min-h-32 resize-none"
                                    aria-invalid={
                                        touched.bio &&
                                        Boolean(
                                            bioError,
                                        )
                                    }
                                />

                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        {!touched.bio && (
                                            <p className="text-xs text-muted-foreground">
                                                اشرح للعملاء
                                                خبرتك ونوع
                                                الشغل اللي
                                                بتعمله.
                                            </p>
                                        )}

                                        {touched.bio &&
                                            bioError && (
                                                <p className="text-xs text-destructive">
                                                    {
                                                        bioError
                                                    }
                                                </p>
                                            )}

                                        {touched.bio &&
                                            !bioError &&
                                            bio.trim() && (
                                                <p className="flex items-center gap-1 text-xs text-green-600">
                                                    <Check className="h-3.5 w-3.5" />
                                                    النبذة مناسبة
                                                </p>
                                            )}
                                    </div>

                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {bio.length}/1500
                                    </span>
                                </div>
                            </div>

                            {/* Experience */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />

                                    <label
                                        htmlFor="experienceYears"
                                        className="text-sm font-medium"
                                    >
                                        سنين الخبرة
                                    </label>

                                    <span className="text-xs text-muted-foreground">
                                        اختياري
                                    </span>
                                </div>

                                <Input
                                    id="experienceYears"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={
                                        experienceYears
                                    }
                                    onFocus={() =>
                                        markTouched(
                                            "experienceYears",
                                        )
                                    }
                                    onChange={(event) => {
                                        markTouched(
                                            "experienceYears",
                                        );

                                        setExperienceYears(
                                            event.target.value,
                                        );
                                    }}
                                    placeholder="مثال: 8"
                                    aria-invalid={
                                        touched.experienceYears &&
                                        Boolean(
                                            experienceYearsError,
                                        )
                                    }
                                />

                                {!touched.experienceYears && (
                                    <p className="text-xs text-muted-foreground">
                                        عدد سنين خبرتك في
                                        المجال.
                                    </p>
                                )}

                                {touched.experienceYears &&
                                    experienceYearsError && (
                                        <p className="text-xs text-destructive">
                                            {
                                                experienceYearsError
                                            }
                                        </p>
                                    )}

                                {touched.experienceYears &&
                                    !experienceYearsError &&
                                    experienceYears && (
                                        <p className="flex items-center gap-1 text-xs text-green-600">
                                            <Check className="h-3.5 w-3.5" />
                                            عدد سنين الخبرة صحيح
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
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div>
                                <h2 className="font-semibold">
                                    موقعك
                                </h2>

                                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                                    موقعك الدقيق محفوظ بشكل
                                    خاص لمساعدتك في العثور
                                    على الشغلانات القريبة
                                    منك. إحداثيات موقعك لا
                                    تظهر للعملاء أو
                                    المستخدمين الآخرين.
                                </p>

                                <p className="mt-2 text-xs text-muted-foreground">
                                    لو محتاج تغيّر موقعك،
                                    يمكن تحديثه من خلال
                                    ميزة تحديد الموقع
                                    المخصصة.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Availability */}
                <Card>
                    <CardContent className="p-6">
                        <div>
                            <h2 className="font-semibold">
                                حالة التوفر
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                بتحدد إذا كنت حاليًا
                                متاح لاستقبال شغل جديد.
                            </p>
                        </div>

                        <Separator className="my-5" />

                        <button
                            type="button"
                            onClick={() => {
                                setIsAvailable(
                                    (current) =>
                                        !current,
                                );

                                setError("");
                                setSuccess("");
                            }}
                            className="flex w-full items-center justify-between rounded-xl border p-4 text-right transition-colors hover:bg-muted/40"
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                        isAvailable
                                            ? "bg-green-500/10 text-green-600"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    <Clock3 className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="font-medium">
                                        {isAvailable
                                            ? "متاح حاليًا"
                                            : "غير متاح حاليًا"}
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {isAvailable
                                            ? "هيظهر للعملاء إنك متاح لاستقبال شغلانات جديدة."
                                            : "مش هتظهر كصنايعي متاح لاستقبال شغل جديد حاليًا."}
                                    </p>
                                </div>
                            </div>

                            <div
                                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                                    isAvailable
                                        ? "bg-primary"
                                        : "bg-muted-foreground/30"
                                }`}
                            >
                                <div
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                                        isAvailable
                                            ? "translate-x-1"
                                            : "translate-x-6"
                                    }`}
                                />
                            </div>
                        </button>
                    </CardContent>
                </Card>

                {/* Verification */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="font-semibold">
                            حالة التوثيق
                        </h2>

                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                            حالة توثيق الحساب لا يمكن
                            تعديلها من هنا.
                        </p>

                        <Separator className="my-5" />

                        <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium">
                                    حالة الحساب
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {verificationLabel}
                                </p>
                            </div>

                            <Link href="/craftsman/verify-identity">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                >
                                    التحقق من الهوية
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Messages */}
                {error && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-600">
                        <Check className="h-4 w-4" />
                        {success}
                    </div>
                )}

                {/* Actions */}
                <Card>
                    <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:justify-end">
                        <Link
                            href="/dashboard"
                            className="w-full sm:w-auto"
                        >
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                إلغاء
                            </Button>
                        </Link>

                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="w-full sm:w-auto"
                        >
                            {isSaving
                                ? "جاري الحفظ..."
                                : "حفظ التعديلات"}
                        </Button>
                    </CardContent>
                </Card>
            </form>

            {/* Back dialog */}
            <Dialog
                open={showBackDialog}
                onOpenChange={
                    setShowBackDialog
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            عايز ترجع لصفحة{" "}
                            {backName}؟
                        </DialogTitle>

                        <DialogDescription>
                            تم حفظ تعديلاتك بنجاح.
                            تحب ترجع للصفحة اللي
                            جيت منها؟
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setShowBackDialog(
                                    false,
                                )
                            }
                            className="w-full sm:w-auto"
                        >
                            لأ، هفضل هنا
                        </Button>

                        <Button
                            type="button"
                            onClick={() => {
                                setShowBackDialog(
                                    false,
                                );

                                if (backTo) {
                                    router.push(
                                        backTo,
                                    );
                                }
                            }}
                            className="w-full sm:w-auto"
                        >
                            آه، وديني على هناك
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}