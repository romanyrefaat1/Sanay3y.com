import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Hammer,
} from "lucide-react";

import { requireAdmin } from "./_lib/require-admin";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const [
    jobsResult,
    craftsmenResult,
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, status", {
        count: "exact",
        head: false,
      }),

    supabase
      .from("profiles")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("role", "craftsman")
      .eq("is_active", true),
  ]);

  const jobs = jobsResult.data ?? [];

  const openJobs = jobs.filter(
    (job) => job.status === "open",
  ).length;

  const activeJobs = jobs.filter(
    (job) => job.status === "in_progress",
  ).length;

  const completedJobs = jobs.filter(
    (job) => job.status === "completed",
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          لوحة التشغيل
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          أهلاً بيك
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="كل الشغلانات"
          value={jobs.length}
        />

        <Stat
          label="مفتوحة"
          value={openJobs}
        />

        <Stat
          label="جاري تنفيذها"
          value={activeJobs}
        />

        <Stat
          label="مكتملة"
          value={completedJobs}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/jobs"
          className="group border p-6 transition hover:bg-muted/50"
        >
          <div className="flex items-center justify-between">
            <BriefcaseBusiness className="size-6" />

            <ArrowLeft className="size-5 transition group-hover:-translate-x-1" />
          </div>

          <h2 className="mt-8 text-xl font-semibold">
            الشغلانات
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            راقب الشغلانات، الصنايعية المطابقين،
            والإشعارات.
          </p>
        </Link>

        <Link
          href="/admin/craftsmen"
          className="group border p-6 transition hover:bg-muted/50"
        >
          <div className="flex items-center justify-between">
            <Hammer className="size-6" />

            <ArrowLeft className="size-5 transition group-hover:-translate-x-1" />
          </div>

          <h2 className="mt-8 text-xl font-semibold">
            الصنايعية
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            إدارة الصنايعية وحساباتهم وحالة التواجد.
          </p>
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border p-5">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}