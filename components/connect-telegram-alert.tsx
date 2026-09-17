"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function TelegramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        d="M17.6 7.2 6.9 11.4c-.6.24-.6.83 0 1.06l2.65.9 1.02 3.2c.14.44.7.55 1 .2l1.5-1.7 2.62 1.9c.43.32 1.06.1 1.18-.42l1.86-8.6c.13-.6-.47-1.1-1.12-.74Zm-1.66 1.9-4.86 4.3-.2 1.9-.86-2.7 5.6-3.7c.2-.14.4.13.22.3Z"
        fill="white"
      />
    </svg>
  );
}

type UserRole = "client" | "craftsman" | "admin" | "team";

type TelegramMessage = {
  title: string;
  description: string;
};

function getTelegramMessage(
  pathname: string,
  role: UserRole
): TelegramMessage {
  const isCraftsman = role === "craftsman";

  if (pathname === "/dashboard") {
    return isCraftsman
      ? {
          title: "خلي الشغل يوصلك بدل ما تفضل تراجع الموقع",
          description:
            "طلبات جديدة، رسائل من العملاء، وأي تحديث مهم على شغلك ممكن يحصل وإنت مش فاتح صنايعي.كوم. اربط تيليجرام وخلي الحاجات المهمة توصلك لوحدها. الموضوع بياخد أقل من دقيقتين.",
        }
      : {
          title: "خليك عارف اللي حصل من غير ما تفتح الموقع",
          description:
            "لما حد يقدم على طلبك، يبعتلك رسالة، أو يحصل تحديث مهم، مش لازم تفضل تدخل صنايعي.كوم كل شوية. اربط تيليجرام وخلي الإشعارات المهمة توصلك مباشرة. الربط بياخد أقل من دقيقتين.",
        };
  }

  if (pathname === "/client/find" && !isCraftsman) {
    return {
      title: "متفوّتش رد على طلبك",
      description:
        "وأنت بتدور على الصنايعي المناسب، ممكن حد يقدّم أو يبعتلك رسالة وإنت مش على الموقع. اربط تيليجرام وخلي أول إشعار يوصلك أول ما يحصل جديد.",
    };
  }

  if (pathname === "/client/job/new" && !isCraftsman) {
    return {
      title: "انشر طلبك وإحنا نوصلك لما يحصل جديد",
      description:
        "بعد ما تنشر الطلب، مش محتاج تدخل تراجع كل شوية. أول ما صنايعي يقدّم، يبعت رسالة، أو يحصل تحديث مهم هننبّهك على تيليجرام. الربط سهل وبيخلص في أقل من دقيقتين.",
    };
  }

  if (pathname === "/craftsman/find" && isCraftsman) {
    return {
      title: "متفوّتش شغل مناسب ليك",
      description:
        "الطلبات الجديدة مش بتستنى وقت معين. اربط تيليجرام عشان تعرف لما يظهر شغل مناسب وتقدر تدخل تقدّم عليه، حتى لو مش فاتح صنايعي.كوم.",
    };
  }

  if (pathname === "/craftsman/jobs" && isCraftsman) {
    return {
      title: "خليك متابع شغلك من غير ما تفتحه كل شوية",
      description:
        "أي تحديث مهم على شغلك أو رسالة من عميل ممكن توصلك على تيليجرام مباشرة. كده تفضل متابع من غير ما تحتاج تراجع الموقع طول اليوم.",
    };
  }

  if (pathname === "/craftsman/messages" && isCraftsman) {
    return {
      title: "خلي رسائل العملاء توصلك أول ما تبعت",
      description:
        "ممكن العميل يبعتلك رسالة وإنت بعيد عن الموقع. لما تربط تيليجرام، هتعرف فورًا إن فيه رسالة جديدة أو حاجة محتاجة منك رد.",
    };
  }

  if (pathname.startsWith("/jobs/")) {
    return isCraftsman
      ? {
          title: "خليك متابع الشغل من غير ما تفتحه كل شوية",
          description:
            "أي رسالة أو تحديث مهم على الطلب ممكن يوصلك على تيليجرام مباشرة. بدل ما تعتمد على إنك تفتكر تدخل الموقع، خلي التنبيه يوصلك في وقته.",
        }
      : {
          title: "خليك متابع طلبك من غير ما تفتحه كل شوية",
          description:
            "أي عرض، رسالة، أو تحديث مهم على الطلب ممكن يوصلك على تيليجرام مباشرة. مش لازم تدخل الموقع كل شوية عشان تعرف إيه اللي حصل.",
        };
  }

  if (pathname.startsWith("/profile/")) {
    return isCraftsman
      ? {
          title: "خلي إشعارات الشغل توصلك على تيليجرام",
          description:
            "بدل ما تفتكر تدخل صنايعي.كوم وتراجع بنفسك، خلي التحديثات المهمة توصلك على تيليجرام. الربط سهل ومش بياخد دقيقتين.",
        }
      : {
          title: "خلي صنايعي.كوم يتابع معاك",
          description:
            "مش لازم تفتكر تدخل الموقع بنفسك كل مرة يحصل فيها جديد. اربط تيليجرام وخلي الإشعارات المهمة توصلك مباشرة.",
        };
  }

  return isCraftsman
    ? {
        title: "خلي الشغل يوصلك على تيليجرام",
        description:
          "طلبات جديدة، رسائل، وتحديثات مهمة ممكن تحصل وإنت بعيد عن الموقع. اربط تيليجرام وخلي صنايعي.كوم ينبهك وقت ما يكون فيه حاجة محتاجة انتباهك.",
      }
    : {
        title: "خلي صنايعي.كوم يوصلك بدل ما تفتكره",
        description:
          "مش لازم تفتح الموقع كل شوية عشان تعرف إن فيه حاجة جديدة. اربط تيليجرام وخلي العروض، الرسائل، والتحديثات المهمة توصلك مباشرة.",
      };
}

