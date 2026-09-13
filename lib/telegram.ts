type TelegramBotType = "client" | "craftsman";

const BOT_TOKENS: Record<TelegramBotType, string | undefined> = {
    client: process.env.TELEGRAM_CLIENT_BOT_TOKEN,
    craftsman: process.env.TELEGRAM_CRAFTSMAN_BOT_TOKEN,
};

const BOT_USERNAMES: Record<TelegramBotType, string | undefined> = {
    client: process.env.TELEGRAM_CLIENT_BOT_USERNAME,
    craftsman: process.env.TELEGRAM_CRAFTSMAN_BOT_USERNAME,
};

const WEBHOOK_SECRETS: Record<TelegramBotType, string | undefined> = {
    client: process.env.TELEGRAM_CLIENT_WEBHOOK_SECRET,
    craftsman: process.env.TELEGRAM_CRAFTSMAN_WEBHOOK_SECRET,
};

export function getTelegramBotToken(botType: TelegramBotType) {
    const token = BOT_TOKENS[botType];

    if (!token) {
        throw new Error(`Missing Telegram token for ${botType} bot`);
    }

    return token;
}

export function getTelegramBotUsername(
    botType: TelegramBotType
) {
    const username = BOT_USERNAMES[botType];

    if (!username) {
        throw new Error(
            `Missing Telegram username for ${botType} bot. ` +
            `Expected environment variable: ` +
            `TELEGRAM_${botType.toUpperCase()}_BOT_USERNAME`
        );
    }

    return username;
}

export function getTelegramWebhookSecret(botType: TelegramBotType) {
    const secret = WEBHOOK_SECRETS[botType];

    if (!secret) {
        throw new Error(
            `Missing Telegram webhook secret for ${botType} bot`
        );
    }

    return secret;
}

export async function sendTelegramMessage({
    botType,
    chatId,
    text,
}: {
    botType: TelegramBotType;
    chatId: number | string;
    text: string;
}) {
    const token = getTelegramBotToken(botType);

    const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok || !data.ok) {
        console.error("Telegram API error:", data);

        throw new Error(
            data?.description || "Failed to send Telegram message"
        );
    }

    return data;
}