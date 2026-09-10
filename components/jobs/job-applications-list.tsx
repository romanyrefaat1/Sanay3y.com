"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MessageSquare,
  UserRound,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type JobApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

type JobApplication = {
  id: string;
  job_id: string;
  craftsman_id: string;
  proposed_price: number;
  message: string | null;
  status: JobApplicationStatus;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
};

type CraftsmanProfile = {
  id: string;
  bio: string | null;
  experience_years: number | null;
  areas: string[];
  shop_address: string | null;
  verification_status:
    | "pending"
    | "verified"
    | "rejected";
  is_available: boolean;
  average_response_time_minutes: number | null;
  response_rate: number;
  completion_rate: number;
};

type ApplicationWithCraftsman =
  JobApplication & {
    profile: Profile | null;
    craftsmanProfile:
      | CraftsmanProfile
      | null;
  };

type JobApplicationsListProps = {
  jobId: string;
};

function getStatusBadge(
  status: JobApplicationStatus,
) {
  switch (status) {
    case "accepted":
      return (
        <Badge className="gap-1 bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
          <CheckCircle2 className="size-3.5" />
          تم القبول
        </Badge>
      );

    case "rejected":
      return (
        <Badge className="gap-1 bg-red-100 px-3 py-1 text-red-700 hover:bg-red-100">
          <XCircle className="size-3.5" />
          مرفوض
        </Badge>
      );

    case "withdrawn":
      return (
        <Badge className="gap-1 bg-gray-100 px-3 py-1 text-gray-600 hover:bg-gray-100">
          <XCircle className="size-3.5" />
          منسحب
        </Badge>
      );

    case "pending":
    default:
      return (
        <Badge className="gap-1 bg-amber-100 px-3 py-1 text-amber-700 hover:bg-amber-100">
          <Clock3 className="size-3.5" />
          قيد المراجعة
        </Badge>
      );
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "ar-EG",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(new Date(date));
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "؟"
  );
}