export function TelegramConnectAlert({
  className,
}: {
  className?: string;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTelegramStatus() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (!cancelled) {
          setRole(null);
          setIsConnected(null);
        }

        return;
      }

      const [{ data: profile, error: profileError }, { data: connection, error: connectionError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single(),

          supabase
            .from("telegram_connections")
            .select("id, bot_type, is_active")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle(),
        ]);

      if (profileError) {
        console.error(
          "Failed to load profile role:",
          profileError
        );
      }

      if (connectionError) {
        console.error(
          "Failed to load Telegram connection:",
          connectionError
        );
      }

      if (cancelled) return;

      const userRole = profile?.role as UserRole | undefined;

      if (
        userRole !== "client" &&
        userRole !== "craftsman" &&
        userRole !== "admin" &&
        userRole !== "team"
      ) {
        setRole(null);
        setIsConnected(null);
        return;
      }

      setRole(userRole);

      /*
       * Only client/craftsman accounts use Telegram bots.
       * Admin/team accounts should not see this alert.
       */
      if (
        userRole !== "client" &&
        userRole !== "craftsman"
      ) {
        setIsConnected(true);
        return;
      }

      setIsConnected(
        connection?.bot_type === userRole &&
          connection?.is_active === true
      );
    }

    loadTelegramStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Hide while we're determining the real state.
   * Also hide for connected users and roles that don't use Telegram.
   */
  if (
    role === null ||
    isConnected === null ||
    isConnected === true
  ) {
    return null;
  }

  const { title, description } = getTelegramMessage(
    pathname,
    role
  );

  return (
    <div
      role="status"
      className={[
        "my-5 flex flex-col gap-4 border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5",
        className ?? "",
      ].join(" ")}
    >
      <TelegramGlyph className="h-10 w-10 shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-foreground">
            {title}
          </p>

          <span className="border border-info/20 bg-info/10 px-2 py-0.5 text-xs font-semibold text-info">
            أقل من دقيقتين
          </span>
        </div>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <Button
        asChild
        size="sm"
        className="shrink-0 whitespace-nowrap"
      >
        <Link href="/connect/telegram">
          اربط تيليجرام الآن
        </Link>
      </Button>
    </div>
  );
}