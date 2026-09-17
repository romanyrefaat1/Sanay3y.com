"use client";

import { useState } from "react";
import { Check, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import createNewUser from "@/actions/auth/createNewUser";
import { useRouter } from "next/navigation";

export function ClientSignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState("");

  const router = useRouter();

  function getLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError("المتصفح لا يدعم تحديد الموقع.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setIsGettingLocation(false);
        setError("");
      },
      (error) => {
        setIsGettingLocation(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(
              "لم نتمكن من الوصول إلى موقعك. اسمح للموقع باستخدام موقعك من إعدادات المتصفح ثم اضغط على الزر مرة أخرى."
            );
            break;

          case error.POSITION_UNAVAILABLE:
            setError(
              "تعذر تحديد موقعك حاليًا. تأكد من تشغيل خدمات الموقع ثم حاول مرة أخرى."
            );
            break;

          case error.TIMEOUT:
            setError(
              "استغرق تحديد موقعك وقتًا طويلًا. حاول مرة أخرى."
            );
            break;

          default:
            setError("تعذر تحديد موقعك. حاول مرة أخرى.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const phone = String(formData.get("phone") || "").trim();
    const gender = String(formData.get("gender") || "");

    if (!fullName || !email || !password || !phone || !gender) {
      setError("من فضلك املأ جميع الحقول المطلوبة.");
      setIsLoading(false);
      return;
    }

    if (!location) {
      setError("من فضلك حدد موقعك أولًا.");
      setIsLoading(false);
      return;
    }

    const result = await createNewUser({
      email,
      password,
      fullName,
      role: "client",
      latitude: location.latitude,
      longitude: location.longitude,
      phone,
      gender: gender as "male" | "female",
    });

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.push("/auth/login");
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Section: account */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">الاسم بالكامل</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="أحمد محمد"
            autoComplete="name"
            required
          />
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
      </div>

      {/* Section: contact */}
      <div className="mt-8 space-y-5 border-t border-border pt-8">
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

        <div className="space-y-3">
          <Label>النوع</Label>

          <RadioGroup
            name="gender"
            defaultValue="male"
            className="grid grid-cols-2 gap-3"
          >
            <Label
              htmlFor="male"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 font-normal transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
            >
              <RadioGroupItem value="male" id="male" />
              ذكر
            </Label>

            <Label
              htmlFor="female"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 font-normal transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
            >
              <RadioGroupItem value="female" id="female" />
              أنثى
            </Label>
          </RadioGroup>
        </div>
      </div>

      {/* Section: location */}
      <div className="mt-8 border-t border-border pt-8">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">حدد موقعك</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              نحتاج إلى موقعك لنعرض لك الصنايعية القريبين منك. لن يظهر موقعك
              الدقيق للمستخدمين الآخرين.
            </p>

            <Button
              type="button"
              variant={location ? "outline" : "default"}
              onClick={getLocation}
              disabled={isGettingLocation || isLoading}
              className="mt-3 w-full gap-2 sm:w-auto"
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
        <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="mt-8 w-full"
        size="lg"
        disabled={isLoading || isGettingLocation || !location}
      >
        {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
      </Button>
    </form>
  );
}