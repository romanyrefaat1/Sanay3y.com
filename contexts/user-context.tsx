"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Profile = {
    id: string;
    full_name: string;
    role: "client" | "craftsman" | "admin" | "team";
    is_active: boolean;
    avatar_url: string | null;
    location: unknown | null;
    location_updated_at: string | null;
    created_at: string;
    updated_at: string;
};

type ClientProfile = {
    id: string;
    phone: string;
    gender: "male" | "female" | null;
    created_at: string;
    updated_at: string;
};

type CraftsmanProfile = {
    id: string;
    phone: string | null;
    bio: string | null;
    experience_years: number | null;
    areas: string[];
    shop_address: string | null;
    verification_status: "pending" | "verified" | "rejected";
    is_available: boolean;
    average_response_time_minutes: number | null;
    response_rate: number;
    completion_rate: number;
    temporary_area: string | null;
    temporary_location_until: string | null;
    work_type: string;
    created_at: string;
    updated_at: string;
};

type OnboardingStep = {
    label: string;
    completed: boolean;
};

type UserContextType = {
    user: User | null;
    profile: Profile | null;
    clientProfile: ClientProfile | null;
    craftsmanProfile: CraftsmanProfile | null;

    isTelegramConnected: boolean;

    onboardingSteps: OnboardingStep[];
    completedSteps: number;
    onboardingPercentage: number;

    isFinishedOnboarding: boolean;
    isLoading: boolean;

    refreshUser: () => Promise<void>;
    signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(
    undefined,
);

export function UserProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();

    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [clientProfile, setClientProfile] =
        useState<ClientProfile | null>(null);
    const [craftsmanProfile, setCraftsmanProfile] =
        useState<CraftsmanProfile | null>(null);

    const [isTelegramConnected, setIsTelegramConnected] =
        useState(false);

    const [isLoading, setIsLoading] = useState(true);

    const clearUser = useCallback(() => {
        setUser(null);
        setProfile(null);
        setClientProfile(null);
        setCraftsmanProfile(null);
        setIsTelegramConnected(false);
    }, []);

    const loadUser = useCallback(
        async (authUser: User) => {
            setUser(authUser);

            const {
                data: profileData,
                error: profileError,
            } = await supabase
                .from("profiles")
                .select(
                    `
                    id,
                    full_name,
                    role,
                    is_active,
                    avatar_url,
                    location,
                    location_updated_at,
                    created_at,
                    updated_at
                    `,
                )
                .eq("id", authUser.id)
                .maybeSingle();

            if (profileError) {
                console.error(
                    "Failed to load profile:",
                    profileError,
                );

                setProfile(null);
                setClientProfile(null);
                setCraftsmanProfile(null);
                setIsTelegramConnected(false);

                return;
            }

            if (!profileData) {
                setProfile(null);
                setClientProfile(null);
                setCraftsmanProfile(null);
                setIsTelegramConnected(false);

                return;
            }

            const normalizedProfile: Profile = {
                id: profileData.id,
                full_name: profileData.full_name,
                role: profileData.role,
                is_active: profileData.is_active,
                avatar_url: profileData.avatar_url ?? null,
                location: profileData.location ?? null,
                location_updated_at:
                    profileData.location_updated_at ?? null,
                created_at: profileData.created_at,
                updated_at: profileData.updated_at,
            };

            setProfile(normalizedProfile);

            /*
             * Telegram is only relevant for client/craftsman
             * accounts. Match the connection to the user's role
             * so a client connection doesn't count as a craftsman
             * connection, and vice versa.
             */
            if (
                profileData.role === "client" ||
                profileData.role === "craftsman"
            ) {
                const {
                    data: telegramConnection,
                    error: telegramError,
                } = await supabase
                    .from("telegram_connections")
                    .select("id")
                    .eq("user_id", authUser.id)
                    .eq("bot_type", profileData.role)
                    .eq("is_active", true)
                    .maybeSingle();

                if (telegramError) {
                    console.error(
                        "Failed to load Telegram connection:",
                        telegramError,
                    );

                    setIsTelegramConnected(false);
                } else {
                    setIsTelegramConnected(
                        Boolean(telegramConnection),
                    );
                }
            } else {
                setIsTelegramConnected(false);
            }

            if (profileData.role === "client") {
                const {
                    data: clientData,
                    error: clientError,
                } = await supabase
                    .from("client_profiles")
                    .select(
                        `
                        id,
                        phone,
                        gender,
                        created_at,
                        updated_at
                        `,
                    )
                    .eq("id", authUser.id)
                    .maybeSingle();

                if (clientError) {
                    console.error(
                        "Failed to load client profile:",
                        clientError,
                    );
                }

                setClientProfile(
                    clientData as ClientProfile | null,
                );
                setCraftsmanProfile(null);

                return;
            }

            if (profileData.role === "craftsman") {
                const {
                    data: craftsmanData,
                    error: craftsmanError,
                } = await supabase
                    .from("craftsman_profiles")
                    .select(
                        `
                        id,
                        phone,
                        bio,
                        experience_years,
                        areas,
                        shop_address,
                        verification_status,
                        is_available,
                        average_response_time_minutes,
                        response_rate,
                        completion_rate,
                        temporary_area,
                        temporary_location_until,
                        work_type,
                        created_at,
                        updated_at
                        `,
                    )
                    .eq("id", authUser.id)
                    .maybeSingle();

                if (craftsmanError) {
                    console.error(
                        "Failed to load craftsman profile:",
                        craftsmanError,
                    );
                }

                setCraftsmanProfile(
                    craftsmanData as CraftsmanProfile | null,
                );
                setClientProfile(null);

                return;
            }

            setClientProfile(null);
            setCraftsmanProfile(null);
        },
        [supabase],
    );

    const refreshUser = useCallback(async () => {
        setIsLoading(true);

        try {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();

            if (!authUser) {
                clearUser();
                return;
            }

            await loadUser(authUser);
        } catch (error) {
            console.error(
                "Failed to refresh user:",
                error,
            );

            clearUser();
        } finally {
            setIsLoading(false);
        }
    }, [supabase, loadUser, clearUser]);

    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            try {
                const {
                    data: { user: authUser },
                } = await supabase.auth.getUser();

                if (!mounted) {
                    return;
                }

                if (!authUser) {
                    clearUser();
                    return;
                }

                await loadUser(authUser);
            } catch (error) {
                console.error(
                    "Failed to initialize user:",
                    error,
                );

                if (mounted) {
                    clearUser();
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initialize();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) {
                    return;
                }

                if (
                    event === "SIGNED_OUT" ||
                    !session?.user
                ) {
                    clearUser();
                    setIsLoading(false);
                    return;
                }

                await loadUser(session.user);

                if (mounted) {
                    setIsLoading(false);
                }
            },
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, loadUser, clearUser]);

    /*
     * ============================================================
     * ONBOARDING
     * ============================================================
     */

    const onboardingSteps = useMemo<OnboardingStep[]>(() => {
        if (!profile) {
            return [];
        }

        switch (profile.role) {
            case "client":
                return [
                    {
                        label: "ربط تيليجرام",
                        completed: isTelegramConnected,
                    },
                    {
                        label: "إضافة صورة شخصية",
                        completed: Boolean(
                            profile.avatar_url,
                        ),
                    },
                    {
                        label: "إضافة رقم الهاتف",
                        completed: Boolean(
                            clientProfile?.phone,
                        ),
                    },
                    {
                        label: "تحديد الموقع",
                        completed: Boolean(
                            profile.location,
                        ),
                    },
                    {
                        label: "تحديد النوع",
                        completed: Boolean(
                            clientProfile?.gender,
                        ),
                    },
                ];

            case "craftsman":
                return [
                    {
                        label: "ربط تيليجرام",
                        completed: isTelegramConnected,
                    },
                    {
                        label: "إضافة صورة شخصية",
                        completed: Boolean(
                            profile.avatar_url,
                        ),
                    },
                    {
                        label:
                            "إضافة رقم الهاتف (توثيق الهوية)",
                        completed: Boolean(
                            craftsmanProfile?.phone,
                        ),
                    },
                    {
                        label: "إضافة نبذة عنك",
                        completed: Boolean(
                            craftsmanProfile?.bio?.trim(),
                        ),
                    },
                    {
                        label: "تحديد مناطق العمل",
                        completed: Boolean(
                            craftsmanProfile?.areas?.length,
                        ),
                    },
                    {
                        label: "إضافة عنوان الورشة",
                        completed: Boolean(
                            craftsmanProfile?.shop_address?.trim(),
                        ),
                    },
                    {
                        label: "إضافة سنوات الخبرة",
                        completed:
                            craftsmanProfile?.experience_years !==
                                null &&
                            craftsmanProfile?.experience_years !==
                                undefined,
                    },
                ];

            case "admin":
            case "team":
                return [];

            default:
                return [];
        }
    }, [
        profile,
        clientProfile,
        craftsmanProfile,
        isTelegramConnected,
    ]);

    const completedSteps = useMemo(
        () =>
            onboardingSteps.filter(
                (step) => step.completed,
            ).length,
        [onboardingSteps],
    );

    const onboardingPercentage = useMemo(() => {
        if (!onboardingSteps.length) {
            return 0;
        }

        return Math.round(
            (completedSteps / onboardingSteps.length) * 100,
        );
    }, [
        completedSteps,
        onboardingSteps.length,
    ]);

    const isFinishedOnboarding = useMemo(() => {
        if (!user || !profile) {
            return false;
        }

        switch (profile.role) {
            case "client":
                return (
                    clientProfile !== null &&
                    onboardingPercentage === 100
                );

            case "craftsman":
                return (
                    craftsmanProfile !== null &&
                    onboardingPercentage === 100
                );

            case "admin":
            case "team":
                return true;

            default:
                return false;
        }
    }, [
        user,
        profile,
        clientProfile,
        craftsmanProfile,
        onboardingPercentage,
    ]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        clearUser();
    }, [supabase, clearUser]);

    const value = useMemo(
        () => ({
            user,
            profile,
            clientProfile,
            craftsmanProfile,

            isTelegramConnected,

            onboardingSteps,
            completedSteps,
            onboardingPercentage,

            isFinishedOnboarding,
            isLoading,

            refreshUser,
            signOut,
        }),
        [
            user,
            profile,
            clientProfile,
            craftsmanProfile,
            isTelegramConnected,
            onboardingSteps,
            completedSteps,
            onboardingPercentage,
            isFinishedOnboarding,
            isLoading,
            refreshUser,
            signOut,
        ],
    );

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);

    if (!context) {
        throw new Error(
            "useUser must be used inside UserProvider",
        );
    }

    return context;
}