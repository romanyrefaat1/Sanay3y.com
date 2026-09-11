"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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
  const [error, setError] = useState("");
  const router = useRouter()

  const [areas, setAreas] = useState([""]);

  function addArea() {
    setAreas((current) => [...current, ""]);
  }

  function removeArea(index: number) {
    setAreas((current) => current.filter((_, i) => i !== index));
  }

  function updateArea(index: number, value: string) {
    setAreas((current) =>
      current.map((area, i) => (i === index ? value : area))
    );
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError("");

    const firstName = String(formData.get("firstName") || "").trim();
    const secondName = String(formData.get("secondName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const phone = String(formData.get("phone") || "").trim();
    const bio = String(formData.get("bio") || "").trim();
    const experience = String(formData.get("experience") || "").trim();
    const shopAddress = String(formData.get("shopAddress") || "").trim();

    const selectedAreas = formData
      .getAll("areas")
      .map((area) => String(area).trim())
      .filter(Boolean);

    if (!firstName || !secondName || !email || !password) {
      setError("من فضلك املأ جميع الحقول المطلوبة.");
      setIsLoading(false);
      return;
    }

    if (selectedAreas.length === 0) {
      setError("من فضلك أضف منطقة واحدة على الأقل تعمل بها.");
      setIsLoading(false);
      return;
    }

    const fullName = `${firstName} ${secondName}`;

    const result = await createNewUser({
      email,
      password,
      fullName,
      role: "craftsman",
    });

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // Then we'll create craftsman_profiles after signup.
    // Save:
    // - phone
    // - bio
    // - experience
    // - areas
    // - shopAddress
    //
    // Verification should happen in a separate onboarding step.

    router.push("/confirm");
  }

  return (
    <Card className="border-border/60 shadow-sm"  >
      <CardHeader>
        <CardTitle className="text-xl">إنشاء حسابك</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={handleSubmit} className="space-y-5">
          {/* Name */}
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

          {/* Email */}
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

          {/* Password */}
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

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              رقم الهاتف{" "}
              <span className="mr-1 text-muted-foreground">(اختياري)</span>
            </Label>

            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
              dir="ltr"
            />

            <p className="text-xs text-muted-foreground">
              رقم هاتفك سيظل خاصًا ولن يظهر للآخرين.
            </p>
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">
              سنوات الخبرة{" "}
              <span className="mr-1 text-muted-foreground">(اختياري)</span>
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

          {/* Areas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>المناطق التي تعمل بها</Label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addArea}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                إضافة منطقة
              </Button>
            </div>

            <div className="space-y-2">
              {areas.map((area, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    name="areas"
                    value={area}
                    onChange={(event) =>
                      updateArea(index, event.target.value)
                    }
                    placeholder={
                      index === 0
                        ? "مثال: مدينة نصر"
                        : "مثال: مصر الجديدة"
                    }
                    required={index === 0}
                  />

                  {areas.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeArea(index)}
                      aria-label="حذف المنطقة"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              أضف جميع المناطق التي يمكنك الوصول إليها للعمل.
            </p>
          </div>

          {/* Shop Address */}
          <div className="space-y-2">
            <Label htmlFor="shopAddress">
              عنوان المحل{" "}
              <span className="mr-1 text-muted-foreground">(اختياري)</span>
            </Label>

            <Input
              id="shopAddress"
              name="shopAddress"
              placeholder="مثال: شارع عباس العقاد، مدينة نصر"
            />

            <p className="text-xs text-muted-foreground">
              يمكنك اختيار ما إذا كنت تريد إظهاره للعامة لاحقًا.
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">
              نبذة عنك{" "}
              <span className="mr-1 text-muted-foreground">(اختياري)</span>
            </Label>

            <Textarea
              id="bio"
              name="bio"
              placeholder="اكتب نبذة بسيطة عن نفسك وعن شغلك..."
              className="min-h-24 resize-none"
              maxLength={300}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}