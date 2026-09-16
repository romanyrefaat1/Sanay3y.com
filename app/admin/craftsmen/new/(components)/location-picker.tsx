"use client";

import { useState } from "react";

type Coordinates = {
    latitude: number;
    longitude: number;
};

function isValidLatitude(value: number) {
    return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
    return Number.isFinite(value) && value >= -180 && value <= 180;
}

function normalizeCoordinate(
    value: string,
) {
    return value.trim().replace(",", ".");
}

/**
 * Supports common Google Maps coordinate formats:
 *
 * https://www.google.com/maps/@29.997,31.123,17z
 *
 * https://www.google.com/maps?q=29.997,31.123
 *
 * ...!3d29.997!4d31.123...
 *
 * It also accepts plain:
 * 29.997,31.123
 */
function parseLocationInput(
    input: string,
): Coordinates | null {
    const value = input.trim();

    if (!value) {
        return null;
    }

    // Plain coordinates:
    // 29.997,31.123
    const plainMatch = value.match(
        /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
    );

    if (plainMatch) {
        const latitude = Number(
            plainMatch[1],
        );

        const longitude = Number(
            plainMatch[2],
        );

        if (
            isValidLatitude(latitude) &&
            isValidLongitude(longitude)
        ) {
            return {
                latitude,
                longitude,
            };
        }
    }

    // Google Maps @lat,lng
    const atMatch = value.match(
        /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    );

    if (atMatch) {
        const latitude = Number(
            atMatch[1],
        );

        const longitude = Number(
            atMatch[2],
        );

        if (
            isValidLatitude(latitude) &&
            isValidLongitude(longitude)
        ) {
            return {
                latitude,
                longitude,
            };
        }
    }

    // Google Maps !3dLAT!4dLNG
    const googleMatch = value.match(
        /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    );

    if (googleMatch) {
        const latitude = Number(
            googleMatch[1],
        );

        const longitude = Number(
            googleMatch[2],
        );

        if (
            isValidLatitude(latitude) &&
            isValidLongitude(longitude)
        ) {
            return {
                latitude,
                longitude,
            };
        }
    }

    // Google Maps query=LAT,LNG
    try {
        const url = new URL(value);

        const query =
            url.searchParams.get(
                "query",
            ) ??
            url.searchParams.get("q");

        if (query) {
            const queryMatch = query.match(
                /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
            );

            if (queryMatch) {
                const latitude = Number(
                    queryMatch[1],
                );

                const longitude = Number(
                    queryMatch[2],
                );

                if (
                    isValidLatitude(latitude) &&
                    isValidLongitude(longitude)
                ) {
                    return {
                        latitude,
                        longitude,
                    };
                }
            }
        }
    } catch {
        // Not a URL. That's fine.
    }

    return null;
}

export default function LocationPicker() {
    const [
        coordinates,
        setCoordinates,
    ] = useState<Coordinates | null>(null);

    const [
        mapsInput,
        setMapsInput,
    ] = useState("");

    const [
        error,
        setError,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(false);

    function applyCoordinates(
        next: Coordinates,
    ) {
        setCoordinates(next);
        setMapsInput(
            `${next.latitude}, ${next.longitude}`,
        );
        setError("");
    }

    function handleMapsInput(
        value: string,
    ) {
        setMapsInput(value);

        const parsed =
            parseLocationInput(value);

        if (parsed) {
            applyCoordinates(parsed);
        } else if (value.trim()) {
            setCoordinates(null);
            setError(
                "مش قادر أستخرج الإحداثيات من الرابط. الصق رابط Google Maps كامل أو اكتب latitude, longitude.",
            );
        } else {
            setCoordinates(null);
            setError("");
        }
    }

    function useCurrentLocation() {
        if (
            typeof navigator ===
            "undefined"
        ) {
            return;
        }

        if (!navigator.geolocation) {
            setError(
                "المتصفح لا يدعم تحديد الموقع.",
            );
            return;
        }

        setLoading(true);
        setError("");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                applyCoordinates({
                    latitude:
                        position.coords
                            .latitude,
                    longitude:
                        position.coords
                            .longitude,
                });

                setLoading(false);
            },
            (geolocationError) => {
                setLoading(false);

                if (
                    geolocationError.code ===
                    geolocationError.PERMISSION_DENIED
                ) {
                    setError(
                        "اسمح للمتصفح بالوصول إلى موقعك ثم حاول مرة أخرى.",
                    );
                    return;
                }

                if (
                    geolocationError.code ===
                    geolocationError.POSITION_UNAVAILABLE
                ) {
                    setError(
                        "مش قادر أحدد موقع الجهاز حاليًا.",
                    );
                    return;
                }

                setError(
                    "تحديد الموقع استغرق وقتًا أطول من المتوقع.",
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000,
            },
        );
    }

    return (
        <section className="border border-border p-6">
            <div>
                <h2 className="text-lg font-semibold">
                    موقع الصنايعي
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    الموقع ده هو اللي هنستخدمه في حساب
                    المسافة وترشيح الشغلانات ضمن 5 كم.
                </p>
            </div>

            <div className="mt-6 space-y-5">
                <div>
                    <button
                        type="button"
                        onClick={
                            useCurrentLocation
                        }
                        disabled={loading}
                        className="border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "جاري تحديد موقعك..."
                            : "استخدام موقعي الحالي"}
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-x-0 top-1/2 border-t border-border" />

                    <span className="relative mx-auto block w-fit bg-background px-3 text-xs text-muted-foreground">
                        أو
                    </span>
                </div>

                <label className="block space-y-2">
                    <span className="text-sm font-medium">
                        رابط Google Maps أو الإحداثيات
                    </span>

                    <input
                        value={mapsInput}
                        onChange={(event) =>
                            handleMapsInput(
                                event.target.value,
                            )
                        }
                        placeholder="https://www.google.com/maps/@29.99,31.12..."
                        className="w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
                    />

                    <p className="text-xs leading-5 text-muted-foreground">
                        تقدر تلصق رابط المكان من Google Maps أو
                        تكتب مثلًا:
                        {" "}
                        29.997, 31.123
                    </p>
                </label>

                {coordinates && (
                    <div className="border border-green-500/20 bg-green-500/5 px-4 py-3">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            تم تحديد الموقع
                        </p>

                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {coordinates.latitude.toFixed(
                                6,
                            )}
                            {" , "}
                            {coordinates.longitude.toFixed(
                                6,
                            )}
                        </p>
                    </div>
                )}

                {error && (
                    <div className="border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <input
                    type="hidden"
                    name="latitude"
                    value={
                        coordinates?.latitude ?? ""
                    }
                />

                <input
                    type="hidden"
                    name="longitude"
                    value={
                        coordinates?.longitude ?? ""
                    }
                />
            </div>
        </section>
    );
}