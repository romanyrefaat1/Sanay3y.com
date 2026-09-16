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

export async function updateJobApplicationStatus(
  formData: FormData,
) {
  const applicationId = String(
    formData.get("applicationId") ?? "",
  ).trim();

  const status = String(
    formData.get("status") ?? "",
  ).trim();

  if (!applicationId) {
    throw new Error("Missing application ID");
  }

  if (!status) {
    throw new Error("Missing status");
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

  const { data, error } = await supabase.rpc(
    "admin_update_job_application_status",
    {
      p_application_id: applicationId,
      p_status: status,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to update application");
  }

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/admin/jobs");

  const {
    data: application,
  } = await supabase.rpc(
    "get_admin_job_application",
    {
      p_application_id: applicationId,
    },
  );

  const jobId = application?.[0]?.job_id;

  if (jobId) {
    revalidatePath(`/admin/jobs/${jobId}`);
  }
}