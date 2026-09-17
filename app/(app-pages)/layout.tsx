import { ClientNavbar } from "@/components/app/client-navbar";
import { CraftsmanNavbar } from "@/components/app/craftsman-navbar";
import { GuestNavbar } from "@/components/app/guest-navbar";
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="sticky top-0 z-99999999999">
        {role === "craftsman" ? (
          <CraftsmanNavbar />
        ) : role === "client" ? (
          <ClientNavbar />
        ) : role !== "admin" && (
          <GuestNavbar />
        )}
      </div>

      {/* pb-20 reserves space so the mobile bottom nav never covers content */}
      <main className={role ? "pb-20 md:pb-0" : undefined}>
        {children}
      </main>
    </div>
  );
}