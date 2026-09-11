import { Suspense } from "react";
import ClientProfileEdit from "./client-profile-edit";

function Loading() {
    return (
        <div
            dir="rtl"
            className="mx-auto w-full max-w-3xl px-4 py-6"
        >
            <p className="text-sm text-muted-foreground">
                جاري تحميل الملف...
            </p>
        </div>
    );
}

export default function ClientProfileEditPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ClientProfileEdit />
        </Suspense>
    );
}