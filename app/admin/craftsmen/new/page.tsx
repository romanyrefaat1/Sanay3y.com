import Link from "next/link";
import { redirect } from "next/navigation";
import { createCraftsman } from "../actions";
import { requireAdmin } from "@/app/admin/_lib/require-admin";
import LocationPicker from "./(components)/location-picker";

const SERVICE_TYPES = [
    "سباكة",
    "كهرباء",
    "نجارة",
    "دهانات",
    "تكييف وتبريد",
    "أجهزة منزلية",
    "نقل ونقل أثاث",
    "تنظيف",
    "صيانة",
    "أخرى",
];

export default async function NewCraftsmanPage() {
    await requireAdmin();

    return (
        <main
            dir="rtl"
            className="mx-auto max-w-3xl px-6 py-10"
        >
            <div className="mb-8">
                <Link
                    href="/admin/craftsmen"
                    className="text-sm text-muted-foreground hover:text-foreground"
                >
                    ← الصنايعية
                </Link>

                <h1 className="mt-4 text-3xl font-semibold">
                    إضافة صنايعي
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    إنشاء حساب جديد وربطه ببيانات الصنايعي.
                </p>
            </div>

            <form
                action={async (formData) => {
                    "use server";

                    const result =
                        await createCraftsman(
                            formData,
                        );

                    redirect(
                        `/admin/craftsmen/${result.craftsmanId}`,
                    );
                }}
                className="space-y-6"
            >
                {/* Account */}
                <section className="border border-border p-6">
                    <h2 className="text-lg font-semibold">
                        الحساب
                    </h2>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-sm font-medium">
                                الاسم الكامل
                            </span>

                            <input
                                name="full_name"
                                required
                                className="w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">
                                البريد الإلكتروني
                            </span>

                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">
                                كلمة المرور
                            </span>

                            <input
                                name="password"
                                type="password"
                                minLength={8}
                                required
                                className="w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">
                                رقم الهاتف
                            </span>

                            <input
                                name="phone"
                                type="tel"
                                required
                                placeholder="01xxxxxxxxx"
                                className="w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
                            />
                        </label>
                    </div>
                </section>

                {/* Work information */}
                <section className="border border-border p-6">
                    <h2 className="text-lg font-semibold">
                        بيانات العمل
                    </h2>

                    <div className="mt-5 space-y-5">
                        <label className="space-y-2">
                            <span className="text-sm font-medium">
                                نوع الشغل
                            </span>

                            <select
                                name="work_type"
                                required
                                className="w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
                            >
                                <option value="">
                                    اختر نوع الشغل
                                </option>

                                {SERVICE_TYPES.map(
                                    (type) => (
                                        <option
                                            key={type}
                                            value={type}
                                        >
                                            {type}
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">
                                سنوات الخبرة
                            </span>

                            <input
                                name="experience_years"
                                type="number"
                                min={0}
                                max={80}
                                className="w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">
                                المناطق
                            </span>

                            <input
                                name="areas"
                                placeholder="فيصل، الهرم، الطالبية"
                                className="w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
                            />

                            <p className="text-xs text-muted-foreground">
                                افصل بين المناطق بفاصلة.
                            </p>
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">
                                عنوان المحل
                            </span>

                            <input
                                name="shop_address"
                                className="w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-sm font-medium">
                                نبذة
                            </span>

                            <textarea
                                name="bio"
                                rows={5}
                                className="w-full resize-none border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
                            />
                        </label>
                    </div>
                </section>

                {/* Location */}
                <LocationPicker />

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Link
                        href="/admin/craftsmen"
                        className="border border-border px-5 py-2.5 text-sm"
                    >
                        إلغاء
                    </Link>

                    <button
                        type="submit"
                        className="bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                        إنشاء الحساب
                    </button>
                </div>
            </form>
        </main>
    );
}