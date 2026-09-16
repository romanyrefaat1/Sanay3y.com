"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function refreshRecommendations(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "").trim();

  if (!jobId) {
    throw new Error("Missing job ID");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.rpc(
    "refresh_job_recommendations",
    {
      p_job_id: jobId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  await supabase.rpc("write_admin_audit_log", {
    p_action: "recommendations_refreshed",
    p_entity_type: "job",
    p_entity_id: jobId,
    p_metadata: {},
  });

  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/jobs");
}

export async function markCraftsmanCalled(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "").trim();
  const recommendationId = String(
    formData.get("recommendationId") ?? "",
  ).trim();

  if (!jobId || !recommendationId) {
    throw new Error("Missing required fields");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.rpc(
    "admin_mark_craftsman_called",
    {
      p_recommendation_id: recommendationId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function unmarkCraftsmanCalled(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "").trim();
  const recommendationId = String(
    formData.get("recommendationId") ?? "",
  ).trim();

  if (!jobId || !recommendationId) {
    throw new Error("Missing required fields");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: isAdmin, error: adminError } =
    await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.rpc(
    "admin_unmark_craftsman_called",
    {
      p_recommendation_id: recommendationId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/jobs/${jobId}`);
}