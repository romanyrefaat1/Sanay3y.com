import { ClientNavbar } from "@/components/app/client-navbar";
import { CraftsmanNavbar } from "@/components/app/craftsman-navbar";
import { createClient } from "@/lib/supabase/server";

export default async function AppRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous visitors can land here on public pages — proxy.ts already
  // gates the private ones, so we just render without a role-based navbar. this fixes the bug of user possibly null
  let role: "client" | "craftsman" | "admin" | "team" | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    role = (profile?.role as typeof role) ?? null;
  }

  return (
    <div dir="rtl" className="min-h-screen" style={{ backgroundColor: "hsl(var(--background))" }}>
      <div className="sticky top-0">
        {role === "craftsman" ? (
        <CraftsmanNavbar />
      ) : role === "client" ? (
        <ClientNavbar />
      ) : null /* Anonymous, admin, team*/}
      </div>

      {/* pb-20 reserves space so the mobile bottom nav never covers content, only matters once a navbar renders */}
      <main className={role ? "pb-20 md:pb-0" : undefined}>{children}</main>
    </div>
  );
}