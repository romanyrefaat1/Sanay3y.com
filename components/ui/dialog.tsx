"use client";

import * as React from "react";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";

function Dialog({
    ...props
}: React.ComponentProps<
    typeof DialogPrimitive.Root
>) {
    return (
        <DialogPrimitive.Root
            data-slot="dialog"
            {...props}
        />
    );
}

function DialogTrigger({
    ...props
}: React.ComponentProps<
    typeof DialogPrimitive.Trigger
>) {
    return (
        <DialogPrimitive.Trigger
            data-slot="dialog-trigger"
            {...props}
        />
    );
}

function DialogPortal({
    ...props
}: React.ComponentProps<
    typeof DialogPrimitive.Portal
>) {
    return (
        <DialogPrimitive.Portal
            data-slot="dialog-portal"
            {...props}
        />
    );
}

function DialogClose({
    ...props
}: React.ComponentProps<
    typeof DialogPrimitive.Close
>) {
    return (
        <DialogPrimitive.Close
            data-slot="dialog-close"
            {...props}
        />
    );
}

function DialogOverlay({
    className,
    ...props
}: React.ComponentProps<
    typeof DialogPrimitive.Overlay
>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={cn(
                "fixed inset-0 z-50 bg-black/50",
                "data-[state=open]:animate-in",
                "data-[state=open]:fade-in-0",
                "data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0",
                className,
            )}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: React.ComponentProps<
    typeof DialogPrimitive.Content
> & {
    showCloseButton?: boolean;
}) {
    return (
        <DialogPortal data-slot="dialog-portal">
            <DialogOverlay />

            <DialogPrimitive.Content
                dir="rtl"
                data-slot="dialog-content"
                className={cn(
                    "fixed left-[50%] top-[50%] z-50",
                    "grid w-[calc(100%-2rem)]",
                    "translate-x-[-50%] translate-y-[-50%]",
                    "gap-6",
                    "rounded-xl",
                    "border",
                    "bg-background",
                    "p-8",
                    "shadow-lg",
                    "outline-none",
                    "sm:max-w-xl",

                    "data-[state=open]:animate-dialog-in",
                    "data-[state=closed]:animate-dialog-out",

                    className,
                )}
                {...props}
            >
                {children}

                {showCloseButton && (
                    <DialogPrimitive.Close
                        data-slot="dialog-close"
                        className={cn(
                            "absolute left-5 top-5",
                            "flex h-9 w-9 items-center justify-center",
                            "rounded-md",
                            "text-muted-foreground",
                            "opacity-70",
                            "transition-colors",
                            "hover:bg-muted",
                            "hover:text-foreground",
                            "hover:opacity-100",
                            "focus:outline-none",
                            "focus:ring-2",
                            "focus:ring-ring",
                            "focus:ring-offset-2",
                            "disabled:pointer-events-none",
                            "[&_svg]:size-5",
                        )}
                    >
                        <XIcon />

                        <span className="sr-only">
                            إغلاق
                        </span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn(
                "flex flex-col gap-3 text-right",
                className,
            )}
            {...props}
        />
    );
}

function DialogFooter({
    className,
    showCloseButton = false,
    children,
    ...props
}: React.ComponentProps<"div"> & {
    showCloseButton?: boolean;
}) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                "flex flex-col-reverse gap-3",
                "sm:flex-row sm:justify-start",
                className,
            )}
            {...props}
        >
            {children}

            {showCloseButton && (
                <DialogPrimitive.Close asChild>
                    <Button
                        variant="outline"
                        className="h-11 px-5 text-base"
                    >
                        إغلاق
                    </Button>
                </DialogPrimitive.Close>
            )}
        </div>
    );
}

function DialogTitle({
    className,
    ...props
}: React.ComponentProps<
    typeof DialogPrimitive.Title
>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn(
                "text-2xl leading-9 font-bold",
                className,
            )}
            {...props}
        />
    );
}

function DialogDescription({
    className,
    ...props
}: React.ComponentProps<
    typeof DialogPrimitive.Description
>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn(
                "text-base leading-7 text-muted-foreground",
                className,
            )}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};