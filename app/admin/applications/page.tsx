import Link from "next/link";

import { requireAdmin } from "../_lib/require-admin";

type Application = {
  application_id: string;
  job_id: string;
  job_title: string;
  job_service_type: string;
  job_area: string;
  job_status: string;
  client_id: string;
  client_name: string | null;
  craftsman_id: string;
  craftsman_name: string | null;
  craftsman_phone: string | null;
  proposed_price: number | null;
  application_message: string | null;
  application_status: string;
  created_at: string;
};

export default async function AdminApplicationsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.rpc(
    "get_admin_applications",
  );

  if (error) {
    throw new Error(error.message);
  }

  const applications =
    (data ?? []) as Application[];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          إدارة التقديمات
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          التقديمات
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          كل الصنايعية الذين تقدموا على الشغلانات.
        </p>
      </div>

      <div className="flex items-center gap-6 border-y py-4 text-sm">
        <div>
          <span className="text-muted-foreground">
            الكل
          </span>

          <span className="mr-2 font-semibold">
            {applications.length}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground">
            متقدمين
          </span>

          <span className="mr-2 font-semibold">
            {
              applications.filter(
                (item) =>
                  item.application_status ===
                  "pending",
              ).length
            }
          </span>
        </div>

        <div>
          <span className="text-muted-foreground">
            مقبولين
          </span>

          <span className="mr-2 font-semibold">
            {
              applications.filter(
                (item) =>
                  item.application_status ===
                  "accepted",
              ).length
            }
          </span>
        </div>
      </div>

      <div className="overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b bg-muted/30">
              <tr className="text-right">
                <th className="px-5 py-3 font-medium">
                  الصنايعي
                </th>

                <th className="px-5 py-3 font-medium">
                  الشغلانة
                </th>

                <th className="px-5 py-3 font-medium">
                  السعر
                </th>

                <th className="px-5 py-3 font-medium">
                  الحالة
                </th>

                <th className="px-5 py-3 font-medium">
                  التوقيت
                </th>

                <th className="px-5 py-3 font-medium">
                  العميل
                </th>
              </tr>
            </thead>

            <tbody>
              {applications.map((application) => (
                <tr
                  key={application.application_id}
                  className="border-b last:border-b-0"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/applications/${application.application_id}`}
                      className="font-medium hover:underline"
                    >
                      {application.craftsman_name ??
                        "بدون اسم"}
                    </Link>

                    {application.craftsman_phone && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {application.craftsman_phone}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/jobs/${application.job_id}`}
                      className="font-medium hover:underline"
                    >
                      {application.job_title}
                    </Link>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {application.job_service_type} ·{" "}
                      {application.job_area}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    {application.proposed_price !==
                    null
                      ? `${application.proposed_price} جنيه`
                      : "—"}
                  </td>

                  <td className="px-5 py-4">
                    <ApplicationStatus
                      status={
                        application.application_status
                      }
                    />
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {formatDate(
                      application.created_at,
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {application.client_name ??
                      "—"}
                  </td>
                </tr>
              ))}

              {!applications.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-sm text-muted-foreground"
                  >
                    مفيش تقديمات حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ApplicationStatus({
  status,
}: {
  status: string;
}) {
  switch (status) {
    case "accepted":
      return (
        <span className="font-medium">
          مقبول
        </span>
      );

    case "rejected":
      return (
        <span className="text-muted-foreground">
          مرفوض
        </span>
      );

    case "withdrawn":
      return (
        <span className="text-muted-foreground">
          منسحب
        </span>
      );

    default:
      return (
        <span className="font-medium">
          متقدم
        </span>
      );
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}