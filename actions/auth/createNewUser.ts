"use server";

import { createClient } from "@/lib/supabase/server";

type CreateNewUserParams = {
  email: string;
  password: string;
  fullName: string;
  role: "client" | "craftsman";
  latitude: number;
  longitude: number;
  phone?: string;
  gender?: "male" | "female";
  bio?: string;
  experienceYears?: number | null;
  shopAddress?: string;
};

export default async function createNewUser({
  email,
  password,
  fullName,
  role,
  latitude,
  longitude,
  phone,
  gender,
  bio,
  experienceYears,
  shopAddress,
}: CreateNewUserParams) {
  const supabase = await createClient();

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      success: false,
      error: "بيانات الموقع غير صالحة.",
    };
  }

  if (role === "client" && (!phone || !gender)) {
    return {
      success: false,
      error: "بيانات العميل غير مكتملة.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
        latitude,
        longitude,
        phone: phone || null,
        gender: gender || null,
        bio: bio || null,
        experience_years: experienceYears ?? null,
        shop_address: shopAddress || null,
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    user: data.user,
  };
}