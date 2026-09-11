"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ApplyToJobButtonProps = {
    jobId: string;
    hasApplied: boolean;
};

export default function ApplyToJobButton({
    jobId,
    hasApplied,
}: ApplyToJobButtonProps) {
    const [open, setOpen] = useState(false);
    const [price, setPrice] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setLoading(true);

        try {
            // Replace this with your application server action/API.
            const response = await fetch("/api/job-applications", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jobId,
                    proposedPrice: Number(price),
                    message,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to apply");
            }

            setOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (hasApplied) {
        return (
            <Button
                disabled
                variant="secondary"
                className="w-full sm:w-auto"
            >
                تم التقديم
            </Button>
        );
    }

    return (
        <>
            <Button
                className="w-full sm:w-auto"
                onClick={() => setOpen(true)}
            >
                قدّم على الشغلانة
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent dir="rtl" className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            التقديم على الشغلانة
                        </DialogTitle>

                        <DialogDescription>
                            اكتب السعر المقترح ورسالة قصيرة للعميل.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor={`price-${jobId}`}>
                                السعر المقترح
                            </Label>

                            <div className="relative">
                                <Input
                                    id={`price-${jobId}`}
                                    type="number"
                                    min="0"
                                    value={price}
                                    onChange={(event) =>
                                        setPrice(event.target.value)
                                    }
                                    placeholder="مثال: 500"
                                    className="pl-14"
                                />

                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    ج.م
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`message-${jobId}`}>
                                رسالتك للعميل
                            </Label>

                            <Textarea
                                id={`message-${jobId}`}
                                value={message}
                                onChange={(event) =>
                                    setMessage(event.target.value)
                                }
                                placeholder="اكتب للعميل خبرتك وإزاي تقدر تنفذ الشغلانة..."
                                rows={5}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            إلغاء
                        </Button>

                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={
                                loading ||
                                !price ||
                                !message.trim()
                            }
                        >
                            {loading && (
                                <Loader2 className="size-4 animate-spin" />
                            )}

                            إرسال التقديم
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}