import ClientDashboardIndex from "@/components/dashboard/client/client-dashboard-index";
import CraftsmanDashboardIndex from "@/components/dashboard/craftsman/craftsman-dashboard-index";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        // Handle unauthenticated user
        e.g. redirect("/login")
        return <div>Not authenticated</div>;
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError) {
        console.error(profileError);
        return <div>Failed to load profile</div>;
    }

    return (
        <div className="p-5 mt-20">
            {/* <h1 className="mb-8 text-xl">لوحة التحكم</h1> */}
            {profile.role === "client" ? <ClientDashboardIndex /> : <CraftsmanDashboardIndex />}
        </div>
    );
}