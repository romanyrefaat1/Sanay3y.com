"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { finishJob } from "@/app/(app-pages)/(common-routes)/jobs/[id]/finished/actions";


type FinishJobButtonProps = {
    jobId: string;
};

export function FinishJobButton({
    jobId,
}: FinishJobButtonProps) {
    const [isPending, startTransition] =
        useTransition();

    const router = useRouter();

    const handleFinish = () => {
        startTransition(async () => {
            const result = await finishJob(jobId);

            if (result?.error) {
                toast.error(result.error);
                return;
            }

            router.push(`/jobs/${jobId}/finished`);
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    className="w-full gap-2"
                    disabled={isPending}
                >
                    {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <CheckCircle2 className="size-4" />
                    )}

                    {isPending
                        ? "جاري الإنهاء..."
                        : "إنهاء الشغلانة"}
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        إنهاء الشغلانة؟
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                        هل أنت متأكد إن الشغلانة خلصت بالفعل؟
                        بعد تأكيد الإنهاء، هتتسجل الشغلانة كمكتملة.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                        إلغاء
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={handleFinish}
                        disabled={isPending}
                    >
                        {isPending
                            ? "جاري الإنهاء..."
                            : "نعم، إنهاء الشغلانة"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}