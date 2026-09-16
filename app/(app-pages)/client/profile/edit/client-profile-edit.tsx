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
    Camera,
    Check,
    Phone,
    UserRound,
    VenusAndMars,
} from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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

const clientProfileSchema = z.object({
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

    gender: z
        .enum(["male", "female"])
        .optional()
        .or(z.literal("")),
});

type ClientProfileForm = {
    fullName: string;
    phone: string;
    gender: "male" | "female" | "";
};

type FieldName =
    | "fullName"
    | "phone"
    | "gender";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const allowedAvatarTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const extensionMap: Record<string, string> = {
    jpg: "jpg",
    jpeg: "jpg",
    png: "png",
    webp: "webp",
};

function getFieldError(
    field: FieldName,
    values: ClientProfileForm,
) {
    const result =
        clientProfileSchema.safeParse(values);

    if (result.success) {
        return "";
    }

    return (
        result.error.issues.find(
            (issue) => issue.path[0] === field,
        )?.message || ""
    );
}

export default function ClientProfileEditPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const supabase = useMemo(
        () => createClient(),
        [],
    );

    const {
        user,
        profile,
        clientProfile,
        isLoading,
        refreshUser,
    } = useUser();

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState<
        "male" | "female" | ""
    >("");

    const [avatar, setAvatar] =
        useState<File | null>(null);

    const [isSaving, setIsSaving] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [touched, setTouched] = useState<
        Partial<Record<FieldName, boolean>>
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
     * Fill the form from the current user.
     *
     * Current schema:
     * profiles:
     * - full_name
     * - avatar_url
     *
     * client_profiles:
     * - phone
     * - gender
     *
     * Location is stored separately in
     * profiles.location and is not manually edited here.
     */
    useEffect(() => {
        if (!profile) {
            return;
        }

        setFullName(profile.full_name ?? "");
        setPhone(clientProfile?.phone ?? "");
        setGender(clientProfile?.gender ?? "");
    }, [profile, clientProfile]);

    const values = useMemo<ClientProfileForm>(
        () => ({
            fullName,
            phone,
            gender,
        }),
        [fullName, phone, gender],
    );

    const fullNameError = getFieldError(
        "fullName",
        values,
    );

    const phoneError = getFieldError(
        "phone",
        values,
    );

    const genderError = getFieldError(
        "gender",
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
     * Local preview for a newly selected image.
     */
    const avatarPreview = useMemo(() => {
        if (!avatar) {
            return null;
        }

        return URL.createObjectURL(avatar);
    }, [avatar]);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
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

        const extension =
            file.name
                .split(".")
                .pop()
                ?.toLowerCase() || "";

        if (
            !allowedAvatarTypes.includes(
                file.type,
            ) ||
            !extensionMap[extension]
        ) {
            setAvatar(null);
            setError(
                "من فضلك اختر صورة بصيغة JPG أو JPEG أو PNG أو WEBP.",
            );

            event.target.value = "";
            return;
        }

        if (file.size > MAX_AVATAR_SIZE) {
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

    /*
     * Upload avatar to:
     *
     * {user.id}/avatar.{extension}
     *
     * This path must match the Storage RLS policy.
     */
    const uploadAvatar = async () => {
        if (!avatar || !user) {
            return null;
        }

        const {
            data: {
                user: authUser,
            },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
            console.error(
                "Failed to get authenticated user:",
                authError,
            );

            throw authError;
        }

        if (!authUser) {
            throw new Error(
                "NO_AUTHENTICATED_USER",
            );
        }

        if (authUser.id !== user.id) {
            console.error(
                "User mismatch:",
                {
                    contextUserId: user.id,
                    supabaseUserId: authUser.id,
                },
            );

            throw new Error(
                "AUTH_USER_MISMATCH",
            );
        }

        const extension =
            avatar.name
                .split(".")
                .pop()
                ?.toLowerCase() || "";

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
            data,
            error: uploadError,
        } = await supabase.storage
            .from("avatars")
            .upload(
                filePath,
                avatar,
                {
                    cacheControl: "3600",
                    upsert: true,
                    contentType: avatar.type,
                },
            );

        if (uploadError) {
            console.error(
                "Avatar upload failed:",
                {
                    message:
                        uploadError.message,
                    name:
                        uploadError.name,
                    statusCode:
                        uploadError.statusCode,
                    filePath,
                },
            );

            throw uploadError;
        }

        console.log(
            "Avatar uploaded successfully:",
            data,
        );

        const {
            data: {
                publicUrl,
            },
        } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

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

        if (profile.role !== "client") {
            setError(
                "هذه الصفحة مخصصة للعملاء فقط.",
            );
            return;
        }

        const result =
            clientProfileSchema.safeParse(
                values,
            );

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

            setError(
                firstIssue?.message ||
                    "راجع البيانات المدخلة.",
            );

            return;
        }

        try {
            setIsSaving(true);

            /*
             * Upload first so we never save an avatar
             * URL that doesn't actually exist.
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
                .update(profileUpdate)
                .eq("id", user.id);

            if (profileError) {
                throw profileError;
            }

            /*
             * Update client_profiles.
             *
             * Current schema:
             * - id
             * - phone
             * - gender
             *
             * No area column exists anymore.
             */
            const {
                error: clientProfileError,
            } = await supabase
                .from("client_profiles")
                .upsert(
                    {
                        id: user.id,
                        phone:
                            result.data.phone.trim() ||
                            null,
                        gender:
                            result.data.gender ||
                            null,
                    },
                    {
                        onConflict: "id",
                    },
                );

            if (clientProfileError) {
                throw clientProfileError;
            }

            /*
             * Refresh global context.
             */
            await refreshUser();

            setAvatar(null);

            setSuccess(
                "تم حفظ التعديلات بنجاح.",
            );

            if (backTo) {
                setShowBackDialog(true);
            }
        } catch (caughtError) {
            console.error(
                "Failed to save client profile:",
                caughtError,
            );

            const saveError =
                caughtError as {
                    name?: string;
                    message?: string;
                    statusCode?: number;
                };

            if (
                saveError.message ===
                "NO_SUPABASE_SESSION"
            ) {
                setError(
                    "انتهت جلسة تسجيل الدخول. سجل دخولك مرة تانية وحاول.",
                );
            } else if (
                saveError.message ===
                "NO_SUPABASE_USER"
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
                    "تعذر رفع الصورة بسبب صلاحيات التخزين. تأكد من إعدادات Storage الخاصة بمجلد المستخدم.",
                );
            } else if (
                saveError.statusCode === 400 ||
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
        profile.role !== "client"
    ) {
        return (
            <div className="mx-auto w-full max-w-3xl px-4 py-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">
                            هذه الصفحة مخصصة
                            للعملاء فقط.
                        </p>
                    </CardContent>
                </Card>
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

                <h1 className="text-2xl font-bold">
                    تعديل الملف الشخصي
                </h1>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    حدّث بياناتك عشان تفضل
                    معلومات حسابك صحيحة.
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
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
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
                                عدّل بيانات حسابك من هنا.
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
                                        الاسم الذي سيظهر
                                        على حسابك.
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
                                        للمستخدمين الآخرين.
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

                            {/* Gender */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <VenusAndMars className="h-4 w-4 text-muted-foreground" />

                                    <label
                                        htmlFor="gender"
                                        className="text-sm font-medium"
                                    >
                                        النوع
                                    </label>

                                    <span className="text-xs text-muted-foreground">
                                        اختياري
                                    </span>
                                </div>

                                <select
                                    id="gender"
                                    value={gender}
                                    onFocus={() =>
                                        markTouched(
                                            "gender",
                                        )
                                    }
                                    onChange={(event) => {
                                        markTouched(
                                            "gender",
                                        );

                                        setGender(
                                            event.target
                                                .value as
                                                | "male"
                                                | "female"
                                                | "",
                                        );
                                    }}
                                    aria-invalid={
                                        touched.gender &&
                                        Boolean(
                                            genderError,
                                        )
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">
                                        اختر النوع
                                    </option>

                                    <option value="male">
                                        ذكر
                                    </option>

                                    <option value="female">
                                        أنثى
                                    </option>
                                </select>

                                {!touched.gender && (
                                    <p className="text-xs text-muted-foreground">
                                        بيانات خاصة بحسابك.
                                    </p>
                                )}

                                {touched.gender &&
                                    genderError && (
                                        <p className="text-xs text-destructive">
                                            {genderError}
                                        </p>
                                    )}

                                {touched.gender &&
                                    !genderError &&
                                    gender && (
                                        <p className="flex items-center gap-1 text-xs text-green-600">
                                            <Check className="h-3.5 w-3.5" />
                                            تم اختيار النوع
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
                                {/* <Mappin className="h-4 w-4 text-muted-foreground" /> */}
                            </div>

                            <div>
                                <h2 className="font-semibold">
                                    الموقع
                                </h2>

                                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                                    موقعك الدقيق محفوظ بشكل
                                    خاص لمساعدتك في العثور
                                    على الصنايعية القريبين
                                    منك. لا يتم عرض إحداثيات
                                    موقعك للمستخدمين الآخرين.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="font-semibold">
                            الخصوصية
                        </h2>

                        <p className="mt-2 text-sm leading-7 text-muted-foreground">
                            رقم الهاتف والنوع لا يظهروا
                            للمستخدمين الآخرين. موقعك
                            الدقيق محفوظ بشكل خاص ويُستخدم
                            فقط للميزات المرتبطة بالموقع.
                        </p>
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
                onOpenChange={setShowBackDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            عايز ترجع لصفحة{" "}
                            {backName}؟
                        </DialogTitle>

                        <DialogDescription>
                            تم حفظ تعديلاتك بنجاح. تحب
                            ترجع للصفحة اللي جيت منها؟
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setShowBackDialog(false)
                            }
                            className="w-full sm:w-auto"
                        >
                            لأ، هفضل هنا
                        </Button>

                        <Button
                            type="button"
                            onClick={() => {
                                setShowBackDialog(false);

                                if (backTo) {
                                    router.push(backTo);
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