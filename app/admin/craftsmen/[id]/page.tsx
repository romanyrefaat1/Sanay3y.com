import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/admin/_lib/require-admin";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

function statusLabel(value: boolean) {
    return value ? "نشط" : "غير نشط";
}

export default async function CraftsmanDetailPage({
    params,
}: PageProps) {
    const { id } = await params;
    const { supabase } = await requireAdmin();

    const [
        craftsmanResult,
        recommendationsResult,
    ] = await Promise.all([
        supabase.rpc(
            "get_admin_craftsman",
            {
                p_craftsman_id: id,
            },
        ),
        supabase.rpc(
            "get_admin_craftsman_recommendations",
            {
                p_craftsman_id: id,
            },
        ),
    ]);

    if (
        craftsmanResult.error ||
        !craftsmanResult.data?.length
    ) {
        notFound();
    }

    const craftsman = craftsmanResult.data[0];

    const recommendations =
        recommendationsResult.error
            ? []
            : recommendationsResult.data ?? [];

    return (
        <main
            dir="rtl"
            className="mx-auto max-w-6xl px-6 py-10"
        >
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <Link
                        href="/admin/craftsmen"
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        ← الصنايعية
                    </Link>

                    <h1 className="mt-4 text-3xl font-semibold">
                        {craftsman.full_name}
                    </h1>

                    <p className="mt-2 text-sm text-muted-foreground">
                        {craftsman.work_type}
                    </p>
                </div>

                <Link
                    href="/admin/craftsmen"
                    className="border border-border px-4 py-2 text-sm"
                >
                    كل الصنايعية
                </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <section className="border border-border p-6 lg:col-span-2">
                    <h2 className="text-lg font-semibold">
                        بيانات الحساب
                    </h2>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <Info
                            label="الاسم"
                            value={craftsman.full_name}
                        />

                        <Info
                            label="الإيميل"
                            value={craftsman.email ?? "—"}
                        />

                        <Info
                            label="رقم الهاتف"
                            value={craftsman.phone ?? "—"}
                        />

                        <Info
                            label="نوع الشغل"
                            value={craftsman.work_type}
                        />

                        <Info
                            label="سنوات الخبرة"
                            value={
                                craftsman.experience_years === null
                                    ? "—"
                                    : String(
                                          craftsman.experience_years,
                                      )
                            }
                        />

                        <Info
                            label="حالة الحساب"
                            value={statusLabel(
                                craftsman.is_active,
                            )}
                        />

                        <Info
                            label="التواجد"
                            value={
                                craftsman.is_available
                                    ? "متاح"
                                    : "غير متاح"
                            }
                        />

                        <Info
                            label="التوثيق"
                            value={
                                craftsman.verification_status
                            }
                        />

                        <Info
                            label="الموقع"
                            value={
                                craftsman.has_location
                                    ? "محدد"
                                    : "غير محدد"
                            }
                        />

                        <Info
                            label="Telegram"
                            value={
                                craftsman.telegram_connected
                                    ? `متصل${
                                          craftsman.telegram_username
                                              ? ` — @${craftsman.telegram_username}`
                                              : ""
                                      }`
                                    : "غير متصل"
                            }
                        />
                    </div>
                </section>

                <section className="border border-border p-6">
                    <h2 className="text-lg font-semibold">
                        التشغيل
                    </h2>

                    <div className="mt-5 space-y-4">
                        <Info
                            label="متوسط وقت الرد"
                            value={
                                craftsman.average_response_time_minutes ===
                                null
                                    ? "—"
                                    : `${craftsman.average_response_time_minutes} دقيقة`
                            }
                        />

                        <Info
                            label="معدل الرد"
                            value={
                                craftsman.response_rate === null
                                    ? "—"
                                    : `${craftsman.response_rate}%`
                            }
                        />

                        <Info
                            label="معدل إتمام الشغل"
                            value={
                                craftsman.completion_rate ===
                                null
                                    ? "—"
                                    : `${craftsman.completion_rate}%`
                            }
                        />

                        <Info
                            label="المناطق"
                            value={
                                craftsman.areas?.length
                                    ? craftsman.areas.join(
                                          "، ",
                                      )
                                    : "—"
                            }
                        />

                        <Info
                            label="عنوان المحل"
                            value={
                                craftsman.shop_address ||
                                "—"
                            }
                        />
                    </div>
                </section>
            </div>

            <section className="mt-5 border border-border p-6">
                <h2 className="text-lg font-semibold">
                    النبذة
                </h2>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {craftsman.bio || "لا توجد نبذة."}
                </p>
            </section>

            <section className="mt-5 border border-border p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            التوصيات
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            الشغلانات اللي ظهر فيها الصنايعي ضمن
                            الترشيحات الحالية.
                        </p>
                    </div>

                    <span className="text-sm text-muted-foreground">
                        {recommendations.length}
                    </span>
                </div>

                <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-3 py-3 font-medium">
                                    الشغلانة
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    المسافة
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    الحالة
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    الإشعار
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {recommendations.map(
                                (item) => (
                                    <tr
                                        key={
                                            item.recommendation_id
                                        }
                                        className="border-b border-border last:border-0"
                                    >
                                        <td className="px-3 py-4">
                                            <Link
                                                href={`/admin/jobs/${item.job_id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {
                                                    item.job_title
                                                }
                                            </Link>
                                        </td>

                                        <td className="px-3 py-4">
                                            {item.distance_km} كم
                                        </td>

                                        <td className="px-3 py-4">
                                            {
                                                item.recommendation_status
                                            }
                                        </td>

                                        <td className="px-3 py-4">
                                            {
                                                item.notification_status
                                            }
                                        </td>
                                    </tr>
                                ),
                            )}

                            {!recommendations.length && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-3 py-10 text-center text-muted-foreground"
                                    >
                                        لا توجد توصيات.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
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
        <div>
            <p className="text-xs text-muted-foreground">
                {label}
            </p>
            <p className="mt-1 text-sm font-medium">
                {value}
            </p>
        </div>
    );
}