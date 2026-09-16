"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";

import { updateJobApplicationStatus } from "../../../actions";

type Props = {
  applicationId: string;
  status: string;
};

export default function ApplicationActions({
  applicationId,
  status,
}: Props) {
  const [pending, setPending] =
    useState<string | null>(null);

  async function updateStatus(
    nextStatus: string,
  ) {
    setPending(nextStatus);

    try {
      const formData = new FormData();

      formData.set(
        "applicationId",
        applicationId,
      );

      formData.set("status", nextStatus);

      await updateJobApplicationStatus(formData);
    } finally {
      setPending(null);
    }
  }

  const isPending = status === "pending";

  return (
    <div className="flex flex-wrap gap-2">
      {isPending && (
        <>
          <button
            type="button"
            disabled={pending !== null}
            onClick={() =>
              updateStatus("accepted")
            }
            className="inline-flex items-center gap-2 border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Check className="size-4" />
            {pending === "accepted"
              ? "جاري القبول..."
              : "قبول التقديم"}
          </button>

          <button
            type="button"
            disabled={pending !== null}
            onClick={() =>
              updateStatus("rejected")
            }
            className="inline-flex items-center gap-2 border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <X className="size-4" />
            {pending === "rejected"
              ? "جاري الرفض..."
              : "رفض"}
          </button>
        </>
      )}

      {status === "accepted" && (
        <button
          type="button"
          disabled={pending !== null}
          onClick={() =>
            updateStatus("rejected")
          }
          className="border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          إلغاء القبول
        </button>
      )}

      {status === "rejected" && (
        <button
          type="button"
          disabled={pending !== null}
          onClick={() =>
            updateStatus("pending")
          }
          className="border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          إعادة للتقديمات
        </button>
      )}
    </div>
  );
}