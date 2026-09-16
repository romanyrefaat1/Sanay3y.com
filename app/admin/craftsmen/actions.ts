"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/admin/_lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SERVICE_TYPES = [
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
] as const;

function normalizePhone(value: string) {
    return value.replace(/[^\d+]/g, "").trim();
}

function parseAreas(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseCoordinate(value: string) {
    const trimmed = value.trim();

    if (!trimmed) {
        return null;
    }

    const number = Number(trimmed);

    return Number.isFinite(number)
        ? number
        : null;
}

function isValidLatitude(
    value: number | null,
): value is number {
    return (
        value !== null &&
        value >= -90 &&
        value <= 90
    );
}

function isValidLongitude(
    value: number | null,
): value is number {
    return (
        value !== null &&
        value >= -180 &&
        value <= 180
    );
}

export async function createCraftsman(
    formData: FormData,
) {
    const { supabase } = await requireAdmin();

    /*
     * ----------------------------------------------------------
     * Read form values
     * ----------------------------------------------------------
     */

    const fullName = String(
        formData.get("full_name") ?? "",
    ).trim();

    const email = String(
        formData.get("email") ?? "",
    )
        .trim()
        .toLowerCase();

    const password = String(
        formData.get("password") ?? "",
    );

    const phone = normalizePhone(
        String(formData.get("phone") ?? ""),
    );

    const workType = String(
        formData.get("work_type") ?? "",
    ).trim();

    const bio = String(
        formData.get("bio") ?? "",
    ).trim();

    const experienceRaw = String(
        formData.get("experience_years") ?? "",
    ).trim();

    const areas = parseAreas(
        String(formData.get("areas") ?? ""),
    );

    const shopAddress = String(
        formData.get("shop_address") ?? "",
    ).trim();

    const latitude = parseCoordinate(
        String(
            formData.get("latitude") ?? "",
        ),
    );

    const longitude = parseCoordinate(
        String(
            formData.get("longitude") ?? "",
        ),
    );

    /*
     * ----------------------------------------------------------
     * Validate
     * ----------------------------------------------------------
     */

    if (fullName.length < 2) {
        throw new Error(
            "الاسم لازم يكون صحيح",
        );
    }

    if (
        !email ||
        !email.includes("@")
    ) {
        throw new Error(
            "اكتب إيميل صحيح",
        );
    }

    if (password.length < 8) {
        throw new Error(
            "الباسورد لازم يكون 8 أحرف على الأقل",
        );
    }

    if (!phone) {
        throw new Error(
            "رقم الهاتف مطلوب",
        );
    }

    if (
        !SERVICE_TYPES.includes(
            workType as (typeof SERVICE_TYPES)[number],
        )
    ) {
        throw new Error(
            "نوع الشغل غير صحيح",
        );
    }

    const experienceYears =
        experienceRaw === ""
            ? null
            : Number(experienceRaw);

    if (
        experienceYears !== null &&
        (
            !Number.isInteger(
                experienceYears,
            ) ||
            experienceYears < 0 ||
            experienceYears > 80
        )
    ) {
        throw new Error(
            "سنوات الخبرة غير صحيحة",
        );
    }

    if (!isValidLatitude(latitude)) {
        throw new Error(
            "حدد خط العرض للموقع بشكل صحيح",
        );
    }

    if (!isValidLongitude(longitude)) {
        throw new Error(
            "حدد خط الطول للموقع بشكل صحيح",
        );
    }

    /*
     * ----------------------------------------------------------
     * Create Auth user
     *
     * IMPORTANT:
     * The existing on_auth_user_created trigger automatically
     * creates:
     *
     *   profiles
     *   craftsman_profiles
     *
     * It also requires:
     *
     *   role
     *   full_name
     *   phone
     *   latitude
     *   longitude
     *
     * so all of them must be passed through user_metadata.
     * ----------------------------------------------------------
     */

    const {
        data: authData,
        error: authError,
    } =
        await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,

            user_metadata: {
                full_name: fullName,
                role: "craftsman",

                phone,

                bio:
                    bio || null,

                experience_years:
                    experienceYears,

                shop_address:
                    shopAddress || null,

                latitude,
                longitude,
            },
        });

    if (authError) {
        throw new Error(
            authError.message,
        );
    }

    if (!authData.user) {
        throw new Error(
            "فشل إنشاء الحساب",
        );
    }

    const userId = authData.user.id;

    try {
        /*
         * ------------------------------------------------------
         * The auth trigger has already created the profiles.
         *
         * Update the craftsman-specific fields that the trigger
         * doesn't currently populate.
         * ------------------------------------------------------
         */

        const {
            error: craftsmanProfileError,
        } = await supabaseAdmin
            .from("craftsman_profiles")
            .update({
                areas,
                verification_status:
                    "pending",
                is_available: true,
                work_type: workType,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

        if (craftsmanProfileError) {
            throw craftsmanProfileError;
        }

        /*
         * ------------------------------------------------------
         * Refresh open-job recommendation snapshots.
         *
         * The trigger already stored the craftsman's location,
         * so the craftsman can now match existing open jobs.
         *
         * This does NOT send Telegram messages.
         * ------------------------------------------------------
         */

        const {
            error: recommendationRefreshError,
        } = await supabase.rpc(
            "refresh_open_job_recommendations_for_craftsman",
            {
                p_craftsman_id: userId,
            },
        );

        if (recommendationRefreshError) {
            /*
             * Don't destroy a valid account because a
             * recommendation refresh failed.
             */
            console.error(
                "Failed to refresh open-job recommendations:",
                recommendationRefreshError,
            );
        }

        /*
         * ------------------------------------------------------
         * Audit log
         * ------------------------------------------------------
         */

        const {
            error: auditError,
        } = await supabase.rpc(
            "write_admin_audit_log",
            {
                p_action:
                    "craftsman_created",
                p_entity_type:
                    "craftsman",
                p_entity_id: userId,
                p_metadata: {
                    full_name:
                        fullName,

                    email,

                    phone,

                    work_type:
                        workType,

                    areas,

                    experience_years:
                        experienceYears,

                    latitude,

                    longitude,
                },
            },
        );

        if (auditError) {
            console.error(
                "Audit log failed:",
                auditError,
            );
        }

        /*
         * ------------------------------------------------------
         * Revalidate admin pages
         * ------------------------------------------------------
         */

        revalidatePath(
            "/admin/craftsmen",
        );

        revalidatePath(
            `/admin/craftsmen/${userId}`,
        );

        revalidatePath(
            "/admin/activity",
        );

        return {
            success: true,
            craftsmanId: userId,
        };
    } catch (error) {
        /*
         * ------------------------------------------------------
         * Roll back Auth account if the post-creation setup
         * fails.
         * ------------------------------------------------------
         */

        await supabaseAdmin.auth.admin.deleteUser(
            userId,
        );

        throw new Error(
            error instanceof Error
                ? error.message
                : "فشل إنشاء بيانات الصنايعي",
        );
    }
}