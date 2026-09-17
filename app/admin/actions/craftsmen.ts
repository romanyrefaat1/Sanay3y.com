"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function normalizeEgyptianPhone(phone: string) {
  const value = phone.trim().replace(/\s+/g, "");

  if (value.startsWith("+20")) {
    return value;
  }

  if (value.startsWith("01")) {
    return `+20${value.slice(1)}`;
  }

  throw new Error(
    "رقم الهاتف غير صحيح. استخدم رقم مصري مثل 01012345678",
  );
}

export async function createCraftsman(
  formData: FormData,
) {
  const supabase = await createClient();

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    throw new Error("Unauthorized");
  }

  const {
    data: isAdmin,
    error: adminError,
  } = await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    throw new Error("Unauthorized");
  }

  const fullName = String(
    formData.get("fullName") ?? "",
  ).trim();

  const rawPhone = String(
    formData.get("phone") ?? "",
  ).trim();

  const workType = String(
    formData.get("workType") ?? "",
  ).trim();

  const experienceRaw = String(
    formData.get("experienceYears") ?? "",
  ).trim();

  const bio = String(
    formData.get("bio") ?? "",
  ).trim();

  const areasRaw = String(
    formData.get("areas") ?? "",
  ).trim();

  const shopAddress = String(
    formData.get("shopAddress") ?? "",
  ).trim();

  if (!fullName) {
    throw new Error("اكتب اسم الصنايعي");
  }

  if (!rawPhone) {
    throw new Error("اكتب رقم الهاتف");
  }

  if (!workType) {
    throw new Error("اختار نوع الشغل");
  }

  const phone = normalizeEgyptianPhone(rawPhone);

  const experienceYears =
    experienceRaw === ""
      ? null
      : Number(experienceRaw);

  if (
    experienceYears !== null &&
    (!Number.isFinite(experienceYears) ||
      experienceYears < 0)
  ) {
    throw new Error(
      "سنين الخبرة لازم تكون رقم صحيح",
    );
  }

  const areas = areasRaw
    ? areasRaw
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean)
    : [];

  const admin = supabaseAdmin;

  /*
   * Create the Auth account.
   *
   * The temporary password is generated server-side.
   * It is returned once to the admin so they can give it
   * to the craftsman.
   */
  const temporaryPassword =
    `San3y-${crypto.randomUUID().slice(0, 8)}!`;

  const {
    data: authData,
    error: authError,
  } = await admin.auth.admin.createUser({
    phone,
    password: temporaryPassword,
    phone_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "craftsman",
    },
  });

  if (authError || !authData.user) {
    throw new Error(
      authError?.message ??
        "تعذر إنشاء حساب المستخدم",
    );
  }

  const userId = authData.user.id;

  try {
    const { error: profileError } =
      await admin
        .from("profiles")
        .insert({
          id: userId,
          full_name: fullName,
          role: "craftsman",
          is_active: true,
        });

    if (profileError) {
      throw profileError;
    }

    const { error: craftsmanError } =
      await admin
        .from("craftsman_profiles")
        .insert({
          id: userId,
          phone,
          bio: bio || null,
          experience_years: experienceYears,
          areas,
          shop_address:
            shopAddress || null,
          verification_status: "pending",
          is_available: true,
          work_type: workType,
        });

    if (craftsmanError) {
      throw craftsmanError;
    }

    await supabase.rpc(
      "write_admin_audit_log",
      {
        p_action: "craftsman_created",
        p_entity_type: "craftsman",
        p_entity_id: userId,
        p_metadata: {
          work_type: workType,
          phone,
          source: "admin_dashboard",
        },
      },
    );

    revalidatePath("/admin/craftsmen");

    return {
      success: true,
      userId,
      temporaryPassword,
    };
  } catch (error) {
    /*
     * The Auth user was created but the application
     * records failed. Remove the Auth user so we don't
     * leave an orphaned account.
     */
    await admin.auth.admin.deleteUser(userId);

    throw new Error(
      error instanceof Error
        ? error.message
        : "تعذر إنشاء بيانات الصنايعي",
    );
  }
}