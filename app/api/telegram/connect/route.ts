import { NextResponse } from "next/server";
import crypto from "crypto";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    getTelegramBotUsername,
} from "@/lib/telegram";

type BotType = "client" | "craftsman";

const VALID_BOT_TYPES: BotType[] = [
    "client",
    "craftsman",
];

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const botType = body.botType as BotType;

        if (!VALID_BOT_TYPES.includes(botType)) {
            return NextResponse.json(
                {
                    error: "Invalid bot type",
                },
                { status: 400 }
            );
        }

        // Authenticate the Sanay3y user
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                {
                    error: "Unauthorized",
                },
                { status: 401 }
            );
        }

        const admin = createAdminClient();

        // Remove any previous unused tokens for this user/bot
        await admin
            .from("telegram_link_tokens")
            .delete()
            .eq("user_id", user.id)
            .eq("bot_type", botType);

        // Generate a secure temporary token
        const token = crypto.randomBytes(24).toString("base64url");

        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        ).toISOString();

        const { error: insertError } = await admin
            .from("telegram_link_tokens")
            .insert({
                user_id: user.id,
                bot_type: botType,
                token,
                expires_at: expiresAt,
            });

        if (insertError) {
            console.error(
                "Failed to create Telegram link token:",
                insertError
            );

            return NextResponse.json(
                {
                    error: "Failed to create Telegram connection",
                },
                { status: 500 }
            );
        }

        const botUsername = getTelegramBotUsername(botType);

        const telegramUrl =
            `https://t.me/${botUsername}?start=${token}`;

        return NextResponse.json({
            success: true,
            url: telegramUrl,
            expiresAt,
        });
    } catch (error) {
        console.error("Telegram connect error:", error);

        return NextResponse.json(
            {
                error: "Something went wrong",
            },
            { status: 500 }
        );
    }
}