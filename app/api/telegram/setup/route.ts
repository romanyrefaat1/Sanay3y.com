import { NextResponse } from "next/server";

type BotType = "client" | "craftsman";

const bots: {
    type: BotType;
    token: string | undefined;
    secret: string | undefined;
    webhookPath: string;
}[] = [
    {
        type: "client",
        token: process.env.TELEGRAM_CLIENT_BOT_TOKEN,
        secret: process.env.TELEGRAM_CLIENT_WEBHOOK_SECRET,
        webhookPath: "/api/telegram/webhook/client",
    },
    {
        type: "craftsman",
        token: process.env.TELEGRAM_CRAFTSMAN_BOT_TOKEN,
        secret: process.env.TELEGRAM_CRAFTSMAN_WEBHOOK_SECRET,
        webhookPath: "/api/telegram/webhook/craftsman",
    },
];

export async function POST(request: Request) {
    try {
        // Protect this endpoint with a setup secret.
        const setupSecret = process.env.TELEGRAM_SETUP_SECRET;

        if (!setupSecret) {
            return NextResponse.json(
                { error: "TELEGRAM_SETUP_SECRET is not configured" },
                { status: 500 }
            );
        }

        const authorization = request.headers.get("authorization");

        if (authorization !== `Bearer ${setupSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const baseUrl =
            process.env.APP_URL ||
            "https://san3y.vercel.app";

        const results = [];

        for (const bot of bots) {
            if (!bot.token) {
                results.push({
                    bot: bot.type,
                    success: false,
                    error: "Missing bot token",
                });

                continue;
            }

            if (!bot.secret) {
                results.push({
                    bot: bot.type,
                    success: false,
                    error: "Missing webhook secret",
                });

                continue;
            }

            const webhookUrl =
                `${baseUrl}${bot.webhookPath}`;

            const response = await fetch(
                `https://api.telegram.org/bot${bot.token}/setWebhook`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        url: webhookUrl,
                        secret_token: bot.secret,
                        allowed_updates: ["message"],
                    }),
                }
            );

            const data = await response.json();

            results.push({
                bot: bot.type,
                success: response.ok && data.ok,
                webhookUrl,
                telegram: data,
            });
        }

        return NextResponse.json({
            success: results.every((result) => result.success),
            results,
        });
    } catch (error) {
        console.error("Telegram webhook setup error:", error);

        return NextResponse.json(
            {
                error: "Failed to configure Telegram webhooks",
            },
            { status: 500 }
        );
    }
}