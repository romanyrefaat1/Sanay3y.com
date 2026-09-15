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

        const findApplication = () => {
            const element = document.getElementById(
                `application-${applicationId}`,
            );

            if (element) {
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                return true;
            }

            return false;
        };

        const handleApplicationsLoaded = () => {
            if (cancelled) {
                return;
            }

            if (!findApplication()) {
                toast.error("لم يتم العثور على الطلب المطلوب.");
            }

            observer.disconnect();
        };

        const loadedElement = document.querySelector(
            "[data-applications-loaded='true']",
        );

        if (loadedElement) {
            handleApplicationsLoaded();

            return;
        }

        const observer = new MutationObserver(() => {
            const applicationsLoaded =
                document.querySelector(
                    "[data-applications-loaded='true']",
                );

            if (applicationsLoaded) {
                handleApplicationsLoaded();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [applicationId]);

    return null;
}