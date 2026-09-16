import Link from "next/link";
import { Plus, Phone } from "lucide-react";

import { requireAdmin } from "../_lib/require-admin";

export default async function AdminCraftsmenPage() {
  const { supabase } =
    await requireAdmin();

  const {
    data: craftsmen,
    error,
  } = await supabase.rpc(
    "get_admin_craftsmen",
  );

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            الإدارة
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            الصنايعية
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            كل الصنايعية المسجلين في المنصة.
          </p>
        </div>

        <Link
          href="/admin/craftsmen/new"
          className="flex items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          إضافة صنايعي
        </Link>
      </div>

      <div className="overflow-hidden border">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_110px_100px_100px] border-b bg-muted/30 px-5 py-3 text-sm font-medium">
          <span>الصنايعي</span>
          <span>الهاتف</span>
          <span>الشغل</span>
          <span>الحساب</span>
          <span>التواجد</span>
          <span>Telegram</span>
        </div>

        {(craftsmen ?? []).map(
          (craftsman) => (
            <Link
              href={`/admin/craftsmen/${craftsman.id}`}
              key={craftsman.id}
              className="grid grid-cols-[1.5fr_1fr_1fr_110px_100px_100px] items-center border-b px-5 py-4 last:border-b-0 hover:bg-muted/40"
            >
              <div>
                <p className="font-medium">
                  {craftsman.full_name}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {craftsman.area_list?.join(
                    "، ",
                  ) || "بدون مناطق"}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                {craftsman.phone}
              </div>

              <span className="text-sm">
                {craftsman.work_type}
              </span>

              <span className="text-sm">
                {craftsman.is_active
                  ? "نشط"
                  : "موقوف"}
              </span>

              <span className="text-sm">
                {craftsman.is_available
                  ? "متاح"
                  : "غير متاح"}
              </span>

              <span className="text-sm">
                {craftsman.telegram_connected
                  ? "متصل"
                  : "غير متصل"}
              </span>
            </Link>
          ),
        )}

        {!craftsmen?.length && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            لا يوجد صنايعية حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
}