export function JobApplicationsList({
  jobId,
}: JobApplicationsListProps) {
  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [applications, setApplications] =
    useState<ApplicationWithCraftsman[]>(
      [],
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadApplications =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: applicationData,
          error: applicationsError,
        } = await supabase
          .from("job_applications")
          .select(
            `
              id,
              job_id,
              craftsman_id,
              proposed_price,
              message,
              status,
              created_at,
              updated_at
            `,
          )
          .eq("job_id", jobId)
          .order("created_at", {
            ascending: false,
          });

        if (applicationsError) {
          throw applicationsError;
        }

        if (
          !applicationData ||
          applicationData.length === 0
        ) {
          setApplications([]);
          return;
        }

        const craftsmanIds = [
          ...new Set(
            applicationData.map(
              (application) =>
                application.craftsman_id,
            ),
          ),
        ];

        const [
          {
            data: profiles,
            error: profilesError,
          },
          {
            data: craftsmanProfiles,
            error:
              craftsmanProfilesError,
          },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, full_name, avatar_url, created_at",
            )
            .in("id", craftsmanIds),

          supabase
            .from("craftsman_profiles")
            .select(
              `
                id,
                bio,
                experience_years,
                areas,
                shop_address,
                verification_status,
                is_available,
                average_response_time_minutes,
                response_rate,
                completion_rate
              `,
            )
            .in("id", craftsmanIds),
        ]);

        if (profilesError) {
          throw profilesError;
        }

        if (
          craftsmanProfilesError
        ) {
          throw craftsmanProfilesError;
        }

        const profileMap =
          new Map(
            (profiles ?? []).map(
              (profile) => [
                profile.id,
                profile,
              ],
            ),
          );

        const craftsmanProfileMap =
          new Map(
            (
              craftsmanProfiles ?? []
            ).map((profile) => [
              profile.id,
              profile,
            ]),
          );

        const combined =
          applicationData.map(
            (application) => ({
              ...application,
              profile:
                profileMap.get(
                  application.craftsman_id,
                ) ?? null,
              craftsmanProfile:
                craftsmanProfileMap.get(
                  application.craftsman_id,
                ) ?? null,
            }),
          );

        setApplications(combined);
      } catch (err) {
        console.error(
          "Failed to load job applications:",
          err,
        );

        setError(
          "حصلت مشكلة أثناء تحميل طلبات التقديم",
        );
      } finally {
        setLoading(false);
      }
    }, [jobId, supabase]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  if (loading) {
    return (
      <Card dir="rtl">
        <CardContent className="flex min-h-40 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            جاري تحميل المتقدمين...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card dir="rtl">
        <CardContent className="flex min-h-40 items-center justify-center text-sm text-red-600">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            المتقدمين
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
            <UserRound className="mb-3 size-8 text-muted-foreground" />

            <p className="font-semibold">
              لسه مفيش متقدمين
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              لما الصنايعية يبدأوا يقدموا
              على الشغلانة هتظهر طلباتهم
              هنا
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">
            المتقدمين
          </CardTitle>

          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length}{" "}
            {applications.length === 1
              ? "متقدم"
              : "متقدمين"}{" "}
            على الشغلانة
          </p>
        </div>

        <Badge
          variant="secondary"
          className="px-3 py-1"
        >
          {applications.length}
        </Badge>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6 mt-8">
        {applications.map((application, index) => {
  const profile = application.profile;
  const craftsmanProfile =
    application.craftsmanProfile;

  const name =
    profile?.full_name || "صنايعي";

  const primaryArea =
    craftsmanProfile?.areas?.[0] || null;

  return (
    <div key={application.id}>
      <div className="py-2">
        {/* Craftsman */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-12 shrink-0 border">
              <AvatarImage
                src={
                  profile?.avatar_url ??
                  undefined
                }
                alt={name}
              />

              <AvatarFallback className="text-sm font-semibold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h3 className="truncate text-base font-bold">
                {name}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {craftsmanProfile?.verification_status ===
                  "verified" && (
                  <span className="font-medium text-emerald-600">
                    حساب موثّق
                  </span>
                )}

                {craftsmanProfile?.experience_years !==
                  null &&
                  craftsmanProfile?.experience_years !==
                    undefined && (
                    <span>
                      {
                        craftsmanProfile.experience_years
                      }{" "}
                      {craftsmanProfile.experience_years ===
                      1
                        ? "سنة خبرة"
                        : "سنين خبرة"}
                    </span>
                  )}

                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {formatDate(
                    application.created_at,
                  )}
                </span>
              </div>

              {/* Important notes */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {getStatusBadge(
                  application.status,
                )}

                {primaryArea && (
                  <Badge
                    variant="secondary"
                    className="gap-1 font-normal"
                  >
                    <MapPin className="size-3" />
                    {primaryArea}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Application stats */}
        <div className="mt-6 grid grid-cols-1 overflow-hidden rounded-md bg-muted/50 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center border-b p-4 text-center sm:border-b-0 sm:border-l">
            <p className="text-sm font-medium text-muted-foreground">
              السعر المقترح
            </p>

            <p className="mt-1 text-lg font-medium">
              {application.proposed_price.toLocaleString(
                "ar-EG",
              )}{" "}
              جنيه
            </p>
          </div>

          <div className="flex flex-col items-center justify-center border-b p-4 text-center sm:border-b-0 sm:border-l">
            <p className="text-sm font-medium text-muted-foreground">
              نسبة الرد
            </p>

            <p className="mt-1 text-lg font-medium">
              {craftsmanProfile
                ? `${craftsmanProfile.response_rate}%`
                : "غير متاح"}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              نسبة إتمام الأعمال
            </p>

            <p className="mt-1 text-lg font-medium">
              {craftsmanProfile
                ? `${craftsmanProfile.completion_rate}%`
                : "غير متاح"}
            </p>
          </div>
        </div>

        {/* Application message */}
        {application.message && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">
              الرسالة
            </p>

            <p className="whitespace-pre-wrap break-words text-sm leading-8 text-foreground">
              {application.message}
            </p>
          </div>
        )}

        {/* Additional areas */}
        {craftsmanProfile &&
          craftsmanProfile.areas.length > 1 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">
                مناطق العمل
              </p>

              <div className="flex flex-wrap gap-2">
                {craftsmanProfile.areas
                  .slice(1)
                  .map((area) => (
                    <Badge
                      key={area}
                      variant="secondary"
                      className="gap-1 font-normal"
                    >
                      <MapPin className="size-3" />
                      {area}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
      </div>

      {index <
        applications.length - 1 && (
        <Separator className="my-7" />
      )}
      <Separator />
    </div>
  );
})}
      </CardContent>
    </Card>
  );
}