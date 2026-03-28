"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { UserPlus } from "lucide-react";
import * as z from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/auth";

const inputClass =
  "h-11 w-full rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_12%,transparent)] bg-white/90 px-4 text-sm text-[var(--dream-ink)] shadow-inner outline-none transition placeholder:text-[color-mix(in_oklch,var(--dream-ink)_45%,transparent)] focus:border-[color-mix(in_oklch,#1a6b4a_45%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,#1a6b4a_22%,transparent)]";

function validateEmail(email: string) {
  return email.includes("@") && email.includes(".");
}

const registerSchema = z
  .object({
    username: z
      .string()
      .refine((s) => s.trim().length > 0, { message: "请输入用户名" })
      .refine((s) => s.trim().length >= 3, {
        message: "用户名至少需要3个字符",
      }),
    email: z.string(),
    password: z
      .string()
      .min(1, "请输入密码")
      .min(6, "密码至少需要6个字符"),
    password_confirm: z.string().min(1, "请确认密码"),
  })
  .refine(
    (data) => {
      const em = data.email.trim();
      return !em || validateEmail(em);
    },
    { message: "邮箱格式不正确", path: ["email"] },
  )
  .refine((data) => data.password === data.password_confirm, {
    message: "两次输入的密码不一致",
    path: ["password_confirm"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      password_confirm: "",
    },
    mode: "onSubmit",
  });

  const [wUsername, wPassword, wPasswordConfirm] = form.watch([
    "username",
    "password",
    "password_confirm",
  ]);

  const canSubmit = useMemo(() => {
    return (
      wUsername.trim().length > 0 &&
      wPassword.trim().length > 0 &&
      wPasswordConfirm.trim().length > 0
    );
  }, [wPassword, wPasswordConfirm, wUsername]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);

    const u = values.username.trim();
    const em = values.email.trim();
    const p = values.password;
    const cp = values.password_confirm;

    try {
      setSubmitting(true);
      const res = await apiFetch("/register", {
        method: "POST",
        body: JSON.stringify({
          username: u,
          email: em,
          password: p,
          password_confirm: cp,
        }),
      });
      if (!res.ok) {
        throw new Error("注册失败");
      }
      const data = await res.json();
      if (data.status === "success") {
        router.push("/textrag/login?redirect=redirect");
      } else {
        setFormError(data.message);
      }
    } catch {
      setFormError("注册失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dream-grain relative min-h-[calc(100vh-56px)] px-4 pt-4 pb-12 sm:pt-6 sm:pb-16">
      <div className="relative z-10 mx-auto w-full max-w-md">
        <Card className="dream-animate-in gap-0 py-0 overflow-hidden rounded-2xl border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white/85 shadow-[0_32px_100px_-40px_rgba(20,17,15,0.45)] ring-1 ring-[color-mix(in_oklch,var(--dream-ink)_6%,transparent)] backdrop-blur-md">
          <CardHeader className="border-b border-[color-mix(in_oklch,var(--dream-ink)_8%,transparent)] bg-gradient-to-br from-[#1a6b4a] via-[#145238] to-[#0b2e1f] p-0">
            <div className="flex items-center gap-3 px-6 py-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <UserPlus className="size-5 text-white" strokeWidth={1.75} />
              </span>
              <div className="flex flex-col gap-1">
                <CardTitle className="font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight text-white">
                  用户注册
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-8 pt-5">
            <form
              className="flex flex-col gap-6"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FieldGroup className="gap-6">
                <Controller
                  name="username"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="register-username"
                        className="text-sm font-medium text-[var(--dream-ink)]"
                      >
                        用户名 <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id="register-username"
                        className={inputClass}
                        placeholder="至少3个字符"
                        autoComplete="username"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : (
                        <FieldDescription className="text-[color-mix(in_oklch,var(--dream-ink)_52%,transparent)]">
                          用户将用于登录，至少需要3个字符
                        </FieldDescription>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="register-email"
                        className="text-sm font-medium text-[var(--dream-ink)]"
                      >
                        邮箱
                      </FieldLabel>
                      <Input
                        {...field}
                        id="register-email"
                        className={inputClass}
                        placeholder="example@email.com"
                        type="email"
                        autoComplete="email"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : (
                        <FieldDescription className="text-[color-mix(in_oklch,var(--dream-ink)_52%,transparent)]">
                          邮箱可选，用于找回密码等
                        </FieldDescription>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="register-password"
                        className="text-sm font-medium text-[var(--dream-ink)]"
                      >
                        密码 <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id="register-password"
                        className={inputClass}
                        placeholder="至少6个字符"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : (
                        <FieldDescription className="text-[color-mix(in_oklch,var(--dream-ink)_52%,transparent)]">
                          密码至少需要6个字符
                        </FieldDescription>
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="password_confirm"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel
                        htmlFor="register-confirm-password"
                        className="text-sm font-medium text-[var(--dream-ink)]"
                      >
                        确认密码 <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id="register-confirm-password"
                        className={inputClass}
                        placeholder="请输入确认密码"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              {formError ? (
                <Alert
                  variant="destructive"
                  className="rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800"
                >
                  <AlertDescription className="text-red-800">
                    {formError}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                disabled={submitting || !canSubmit}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-[#1a6b4a] to-[#0f4a32] font-medium text-white shadow-lg shadow-[color-mix(in_oklch,#1a6b4a_30%,transparent)] transition hover:brightness-110 disabled:opacity-50"
              >
                <UserPlus data-icon="inline-start" strokeWidth={1.75} />
                注册
              </Button>

              <Separator className="my-1 bg-[color-mix(in_oklch,var(--dream-ink)_12%,transparent)]" />

              <div className="text-center text-sm text-[color-mix(in_oklch,var(--dream-ink)_58%,transparent)]">
                已有账号？
                <Link
                  href="/textrag/login"
                  className="ml-2 font-semibold text-[var(--dream-teal)] underline-offset-4 hover:underline"
                >
                  立即登录
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
