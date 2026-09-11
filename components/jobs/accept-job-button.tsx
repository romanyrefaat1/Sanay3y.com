"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";

type AcceptJobButtonProps = {
    jobId: string;
    applicationId: string;
    craftsmanName: string;
};

export default function AcceptJobButton({
    jobId,
    applicationId,
    craftsmanName,
}: AcceptJobButtonProps) {
    const router = useRouter();

    const [isLoading, setIsLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    async function handleAccept() {
        try {
            setIsLoading(true);
            setError(null);

            const supabase = createClient();

            const { error } = await supabase.rpc(
                "accept_job_application",
                {
                    p_job_id: jobId,
                    p_application_id:
                        applicationId,
                },
            );

            if (error) {
                console.error(
                    "accept_job_application:",
                    error,
                );

                setError(
                    error.message ||
                        "حصلت مشكلة أثناء قبول الصنايعي.",
                );

                return;
            }

            router.refresh();
        } catch (error) {
            console.error(
                "Failed to accept application:",
                error,
            );

            setError(
                "حصلت مشكلة غير متوقعة. حاول مرة تانية.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        type="button"
                        size="lg"
                        disabled={isLoading}
                        className="h-12 w-full gap-2 text-base font-bold"
                    >
                        <CheckCircle2 className="size-5" />
                        قبول الصنايعي
                    </Button>
                </AlertDialogTrigger>

                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            قبول {craftsmanName}؟
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            بعد التأكيد، هتبدأ الشغلانة
                            مع الصنايعي ده وهيتم رفض
                            باقي التقديمات المعلقة
                            تلقائيًا.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={isLoading}
                        >
                            إلغاء
                        </AlertDialogCancel>

                        <AlertDialogAction
                            disabled={isLoading}
                            onClick={(event) => {
                                event.preventDefault();
                                void handleAccept();
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    جاري القبول...
                                </>
                            ) : (
                                "تأكيد قبول الصنايعي"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {error && (
                <p className="text-sm font-medium text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}