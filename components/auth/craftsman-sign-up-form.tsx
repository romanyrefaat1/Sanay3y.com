"use client";

import { useState } from "react";

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

export function CraftsmanSignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError("");

    const fullName = String(formData.get("fullName") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const phone = String(formData.get("phone") || "");
    const bio = String(formData.get("bio") || "");
    const experience = String(formData.get("experience") || "");
    const areas = String(formData.get("areas") || "");
    const shopAddress = String(formData.get("shopAddress") || "");

    if (!fullName || !email || !password || !phone || !areas) {
      setError("من فضلك املأ جميع الحقول المطلوبة.");
      setIsLoading(false);
      return;
    }

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

    // TODO:
    // Create craftsman_profiles after signup.
    // Verification should happen in a separate onboarding step.

    window.location.href = "/craftsman/onboarding";
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">إنشاء حسابك</CardTitle>
      </CardHeader>

      <CardContent>
        <form action={handleSubmit} className="space-y-5">
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
            <Label htmlFor="bio">
              نبذة قصيرة{" "}
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

          <div className="space-y-2">
            <Label htmlFor="areas">المناطق التي تعمل بها</Label>

            <Input
              id="areas"
              name="areas"
              placeholder="مدينة نصر، مصر الجديدة، القاهرة الجديدة"
              required
            />

            <p className="text-xs text-muted-foreground">
              افصل بين المناطق المختلفة باستخدام الفاصلة.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopAddress">
              عنوان المحل{" "}
              <span className="mr-1 text-muted-foreground">(اختياري)</span>
            </Label>

            <Input
              id="shopAddress"
              name="shopAddress"
              placeholder="عنوان المحل"
            />

            <p className="text-xs text-muted-foreground">
              يمكنك اختيار ما إذا كنت تريد إظهاره للعامة لاحقًا.
            </p>
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