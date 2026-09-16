"use client";

import { markCraftsmanCalled, unmarkCraftsmanCalled } from "@/app/admin/actions";
import {
  Check,
  CheckCircle2,
  MessageCircle,
  Phone,
  PhoneCall,
  RotateCcw,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";


type Recommendation = {
  recommendation_id: string;
  craftsman_id: string;
  full_name: string | null;
  phone: string | null;
  work_type: string | null;
  distance_km: number | null;
  is_active: boolean;
  is_available: boolean;
  verification_status: string | null;
  telegram_connected: boolean;
  telegram_connected_at: string | null;
  telegram_connected_after_job: boolean;
  notification_status: string | null;
  telegram_notified: boolean;
  called: boolean;
  called_at: string | null;
  applied: boolean;
  application_status: string | null;
  recommendation_status: string | null;
};

type Filter =
  | "all"
  | "needs_call"
  | "not_called"
  | "called"
  | "telegram"
  | "not_telegram"
  | "applied"
  | "not_applied";

function formatDistance(distanceKm: number | null) {
  if (distanceKm == null) return "—";
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} م`;
  }

  return `${distanceKm.toFixed(2)} كم`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getApplicationLabel(
  applied: boolean,
  status: string | null,
) {
  if (!applied) return "لم يتقدم";

  switch (status) {
    case "pending":
      return "متقدم";
    case "accepted":
      return "تم قبوله";
    case "rejected":
      return "مرفوض";
    case "withdrawn":
      return "منسحب";
    default:
      return "متقدم";
  }
}

function getNotificationLabel(
  recommendation: Recommendation,
) {
  if (recommendation.telegram_connected_after_job) {
    return "اتصل بعد نشر الشغل";
  }

  if (recommendation.telegram_notified) {
    return "تم الإرسال";
  }

  if (recommendation.notification_status === "failed") {
    return "فشل الإرسال";
  }

  if (recommendation.telegram_connected) {
    return "متصل بتيليجرام";
  }

  return "بدون تيليجرام";
}

export default function RecommendationsTable({
  jobId,
  recommendations,
}: {
  jobId: string;
  recommendations: Recommendation[];
}) {
  const [filter, setFilter] = useState<Filter>("needs_call");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return {
      all: recommendations.length,
      needs_call: recommendations.filter(
        (r) => !r.called && !r.telegram_notified,
      ).length,
      not_called: recommendations.filter((r) => !r.called).length,
      called: recommendations.filter((r) => r.called).length,
      telegram: recommendations.filter(
        (r) => r.telegram_connected && !r.telegram_connected_after_job,
      ).length,
      not_telegram: recommendations.filter(
        (r) => !r.telegram_connected,
      ).length,
      applied: recommendations.filter((r) => r.applied).length,
      not_applied: recommendations.filter((r) => !r.applied).length,
    };
  }, [recommendations]);

  const filtered = useMemo(() => {
    return recommendations.filter((r) => {
      switch (filter) {
        case "needs_call":
          return !r.called && !r.telegram_notified;

        case "not_called":
          return !r.called;

        case "called":
          return r.called;

        case "telegram":
          return (
            r.telegram_connected &&
            !r.telegram_connected_after_job
          );

        case "not_telegram":
          return !r.telegram_connected;

        case "applied":
          return r.applied;

        case "not_applied":
          return !r.applied;

        case "all":
        default:
          return true;
      }
    });
  }, [filter, recommendations]);

  async function handleCalled(
    recommendation: Recommendation,
  ) {
    setPendingId(recommendation.recommendation_id);

    try {
      const formData = new FormData();
      formData.set("jobId", jobId);
      formData.set(
        "recommendationId",
        recommendation.recommendation_id,
      );

      await markCraftsmanCalled(formData);
    } finally {
      setPendingId(null);
    }
  }

  async function handleUnmark(
    recommendation: Recommendation,
  ) {
    setPendingId(recommendation.recommendation_id);

    try {
      const formData = new FormData();
      formData.set("jobId", jobId);
      formData.set(
        "recommendationId",
        recommendation.recommendation_id,
      );

      await unmarkCraftsmanCalled(formData);
    } finally {
      setPendingId(null);
    }
  }

  const filters: {
    id: Filter;
    label: string;
  }[] = [
    {
      id: "needs_call",
      label: `يحتاج اتصال (${counts.needs_call})`,
    },
    {
      id: "all",
      label: `الكل (${counts.all})`,
    },
    {
      id: "not_called",
      label: `لم يتم الاتصال (${counts.not_called})`,
    },
    {
      id: "called",
      label: `تم الاتصال (${counts.called})`,
    },
    {
      id: "telegram",
      label: `تيليجرام (${counts.telegram})`,
    },
    {
      id: "not_telegram",
      label: `بدون تيليجرام (${counts.not_telegram})`,
    },
    {
      id: "applied",
      label: `تقدموا (${counts.applied})`,
    },
    {
      id: "not_applied",
      label: `لم يتقدموا (${counts.not_applied})`,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={[
              "border px-3 py-2 text-sm transition-colors",
              filter === item.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr className="text-right">
                <th className="px-4 py-3 font-medium">
                  الصنايعي
                </th>
                <th className="px-4 py-3 font-medium">
                  المطابقة
                </th>
                <th className="px-4 py-3 font-medium">
                  الحساب
                </th>
                <th className="px-4 py-3 font-medium">
                  تيليجرام
                </th>
                <th className="px-4 py-3 font-medium">
                  التقدم
                </th>
                <th className="px-4 py-3 font-medium">
                  الاتصال
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((recommendation) => {
                const isPending =
                  pendingId === recommendation.recommendation_id;

                return (
                  <tr
                    key={recommendation.recommendation_id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted">
                          <UserRound className="size-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="font-medium">
                            {recommendation.full_name ||
                              "بدون اسم"}
                          </div>

                          <div className="mt-1 text-xs text-muted-foreground">
                            {recommendation.work_type || "—"}
                          </div>

                          {recommendation.phone && (
                            <a
                              href={`tel:${recommendation.phone}`}
                              className="mt-1 block text-xs text-primary hover:underline"
                            >
                              {recommendation.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {formatDistance(
                            recommendation.distance_km,
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {recommendation.is_available
                            ? "متاح"
                            : "غير متاح"}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {recommendation.is_active ? (
                            <>
                              <CheckCircle2 className="size-4" />
                              <span>نشط</span>
                            </>
                          ) : (
                            <>
                              <X className="size-4" />
                              <span>غير نشط</span>
                            </>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          التحقق:{" "}
                          {recommendation.verification_status ||
                            "—"}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {recommendation.telegram_connected ? (
                          <div className="flex items-center gap-2">
                            <Send className="size-4" />
                            <span>
                              {getNotificationLabel(
                                recommendation,
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            بدون تيليجرام
                          </div>
                        )}

                        {recommendation.telegram_connected_at && (
                          <div className="text-xs text-muted-foreground">
                            {formatDate(
                              recommendation.telegram_connected_at,
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {recommendation.applied ? (
                        <div className="flex items-center gap-2">
                          <Check className="size-4" />
                          <span>
                            {getApplicationLabel(
                              true,
                              recommendation.application_status,
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          لم يتقدم
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {recommendation.called ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <PhoneCall className="size-4" />
                            <span>تم الاتصال</span>
                          </div>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              handleUnmark(recommendation)
                            }
                            className="inline-flex items-center gap-1 border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                          >
                            <RotateCcw className="size-3" />
                            تراجع
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {recommendation.phone && (
                            <a
                              href={`tel:${recommendation.phone}`}
                              className="inline-flex items-center gap-2 border border-border px-3 py-2 hover:bg-muted"
                            >
                              <Phone className="size-4" />
                              اتصال
                            </a>
                          )}

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              handleCalled(recommendation)
                            }
                            className="inline-flex items-center gap-2 border border-primary bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
                          >
                            <PhoneCall className="size-4" />
                            تم الاتصال
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    لا يوجد صنايعية في هذا الفلتر.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}