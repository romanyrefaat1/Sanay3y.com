import Link from "next/link";

import { requireAdmin } from "../../_lib/require-admin";
import ApplicationActions from "./(components)/application-actions";

export default async function AdminApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc(
    "get_admin_job_application",
    {
      p_application_id: id,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  const application = data?.[0];

  if (!application) {
    return (
      <div className="py-20 text-center">
        التقديم غير موجود.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/applications"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← كل التقديمات
        </Link>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            تقديم على شغلانة
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            {application.job_title}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {application.job_service_type} ·{" "}
            {application.job_area}
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Info
          label="الصنايعي"
          value={
            application.craftsman_name ??
            "بدون اسم"
          }
        />

        <Info
          label="السعر المقترح"
          value={
            application.proposed_price !== null
              ? `${application.proposed_price} جنيه`
              : "—"
          }
        />

        <Info
          label="الحالة"
          value={formatStatus(
            application.application_status,
          )}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="border p-6">
          <h2 className="text-lg font-semibold">
            بيانات الصنايعي
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <Row
              label="الاسم"
              value={
                application.craftsman_name ??
                "—"
              }
            />

            <Row
              label="الهاتف"
              value={
                application.craftsman_phone ??
                "—"
              }
            />

            <Row
              label="نوع الشغل"
              value={
                application.craftsman_work_type ??
                "—"
              }
            />

            <Row
              label="التواجد"
              value={
                application.craftsman_is_available
                  ? "متاح"
                  : "غير متاح"
              }
            />

            <Row
              label="التحقق"
              value={
                application.craftsman_verification_status ??
                "—"
              }
            />
          </div>
        </div>

        <div className="border p-6">
          <h2 className="text-lg font-semibold">
            تفاصيل الشغلانة
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <Row
              label="العميل"
              value={
                application.client_name ??
                "—"
              }
            />

            <Row
              label="المنطقة"
              value={
                application.job_area ?? "—"
              }
            />

            <Row
              label="الميزانية"
              value={
                application.job_budget !== null
                  ? `${application.job_budget} جنيه`
                  : "—"
              }
            />

            <Row
              label="حالة الشغل"
              value={application.job_status}
            />
          </div>
        </div>
      </section>

      <section className="border p-6">
        <h2 className="text-lg font-semibold">
          رسالة التقديم
        </h2>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {application.application_message ||
            "لم يكتب الصنايعي رسالة."}
        </p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border p-6">
        <div>
          <p className="text-sm text-muted-foreground">
            وقت التقديم
          </p>

          <p className="mt-1 text-sm font-medium">
            {formatDate(application.created_at)}
          </p>
        </div>

        <ApplicationActions
          applicationId={
            application.application_id
          }
          status={
            application.application_status
          }
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

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="text-left font-medium">
        {value}
      </span>
    </div>
  );
}

function formatStatus(status: string) {
  switch (status) {
    case "accepted":
      return "مقبول";
    case "rejected":
      return "مرفوض";
    case "withdrawn":
      return "منسحب";
    default:
      return "متقدم";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}