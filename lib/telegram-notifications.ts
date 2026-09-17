import { sendTelegramMessage } from "@/lib/telegram";
import { supabaseAdmin } from "./supabase/admin";

type BotType = "client" | "craftsman";

export async function sendTelegramNotification({
    userId,
    botType,
    message,
}: {
    userId: string;
    botType: BotType;
    message: string;
}) {
    const admin = supabaseAdmin;

    const { data: connection, error } = await admin
        .from("telegram_connections")
        .select("telegram_chat_id")
        .eq("user_id", userId)
        .eq("bot_type", botType)
        .eq("is_active", true)
        .maybeSingle();

    if (error) {
        console.error(
            "Failed to get Telegram connection:",
            error
        );

        return {
            sent: false,
            reason: "database_error",
        };
    }

    if (!connection) {
        return {
            sent: false,
            reason: "telegram_not_connected",
        };
    }

    try {
        await sendTelegramMessage({
            botType,
            chatId: connection.telegram_chat_id,
            text: message,
        });

        return {
            sent: true,
        };
    } catch (error) {
        console.error(
            "Failed to send Telegram notification:",
            error
        );

        return {
            sent: false,
            reason: "telegram_error",
        };
    }
}