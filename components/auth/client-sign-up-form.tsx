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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import createNewUser from "@/actions/auth/createNewUser";
import { useRouter } from "next/navigation";

export function ClientSignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError("");

    const fullName = String(formData.get("fullName") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const phone = String(formData.get("phone") || "");
    const area = String(formData.get("area") || "");
    const gender = String(formData.get("gender") || "");

    if (!fullName || !email || !password || !phone || !area || !gender) {
      setError("من فضلك املأ جميع الحقول المطلوبة.");
      setIsLoading(false);
      return;
    }

    const result = await createNewUser({
      email,
      password,
      fullName,
      role: "client",
    });

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.push("/confirm")
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
            <Label htmlFor="area">المنطقة</Label>
            <Input
              id="area"
              name="area"
              placeholder="مثال: مدينة نصر"
              required
            />
            <p className="text-xs text-muted-foreground">
              ستظهر منطقتك العامة فقط على ملفك الشخصي.
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
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal transition-colors hover:bg-accent"
              >
                <RadioGroupItem value="male" id="male" />
                ذكر
              </Label>

              <Label
                htmlFor="female"
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal transition-colors hover:bg-accent"
              >
                <RadioGroupItem value="female" id="female" />
                أنثى
              </Label>
            </RadioGroup>
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