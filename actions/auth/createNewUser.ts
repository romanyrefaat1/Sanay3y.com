"use server";

import { createClient } from "@/lib/supabase/server";

type CreateNewUserParams = {
  email: string;
  password: string;
  fullName: string;
  role: "client" | "craftsman";
};

export default async function createNewUser({
  email,
  password,
  fullName,
  role,
}: CreateNewUserParams) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
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