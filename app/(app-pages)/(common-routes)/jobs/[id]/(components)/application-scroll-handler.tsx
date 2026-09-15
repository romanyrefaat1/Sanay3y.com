"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type Props = {
    applicationId?: string;
};

export function ApplicationScrollHandler({
    applicationId,
}: Props) {
    useEffect(() => {
        if (!applicationId) {
            return;
        }

        let cancelled = false;
        let observer: MutationObserver | null = null;
        let timeout: ReturnType<typeof setTimeout> | null = null;

        const findAndScroll = () => {
            if (cancelled) {
                return true;
            }

            const element = document.getElementById(
                `application-${applicationId}`,
            );

            if (!element) {
                return false;
            }

            requestAnimationFrame(() => {
                if (cancelled) {
                    return;
                }

                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            });

            observer?.disconnect();

            return true;
        };

        // Try immediately
        if (findAndScroll()) {
            return;
        }

        // Watch the DOM until the application actually appears
        observer = new MutationObserver(() => {
            if (findAndScroll()) {
                observer?.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // Don't wait forever
        timeout = setTimeout(() => {
            if (cancelled) {
                return;
            }

            observer?.disconnect();

            const element = document.getElementById(
                `application-${applicationId}`,
            );

            if (!element) {
                toast.error("لم يتم العثور على الطلب المطلوب.");
            }
        }, 5000);

        return () => {
            cancelled = true;
            observer?.disconnect();

            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [applicationId]);

    return null;
}