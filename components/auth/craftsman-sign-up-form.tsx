"use client";

import { useState } from "react";
import { Check, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import createNewUser from "@/actions/auth/createNewUser";
import { useRouter } from "next/navigation";

export function CraftsmanSignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const router = useRouter();

  async function getLocation() {
    setError("");
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع.");
      setIsGettingLocation(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        }
      );

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setError(
        "يجب السماح بالوصول إلى موقعك لإنشاء الحساب. يرجى تفعيل الموقع والمحاولة مرة أخرى."
      );
    } finally {
      setIsGettingLocation(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const firstName = String(formData.get("firstName") || "").trim();
    const secondName = String(formData.get("secondName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const phone = String(formData.get("phone") || "").trim();
    const bio = String(formData.get("bio") || "").trim();
    const experience = String(formData.get("experience") || "").trim();

    if (!firstName || !secondName || !email || !password || !phone) {
      setError("من فضلك املأ جميع الحقول المطلوبة.");
      setIsLoading(false);
      return;
    }

    if (!location) {
      setError("من فضلك حدد موقعك أولًا.");
      setIsLoading(false);
      return;
    }

    const experienceYears = experience
      ? Number(experience)
      : null;

    if (
      experienceYears !== null &&
      (!Number.isFinite(experienceYears) || experienceYears < 0)
    ) {
      setError("سنوات الخبرة غير صالحة.");
      setIsLoading(false);
      return;
    }

    const fullName = `${firstName} ${secondName}`;

    const result = await createNewUser({
      email,
      password,
      fullName,
      role: "craftsman",
      latitude: location.latitude,
      longitude: location.longitude,
      phone,
      bio: bio || undefined,
      experienceYears,
    });

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.push("/auth/login");
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">إنشاء حسابك</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">الاسم الأول</Label>

              <Input
                id="firstName"
                name="firstName"
                placeholder="أحمد"
                autoComplete="given-name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondName">الاسم الثاني</Label>

              <Input
                id="secondName"
                name="secondName"
                placeholder="محمد"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>

            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              dir="ltr"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>

            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              dir="ltr"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>

            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
              dir="ltr"
              required
            />

            <p className="text-xs text-muted-foreground">
              رقم هاتفك سيظل خاصًا ولن يظهر للآخرين.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">
              سنوات الخبرة{" "}
              <span className="mr-1 text-muted-foreground">
                (اختياري)
              </span>
            </Label>

            <Input
              id="experience"
              name="experience"
              type="number"
              min={0}
              placeholder="5"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">
              نبذة عنك{" "}
              <span className="mr-1 text-muted-foreground">
                (اختياري)
              </span>
            </Label>

            <Textarea
              id="bio"
              name="bio"
              placeholder="اكتب نبذة بسيطة عن نفسك وعن شغلك..."
              className="min-h-24 resize-none"
              maxLength={300}
            />
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  حدد موقعك
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  نحتاج موقعك الحالي لمساعدتك في العثور على
                  الشغلانات القريبة منك. موقعك الدقيق لن يظهر
                  للمستخدمين الآخرين.
                </p>

                <Button
                  type="button"
                  variant={location ? "outline" : "default"}
                  className="mt-3 w-full gap-2"
                  onClick={getLocation}
                  disabled={isGettingLocation || isLoading}
                >
                  {location ? (
                    <>
                      <Check className="size-4" />
                      تم تحديد موقعك
                    </>
                  ) : (
                    <>
                      <MapPin className="size-4" />
                      {isGettingLocation
                        ? "جاري تحديد موقعك..."
                        : "تحديد موقعي"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isGettingLocation}
          >
            {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}