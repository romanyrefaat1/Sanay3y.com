"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function finishJob(jobId: string) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            error: "يجب تسجيل الدخول أولًا.",
        };
    }

    const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select(
            `
                id,
                client_id,
                selected_craftsman_id,
                status,
                client_finished_at,
                craftsman_finished_at
            `,
        )
        .eq("id", jobId)
        .single();

    if (jobError || !job) {
        return {
            error: "الشغلانة غير موجودة.",
        };
    }

    const isClient = job.client_id === user.id;
    const isCraftsman =
        job.selected_craftsman_id === user.id;

    if (!isClient && !isCraftsman) {
        return {
            error: "مش مسموح لك بإنهاء الشغلانة دي.",
        };
    }

    if (job.status !== "in_progress") {
        return {
            error: "الشغلانة مش قيد التنفيذ حاليًا.",
        };
    }

    const updates = isClient
        ? {
              client_finished_at: new Date().toISOString(),
              status: "completed",
          }
        : {
              craftsman_finished_at: new Date().toISOString(),
              status: "completed",
          };

    const { error: updateError } = await supabase
        .from("jobs")
        .update(updates)
        .eq("id", jobId);

    if (updateError) {
        console.error(
            "Failed to finish job:",
            updateError,
        );

        return {
            error: "حصلت مشكلة أثناء إنهاء الشغلانة.",
        };
    }

    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/craftsman/my-work");
    revalidatePath("/client/my-work");
    revalidatePath("/dashboard");

    return {
        success: true,
    };
}

type SubmitReviewInput = {
    jobId: string;
    workRating: number | null;
    respectRating: number | null;
    clientExperience: "good" | "had_issues" | null;
    issueType: string | null;
    comment: string | null;
};

const VALID_ISSUE_TYPES = [
    "late_unavailable",
    "changed_requirements",
    "communication",
    "payment_issue",
    "other",
] as const;

export async function submitReview(
    input: SubmitReviewInput
) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            error: "يجب تسجيل الدخول أولًا.",
        };
    }

    if (!input.jobId) {
        return {
            error: "الشغلانة غير موجودة.",
        };
    }

    const { data: job, error: jobError } =
        await supabase
            .from("jobs")
            .select(`
                id,
                status,
                client_id,
                selected_craftsman_id
            `)
            .eq("id", input.jobId)
            .single();

    if (jobError || !job) {
        return {
            error: "الشغلانة غير موجودة.",
        };
    }

    if (job.status !== "completed") {
        return {
            error: "لا يمكن تقييم شغلانة لم تكتمل بعد.",
        };
    }

    const isClient = job.client_id === user.id;
    const isCraftsman =
        job.selected_craftsman_id === user.id;

    if (!isClient && !isCraftsman) {
        return {
            error: "مش مسموح لك بتقييم الشغلانة دي.",
        };
    }

    const revieweeId = isClient
        ? job.selected_craftsman_id
        : job.client_id;

    if (!revieweeId) {
        return {
            error: "لا يمكن تحديد الشخص الذي سيتم تقييمه.",
        };
    }

    // Prevent duplicate reviews.
    const { data: existingReview } =
        await supabase
            .from("reviews")
            .select("id")
            .eq("job_id", job.id)
            .eq("reviewer_id", user.id)
            .maybeSingle();

    if (existingReview) {
        return {
            error: "أنت قيّمت الشغلانة دي بالفعل.",
        };
    }

    const cleanComment =
        typeof input.comment === "string"
            ? input.comment.trim().slice(0, 500)
            : null;

    /*
     * CLIENT REVIEW
     *
     * Client evaluates:
     * - work quality
     * - respect/treatment
     * - optional comment
     */
    if (isClient) {
        if (
            !Number.isInteger(input.workRating) ||
            input.workRating < 1 ||
            input.workRating > 5
        ) {
            return {
                error: "اختار تقييم جودة الشغل من 1 إلى 5.",
            };
        }

        if (
            !Number.isInteger(input.respectRating) ||
            input.respectRating < 1 ||
            input.respectRating > 5
        ) {
            return {
                error: "اختار تقييم التعامل من 1 إلى 5.",
            };
        }

        // Client reviews should never contain craftsman-specific fields.
        if (
            input.clientExperience !== null ||
            input.issueType !== null
        ) {
            return {
                error: "بيانات التقييم غير صحيحة.",
            };
        }

        const { error: insertError } =
            await supabase.from("reviews").insert({
                job_id: job.id,
                reviewer_id: user.id,
                reviewee_id: revieweeId,

                reviewer_role: "client",
                reviewee_role: "craftsman",

                work_rating: input.workRating,
                respect_rating: input.respectRating,

                client_experience: null,
                issue_type: null,

                comment: cleanComment,
            });

        if (insertError) {
            console.error(
                "Failed to create client review:",
                insertError
            );

            return {
                error: "حصلت مشكلة أثناء حفظ التقييم.",
            };
        }
    }

    /*
     * CRAFTSMAN REVIEW
     *
     * Craftsman evaluates:
     * - good / had issues
     * - issue type when necessary
     * - optional comment
     */
    if (isCraftsman) {
        if (
            input.clientExperience !== "good" &&
            input.clientExperience !== "had_issues"
        ) {
            return {
                error: "اختار حالة التعامل مع العميل.",
            };
        }

        if (
            input.clientExperience === "had_issues" &&
            !VALID_ISSUE_TYPES.includes(
                input.issueType as
                    | (typeof VALID_ISSUE_TYPES)[number]
                    | undefined
            )
        ) {
            return {
                error: "اختار سبب المشكلة.",
            };
        }

        if (
            input.clientExperience === "good" &&
            input.issueType !== null
        ) {
            return {
                error: "بيانات التقييم غير صحيحة.",
            };
        }

        // Craftsman reviews should never contain star ratings.
        if (
            input.workRating !== null ||
            input.respectRating !== null
        ) {
            return {
                error: "بيانات التقييم غير صحيحة.",
            };
        }

        const { error: insertError } =
            await supabase.from("reviews").insert({
                job_id: job.id,
                reviewer_id: user.id,
                reviewee_id: revieweeId,

                reviewer_role: "craftsman",
                reviewee_role: "client",

                work_rating: null,
                respect_rating: null,

                client_experience:
                    input.clientExperience,

                issue_type:
                    input.clientExperience ===
                    "had_issues"
                        ? input.issueType
                        : null,

                comment: cleanComment,
            });

        if (insertError) {
            console.error(
                "Failed to create craftsman review:",
                insertError
            );

            return {
                error: "حصلت مشكلة أثناء حفظ التقييم.",
            };
        }
    }

    revalidatePath(`/jobs/${job.id}`);
    revalidatePath(`/jobs/${job.id}/finished`);
    revalidatePath(`/profiles/${revieweeId}`);
    revalidatePath("/dashboard");
    revalidatePath("/craftsman/my-work");
    revalidatePath("/client/my-work");

    return {
        success: true,
    };
}