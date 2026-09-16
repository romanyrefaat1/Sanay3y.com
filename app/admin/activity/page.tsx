import Link from "next/link";
import { requireAdmin } from "@/app/admin/_lib/require-admin";

const actionLabels: Record<string, string> = {
    craftsman_created: "إنشاء صنايعي",
    craftsman_updated: "تعديل صنايعي",
    craftsman_activated: "تفعيل حساب",
    craftsman_deactivated: "تعطيل حساب",
    craftsman_availability_changed:
        "تغيير التواجد",
    craftsman_verification_changed:
        "تغيير حالة التوثيق",
    craftsman_contacted: "تم التواصل",
    recommendations_refreshed:
        "تحديث المطابقين",
    telegram_notification_sent:
        "إرسال Telegram",
    telegram_notification_failed:
        "فشل Telegram",
    telegram_notification_retried:
        "إعادة إرسال Telegram",
};

export default async function AdminActivityPage() {
    const { supabase } = await requireAdmin();

    const { data, error } = await supabase.rpc(
        "get_admin_activity",
        {
            p_limit: 200,
            p_offset: 0,
        },
    );

    if (error) {
        throw new Error(error.message);
    }

    return (
        <main
            dir="rtl"
            className="mx-auto max-w-7xl px-6 py-10"
        >
            <div className="mb-8">
                <Link
                    href="/admin"
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← لوحة الإدارة
                </Link>

                <h1 className="mt-4 text-3xl font-semibold">
                    سجل النشاط
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    كل الإجراءات الإدارية المسجلة في النظام.
                </p>
            </div>

            <div className="border border-border">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-right text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="px-4 py-3 font-medium">
                                    التاريخ
                                </th>

                                <th className="px-4 py-3 font-medium">
                                    المسؤول
                                </th>

                                <th className="px-4 py-3 font-medium">
                                    العملية
                                </th>

                                <th className="px-4 py-3 font-medium">
                                    النوع
                                </th>

                                <th className="px-4 py-3 font-medium">
                                    التفاصيل
                                </th>

                                <th className="px-4 py-3 font-medium">
                                    ID
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {(data ?? []).map(
                                (item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-border last:border-0"
                                    >
                                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                                            {new Date(
                                                item.created_at,
                                            ).toLocaleString(
                                                "ar-EG",
                                                {
                                                    dateStyle:
                                                        "medium",
                                                    timeStyle:
                                                        "short",
                                                },
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            {item.admin_name ??
                                                "—"}
                                        </td>

                                        <td className="px-4 py-4 font-medium">
                                            {actionLabels[
                                                item.action
                                            ] ??
                                                item.action}
                                        </td>

                                        <td className="px-4 py-4">
                                            {item.entity_type ??
                                                "—"}
                                        </td>

                                        <td className="max-w-[360px] px-4 py-4">
                                            <pre className="overflow-hidden whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                                                {JSON.stringify(
                                                    item.metadata,
                                                    null,
                                                    2,
                                                )}
                                            </pre>
                                        </td>

                                        <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                                            {item.entity_id ??
                                                "—"}
                                        </td>
                                    </tr>
                                ),
                            )}

                            {!data?.length && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-16 text-center text-muted-foreground"
                                    >
                                        لا يوجد نشاط مسجل حتى الآن.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}