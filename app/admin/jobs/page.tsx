import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "../_lib/require-admin";

const statusLabels: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد التنفيذ",
  completion_requested: "في انتظار الإنهاء",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

export default async function AdminJobsPage() {
  const { supabase } = await requireAdmin();

  const {
    data: jobs,
    error,
  } = await supabase.rpc(
    "get_admin_jobs",
  );

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          الإدارة
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          الشغلانات
        </h1>
      </div>

      <div className="overflow-hidden border">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_110px_120px] border-b bg-muted/30 px-5 py-3 text-sm font-medium">
          <span>الشغلانة</span>
          <span>النوع</span>
          <span>العميل</span>
          <span>الحالة</span>
          <span>المطابقين</span>
        </div>

        {(jobs ?? []).map((job) => (
          <Link
            key={job.id}
            href={`/admin/jobs/${job.id}`}
            className="grid grid-cols-[1.6fr_1fr_1fr_110px_120px] items-center border-b px-5 py-4 transition last:border-b-0 hover:bg-muted/40"
          >
            <div>
              <p className="font-medium">
                {job.title}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {job.area || "بدون منطقة"}
              </p>
            </div>

            <span className="text-sm">
              {job.service_type}
            </span>

            <span className="text-sm">
              {job.client_name || "—"}
            </span>

            <span className="text-sm">
              {statusLabels[job.status] ?? job.status}
            </span>

            <div className="text-sm">
              <span className="font-medium">
                {job.recommendation_count}
              </span>

              <span className="mr-1 text-muted-foreground">
                مطابق
              </span>
            </div>

            <ArrowLeft className="pointer-events-none absolute hidden" />
          </Link>
        ))}

        {!jobs?.length && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            مفيش شغلانات حاليًا.
          </div>
        )}
      </div>
    </div>
  );
}