"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

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

type TelegramMessage = {
  title: string;
  description: string;
};

function getTelegramMessage(pathname: string): TelegramMessage {
  if (pathname === "/dashboard") {
    return {
      title: "اربط تيليجرام وخليك عارف كل جديد أول بأول",
      description:
        "مش لازم تفضل فاتح صنايعي.كوم عشان تعرف إيه اللي حصل. عروض الصنايعية، الرسائل، وأي تحديث مهم على طلباتك هيوصلك على تيليجرام فورًا. الربط سهل وبيخلص في أقل من دقيقتين.",
    };
  }

  if (pathname === "/client/find") {
    return {
      title: "متفوّتش عرض مناسب على طلبك",
      description:
        "وأنت بتدور على الصنايعي المناسب، العروض والرسائل الجديدة ممكن توصل في أي وقت. اربط تيليجرام عشان أول ما يحصل تحديث على طلبك تعرف فورًا، حتى لو مش فاتح الموقع. الموضوع سهل وبيخلص في أقل من دقيقتين.",
    };
  }

  if (pathname === "/client/job/new") {
    return {
      title: "قبل ما تنشر طلبك، اربط تيليجرام",
      description:
        "بعد ما تنشر طلبك، مش محتاج تفضل ترجع للموقع كل شوية وتشوف مين رد. أول ما يوصلك عرض أو رسالة أو يحصل تحديث مهم، هننبّهك على تيليجرام. الربط سهل جدًا وبيأخذ أقل من دقيقتين.",
    };
  }

  if (pathname === "/craftsman/find") {
    return {
      title: "متفوّتش شغل جديد مناسب ليك",
      description:
        "طلبات الشغل الجديدة ممكن تظهر في أي وقت. اربط تيليجرام عشان تعرف فورًا لما يكون فيه طلب جديد تقدر تقدّم عليه، بدل ما تحتاج تفتح صنايعي.كوم كل شوية. الربط سهل وبيخلص في أقل من دقيقتين.",
    };
  }

  if (pathname === "/craftsman/jobs") {
    return {
      title: "خلي الشغل يوصلك حتى وإنت مش على الموقع",
      description:
        "أي تحديث مهم على شغلك أو أي طلب جديد محتاج انتباهك ممكن يوصلك مباشرة على تيليجرام. كده تفضل متابع من غير ما تفتح صنايعي.كوم كل شوية. ربط تيليجرام بياخد أقل من دقيقتين.",
    };
  }

  if (pathname === "/craftsman/messages") {
    return {
      title: "متسيبش رسالة من عميل من غير ما تشوفها",
      description:
        "اربط تيليجرام وخلي رسائل العملاء والتحديثات المهمة توصلك مباشرة. حتى لو مش فاتح صنايعي.كوم، هتعرف إن فيه رسالة أو حاجة محتاجة تدخل منك. الربط سهل وبيخلص في أقل من دقيقتين.",
    };
  }

  if (pathname.startsWith("/jobs/")) {
    return {
      title: "خليك متابع الطلب من غير ما تفتحه كل شوية",
      description:
        "أي تحديث مهم على الطلب أو رسالة جديدة ممكن توصلك على تيليجرام فورًا. بدل ما تعتمد على إنك تفتكر تدخل الموقع، خلي الإشعار هو اللي يوصلك. ربط تيليجرام بياخد أقل من دقيقتين.",
    };
  }

  if (pathname.startsWith("/profile/")) {
    return {
      title: "اربط تيليجرام عشان متفوتش أي تحديث مهم",
      description:
        "خلي صنايعي.كوم يتابع معاك بدل ما تفضل فاكر تدخل الموقع بنفسك. الإشعارات المهمة هتوصلك على تيليجرام، والربط سهل وبيخلص في أقل من دقيقتين.",
    };
  }

  return {
    title: "خلي صنايعي.كوم يوصلك بدل ما تفتكره",
    description:
      "مش لازم تفتح الموقع كل شوية عشان تعرف إن فيه حاجة جديدة. اربط تيليجرام وخلي العروض، الرسائل، والتحديثات المهمة توصلك مباشرة حتى لو مش فاتح صنايعي.كوم. الربط سهل وبيخلص في أقل من دقيقتين.",
  };
}

export function TelegramConnectAlert({
  isConnected = false,
  className,
}: {
  /** Pass the real connection status from the user's profile. */
  isConnected?: boolean;
  className?: string;
}) {
  const pathname = usePathname();

  if (isConnected) return null;

  const { title, description } = getTelegramMessage(pathname);

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
          <p className="text-sm font-bold text-foreground">{title}</p>

          <span className="border border-info/20 bg-info/10 px-2 py-0.5 text-xs font-semibold text-info">
            أقل من دقيقتين
          </span>
        </div>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <Button asChild size="sm" className="shrink-0 whitespace-nowrap">
        <Link href="/connect/telegram">اربط تيليجرام الآن</Link>
      </Button>
    </div>
  );
}