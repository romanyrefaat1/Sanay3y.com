import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { requireAdmin } from "../../_lib/require-admin";
import { refreshRecommendations } from "../../actions";
import RecommendationsTable from "./(components)/recommendations-table";

export default async function AdminJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { supabase } = await requireAdmin();

  const [jobResult, recommendationsResult] =
    await Promise.all([
      supabase.rpc("get_admin_job", {
        p_job_id: id,
      }),

      supabase.rpc("get_job_admin_recommendations", {
        p_job_id: id,
      }),
    ]);

  if (jobResult.error) {
    throw new Error(jobResult.error.message);
  }

  if (recommendationsResult.error) {
    throw new Error(
      recommendationsResult.error.message,
    );
  }

  const job = jobResult.data?.[0];
  const recommendations =
    recommendationsResult.data ?? [];

  if (!job) {
    return (
      <div className="py-20 text-center">
        الشغلانة غير موجودة.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/jobs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← كل الشغلانات
        </Link>

        <div className="mt-4 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm text-muted-foreground">
              {job.service_type}
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              {job.title}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {job.area}
            </p>
          </div>

          <form action={refreshRecommendations}>
            <input
              type="hidden"
              name="jobId"
              value={id}
            />

            <button
              type="submit"
              className="flex items-center gap-2 border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <RefreshCw className="size-4" />
              تحديث المطابقين
            </button>
          </form>
        </div>
      </div>

      {/* Summary */}
      <section className="grid gap-4 md:grid-cols-3">
        <Info
          label="العميل"
          value={job.client_name ?? "—"}
        />

        <Info
          label="الميزانية"
          value={
            job.budget !== null
              ? `${job.budget} جنيه`
              : "—"
          }
        />

        <Info
          label="الحالة"
          value={job.status}
        />
      </section>

      {/* Job details */}
      <section className="border p-6">
        <h2 className="text-lg font-semibold">
          تفاصيل الشغلانة
        </h2>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {job.description || "لا يوجد وصف."}
        </p>
      </section>

      {/* Recommendations */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            الصنايعية المطابقين
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            حتى 5 كم + نوع الشغل مطابق + الحساب نشط.
          </p>
        </div>

        <RecommendationsTable
          jobId={id}
          recommendations={recommendations}
        />
      </section>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border p-5">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 font-medium">
        {value}
      </p>
    </div>
  );
}